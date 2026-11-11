/* Parcours « Demander un accès » de bout en bout, sans créer aucun compte :
   pilote Chrome headless par le protocole DevTools, sur le modèle de
   capture.mjs.

   node REFONTE/outils/parcours-signup.mjs [base]

   Garde-fou : toute requête du navigateur vers l'API d'authentification
   (/auth/v1/…) est arrêtée dans le navigateur et reçoit une réponse simulée ;
   elle n'atteint jamais Supabase. Avant tout envoi de formulaire, une requête
   témoin vers un hôte inexistant vérifie que l'interception est bien active ;
   sinon le script s'arrête.

   Écrit les captures et `parcours.json` dans REFONTE/captures/apres-signup/parcours/. */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const base = process.argv[2] ?? "http://localhost:3000";
const outDir = resolve("REFONTE/captures/apres-signup/parcours");
mkdirSync(outDir, { recursive: true });

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find((p) => existsSync(p));
if (!CHROME) throw new Error("Chrome introuvable");

const port = 9300 + Math.floor(Math.random() * 400);
const chrome = spawn(
  CHROME,
  ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), `tc-signup-${port}`)}`, "--hide-scrollbars", "--no-first-run", "--disable-gpu", "--mute-audio", "about:blank"],
  { stdio: "ignore" },
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

const host = new URL(base).hostname;
const report = [];
let failures = 0;
const CORS = [
  { name: "content-type", value: "application/json" },
  { name: "access-control-allow-origin", value: "*" },
  { name: "access-control-allow-headers", value: "*" },
  { name: "access-control-allow-methods", value: "GET,POST,OPTIONS" },
];

/* `answer` : réponse simulée de l'API d'authentification, { status, body }. */
async function open({ name, path, lang = "fr", width = 390, reducedMotion = false, answer }) {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const errors = [];
  const auth = [];
  const S = (m, p = {}) => send(m, p, sessionId);
  const onEvent = async (msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === "Runtime.exceptionThrown")
      errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error")
      errors.push(msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 400));
    if (msg.method === "Fetch.requestPaused") {
      const { request, requestId } = msg.params;
      if (request.method === "OPTIONS") {
        await S("Fetch.fulfillRequest", { requestId, responseCode: 204, responseHeaders: CORS, body: "" }).catch(() => {});
        return;
      }
      auth.push({ url: request.url, method: request.method, body: request.postData ?? null });
      const a = answer ?? { status: 200, body: { id: "00000000-0000-0000-0000-000000000000", aud: "authenticated", email: "x@example.invalid", identities: [], user_metadata: {} } };
      await S("Fetch.fulfillRequest", {
        requestId,
        responseCode: a.status,
        responseHeaders: CORS,
        body: Buffer.from(JSON.stringify(a.body)).toString("base64"),
      }).catch(() => {});
    }
  };
  listeners.add(onEvent);
  await S("Page.enable");
  await S("Runtime.enable");
  await S("Network.enable");
  await S("Fetch.enable", { patterns: [{ urlPattern: "*/auth/v1/*" }] });
  const mobile = width < 768;
  await S("Emulation.setDeviceMetricsOverride", { width, height: mobile ? 844 : 900, deviceScaleFactor: mobile ? 2 : 1, mobile });
  if (reducedMotion) await S("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await S("Network.setCookie", { name: "tc-lang", value: lang, domain: host, path: "/" });
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
  const key = async (k, code, vk, { shift = false, text } = {}) => {
    await S("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk, modifiers: shift ? 8 : 0, ...(text ? { text } : {}) });
    await S("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk, modifiers: shift ? 8 : 0 });
    await sleep(150);
  };
  return {
    name,
    ev,
    errors,
    auth,
    shot: async (label, full = true) => {
      const s = await S("Page.captureScreenshot", { format: "png", captureBeyondViewport: full });
      writeFileSync(join(outDir, `${name}-${label}.png`), Buffer.from(s.data, "base64"));
    },
    click: async (selector, text = null) => {
      const ok = await ev(`(()=>{const els=[...document.querySelectorAll(${JSON.stringify(selector)})].filter(e=>e.offsetParent!==null&&!e.disabled&&(${JSON.stringify(text)}===null||e.textContent.includes(${JSON.stringify(text)})));if(!els[0])return false;els[0].scrollIntoView({block:"center"});els[0].click();return true})()`);
      if (!ok) throw new Error(`[${name}] introuvable : ${selector} ${text ?? ""}`);
      await sleep(700);
    },
    /* Saisie réelle : focus puis texte inséré comme au clavier. */
    type: async (id, value) => {
      const ok = await ev(`(()=>{const el=document.getElementById(${JSON.stringify(id)});if(!el)return false;el.focus();el.select&&el.select();return true})()`);
      if (!ok) throw new Error(`[${name}] champ introuvable : ${id}`);
      await S("Input.insertText", { text: value });
      await sleep(120);
    },
    tab: (shift = false) => key("Tab", "Tab", 9, { shift }),
    enter: async () => {
      await key("Enter", "Enter", 13, { text: "\r" });
      await sleep(600);
    },
    space: () => key(" ", "Space", 32, { text: " " }),
    arrowRight: () => key("ArrowRight", "ArrowRight", 39),
    /* Élément qui a le focus : identifiant, sinon balise et début du texte. */
    focused: () =>
      ev(`(()=>{const e=document.activeElement;if(!e||e===document.body)return "body";return e.id||(e.tagName.toLowerCase()+(e.type==="radio"?"[radio "+e.value+"]":"")+":"+(e.getAttribute("aria-label")||e.textContent||"").trim().slice(0,40))})()`),
    h1: () => ev(`[...document.querySelectorAll("h1")].map(h=>h.textContent.trim())`),
    /* Champs en erreur : identifiant, message relié par aria-describedby. */
    invalid: () =>
      ev(`[...document.querySelectorAll('[aria-invalid="true"]')].map(e=>({id:e.id,message:(e.getAttribute("aria-describedby")||"").split(" ").map(i=>document.getElementById(i)?.textContent??"(introuvable)").join(" | ")}))`),
    /* Cibles de moins de 44 px (hors liens dans une phrase, hors éléments
       fournis par auth-shell : logo, langue, pied de page), champs sous
       16 px, champs sans étiquette. Un bouton radio masqué est mesuré par sa
       pastille. */
    audit: () =>
      ev(`(()=>{const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0};const scope=document.querySelector("main");const box=e=>(e.type==="radio"?e.nextElementSibling:e).getBoundingClientRect();const all=[...scope.querySelectorAll("button,a[href],input")].filter(vis).filter(e=>!e.closest("header,footer")&&!(e.tagName==="A"&&e.closest("p")));const small=all.map(e=>{const r=box(e);return{t:(e.id||e.value||e.textContent||e.tagName).trim().slice(0,30),w:Math.round(r.width),h:Math.round(r.height)}}).filter(x=>x.w<44||x.h<44);const inputs=[...scope.querySelectorAll("input")].filter(vis);const fields=inputs.filter(e=>e.type!=="radio").map(e=>({t:e.id,px:parseFloat(getComputedStyle(e).fontSize)})).filter(x=>x.px<16);const unlabeled=inputs.filter(e=>!(e.labels&&e.labels.length)).map(e=>e.id||e.type);return{checked:all.length,small,fields,unlabeled,overflow:document.documentElement.scrollWidth>window.innerWidth}})()`),
    attrs: () =>
      ev(`Object.fromEntries([...document.querySelectorAll("main form input:not([type=radio])")].map(e=>[e.id,[e.type,e.autocomplete||"-",e.inputMode||"-",e.required?"requis":"facultatif"].join(" / ")]))`),
    close: async () => {
      listeners.delete(onEvent);
      await send("Target.closeTarget", { targetId });
    },
  };
}

function check(s, label, ok, detail = "") {
  if (!ok) failures++;
  s.checks.push({ label, ok, ...(detail ? { detail } : {}) });
  console.log(`${ok ? "  ok   " : "  ÉCHEC"} ${label}${detail ? ` — ${detail}` : ""}`);
}
async function scenario(name, fn) {
  console.log(`\n${name}`);
  const s = { name, checks: [] };
  report.push(s);
  try {
    await fn(s);
  } catch (e) {
    check(s, "exécution", false, String(e.message ?? e));
  }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* Vérifie que l'interception est active avant tout envoi de formulaire. */
async function guard(p) {
  await p.ev(`fetch("https://temoin.invalid/auth/v1/signup",{method:"POST",body:"temoin"}).then(()=>1,()=>0)`);
  const seen = p.auth.some((r) => r.url.includes("temoin.invalid"));
  if (!seen) throw new Error("interception inactive : envoi abandonné");
  p.auth.length = 0;
}

/* Champs obligatoires visibles attendus, dans l'ordre, par métier. */
const REQUIRED = {
  hotel: ["venue-name", "city", "fullname", "email", "password"],
  etablissement: ["venue-name", "city", "fullname", "email", "password"],
  concierge: ["fullname", "email", "password"],
  influenceur: ["instagram", "fullname", "email", "password"],
};
const FIRST_OPTIONAL = { hotel: "rooms", etablissement: "instagram", concierge: "input[radio hotel]:", influenceur: "input[radio lt10k]:" };

/* 1. Écran 1, puis envoi à vide et retour, pour chaque métier. */
for (const width of [390, 1440]) {
  await scenario(`Écran 1 → formulaire → envoi à vide → retour (${width} px)`, async (s) => {
    const p = await open({ name: `vide-${width}`, path: "/signup", width });
    check(s, "écran 1 : un seul h1", same(await p.h1(), ["Vous êtes…"]), JSON.stringify(await p.h1()));
    check(s, "écran 1 : « Étape 1 sur 2 »", (await p.ev("document.body.textContent")).includes("Étape 1 sur 2"));
    const a1 = await p.audit();
    check(s, "écran 1 : cibles ≥ 44 px, pas de défilement horizontal", a1.small.length === 0 && !a1.overflow, JSON.stringify(a1));
    const labels = { hotel: "Hôtel ou riad", etablissement: "Établissement", concierge: "Concierge ou RP", influenceur: "Créateur de contenu" };
    for (const [kind, label] of Object.entries(labels)) {
      await p.click("main ul button", label);
      const h1 = await p.h1();
      check(s, `${kind} : un clic ouvre le formulaire, un seul h1, focus sur le titre`, h1.length === 1 && (await p.ev("document.activeElement.tagName")) === "H1", h1.join(" / "));
      const attrs = await p.attrs();
      check(s, `${kind} : champs visibles = obligatoires seulement`, same(Object.keys(attrs), REQUIRED[kind]) && Object.values(attrs).every((v) => v.endsWith("requis")), JSON.stringify(attrs));
      await p.click("main form button[type=submit]");
      const invalid = await p.invalid();
      check(s, `${kind} : un message par champ obligatoire`, same(invalid.map((i) => i.id), REQUIRED[kind]) && invalid.every((i) => i.message && !i.message.includes("introuvable")), invalid.map((i) => `${i.id}: ${i.message}`).join(" ; "));
      check(s, `${kind} : focus sur la première erreur`, (await p.focused()) === REQUIRED[kind][0], await p.focused());
      check(s, `${kind} : aucune requête d'authentification`, p.auth.length === 0);
      const a = await p.audit();
      check(s, `${kind} : cibles ≥ 44 px, champs à 16 px, étiquettes`, a.small.length === 0 && a.fields.length === 0 && a.unlabeled.length === 0 && !a.overflow, JSON.stringify(a));
      if (kind === "hotel") await p.shot("erreurs-hotel");
      /* Corriger un champ efface son erreur. */
      await p.type(REQUIRED[kind][0], "abc");
      check(s, `${kind} : l'erreur s'efface à la correction`, !(await p.invalid()).some((i) => i.id === REQUIRED[kind][0]));
      await p.type(REQUIRED[kind][0], "");
      await p.ev(`(()=>{const el=document.getElementById(${JSON.stringify(REQUIRED[kind][0])});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"");el.dispatchEvent(new Event("input",{bubbles:true}))})()`);
      await p.click("main button", "Changer de métier");
      check(s, `${kind} : retour à l'écran 1, focus sur le titre`, same(await p.h1(), ["Vous êtes…"]) && (await p.ev("document.activeElement.tagName")) === "H1");
    }
    check(s, "aucune erreur console", p.errors.length === 0, p.errors.join(" | "));
    await p.close();
  });
}

