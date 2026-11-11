// The look check: records how the built page looks, then compares two records.
//   node scripts/look.mjs capture <dir>         the build in dist/, served by vite preview
//   node scripts/look.mjs compare <before> <after>
// A record holds, for each screen and window width, every visible element's box, colours and font, a
// screenshot, and the contrast audit (texts under 4.5:1). Chrome comes from $CHROME or its usual install path.
// It drives Chrome over the DevTools protocol, so it needs no package.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const WIDTHS = [1280, 1000, 390, 360];
const HEIGHT = { 1280: 800, 1000: 760, 390: 844, 360: 740 };
const PREVIEW_PORT = 4174;
const URL = `http://localhost:${PREVIEW_PORT}/gibber-hands/`;
const CHROME_PATHS = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Clicks the first element matching `selector`; the screens are reached the way a visitor would. */
const click = (selector) => `document.querySelector(${JSON.stringify(selector)})?.click()`;
const closeWelcome = click('.welcome-dialog .dialog-close');
const ready = {
  live: `document.querySelector('.status-part')?.textContent.includes('Camera on') && ![...document.querySelectorAll('#camera-status .status-card')].some((c) => !c.hidden)`,
  sliders: `!!document.querySelector('.sliders')`
};

/** Each screen: whether the camera works, what to wait for, and what to press. Narrow windows open sheets instead. */
function screens(width) {
  const narrow = width < 720;
  return [
    { name: 'welcome', camera: true, ready: ready.live, actions: [] },
    { name: 'live', camera: true, ready: ready.live, actions: [closeWelcome] },
    { name: 'sliders', camera: false, ready: ready.sliders, actions: [closeWelcome] },
    { name: 'help', camera: true, ready: ready.live, actions: [closeWelcome, click('.top-help')] },
    narrow
      ? { name: 'sheet-sounds', camera: true, ready: ready.live, actions: [closeWelcome, click('.bottom-button')] }
      : { name: 'side-collapsed', camera: true, ready: ready.live, actions: [closeWelcome, click('.side-collapse')] },
    narrow
      ? { name: 'sheet-side', camera: true, ready: ready.live, actions: [closeWelcome, click('.bottom-button + .bottom-button')] }
      : { name: 'sounds-shrunk', camera: true, ready: ready.live, actions: [closeWelcome, click('.sounds-shrink')] }
  ];
}

/** Runs in the page: every visible element by its place in the tree, with its box and look. */
const DUMP = `(() => {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgba = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].join(','); };
  const shadow = (s) => s === 'none' ? 'none' : s.split(/,(?![^(]*\\))/).map((l) => l.trim()).filter((l) => !/^rgba\\(0, 0, 0, 0\\)|^transparent/.test(l) && !/0px 0px 0px 0px$/.test(l.replace(/ inset/, ''))).join(', ') || 'none';
  const key = (el) => { const parts = []; for (let e = el; e && e !== document.body; e = e.parentElement) parts.unshift(e.id ? '#' + e.id : e.tagName.toLowerCase() + ':' + ([...e.parentElement.children].indexOf(e) + 1)); return parts.join('>'); };
  const out = {};
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    if (r.width === 0 || r.height === 0 || s.visibility === 'hidden' || el.closest('[hidden], dialog:not([open])')) continue;
    out[key(el)] = {
      box: [r.x, r.y, r.width, r.height].map((v) => Math.round(v)),
      color: rgba(s.color), background: rgba(s.backgroundColor), border: s.borderTopWidth + ' ' + s.borderTopStyle + ' ' + rgba(s.borderTopColor),
      radius: s.borderRadius, font: s.fontWeight + ' ' + s.fontSize + ' ' + s.fontFamily, opacity: s.opacity, shadow: shadow(s.boxShadow), outline: s.outlineStyle
    };
  }
  return JSON.stringify(out);
})()`;

/** Runs in the page: texts under 4.5:1 against the backgrounds they sit on, disabled controls aside. */
const CONTRAST = `(() => {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgba = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const over = (top, under) => [0, 1, 2].map((i) => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const bad = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (![...el.childNodes].some((t) => t.nodeType === 3 && t.textContent.trim())) continue;
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    if (r.width < 2 || r.height < 2 || s.visibility === 'hidden' || s.clipPath.includes('inset(50%)') || el.closest(':disabled, [aria-disabled=true], [hidden], dialog:not([open])')) continue;
    const chain = []; for (let e = el; e; e = e.parentElement) chain.unshift(e);
    let bg = [11, 15, 20, 1]; let opacity = 1;
    for (const e of chain) { const cs = getComputedStyle(e); bg = over(rgba(cs.backgroundColor), bg); opacity *= Number(cs.opacity); }
    const c = rgba(s.color); const fg = over([c[0], c[1], c[2], c[3] * opacity], bg);
    const [a, b] = [lum(fg), lum(bg)].sort((p, q) => q - p);
    const ratio = (a + 0.05) / (b + 0.05);
    if (ratio < 4.5) bad.push(el.tagName.toLowerCase() + ' "' + el.textContent.trim().slice(0, 30) + '" ' + ratio.toFixed(2));
  }
  return JSON.stringify(bad);
})()`;

