// Renders the profile banner, the featured-work cards and the repos' social previews from HTML,
// with the portfolio's own fonts and colours, in headless Edge at 2x.
//
//   node art/build.mjs [name ...]        (no names: everything)
//
// Needs S:\portfolio (fonts, sharp, screenshots) and the shots in art/shots/.
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ART = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(ART, "..");
const PORTFOLIO = "S:/portfolio";
const sharp = createRequire(join(PORTFOLIO, "package.json"))("sharp");

const uri = (path, type) => `data:${type};base64,${readFileSync(path).toString("base64")}`;
const img = (path) => uri(path, path.endsWith(".webp") ? "image/webp" : path.endsWith(".png") ? "image/png" : "image/jpeg");
const P = (p) => join(PORTFOLIO, "src/assets", p);
const S = (p) => join(ART, "shots", p);

const fonts = `
@font-face { font-family: Archivo; src: url(${uri(P("fonts/web/archivo.woff2"), "font/woff2")}) format("woff2"); font-weight: 600 900; font-stretch: 75% 125%; }
@font-face { font-family: Geist; src: url(${uri(P("fonts/web/geist.woff2"), "font/woff2")}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: GeistMono; src: url(${uri(P("fonts/web/geist-mono.woff2"), "font/woff2")}) format("woff2"); font-weight: 100 900; }`;

const css = `${fonts}
:root { --ink:#0a0908; --ink-2:#141210; --fg:#efe9dc; --muted:#a39e94; --red:#e10600; --red-deep:#a80400; --red-text:#ff3b30;
  --paper:#e9e3d5; --paper-2:#dfd8c8; --paper-muted:#5c564c; --line:rgb(239 233 220/.14); }
* { box-sizing: border-box; margin: 0; }
html, body { background: transparent; }
body { font-family: Geist, sans-serif; -webkit-font-smoothing: antialiased; }
.frame { position: relative; overflow: hidden; }
.caps { font-family: Archivo; font-weight: 900; font-stretch: 118%; letter-spacing: -0.03em; line-height: .84; text-transform: uppercase; }
.display { font-family: Archivo; font-weight: 800; font-stretch: 112%; letter-spacing: -0.035em; line-height: .95; }
.label { font-family: GeistMono; font-size: 15px; letter-spacing: .08em; text-transform: uppercase; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--red); margin-right: 10px; vertical-align: 1px; }
.glow { position: absolute; border-radius: 50%; background: radial-gradient(closest-side, rgb(225 6 0 / .42), transparent); pointer-events: none; }
.phone-box { position: absolute; }
.phone { position: relative; width: 100%; aspect-ratio: 9 / 19.2; border-radius: 13% / 6.1%; background: #050505; padding: 3.2%;
  box-shadow: inset 0 0 0 2px #3a3633, inset 0 0 0 5px #121010, 0 0 0 1px rgb(0 0 0 / .6), 0 40px 80px -30px rgb(0 0 0 / .85); }
.phone .screen { position: relative; height: 100%; overflow: hidden; border-radius: 11% / 5.2%; background: #000; }
.phone .screen img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: top; }
.phone .island { position: absolute; top: 2.2%; left: 50%; width: 30%; height: 3.4%; transform: translateX(-50%); border-radius: 99px; background: #000; }
.browser { position: absolute; overflow: hidden; border-radius: 16px; background: #f6f4ef; box-shadow: 0 40px 80px -30px rgb(0 0 0 / .7), 0 0 0 1px rgb(0 0 0 / .18); }
.browser .bar { height: 36px; display: flex; align-items: center; gap: 7px; padding: 0 14px; border-bottom: 1px solid rgb(0 0 0 / .1); }
.browser .bar i { width: 11px; height: 11px; border-radius: 50%; }
.browser .bar span { margin-left: 12px; font: 13px GeistMono; color: rgb(0 0 0 / .62); }
.browser > img { display: block; width: 100%; }
.chips { display: flex; flex-wrap: wrap; gap: 10px; }
.chip { font-family: GeistMono; font-size: 15px; letter-spacing: .04em; padding: 9px 16px; border-radius: 99px; border: 1px solid var(--line); color: var(--fg); }
.chip.red { background: var(--red); border-color: var(--red); color: #fff; }
`;