/* 2. Clavier seul, depuis l'écran 1. */
await scenario("Clavier seul : écran 1 → hôtel → champs facultatifs → erreur dans un facultatif", async (s) => {
  const p = await open({ name: "clavier", path: "/signup", width: 1440 });
  await guard(p);
  const order = [];
  for (let i = 0; i < 12; i++) {
    await p.tab();
    const f = await p.focused();
    order.push(f);
    if (f.startsWith("button:Hôtel ou riad")) break;
  }
  check(s, "Tab atteint le premier métier", order.at(-1).startsWith("button:Hôtel ou riad"), order.join(" → "));
  await p.enter();
  await sleep(600);
  check(s, "Entrée ouvre le formulaire hôtel", same(await p.h1(), ["Inscrire votre hôtel"]));
  const seq2 = [];
  for (let i = 0; i < 8; i++) {
    await p.tab();
    seq2.push(await p.focused());
  }
  const expected = ["venue-name", "city", "fullname", "email", "password"];
  const from = seq2.indexOf("venue-name");
  check(s, "ordre de tabulation = ordre visuel", from >= 0 && same(seq2.slice(from, from + 5), expected), seq2.join(" → "));
  const more = seq2.findIndex((x) => x.startsWith("button:Ajouter"));
  check(s, "« Afficher » puis « Ajouter… » puis « Créer mon compte » suivent", more > 0 && seq2[more - 1].startsWith("button:Afficher") && (seq2[more + 1] ?? "").startsWith("button:Créer mon compte"), seq2.slice(from + 5).join(" → "));
  /* Revenir sur « Ajouter… » et l'ouvrir à la barre d'espace. */
  for (let i = 0; i < 6 && !(await p.focused()).startsWith("button:Ajouter"); i++) await p.tab(true);
  await p.space();
  await sleep(500);
  check(s, "Espace déplie les facultatifs, focus sur le premier", (await p.focused()) === "rooms", await p.focused());
  check(s, "facultatifs de l'hôtel : chambres, Instagram, téléphone", same(Object.keys(await p.attrs()).slice(5), ["rooms", "instagram", "phone"]), JSON.stringify(await p.attrs()));
  await p.shot("facultatifs-hotel");
  await p.type("venue-name", "Riad Essai");
  await p.type("city", "Marrakech");
  await p.type("fullname", "Essai Parcours");
  await p.type("email", "essai@example.invalid");
  await p.type("password", "motdepasse");
  await p.type("phone", "12");
  await p.type("instagram", "pas valide !");
  await p.enter();
  const invalid = await p.invalid();
  check(s, "erreurs sur les seuls facultatifs fautifs", same(invalid.map((i) => i.id), ["instagram", "phone"]), invalid.map((i) => `${i.id}: ${i.message}`).join(" ; "));
  check(s, "focus sur la première (Instagram)", (await p.focused()) === "instagram", await p.focused());
  check(s, "rien n'est parti", p.auth.length === 0);
  const a = await p.audit();
  check(s, "cibles ≥ 44 px, champs à 16 px, étiquettes (facultatifs dépliés)", a.small.length === 0 && a.fields.length === 0 && a.unlabeled.length === 0, JSON.stringify(a));
  /* Changer de métier avec un facultatif rempli : il reste visible. */
  await p.click("main button", "Changer de métier");
  await p.click("main ul button", "Concierge ou RP");
  check(s, "concierge : facultatifs déjà dépliés car Instagram est rempli", (await p.ev(`!!document.getElementById("instagram")`)) === true);
  check(s, "aucune erreur console", p.errors.length === 0, p.errors.join(" | "));
  await p.close();
});

