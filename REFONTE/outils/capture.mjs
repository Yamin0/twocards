/* Captures d'écran et relevé des erreurs console, sans dépendance :
   pilote Chrome en mode headless par le protocole DevTools.

   node REFONTE/outils/capture.mjs <dossier> <base> <chemins,…> [largeurs] [langues] [--pleine]

   Exemple :
   node REFONTE/outils/capture.mjs avant http://localhost:3001 /,/hotels 390,1440 fr,en

   Chaque capture s'appelle <dossier>/<chemin>-<langue>-<largeur>.png.
   Un fichier <dossier>/console.json liste les erreurs relevées par page. */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const [, , outArg, base, pathsArg, widthsArg = "390,1440", langsArg = "fr,en", ...flags] = process.argv;
if (!outArg || !base || !pathsArg) {
  console.error("usage: capture.mjs <dossier> <base> <chemins> [largeurs] [langues] [--pleine]");
  process.exit(1);
}
const fullPage = flags.includes("--pleine");
const outDir = resolve("REFONTE/captures", outArg);
mkdirSync(outDir, { recursive: true });
const paths = pathsArg.split(",");
const widths = widthsArg.split(",").map(Number);
const langs = langsArg.split(",");

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find((p) => existsSync(p));
if (!CHROME) throw new Error("Chrome introuvable");

const port = 9300 + Math.floor(Math.random() * 400);
const profile = join(tmpdir(), `tc-capture-${port}`);
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--hide-scrollbars",
    "--no-first-run",
    "--disable-gpu",
    "--mute-audio",
    "about:blank",
  ],
  { stdio: "ignore" }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wsUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      return (await r.json()).webSocketDebuggerUrl;
    } catch {
      await sleep(200);
    }
  }
  throw new Error("Chrome ne répond pas");
}

const ws = new WebSocket(await wsUrl());
await new Promise((r) => (ws.onopen = r));
let seq = 0;
const pending = new Map();
const listeners = new Set();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
  } else for (const l of listeners) l(msg);
};
const send = (method, params = {}, sessionId) =>
  new Promise((res, rej) => {
    const id = ++seq;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

const report = existsSync(join(outDir, "console.json"))
  ? JSON.parse(readFileSync(join(outDir, "console.json"), "utf8"))
  : {};

const host = new URL(base).hostname;

for (const lang of langs) {
  for (const width of widths) {
    for (const path of paths) {
      const { targetId } = await send("Target.createTarget", { url: "about:blank" });
      const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
      const errors = [];
      const onEvent = (msg) => {
        if (msg.sessionId !== sessionId) return;
        if (msg.method === "Runtime.exceptionThrown")
          errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
        if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error")
          errors.push(msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 400));
        if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error")
          errors.push(`${msg.params.entry.text} ${msg.params.entry.url ?? ""}`.slice(0, 400));
      };
      listeners.add(onEvent);
      const mobile = width < 768;
      const height = mobile ? 844 : 900;
      await send("Page.enable", {}, sessionId);
      await send("Runtime.enable", {}, sessionId);
      await send("Log.enable", {}, sessionId);
      await send("Network.enable", {}, sessionId);
      await send(
        "Emulation.setDeviceMetricsOverride",
        { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile },
        sessionId
      );
      await send("Network.setCookie", { name: "tc-lang", value: lang, domain: host, path: "/" }, sessionId);
      const loaded = new Promise((r) => {
        const l = (msg) => {
          if (msg.sessionId === sessionId && msg.method === "Page.loadEventFired") {
            listeners.delete(l);
            r();
          }
        };
        listeners.add(l);
      });
      await send("Page.navigate", { url: base + path }, sessionId);
      await Promise.race([loaded, sleep(45000)]);
      await sleep(2500);
      if (fullPage) {
        /* Fait défiler la page pour déclencher les chargements paresseux. */
        await send(
          "Runtime.evaluate",
          {
            expression:
              "(async()=>{const h=document.documentElement.scrollHeight;for(let y=0;y<h;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}window.scrollTo(0,0);await new Promise(r=>setTimeout(r,400))})()",
            awaitPromise: true,
          },
          sessionId
        );
      }
      const shot = await send(
        "Page.captureScreenshot",
        { format: "png", captureBeyondViewport: fullPage },
        sessionId
      ).catch(async () => send("Page.captureScreenshot", { format: "png" }, sessionId));
      const name =
        (path.replace(/^\//, "").replace(/[/?=&]/g, "_") || "accueil") + `-${lang}-${width}.png`;
      writeFileSync(join(outDir, name), Buffer.from(shot.data, "base64"));
      const { result } = await send(
        "Runtime.evaluate",
        { expression: "location.pathname + ' | ' + document.title" },
        sessionId
      );
      report[name] = { final: result.value, errors: [...new Set(errors)] };
      console.log(`${name}  →  ${result.value}${errors.length ? `  (${errors.length} erreur(s))` : ""}`);
      listeners.delete(onEvent);
      await send("Target.closeTarget", { targetId });
    }
  }
}

writeFileSync(join(outDir, "console.json"), JSON.stringify(report, null, 2));
ws.close();
chrome.kill();
process.exit(0);