// The box carries the size and position: the bezel's % padding resolves against it.
const phone = (src, style) => `<div class="phone-box" style="${style}"><div class="phone"><div class="screen"><img src="${img(src)}"></div><span class="island"></span></div></div>`;
const browser = (src, url, style) =>
  `<div class="browser" style="${style}"><div class="bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span>${url}</span></div><img src="${img(src)}"></div>`;
const z = (style) => `<img src="${img(P("v4/brand/z-glossy.webp"))}" style="position:absolute;${style}">`;

// ── Banner (1280×480): name, the two numbers, the red Z. Dark and light.
// On a phone GitHub shows it about 300 px wide (×0.23), so every line that matters is ≥ 44 px here.
function banner(theme) {
  const dark = theme === "dark";
  const c = dark
    ? { bg: "var(--ink)", fg: "var(--fg)", muted: "var(--muted)", label: "var(--muted)", accent: "var(--red-text)", rule: "var(--line)" }
    : { bg: "var(--paper)", fg: "var(--ink)", muted: "var(--paper-muted)", label: "var(--paper-muted)", accent: "var(--red-deep)", rule: "rgb(10 9 8 / .14)" };
  const stat = (num, what) =>
    `<div><p class="display" style="font-size:74px;color:${c.accent}">${num}</p>
      <p style="margin-top:10px;font-size:30px;line-height:1.1;color:${c.fg};font-weight:500;letter-spacing:-.01em">${what}</p></div>`;
  return {
    w: 1280, h: 480,
    html: `<div class="frame" style="width:1280px;height:480px;background:${c.bg};border-radius:24px">
      <div class="glow" style="width:640px;height:640px;right:-80px;top:-120px;opacity:${dark ? 1 : 0.55}"></div>
      ${z("right:70px;top:60px;height:360px;transform:rotate(-6deg);filter:drop-shadow(0 26px 40px rgb(120 0 0 / .45))")}
      <div style="position:absolute;left:64px;top:52px;right:400px">
        <p class="label" style="font-size:21px;color:${c.label}"><span class="dot" style="width:13px;height:13px"></span>Founder of Zen-Z · live on Google Play</p>
        <h1 class="caps" style="font-size:94px;color:${c.fg};margin-top:24px">Aayush<br>Thakur</h1>
        <div style="display:flex;gap:56px;margin-top:30px;padding-top:24px;border-top:2px solid ${c.rule}">
          ${stat("150+", "users in 2 days")}
          ${stat("₹33K+", "revenue")}
        </div>
      </div>
    </div>`,
  };
}

// ── Featured-work cards (1200×750, rounded, transparent corners).
const card = (bg, label, labelColor, inner) => ({
  w: 1200, h: 750,
  html: `<div class="frame" style="width:1200px;height:750px;border-radius:36px;background:${bg}">
    ${inner}
    <p class="label" style="position:absolute;left:40px;top:36px;font-size:17px;color:${labelColor}">${label}</p>
  </div>`,
});