/* 3. Arrivée directe par ?role=…, attributs des champs, ouverture des facultatifs. */
for (const kind of Object.keys(REQUIRED)) {
  await scenario(`?role=${kind} : arrivée directe sur le formulaire (390 px, anglais)`, async (s) => {
    const p = await open({ name: `role-${kind}`, path: `/signup?role=${kind}`, lang: "en" });
    const h1 = await p.h1();
    check(s, "formulaire affiché d'emblée, un seul h1, « Step 2 of 2 »", h1.length === 1 && h1[0] !== "You are…" && (await p.ev("document.body.textContent")).includes("Step 2 of 2"), h1.join(" / "));
    check(s, "obligatoires visibles seulement", same(Object.keys(await p.attrs()), REQUIRED[kind]));
    await p.click("main form button[aria-expanded]");
    check(s, "ouvrir les facultatifs pose le focus sur le premier", (await p.focused()) === FIRST_OPTIONAL[kind], await p.focused());
    const attrs = await p.attrs();
    console.log(`         ${JSON.stringify(attrs)}`);
    s.attrs = attrs;
    const a = await p.audit();
    check(s, "cibles ≥ 44 px, champs à 16 px, étiquettes, pas de défilement horizontal", a.small.length === 0 && a.fields.length === 0 && a.unlabeled.length === 0 && !a.overflow, JSON.stringify(a));
    await p.shot("facultatifs");
    await p.click("main button", "Change profile");
    check(s, "retour à l'écran 1", same(await p.h1(), ["You are…"]));
    check(s, "aucune erreur console", p.errors.length === 0, p.errors.join(" | "));
    await p.close();
  });
}