async function browser(camera, port) {
  const exe = CHROME_PATHS.find((p) => p && existsSync(p));
  if (!exe) throw new Error('Chrome not found: set $CHROME to its executable');
  const profile = mkdtempSync(join(tmpdir(), 'look-'));
  const flags = ['--headless=new', '--hide-scrollbars', '--remote-debugging-port=' + port, '--user-data-dir=' + profile, 'about:blank'];
  if (camera) flags.unshift('--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream');
  const proc = spawn(exe, flags, { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 50 && !targets; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(200); }
  }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
  });
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.value;
  return {
    send, evaluate,
    async close() {
      ws.close();
      const exited = new Promise((r) => proc.once('exit', r));
      proc.kill();
      await exited;
      rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
    }
  };
}

async function capture(dir) {
  mkdirSync(dir, { recursive: true });
  const preview = spawn(join('node_modules', '.bin', 'vite'), ['preview', '--port', String(PREVIEW_PORT), '--strictPort'], { stdio: 'ignore' });
  await sleep(1500);
  const browsers = { true: await browser(true, 9334), false: await browser(false, 9335) };
  const record = {};
  try {
    for (const width of WIDTHS) {
      for (const screen of screens(width)) {
        const b = browsers[screen.camera];
        await b.send('Emulation.setDeviceMetricsOverride', { width, height: HEIGHT[width], deviceScaleFactor: 1, mobile: false });
        // The step hint's icons move: reduced motion holds them still, so two records of one page match.
        await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
        await b.send('Page.navigate', { url: URL });
        await sleep(500);
        await b.evaluate('localStorage.clear()');
        await b.send('Page.reload');
        let ok = false;
        for (let i = 0; i < 120 && !ok; i++) { await sleep(250); ok = await b.evaluate(screen.ready); }
        if (!ok) console.warn(`${screen.name} at ${width}: not ready after 30 s, recorded as is`);
        for (const action of screen.actions) { await b.evaluate(action); await sleep(300); }
        await sleep(400);
        const name = `${screen.name}-${width}`;
        record[name] = { elements: JSON.parse(await b.evaluate(DUMP)), contrast: JSON.parse(await b.evaluate(CONTRAST)) };
        const shot = await b.send('Page.captureScreenshot', { format: 'png' });
        writeFileSync(join(dir, name + '.png'), Buffer.from(shot.data, 'base64'));
        console.log(`${name}: ${Object.keys(record[name].elements).length} elements, ${record[name].contrast.length} texts under 4.5:1`);
      }
    }
  } finally {
    await browsers.true.close();
    await browsers.false.close();
    preview.kill();
  }
  writeFileSync(join(dir, 'look.json'), JSON.stringify(record));
}

/** What the eye sees of a property: a border 0 px wide shows nothing, whatever its style and colour. */
const seen = (prop, value) => (prop === 'border' && value.startsWith('0px ') ? 'none' : value);

function compare(beforeDir, afterDir) {
  const before = JSON.parse(readFileSync(join(beforeDir, 'look.json'), 'utf8'));
  const after = JSON.parse(readFileSync(join(afterDir, 'look.json'), 'utf8'));
  let differences = 0;
  const report = (line) => { differences++; console.log(line); };
  for (const [name, b] of Object.entries(before)) {
    const a = after[name];
    if (!a) { report(`${name}: screen missing`); continue; }
    for (const [key, was] of Object.entries(b.elements)) {
      const now = a.elements[key];
      if (!now) { report(`${name} ${key}: no longer visible`); continue; }
      if (was.box.some((v, i) => Math.abs(v - now.box[i]) > 1)) report(`${name} ${key}: box ${was.box} → ${now.box}`);
      for (const prop of ['color', 'background', 'border', 'radius', 'font', 'opacity', 'shadow', 'outline']) {
        if (seen(prop, was[prop]) !== seen(prop, now[prop])) report(`${name} ${key}: ${prop} ${was[prop]} → ${now[prop]}`);
      }
    }
    for (const key of Object.keys(a.elements)) if (!b.elements[key]) report(`${name} ${key}: newly visible`);
    for (const text of a.contrast) report(`${name}: contrast under 4.5:1: ${text}`);
  }
  console.log(differences ? `${differences} differences` : 'No difference.');
  process.exitCode = differences ? 1 : 0;
}

const [command, ...dirs] = process.argv.slice(2);
if (command === 'capture' && dirs.length === 1) await capture(dirs[0]);
else if (command === 'compare' && dirs.length === 2) compare(dirs[0], dirs[1]);
else {
  console.error('Usage: node scripts/look.mjs capture <dir> | compare <before> <after>');
  process.exitCode = 2;
}