const cards = {
  "card-zen-z-app": () =>
    card("radial-gradient(120% 100% at 70% 30%, #ff2a1f, #e10600 45%, #9c0400)", "Zen-Z · Android app", "rgb(255 255 255 / .85)", `
      ${z("left:50%;top:50%;height:640px;transform:translate(-50%,-50%) rotate(-8deg);opacity:.28;mix-blend-mode:multiply")}
      ${phone(P("zenz/home.jpg"), "width:250px;left:330px;top:150px;transform:rotate(-7deg)")}
      ${phone(P("zenz/flow-1-game.jpg"), "width:250px;left:620px;top:110px;transform:rotate(6deg)")}`),
  "card-zen-z-site": () =>
    card("var(--paper)", "zen-z.site · marketing site", "var(--paper-muted)", `
      ${browser(P("v4/brand/zen-z-site.webp"), "zen-z.site", "width:860px;left:70px;top:110px")}
      ${phone(P("v4/brand/zen-z-site-phone.webp"), "width:220px;right:70px;top:250px;transform:rotate(5deg)")}`),
  "card-prelimsdaily": () =>
    card("#f3efe6", "PrelimsDaily · Android + web", "var(--paper-muted)", `
      ${phone(P("prelims/today.jpg"), "width:236px;left:290px;top:150px;transform:rotate(-9deg);z-index:0")}
      ${phone(P("prelims/quiz.jpg"), "width:266px;left:467px;top:100px;z-index:1")}
      ${phone(P("prelims/result.jpg"), "width:236px;left:674px;top:150px;transform:rotate(9deg);z-index:0")}`),
  "card-portfolio": () =>
    card("radial-gradient(90% 90% at 75% 20%, #3a0605, #0f0b0a 62%)", "aayush · portfolio", "var(--muted)", `
      ${browser(S("portfolio-desk.webp"), PORTFOLIO_HOST, "width:860px;left:70px;top:110px")}
      ${phone(S("portfolio-phone.webp"), "width:220px;right:70px;top:250px;transform:rotate(5deg)")}`),
};

// ── Social previews (1280×640): repo name, one line, three chips, a visual on the right.
function preview({ repo, title, line, chips, visual, titleSize = 96 }) {
  return {
    w: 1280, h: 640,
    html: `<div class="frame" style="width:1280px;height:640px;background:var(--ink)">
      <div class="glow" style="width:900px;height:900px;right:-260px;top:-180px"></div>
      ${visual}
      <div style="position:absolute;left:72px;top:72px;width:600px">
        <p class="label" style="color:var(--muted)"><span class="dot"></span>github.com/aayush-t-exe/${repo}</p>
        <h1 class="caps" style="font-size:${titleSize}px;color:var(--fg);margin-top:34px">${title}</h1>
        <p style="margin-top:30px;font-size:27px;line-height:1.3;color:var(--fg);letter-spacing:-.01em;max-width:560px">${line}</p>
      </div>
      <div class="chips" style="position:absolute;left:72px;bottom:68px;width:640px">${chips.map((c, i) => `<span class="chip ${i === 0 ? "red" : ""}">${c}</span>`).join("")}</div>
    </div>`,
  };
}

const previews = {
  "preview-zen-z": () =>
    preview({
      repo: "Zen-Z",
      title: "Zen-Z",
      titleSize: 120,
      line: "A campus app that puts students into small groups for cafés, dinners, movies and sports.",
      chips: ["Live on Google Play", "150+ users in 2 days", "React Native · Next.js · Supabase"],
      visual: `${z("right:40px;top:40px;height:330px;opacity:.9;transform:rotate(-6deg)")}
        ${phone(P("zenz/home.jpg"), "width:230px;right:290px;top:120px;transform:rotate(-7deg)")}
        ${phone(P("zenz/flow-6-pay.jpg"), "width:230px;right:60px;top:170px;transform:rotate(6deg)")}`,
    }),
  "preview-prelims-daily": () =>
    preview({
      repo: "prelims-daily",
      title: "Prelims<br>Daily",
      line: "A daily UPSC Prelims practice app: streaks, smart reminders, works offline.",
      chips: ["Built in 1 day", "72 tests", "Expo · TypeScript"],
      visual: `${phone(P("prelims/today.jpg"), "width:220px;right:300px;top:150px;transform:rotate(-8deg)")}
        ${phone(P("prelims/quiz.jpg"), "width:240px;right:80px;top:110px;transform:rotate(5deg)")}`,
    }),
  "preview-shadow": () =>
    preview({
      repo: "Shadow",
      title: "Shadow",
      titleSize: 96,
      line: "A study companion for Windows. It explains a coding problem step by step, in Python or Java.",
      chips: ["College project", "Electron · React · TypeScript", "Open source"],
      visual: browser("S:/Projects/Shadow/docs/images/hero.png", "Shadow", "width:660px;right:-150px;top:190px;transform:rotate(-3deg)"),
    }),
  "preview-portfolio": () =>
    preview({
      repo: "portfolio",
      title: "Aayush<br>Thakur",
      titleSize: 100,
      line: "My portfolio: a CSS-3D phone that travels through the page.",
      chips: ["Next.js 16", "GSAP · Lenis", PORTFOLIO_HOST],
      visual: `${phone(S("portfolio-phone.webp"), "width:250px;right:120px;top:110px;transform:rotate(6deg)")}`,
    }),
};