/* 4. Envoi complet, intercepté : ce qui partirait vers Supabase. */
const FILL = {
  "venue-name": "Riad Essai",
  city: "Marrakech",
  rooms: "45",
  organization: "Royal Essai",
  instagram: "https://www.instagram.com/Essai.Parcours/?hl=fr",
  fullname: "Essai Parcours",
  email: "essai@example.invalid",
  phone: "+212 6 12 34 56 78",
  password: "motdepasse",
};
const EXPECTED = {
  hotel: { role: "hotel", signup_profile: "hotel", venue_name: "Riad Essai", venue_type: null, city: "Marrakech", rooms_count: 45, organization: null, concierge_type: null, audience_size: null },
  etablissement: { role: "etablissement", signup_profile: "etablissement", venue_name: "Riad Essai", venue_type: "rooftop", city: "Marrakech", rooms_count: null, organization: null, concierge_type: null, audience_size: null },
  concierge: { role: "concierge", signup_profile: "concierge", venue_name: null, venue_type: null, city: null, rooms_count: null, organization: "Royal Essai", concierge_type: "rp", audience_size: null },
  influenceur: { role: "concierge", signup_profile: "influenceur", venue_name: null, venue_type: null, city: null, rooms_count: null, organization: null, concierge_type: null, audience_size: "10-50k" },
};
const RADIO = { etablissement: "rooftop", concierge: "rp", influenceur: "10-50k" };
for (const kind of Object.keys(REQUIRED)) {
  await scenario(`${kind} : envoi complet, intercepté dans le navigateur`, async (s) => {
    const p = await open({ name: `envoi-${kind}`, path: `/signup?role=${kind}` });
    await guard(p);
    await p.click("main form button[aria-expanded]");
    for (const id of Object.keys(await p.attrs())) await p.type(id, FILL[id]);
    if (RADIO[kind]) await p.click(`main form input[type=radio][value="${RADIO[kind]}"]`);
    await p.click("main form button[type=submit]");
    await sleep(1200);
    const sent = p.auth.filter((r) => r.method === "POST");
    check(s, "une seule requête, vers /auth/v1/signup", sent.length === 1 && /\/auth\/v1\/signup(\?|$)/.test(sent[0]?.url ?? ""), sent.map((r) => r.url.replace(/^https?:\/\/[^/]+/, "")).join(", "));
    const body = sent[0]?.body ? JSON.parse(sent[0].body) : {};
    const data = body.data ?? {};
    const expected = { full_name: "Essai Parcours", phone: "+212 6 12 34 56 78", instagram: "essai.parcours", ...EXPECTED[kind] };
    check(s, "options.data : clés, ordre et valeurs attendus", same(data, expected), JSON.stringify(data));
    check(s, "e-mail et redirection", body.email === FILL.email && decodeURIComponent(sent[0]?.url ?? "").includes(`redirect_to=${base}/auth/callback`), `${body.email} ${decodeURIComponent((sent[0]?.url ?? "").split("?")[1] ?? "")}`);
    const h1 = await p.h1();
    check(s, "écran « Vérifiez votre boîte mail », un seul h1, adresse rappelée", same(h1, ["Vérifiez votre boîte mail."]) && (await p.ev("document.body.textContent")).includes(FILL.email), h1.join(" / "));
    if (kind === "hotel") await p.shot("boite-mail");
    check(s, "aucune erreur console", p.errors.length === 0, p.errors.join(" | "));
    s.sent = { ...body, password: "(masqué)" };
    await p.close();
  });
}

