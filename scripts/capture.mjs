// Card pictures for /index and /extra: loads a page of the running dev server in headless Chrome at 1440×900, waits for its arrival, and saves the first
// screen as a 1200×750 WebP.
//
//   npm run capture -- <path> <out.webp> [waitMs]
//   npm run capture -- /contact public/index/contact.webp
//   npm run capture -- /foundation-g public/extra/foundation-g.webp 6000
//
// BASE (default http://localhost:3300) is the server to read from; CHROME the browser binary (default: Google Chrome on macOS).
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const [path, out, wait = "5000"] = process.argv.slice(2);
if (!path || !out) {
  console.error("usage: npm run capture -- <path> <out.webp> [waitMs]");
  process.exit(1);
}
const BASE = process.env.BASE ?? "http://localhost:3300";
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9600 + Math.floor(Math.random() * 300);
const profile = mkdtempSync(join(tmpdir(), "capture-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--window-size=1440,900", "--hide-scrollbars", "about:blank"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let tabs;
  for (let i = 0; i < 50 && !tabs; i++) {
    try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(200); }
  }
  if (!tabs) throw new Error(`Chrome did not start (CHROME=${CHROME})`);
  const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: new URL(path, BASE).href });
  await sleep(Number(wait));
  // the working aids are not part of the page: the Extra pages chip (bottom right) and the version switches (top left)
  await send("Runtime.evaluate", { expression: "document.querySelectorAll('[data-extra-chip], .rv-sw').forEach((e) => e.remove()); scrollTo(0, 0)" });
  await sleep(600);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  await sharp(Buffer.from(shot.result.data, "base64")).resize(1200, 750).webp({ quality: 82 }).toFile(out);
  console.log(`${new URL(path, BASE).href} -> ${out}`);
  ws.close();
} finally {
  chrome.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
process.exit(0);