const PORTFOLIO_HOST = process.env.PORTFOLIO_HOST || "aayushthakur.vercel.app";

const jobs = {
  "banner-dark": () => banner("dark"),
  "banner-light": () => banner("light"),
  ...cards,
  ...previews,
};
// Where each image goes, and its format (social previews: JPG, which GitHub's upload accepts).
const out = (name) =>
  name.startsWith("banner") ? { path: `assets/${name}.webp`, fmt: "webp" }
  : name.startsWith("card") ? { path: `assets/work/${name.slice(5)}.webp`, fmt: "webp" }
  : { path: `previews/${name.slice(8)}.jpg`, fmt: "jpg" };

const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(jobs);

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9300 + Math.floor(Math.random() * 500);
const TMP = join(ART, ".tmp");
mkdirSync(TMP, { recursive: true });
const edge = spawn(EDGE, ["--headless=new", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(TMP, "edge")}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ver;
for (let i = 0; i < 120; i++) { try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); break; } catch { await sleep(250); } }
function connect(url) {
  const ws = new WebSocket(url); let id = 0; const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  return new Promise((r) => ws.addEventListener("open", () => r({ ws, send })));
}
const browserWs = await connect(ver.webSocketDebuggerUrl);
try {
  for (const name of names) {
    const { w, h, html } = jobs[name]();
    const file = join(TMP, `${name}.html`);
    writeFileSync(file, `<!doctype html><meta charset="utf-8"><style>${css}</style><body>${html}</body>`);
    const t = await browserWs.send("Target.createTarget", { url: "about:blank" });
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    const p = await connect(list.find((x) => x.id === t.result.targetId).webSocketDebuggerUrl);
    await p.send("Page.enable");
    await p.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: false });
    await p.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
    await p.send("Page.navigate", { url: "file:///" + file.replace(/\\/g, "/") });
    await sleep(1200);
    await p.send("Runtime.evaluate", { expression: "document.fonts.ready", awaitPromise: true });
    const shot = await p.send("Page.captureScreenshot", { format: "png" });
    const png = Buffer.from(shot.result.data, "base64");
    const { path, fmt } = out(name);
    mkdirSync(dirname(join(ROOT, path)), { recursive: true });
    if (fmt === "webp") await sharp(png).webp({ quality: 84, alphaQuality: 90, effort: 6 }).toFile(join(ROOT, path));
    else await sharp(png).resize(1280, 640).jpeg({ quality: 90, mozjpeg: true }).toFile(join(ROOT, path));
    console.log(name, "->", path, Math.round(readFileSync(join(ROOT, path)).length / 1024) + " KB");
    p.ws.close();
    await browserWs.send("Target.closeTarget", { targetId: t.result.targetId });
  }
} finally {
  await browserWs.send("Browser.close");
  await sleep(500);
  try { edge.kill(); } catch {}
  rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
}
process.exit(0);