/* 5. Erreur renvoyée par Supabase : message traduit, saisie conservée. */
for (const lang of ["fr", "en"]) {
  await scenario(`Erreur Supabase « compte déjà existant » (${lang})`, async (s) => {
    const p = await open({ name: `erreur-${lang}`, path: "/signup?role=concierge", lang, answer: { status: 422, body: { code: 422, error_code: "user_already_exists", msg: "User already registered" } } });
    await guard(p);
    for (const id of REQUIRED.concierge) await p.type(id, FILL[id]);
    await p.click("main form button[type=submit]");
    await sleep(1200);
    const alert = await p.ev(`document.querySelector('main [role="alert"]')?.textContent ?? ""`);
    const wanted = lang === "fr" ? "Un compte existe déjà avec cet e-mail" : "An account already exists with this email";
    check(s, "message traduit, pas le texte brut du serveur", alert.includes(wanted) && !alert.includes("User already registered"), alert);
    check(s, "on reste sur le formulaire, saisie conservée", (await p.ev(`document.getElementById("email").value`)) === FILL.email);
    if (lang === "fr") await p.shot("erreur-supabase");
    /* Une seule erreur attendue en console : la réponse 422 simulée. */
    const others = p.errors.filter((e) => !/422|Failed to load resource/.test(e));
    check(s, "aucune autre erreur console", others.length === 0, others.join(" | "));
    await p.close();
  });
}

