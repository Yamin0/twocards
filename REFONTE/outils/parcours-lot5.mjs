/* Parcours de réservation des pages clients, de bout en bout, sans rien
   écrire en base : pilote Chrome headless par le protocole DevTools, sur le
   modèle de capture.mjs.

   node REFONTE/outils/parcours-lot5.mjs [base]

   Garde-fou : toute requête du navigateur vers une RPC d'écriture
   (qr_create_reservation, portal_create_reservation, qr_rate_reservation,
   qr_track_scan) est interceptée et n'atteint jamais Supabase. Le menu QR est
   parcouru en mode aperçu (`?apercu=1`), qui n'envoie rien de toute façon.

   Écrit les captures et `parcours.json` dans REFONTE/captures/apres-lot5/parcours/. */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const base = process.argv[2] ?? "http://localhost:3000";
const outDir = resolve("REFONTE/captures/apres-lot5/parcours");
mkdirSync(outDir, { recursive: true });

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find((p) => existsSync(p));
if (!CHROME) throw new Error("Chrome introuvable");

const port = 9300 + Math.floor(Math.random() * 400);
const chrome = spawn(
  CHROME,
  ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), `tc-parcours-${port}`)}`, "--hide-scrollbars", "--no-first-run", "--disable-gpu", "--mute-audio", "about:blank"],
  { stdio: "ignore" }
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wsUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      return (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl;
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
    if (msg.error) rej(new Error(msg.error.message));
    else res(msg.result);
  } else for (const l of listeners) l(msg);
};
const send = (method, params = {}, sessionId) =>
  new Promise((res, rej) => {
    const id = ++seq;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

const WRITE_RPC = /\/rest\/v1\/rpc\/(qr_create_reservation|portal_create_reservation|qr_rate_reservation|qr_track_scan)/;
const host = new URL(base).hostname;
const report = [];
let failures = 0;

/* Ouvre une page ; `mock(url)` peut renvoyer { status, body } pour répondre à
   la place de Supabase, ou "fail" pour simuler une coupure réseau. Sans
   réponse de `mock`, les RPC d'écriture échouent (jamais transmises). */
async function open({ name, path, lang, width = 390, mock = () => null, mocked = /qr_rating_context/, clock = null }) {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const errors = [];
  const rpc = [];
  const blocked = [];
  const S = (m, p = {}) => send(m, p, sessionId);
  const onEvent = async (msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === "Runtime.exceptionThrown")
      errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error")
      errors.push(msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 400));
    if (msg.method === "Fetch.requestPaused") {
      const url = msg.params.request.url;
      const fn = url.match(/\/rpc\/([a-z_]+)/)?.[1] ?? url;
      /* Pré-vol CORS d'une RPC simulée : accepté sur place. */
      const preflight = msg.params.request.method === "OPTIONS";
      const answer = preflight ? (mocked.test(url) || WRITE_RPC.test(url) ? { status: 204, body: null } : null) : mock(url, msg.params.request);
      if (!preflight) rpc.push(fn);
      if (answer && answer !== "fail") {
        await S("Fetch.fulfillRequest", {
          requestId: msg.params.requestId,
          responseCode: answer.status,
          responseHeaders: [
            { name: "content-type", value: "application/json" },
            { name: "access-control-allow-origin", value: "*" },
            { name: "access-control-allow-headers", value: "*" },
            { name: "access-control-allow-methods", value: "GET,POST,OPTIONS" },
          ],
          body: answer.body === null && answer.status === 204 ? "" : Buffer.from(JSON.stringify(answer.body)).toString("base64"),
        }).catch(() => {});
      } else if (answer === "fail" || WRITE_RPC.test(url)) {
        blocked.push(fn);
        await S("Fetch.failRequest", { requestId: msg.params.requestId, errorReason: "InternetDisconnected" }).catch(() => {});
      } else {
        await S("Fetch.continueRequest", { requestId: msg.params.requestId }).catch(() => {});
      }
    }
  };
  listeners.add(onEvent);
  await S("Page.enable");
  await S("Runtime.enable");
  await S("Network.enable");
  await S("Fetch.enable", { patterns: [{ urlPattern: "*/rest/v1/rpc/*" }] });
  const mobile = width < 768;
  await S("Emulation.setDeviceMetricsOverride", { width, height: mobile ? 844 : 900, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await S("Network.setCookie", { name: "tc-lang", value: lang, domain: host, path: "/" });
  if (clock !== null) {
    /* Horloge décalée : « maintenant » devient l'heure locale voulue. */
    await S("Page.addScriptToEvaluateOnNewDocument", {
      source: `(()=>{const R=Date;const n=new R();const t=new R(n);t.setHours(${clock.h},${clock.m},0,0);const off=t-n;class D extends R{constructor(...a){if(a.length===0)super(R.now()+off);else super(...a)}static now(){return R.now()+off}}window.Date=D})()`,
    });
  }
  const loaded = new Promise((r) => {
    const l = (msg) => {
      if (msg.sessionId === sessionId && msg.method === "Page.loadEventFired") {
        listeners.delete(l);
        r();
      }
    };
    listeners.add(l);
  });
  await S("Page.navigate", { url: base + path });
  await Promise.race([loaded, sleep(45000)]);
  await sleep(2500);

  const ev = async (expression) => {
    const r = await S("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  const page = {
    name,
    ev,
    errors,
    rpc,
    blocked,
    shot: async (label) => {
      const s = await S("Page.captureScreenshot", { format: "png" });
      writeFileSync(join(outDir, `${name}-${label}.png`), Buffer.from(s.data, "base64"));
    },
    /* Clique le premier élément visible correspondant au sélecteur, ou dont le
       texte contient `text`. */
    click: async (selector, text = null) => {
      const ok = await ev(`(()=>{const els=[...document.querySelectorAll(${JSON.stringify(selector)})].filter(e=>e.offsetParent!==null&&!e.disabled&&(${JSON.stringify(text)}===null||e.textContent.includes(${JSON.stringify(text)})));if(!els[0])return false;els[0].scrollIntoView({block:"center"});els[0].click();return true})()`);
      if (!ok) throw new Error(`[${name}] introuvable : ${selector} ${text ?? ""}`);
      await sleep(450);
    },
    fill: async (selector, value) => {
      const ok = await ev(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return false;const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,"value").set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event("input",{bubbles:true}));el.focus();return true})()`);
      if (!ok) throw new Error(`[${name}] champ introuvable : ${selector}`);
      await sleep(150);
    },
    enter: async () => {
      await S("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
      await S("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
      await sleep(500);
    },
    key: async (key, code, vk, shift = false) => {
      await S("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: vk, modifiers: shift ? 8 : 0 });
      await S("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk, modifiers: shift ? 8 : 0 });
      await sleep(120);
    },
    /* textContent : insensible aux capitales posées en CSS. */
    text: () => ev("document.body.textContent"),
    /* Cibles tactiles visibles de moins de 44 px, et champs sous 16 px. */
    audit: () =>
      ev(`(()=>{const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=="hidden"};const scope=document.querySelector('[role="dialog"]')||document.body;const small=[...scope.querySelectorAll("button,a[href],input,textarea,select")].filter(vis).filter(e=>!e.closest("nextjs-portal")).map(e=>{const r=e.getBoundingClientRect();return{t:(e.getAttribute("aria-label")||e.textContent||e.tagName).trim().slice(0,30),w:Math.round(r.width),h:Math.round(r.height)}}).filter(x=>x.w<44||x.h<44);const fields=[...scope.querySelectorAll("input,textarea,select")].filter(vis).map(e=>({t:e.id||e.type,px:parseFloat(getComputedStyle(e).fontSize)})).filter(x=>x.px<16);const unlabeled=[...scope.querySelectorAll("input,textarea,select")].filter(vis).filter(e=>!(e.labels&&e.labels.length)&&!e.getAttribute("aria-label")).map(e=>e.type);return{small,fields,unlabeled}})()`),
    close: async () => {
      listeners.delete(onEvent);
      await send("Target.closeTarget", { targetId });
    },
  };
  return page;
}

function check(scenario, label, ok, detail = "") {
  if (!ok) failures++;
  scenario.checks.push({ label, ok, ...(detail ? { detail } : {}) });
  console.log(`${ok ? "  ok " : "  ÉCHEC"} ${label}${detail ? ` — ${detail}` : ""}`);
}

async function scenario(name, fn) {
  console.log(`\n${name}`);
  const s = { name, checks: [] };
  report.push(s);
  try {
    await fn(s);
  } catch (e) {
    failures++;
    s.checks.push({ label: "exception", ok: false, detail: String(e.message ?? e) });
    console.log(`  ÉCHEC exception — ${e.message ?? e}`);
  }
}

const L = (lang, fr, en) => (lang === "en" ? en : fr);

/* ─── 1. Menu QR en mode aperçu, jusqu'à la confirmation ──────────────────── */
for (const lang of ["fr", "en"]) {
  await scenario(`/s/a1f3c07b?apercu=1 — ${lang} — réservation jusqu'à la confirmation`, async (s) => {
    /* 15 h : « 12:00 » est une heure passée, les créneaux du soir restent ouverts. */
    const p = await open({ name: `s-${lang}`, path: "/s/a1f3c07b?apercu=1", lang, clock: { h: 15, m: 0 } });
    let a = await p.audit();
    check(s, "accueil : cibles ≥ 44 px", a.small.length === 0, JSON.stringify(a.small));
    await p.shot("1-menu");
    await p.click("main li button");
    a = await p.audit();
    check(s, "catégorie : cibles ≥ 44 px", a.small.length === 0, JSON.stringify(a.small));
    check(s, "catégorie : champs ≥ 16 px et étiquetés", a.fields.length === 0 && a.unlabeled.length === 0, JSON.stringify(a));
    await sleep(2500);
    const imgs = await p.ev(`(()=>{const v=[...document.querySelectorAll("main img")].filter(i=>{const r=i.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0});return{n:v.length,broken:v.filter(i=>i.complete&&i.naturalWidth===0).length,optimized:v.filter(i=>i.currentSrc.includes("/_next/image")).length}})()`);
    check(s, "catégorie : photos visibles chargées, servies par l'optimiseur", imgs.n > 0 && imgs.broken === 0 && imgs.optimized === imgs.n, JSON.stringify(imgs));
    await p.shot("2-categorie");
    await p.click('button[aria-haspopup="dialog"]');
    const dlg = await p.ev(`(()=>{const d=document.querySelector('[role="dialog"]');if(!d)return null;const id=d.getAttribute("aria-labelledby");return{modal:d.getAttribute("aria-modal"),title:id?document.getElementById(id)?.textContent:null,focusInside:d.contains(document.activeElement),images:d.querySelectorAll("img").length}})()`);
    check(s, "feuille : dialogue modal, titre relié, focus à l'intérieur", !!dlg && dlg.modal === "true" && !!dlg.title && dlg.focusInside, JSON.stringify(dlg));
    a = await p.audit();
    check(s, "étape 1 : cibles ≥ 44 px", a.small.length === 0, JSON.stringify(a.small));
    await p.shot("3-etape1");
    /* Piège de focus : 60 tabulations ne sortent jamais de la feuille. */
    let escaped = false;
    for (let i = 0; i < 60; i++) {
      await p.key("Tab", "Tab", 9, i % 7 === 6);
      if (!(await p.ev(`document.querySelector('[role="dialog"]').contains(document.activeElement)`))) escaped = true;
    }
    check(s, "feuille : le focus reste piégé (60 tabulations)", !escaped);
    /* D1 + D7 : « Autre » avec une heure passée, puis Entrée. */
    await p.click('[role="dialog"] button', L(lang, "Autre", "Other"));
    await p.fill('[role="dialog"] input[type="time"]', "12:00");
    await p.enter();
    let t = await p.text();
    check(s, "D7 : heure passée refusée, message visible", t.includes(L(lang, "déjà passée", "already passed")) && !!(await p.ev(`!!document.querySelector('[role="dialog"] [role="alert"]')`)));
    check(s, "D1 : Entrée à l'étape 1 n'envoie rien", !t.includes(L(lang, "Demande envoyée", "Request sent")) && !p.rpc.includes("qr_create_reservation"));
    await p.shot("4-heure-passee");
    await p.fill('[role="dialog"] input[type="time"]', "21:15");
    await p.enter();
    t = await p.text();
    check(s, "D1 : Entrée à l'étape 1 fait « Continuer »", !!(await p.ev(`!!document.querySelector('[role="dialog"] input[type="tel"]')`)) && !t.includes(L(lang, "Demande envoyée", "Request sent")));
    a = await p.audit();
    check(s, "étape 2 : cibles ≥ 44 px", a.small.length === 0, JSON.stringify(a.small));
    check(s, "étape 2 : champs ≥ 16 px et étiquetés", a.fields.length === 0 && a.unlabeled.length === 0, JSON.stringify(a));
    /* Envoi sans téléphone : message, pas de confirmation. */
    await p.fill('[role="dialog"] input[autocomplete="name"]', "Client Aperçu");
    await p.enter();
    t = await p.text();
    check(s, "étape 2 : téléphone manquant signalé", !!(await p.ev(`!!document.querySelector('[role="dialog"] [role="alert"]')`)) && !t.includes(L(lang, "Demande envoyée", "Request sent")));
    await p.fill('[role="dialog"] input[type="tel"]', "+212 600 000 000");
    await p.shot("5-etape2");
    await p.click('[role="dialog"] button[type="submit"]');
    t = await p.text();
    check(s, "confirmation affichée", t.includes(L(lang, "Demande envoyée", "Request sent")) && t.includes("+212 600 000 000") && t.includes("21:15"));
    check(s, "mode aperçu annoncé", t.includes(L(lang, "Aperçu : aucune demande", "Preview: no request")));
    await p.shot("6-confirmation");
    await p.click('[role="dialog"] button', L(lang, "Parfait", "Perfect"));
    check(s, "fermeture : le focus revient sur la carte", await p.ev(`document.activeElement?.getAttribute("aria-haspopup")==="dialog"&&!document.querySelector('[role="dialog"]')`));
    check(s, "aucune RPC d'écriture émise (ni réservation, ni scan)", p.rpc.length === 0, p.rpc.join(","));
    check(s, "« Propulsé par twocards. » présent", (await p.text()).includes("twocards."));
    check(s, "aucune erreur console", p.errors.length === 0, p.errors.join(" | "));
    await p.close();
  });
}

/* ─── 2. Menu QR : date par défaut quand tout est passé, messages d'erreur ── */
await scenario("/s/a1f3c07b — fr — 22 h 45 : la feuille s'ouvre sur demain (D7)", async (s) => {
  const p = await open({ name: "s-fr-tard", path: "/s/a1f3c07b?apercu=1", lang: "fr", clock: { h: 22, m: 45 } });
  await p.click("main li button");
  await p.click('button[aria-haspopup="dialog"]');
  const chosen = await p.ev(`[...document.querySelectorAll('[role="dialog"] button[aria-pressed="true"]')].map(b=>b.textContent.trim()).join("|")`);
  check(s, "restaurants à 22 h 45 : jour choisi = demain", chosen.includes("dem."), chosen);
  await p.shot("demain");
  await p.close();
});

const rpcError = (message) => ({ status: 400, body: { code: "P0001", message, details: null, hint: null } });
for (const [label, mock, fr] of [
  ["limite de débit", () => rpcError("Trop de demandes, réessayez dans quelques minutes"), "Patientez une dizaine de minutes"],
  ["date invalide", () => rpcError("Date invalide"), "plus réservable"],
  ["adresse indisponible", () => rpcError("Adresse indisponible"), "n'est plus proposée"],
  ["nom invalide", () => rpcError("Nom invalide"), "Indiquez votre nom"],
  ["QR inactif", () => rpcError("QR code introuvable ou inactif"), "n'est plus actif"],
  ["réseau coupé", () => "fail", "Pas de connexion"],
]) {
  await scenario(`/s/a1f3c07b — fr — erreur « ${label} » (réponse simulée dans le navigateur, D5)`, async (s) => {
    const p = await open({
      name: `s-erreur-${label.replace(/\s/g, "-")}`,
      path: "/s/a1f3c07b",
      lang: "fr",
      mock: (url) => (url.includes("qr_create_reservation") ? mock() : null),
    });
    await p.click("main li button");
    await p.click('button[aria-haspopup="dialog"]');
    await p.click('[role="dialog"] button[type="submit"]');
    await p.fill('[role="dialog"] input[autocomplete="name"]', "Test Erreur");
    await p.fill('[role="dialog"] input[type="tel"]', "+212 600 000 000");
    await p.click('[role="dialog"] button[type="submit"]');
    await sleep(600);
    const alert = await p.ev(`document.querySelector('[role="dialog"] [role="alert"]')?.textContent ?? ""`);
    check(s, `message par cause : « ${fr} »`, alert.includes(fr), alert);
    check(s, "pas de fausse confirmation", !(await p.text()).includes("Demande envoyée"));
    if (label === "limite de débit" || label === "réseau coupé") await p.shot("message");
    await p.close();
  });
}

/* ─── 3. Portail direct : jusqu'au formulaire, sans envoi ─────────────────── */
for (const lang of ["fr", "en"]) {
  for (const embed of [false, true]) {
    await scenario(`/r/table-du-marche${embed ? "?embed=1" : ""} — ${lang} — jusqu'au formulaire (rien n'est envoyé)`, async (s) => {
      const p = await open({ name: `r-${lang}${embed ? "-embed" : ""}`, path: `/r/table-du-marche${embed ? "?embed=1" : ""}`, lang, clock: { h: 15, m: 0 } });
      let a = await p.audit();
      check(s, "étape 1 : cibles ≥ 44 px", a.small.length === 0, JSON.stringify(a.small));
      check(s, "h1 = nom de l'établissement", (await p.ev(`document.querySelector("h1")?.textContent`)) === "Restaurant Hivernage");
      await p.click("button", "20:00");
      await p.click("button", L(lang, "Continuer", "Continue"));
      a = await p.audit();
      check(s, "étape 2 : cibles ≥ 44 px", a.small.length === 0, JSON.stringify(a.small));
      check(s, "étape 2 : champs ≥ 16 px et étiquetés", a.fields.length === 0 && a.unlabeled.length === 0, JSON.stringify(a));
      await p.shot("formulaire");
      /* Envoi à vide : validation locale, aucune requête. */
      await p.click('button[type="submit"]');
      check(s, "formulaire vide : message visible", !!(await p.ev(`!!document.querySelector('form [role="alert"]')`)));
      check(s, "aucune demande émise", !p.rpc.includes("portal_create_reservation"), p.rpc.join(","));
      check(s, "« Propulsé par twocards. » présent", (await p.text()).includes(L(lang, "Propulsé par", "Powered by")) && (await p.text()).includes("twocards."));
      check(s, "aucune erreur console", p.errors.length === 0, p.errors.join(" | "));
      await p.close();
    });
  }
}

await scenario("/r/table-du-marche — fr — erreurs par cause (réponses simulées, D5)", async (s) => {
  for (const [label, mock, fr] of [
    ["débit", () => rpcError("Trop de demandes, réessayez dans quelques minutes"), "Patientez une dizaine de minutes"],
    ["réseau", () => "fail", "Pas de connexion"],
  ]) {
    const p = await open({ name: `r-erreur-${label}`, path: "/r/table-du-marche", lang: "fr", clock: { h: 15, m: 0 }, mock: (url) => (url.includes("portal_create_reservation") ? mock() : null) });
    await p.click("button", "20:00");
    await p.click("button", "Continuer");
    await p.fill('input[autocomplete="given-name"]', "Test");
    await p.fill('input[autocomplete="family-name"]', "Erreur");
    await p.fill('input[type="tel"]', "+212 600 000 000");
    await p.click('button[type="submit"]');
    await sleep(600);
    const alert = await p.ev(`document.querySelector('form [role="alert"]')?.textContent ?? ""`);
    check(s, `${label} : « ${fr} »`, alert.includes(fr), alert);
    await p.shot("message");
    await p.close();
  }
});

await scenario("/r/…?embed=1&lang=en — la langue voyage dans l'URL (D15)", async (s) => {
  const p = await open({ name: "r-embed-lang", path: "/r/table-du-marche?embed=1&lang=en", lang: "fr" });
  const loc = await p.ev("location.search");
  check(s, "pas de redirection : ?lang=en reste dans l'adresse", loc.includes("lang=en") && loc.includes("embed=1"), loc);
  check(s, "page en anglais", (await p.text()).includes("Number of guests"));
  await p.click('button[lang="fr"]');
  await sleep(3000);
  const loc2 = await p.ev("location.search");
  check(s, "sélecteur : bascule par l'URL (?lang=fr)", loc2.includes("lang=fr") && loc2.includes("embed=1") && (await p.text()).includes("Nombre de personnes"), loc2);
  await p.close();
});

/* ─── 4. Codes et liens inexistants ───────────────────────────────────────── */
for (const lang of ["fr", "en"]) {
  await scenario(`pages introuvables — ${lang}`, async (s) => {
    let p = await open({ name: `s-inexistant-${lang}`, path: "/s/zzzzzzzz", lang });
    let t = await p.text();
    check(s, "/s/zzzzzzzz : « menu plus disponible », sans bouton Réessayer", t.includes(L(lang, "Ce menu n'est plus disponible", "This menu is no longer available")) && !t.includes(L(lang, "Réessayer", "Try again")));
    check(s, "/s/zzzzzzzz : signature et console propre", t.includes("twocards.") && p.errors.length === 0, p.errors.join(" | "));
    await p.shot("page");
    await p.close();
    p = await open({ name: `r-inexistant-${lang}`, path: "/r/ce-portail-n-existe-pas", lang });
    t = await p.text();
    check(s, "/r/slug inexistant : « portail introuvable »", t.includes(L(lang, "Portail introuvable", "Booking page not found")) && !t.includes(L(lang, "Réessayer", "Try again")));
    check(s, "/r/slug inexistant : signature et console propre", t.includes("twocards.") && p.errors.length === 0, p.errors.join(" | "));
    await p.shot("page");
    await p.close();
  });
}

/* ─── 5. Avis : contexte et envoi simulés dans le navigateur ──────────────── */
const FAKE_ID = "00000000-0000-4000-8000-000000000000";
for (const lang of ["fr", "en"]) {
  await scenario(`/avis/[id] — ${lang} — échec d'envoi visible puis réussite (D2, réponses simulées)`, async (s) => {
    let rateCalls = 0;
    const p = await open({
      name: `avis-${lang}`,
      path: `/avis/${FAKE_ID}`,
      lang,
      mock: (url) => {
        if (url.includes("qr_rating_context"))
          return { status: 200, body: [{ venue_name: "Table du Marché", reservation_date: "2026-11-10", already_rated: false, google_review_url: null }] };
        if (url.includes("qr_rate_reservation")) return ++rateCalls === 1 ? "fail" : { status: 200, body: null };
        return null;
      },
    });
    const group = await p.ev(`(()=>{const g=document.querySelector('[role="radiogroup"]');return g?{radios:g.querySelectorAll('[role="radio"]').length,labelled:!!document.getElementById(g.getAttribute("aria-labelledby"))}:null})()`);
    check(s, "étoiles : radiogroup de 5 radios, relié au titre", !!group && group.radios === 5 && group.labelled, JSON.stringify(group));
    const a = await p.audit();
    check(s, "cibles ≥ 44 px, champ ≥ 16 px et étiqueté", a.small.length === 0 && a.fields.length === 0 && a.unlabeled.length === 0, JSON.stringify(a));
    await p.click('[role="radio"]:nth-of-type(4)');
    await p.ev(`document.querySelector('[role="radio"]:nth-of-type(4)').focus()`);
    await p.key("ArrowRight", "ArrowRight", 39);
    check(s, "clavier : flèche droite passe à 5 étoiles", (await p.ev(`[...document.querySelectorAll('[role="radio"]')].findIndex(r=>r.getAttribute("aria-checked")==="true")`)) === 4);
    await p.click('button[type="submit"]');
    await sleep(600);
    const alert = await p.ev(`document.querySelector('[role="alert"]')?.textContent ?? ""`);
    check(s, "D2 : échec d'envoi → message role=alert", alert.includes(L(lang, "Pas de connexion", "No connection")), alert);
    check(s, "D2 : la note est conservée, bouton « Réessayer »", (await p.ev(`document.querySelector('[role="radio"][aria-checked="true"]')!==null`)) && (await p.ev(`document.querySelector('button[type="submit"]').textContent`)).includes(L(lang, "Réessayer", "Try again")));
    await p.shot("1-echec");
    await p.click('button[type="submit"]');
    await sleep(600);
    check(s, "second envoi : remerciement", (await p.text()).includes(L(lang, "Merci pour votre avis", "Thank you for your review")));
    await p.shot("2-merci");
    check(s, "signature et console propre", (await p.text()).includes("twocards.") && p.errors.filter((e) => !e.includes("ERR_INTERNET_DISCONNECTED")).length === 0, p.errors.join(" | "));
    await p.close();
  });
}

await scenario("/avis/[id] inexistant — fr (vraie réponse de la base, lecture seule)", async (s) => {
  const p = await open({ name: "avis-inexistant", path: `/avis/${FAKE_ID}`, lang: "fr" });
  check(s, "« Lien invalide »", (await p.text()).includes("Lien invalide"));
  check(s, "aucune erreur console", p.errors.length === 0, p.errors.join(" | "));
  await p.shot("page");
  await p.close();
});

await scenario("/avis/[id] — fr — panne de chargement distincte de « lien invalide », bouton Réessayer (D3, réponses simulées)", async (s) => {
  let calls = 0;
  const p = await open({
    name: "avis-panne",
    path: `/avis/${FAKE_ID}`,
    lang: "fr",
    mock: (url) =>
      url.includes("qr_rating_context")
        ? ++calls <= 2
          ? "fail"
          : { status: 200, body: [{ venue_name: "Table du Marché", reservation_date: "2026-11-10", already_rated: false, google_review_url: null }] }
        : null,
  });
  let t = await p.text();
  check(s, "panne : message et bouton Réessayer, pas « Lien invalide »", t.includes("ne s'est pas chargée") && t.includes("Réessayer") && !t.includes("Lien invalide"));
  await p.shot("1-panne");
  calls = 2;
  await p.click("button", "Réessayer");
  await sleep(1200);
  t = await p.text();
  check(s, "après Réessayer : le formulaire s'affiche", t.includes("Comment était votre sortie"));
  await p.close();
});

writeFileSync(join(outDir, "parcours.json"), JSON.stringify(report, null, 2));
const total = report.reduce((n, s) => n + s.checks.length, 0);
console.log(`\n${total - failures}/${total} vérifications réussies — ${join(outDir, "parcours.json")}`);
ws.close();
chrome.kill();
process.exit(failures ? 1 : 0);