/* 6. Mouvement réduit : pas de déplacement entre les écrans. */
await scenario("prefers-reduced-motion : changement d'écran sans déplacement", async (s) => {
  const p = await open({ name: "mouvement-reduit", path: "/signup", reducedMotion: true });
  const watch = `(async()=>{const seen=new Set();const t0=performance.now();while(performance.now()-t0<900){for(const el of document.querySelectorAll("main [style*=transform], main [style*=opacity]")){const tr=getComputedStyle(el).transform;if(tr&&tr!=="none"&&tr!=="matrix(1, 0, 0, 1, 0, 0)")seen.add(tr)}await new Promise(r=>requestAnimationFrame(r))}return [...seen]})()`;
  const moving = p.ev(watch);
  await p.ev(`[...document.querySelectorAll("main ul button")][0].click()`);
  const transforms = await moving;
  check(s, "aucune translation pendant la transition", transforms.length === 0, transforms.join(" ; "));
  check(s, "le formulaire est bien affiché", same(await p.h1(), ["Inscrire votre hôtel"]));
  await p.close();
});

writeFileSync(join(outDir, "parcours.json"), JSON.stringify(report, null, 2));
const total = report.reduce((n, s) => n + s.checks.length, 0);
console.log(`\n${total - failures} vérification(s) réussie(s) sur ${total}.`);
ws.close();
chrome.kill();
process.exit(failures ? 1 : 0);
