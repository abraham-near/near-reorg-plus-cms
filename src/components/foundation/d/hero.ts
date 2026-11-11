// Version D's hero: the world laid flat as an isometric dot ground, with the network of people, apps and builders popping up across it.
// The ground: the home globe's land mask (/v1/world/land-rle.json, equirectangular 1440 × 720) sampled on an isometric lattice (the home's dot language,
// on the rail's iso floor). The map is turned 45° in the floor plane so it reads north-up and runs across the screen (lon → screen x, lat → screen y,
// foreshortened by tan 30°); every object on it stays on the iso axes (2:1 slabs, the rail's hand).
// On it: ~40 places (small slabs with people, app tiles, stacked builder plates) and ~26 single people, popping up as the ground sweeps in, joined by thin
// dashed arcs (each to its nearest neighbours: a mesh, no hub) that carry green pulses. The NEAR Foundation is one small ink slab in Zug, off to the side,
// with only two faint links: it supports, it does not control.
// Motion: the intro (sweep, pops, arcs), then idle (pulses, pings); pointer parallax on desktop (ground < arcs < objects < chips); setP(p) scrubs a slow
// camera pull-back (the whole world comes into view). Reduced motion: one finished frame, redrawn on resize only.
// Cost: the ground (~9k dots) is cached in an offscreen canvas and only re-rendered when the camera's zoom changes; the frame blits it and draws ~70 objects.
// The loop only runs while the hero is on screen and the tab is visible; dpr <= 2.
import { C, S, INK, GREEN, DARK, LIGHT, box, quad, cyl, person, ring, fit, clamp, o3, oBack, io, rng } from "./canvas-kit";

const A = Math.SQRT2 * C, B = Math.SQRT2 * S;   // screen px per degree (lon, lat) at k = 1: the 45° turn of the map in the iso floor
const LAT_N = 74, LAT_S = -57, H = 0.8;           // the band drawn, and the lattice step (degrees)

type Kind = "community" | "apps" | "builders" | "person" | "foundation";
type Node = { lon: number; lat: number; kind: Kind; chip?: string; t0: number; g: boolean; s: number; top: number };
type Edge = { a: number; b: number; t0: number; faint: boolean; pulse: number; per: number; ph: number };

// [lon, lat, kind, chip]
const PLACES: [number, number, Kind, string?][] = [
  [-122.4, 37.8, "builders"], [-123.1, 49.3, "person"], [-99.1, 19.4, "community"], [-74, 40.7, "apps"], [-79.4, 43.7, "person"],
  [-80.2, 25.8, "apps"], [-74.1, 4.7, "community"], [-46.6, -23.5, "community", "COMMUNITY"], [-58.4, -34.6, "builders"], [-77, -12, "person"],
  [-0.1, 51.5, "apps"], [-9.1, 38.7, "community"], [13.4, 52.5, "builders"], [8.5, 47.2, "foundation", "NEAR FOUNDATION"], [30.5, 50.4, "builders"],
  [29, 41, "apps"], [3.4, 6.5, "community"], [36.8, -1.3, "builders"],
  [18.4, -33.9, "apps"], [31.2, 30, "community"], [-0.2, 5.6, "person"], [55.3, 25.2, "apps", "APPS"], [77.6, 13, "builders", "BUILDERS"],
  [77.2, 28.6, "community"], [103.8, 1.35, "apps"], [106.8, -6.2, "community"], [106.7, 10.8, "builders"], [121, 14.6, "community"],
  [114.2, 22.3, "apps"], [121.5, 31.2, "builders"], [127, 37.5, "apps"], [139.7, 35.7, "community"], [100.5, 13.8, "person"],
  [151.2, -33.9, "builders"], [145, -37.8, "person"], [174.8, -36.8, "community"], [-43.2, -22.9, "person"],
];
const TOPZ: Record<Kind, number> = { community: 14, apps: 13, builders: 17, person: 12, foundation: 5 };
// a few long links (indices into PLACES): New York–London, London–Lagos, São Paulo–Lagos, Dubai–Bangalore, Singapore–Sydney, SF–New York, Bangalore–Singapore, Cairo–Dubai
const LONG: [number, number][] = [[3, 10], [10, 16], [7, 16], [21, 22], [24, 33], [0, 3], [22, 24], [19, 21]];

export type Hero = { setP: (p: number) => void; setKnock: (r: { x0: number; y0: number; x1: number; y1: number }[]) => void; resize: () => void; dispose: () => void };

type Land = { w: number; h: number; m: Uint8Array };
let landCache: Promise<Land> | null = null;
function loadLand(): Promise<Land> {
  if (landCache) return landCache;
  landCache = fetch("/v1/world/land-rle.json").then((r) => r.json()).then((j: { w: number; h: number; rows: number[][] }) => {
    const m = new Uint8Array(j.w * j.h);
    j.rows.forEach((row, y) => { let x = 0, land = false; for (const n of row) { if (land) m.fill(1, y * j.w + x, y * j.w + x + n); x += n; land = !land; } });
    return { w: j.w, h: j.h, m };
  });
  landCache.catch(() => { landCache = null; });
  return landCache;
}
const isLand = (L: Land, lon: number, lat: number) => {
  const x = Math.min(L.w - 1, Math.max(0, Math.floor(((lon + 180) / 360) * L.w))), y = Math.min(L.h - 1, Math.max(0, Math.floor(((90 - lat) / 180) * L.h)));
  return L.m[y * L.w + x] === 1;
};

export function createHero(cv: HTMLCanvasElement, stage: HTMLElement, chipEls: Map<string, HTMLElement>, reduced: boolean): Hero {
  let W = 0, Hh = 0, mobile = false, dead = false, raf = 0, visible = true, introDone = reduced;
  const t0 = performance.now();
  let land: Float32Array | null = null, sea: Float32Array | null = null;
  let pT = 0, pS = 0;   // the scroll's progress: wanted, smoothed
  let knock: { x0: number; y0: number; x1: number; y1: number }[] = [];
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  const off = document.createElement("canvas"), M = 40; let offKey = "";
  const nodes: Node[] = [], edges: Edge[] = [];
  const chipMemo = new Map<HTMLElement, string>(), chipW = new Map<HTMLElement, number>();
  const R = rng(7);

  /* ── the places and the people ── */
  PLACES.forEach(([lon, lat, kind, chip], i) => nodes.push({ lon, lat, kind, chip, t0: 0, g: kind === "apps" ? i % 2 === 0 : i % 5 === 0, s: R(), top: TOPZ[kind] }));
  const near = (a: Node, b: Node) => { const dl = (a.lon - b.lon) * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180), dt = a.lat - b.lat; return Math.hypot(dl, dt); };
  /* the mesh: each place to its two nearest (people and the Foundation join later), plus a few long links */
  const key = new Set<string>();
  const addE = (a: number, b: number, faint = false) => { const k = a < b ? `${a}-${b}` : `${b}-${a}`; if (a === b || key.has(k)) return; key.add(k); edges.push({ a, b, t0: 0, faint, pulse: 0, per: 0, ph: 0 }); };
  const hubs = nodes.map((n, i) => i).filter((i) => nodes[i].kind !== "person" && nodes[i].kind !== "foundation");
  hubs.forEach((i) => hubs.filter((j) => j !== i).sort((x, y) => near(nodes[i], nodes[x]) - near(nodes[i], nodes[y])).slice(0, 2).forEach((j) => addE(i, j)));
  LONG.forEach(([a, b]) => addE(a, b));
  const F = nodes.findIndex((n) => n.kind === "foundation");
  hubs.slice().sort((x, y) => near(nodes[F], nodes[x]) - near(nodes[F], nodes[y])).slice(0, 2).forEach((j) => addE(F, j, true));
  edges.forEach((e, i) => { e.pulse = i % 3 === 0 && !e.faint ? 1 : 0; e.per = 5.5 + R() * 4.5; e.ph = R() * e.per; });

  /* ── the ground: the land mask on the iso lattice (lon = (i − j)·H, −lat = (i + j)·H) ── */
  loadLand().then((L) => {
    if (dead) return;
    const ls: number[] = [], ss: number[] = [];
    for (let r = Math.ceil(-LAT_N / H); r <= Math.floor(-LAT_S / H); r++) {
      const lat = -r * H;
      for (let q = Math.ceil(-180 / H); q <= Math.floor(180 / H); q++) {
        if ((q - r) & 1) continue;
        const lon = q * H;
        if (isLand(L, lon, lat)) ls.push(lon, lat);
        else if (((r + q) & 3) === 0 && ((r - q) & 3) === 0) ss.push(lon, lat);
      }
    }
    land = Float32Array.from(ls); sea = Float32Array.from(ss);
    /* the people: single figures at random inhabited land points, away from the places */
    const r2 = rng(23); let tries = 0;
    while (nodes.filter((n) => n.kind === "person").length < 30 && tries++ < 4000) {
      const k = (r2() * (land.length / 2)) | 0, lon = land[2 * k], lat = land[2 * k + 1];
      if (lat > 62 || lat < -42 || (lon > -20 && lon < 50 && lat > 15 && lat < 33) || (lon > 90 && lon < 130 && lat > 38)) continue;   // not the poles, the Sahara or the steppe
      if (lon > 95 && lon < 150 && lat < -18 && lat > -32) continue;   // not the outback
      const cand = { lon, lat } as Node;
      if (nodes.some((n) => near(n, cand) < 6)) continue;
      nodes.push({ lon, lat, kind: "person", t0: 0, g: r2() < 0.18, s: r2(), top: TOPZ.person });
    }
    schedule(); resize();
  }).catch(() => { /* no land: the network alone, on a plain lattice */ land = new Float32Array(0); sea = new Float32Array(0); schedule(); resize(); });

  /* ── the camera: zoom k (css px per degree-unit), the screen anchor of (lonC, latC) ── */
  // the anchor is the band's north edge (latC = 72) under the screen point (ax, ay): at p = 0 it tucks under the copy's last line (a close-up of the
  // Atlantic to India), at p = 1 the whole band sits in the space below the copy
  const textBottom = () => (knock.length ? Math.max(...knock.map((b) => b.y1)) : Hh * 0.5);
  const cam = (p: number) => {
    const e = io(p), tb = textBottom();
    if (mobile) { const k = W / 112; return { k, lonC: 14, latC: 72, ax: W * 0.5, ay: Math.min(tb - 6, Hh - 72 * B * k * 1.1) }; }
    const k0 = W / 186, k1 = Math.min(W / 360, ((Hh - tb) * 0.92) / (131 * B)), k = k0 + (k1 - k0) * e;
    const n0 = tb - 36, n1 = tb + (Hh - tb) / 2 - (131 * B * k1) / 2 - 10;
    return { k, lonC: 13 + 7 * e, latC: 72, ax: W * 0.5, ay: n0 + (n1 - n0) * e };
  };
  const nodeK = (k: number) => (mobile ? 0.82 : 1.32 * Math.sqrt(W / 1440) * Math.sqrt(k / (W / 186)));
  const scr = (cm: ReturnType<typeof cam>, lon: number, lat: number): [number, number] => [cm.ax + (lon - cm.lonC) * A * cm.k, cm.ay + (cm.latC - lat) * B * cm.k];
  const knockAt = (x: number, y: number) => {
    let m = 0;
    for (const b of knock) { const d = Math.max(b.x0 - x, x - b.x1, b.y0 - y, y - b.y1); if (d < 60) m = Math.max(m, d <= 0 ? 1 : 1 - d / 60); }
    return m;
  };

  function schedule() {
    const cm = cam(0);
    nodes.forEach((n) => { const [x] = scr(cm, n.lon, n.lat); n.t0 = 0.55 + clamp(x / W, -0.1, 1.15) * 1.15 + n.s * 0.5 + (n.kind === "foundation" ? 0.6 : 0); });
    edges.forEach((e) => { e.t0 = Math.max(nodes[e.a].t0, nodes[e.b].t0) + 0.25 + (e.faint ? 0.6 : 0); });
  }

  /* ── drawing ── */
  function ground(c: CanvasRenderingContext2D, cm: ReturnType<typeof cam>, t: number, ox: number, oy: number) {
    if (!land || !sea) return;
    const N = 9, paths: Path2D[] = Array.from({ length: N + 1 }, () => new Path2D()), sp: Path2D[] = Array.from({ length: N + 1 }, () => new Path2D());
    const kx = A * cm.k, ky = B * cm.k, x0 = cm.ax - cm.lonC * kx + ox, y0 = cm.ay + cm.latC * ky + oy;
    const rev = (x: number) => (introDone ? 1 : clamp((-0.25 + t / 1.05 - x / W) / 0.3));
    const vis = (x: number, y: number) => x > -M && x < W + M && y > -M && y < Hh + M;
    const fade = (x: number, y: number, lat: number) => {
      const top = clamp((y - 64) / 120), bot = mobile ? 1 : clamp((Hh + 30 - y) / 140), side = clamp(Math.min(x + 20, W + 20 - x) / 160);
      const band = clamp((LAT_N - lat) / 10) * clamp((lat - LAT_S) / 10);
      return top * bot * side * band * (1 - 0.82 * knockAt(x - ox, y - oy)) * rev(x - ox);
    };
    const L = land, Sx = sea, rl = mobile ? 0.8 : 0.95, rs = 0.65;
    for (let i = 0; i < L.length; i += 2) {
      const x = x0 + L[i] * kx, y = y0 - L[i + 1] * ky; if (!vis(x, y)) continue;
      const a = fade(x, y, L[i + 1]); if (a < 0.04) continue;
      paths[Math.round(a * N)].rect(x - rl, y - rl, rl * 2, rl * 2);
    }
    for (let i = 0; i < Sx.length; i += 2) {
      const x = x0 + Sx[i] * kx, y = y0 - Sx[i + 1] * ky; if (!vis(x, y)) continue;
      const a = fade(x, y, Sx[i + 1]); if (a < 0.08) continue;
      sp[Math.round(a * N)].rect(x - rs, y - rs, rs * 2, rs * 2);
    }
    for (let b = 1; b <= N; b++) {
      c.fillStyle = `rgba(38,38,38,${((b / N) * 0.62).toFixed(3)})`; c.fill(paths[b]);
      c.fillStyle = `rgba(38,38,38,${((b / N) * 0.2).toFixed(3)})`; c.fill(sp[b]);
    }
  }

  function drawNode(c: CanvasRenderingContext2D, n: Node, k: number, t: number) {
    switch (n.kind) {
      case "foundation": box(c, 0, 0, k, 9, 9, 4.5, 0, DARK); quad(c, 0, 0, k, -1.4, -1.4, 2.8, 2.8, 4.5, GREEN); break;
      case "community":
        box(c, 0, 0, k, 18, 18, 2.6, 0, LIGHT);
        ([[-4, -3.5, false], [3.5, -2.5, n.g], [-1, 4.5, false]] as [number, number, boolean][]).forEach(([x, y, g]) => person(c, (x - y) * C * k, (x + y) * S * k, k, 2.6, g));
        break;
      case "apps": {
        box(c, 0, 0, k, 18, 18, 2.6, 0, LIGHT);
        const hs = [8, 4.5, 6, 10.5], at: [number, number][] = [[-4.4, -4.4], [4.4, -4.4], [-4.4, 4.4], [4.4, 4.4]];
        at.forEach(([x, y], j) => { const bob = reduced ? 0 : Math.sin(t * 1.6 + n.s * 6 + j) * 0.5; box(c, (x - y) * C * k, (x + y) * S * k - 2.6 * k, k, 6.4, 6.4, hs[j] + bob, 0, LIGHT, n.g && j === 3 ? GREEN : undefined); });
        break;
      }
      case "builders":
        box(c, 0, 0, k, 16, 16, 2.6, 0, LIGHT);
        box(c, 0, 0, k, 16, 16, 2.6, 6.4 + (reduced ? 0 : Math.sin(t * 1.3 + n.s * 6) * 0.6), LIGHT);
        box(c, 0, 0, k, 16, 16, 2.6, 12.8 + (reduced ? 0 : Math.sin(t * 1.3 + n.s * 6 + 0.8) * 0.9), LIGHT);
        quad(c, 0, 0, k, -5, -2.2, 10, 4.4, 15.4 + (reduced ? 0 : Math.sin(t * 1.3 + n.s * 6 + 0.8) * 0.9), n.g ? GREEN : "#FFFFFF");
        break;
      case "person": cyl(c, 0, 0, k, 3.6, 0.01, 0, "#FFFFFF", "rgba(255,255,255,0)", "rgba(17,17,17,0.35)"); person(c, 0, 0, k, 0, n.g); break;
    }
  }

  function frame(now: number) {
    if (dead) return;
    const t = reduced ? 99 : (now - t0) / 1000;
    if (!introDone && t > 2.1) introDone = true;
    pS += (pT - pS) * (reduced ? 1 : 0.12); if (Math.abs(pT - pS) < 1e-4) pS = pT;
    par.x += (par.tx - par.x) * 0.06; par.y += (par.ty - par.y) * 0.06;
    const { c } = fit(cv, W, Hh), cm = cam(mobile ? 0 : pS);
    c.clearRect(0, 0, W, Hh);
    const gx = -par.x * 10, gy = -par.y * 6;
    /* the ground: live during the intro, else from its cache (re-rendered when the zoom moves) */
    if (!introDone) { c.lineWidth = 1; ground(c, cm, t, gx, gy); }
    else {
      const dpr = Math.min(2, window.devicePixelRatio || 1), k = `${cm.k.toFixed(3)}|${cm.ax.toFixed(1)}|${cm.ay.toFixed(1)}|${cm.lonC.toFixed(2)}|${W}|${Hh}|${dpr}|${knock.length}`;
      if (k !== offKey) {
        offKey = k; const ow = W + 2 * M, oh = Hh + 2 * M;
        off.width = Math.round(ow * dpr); off.height = Math.round(oh * dpr);
        const oc = off.getContext("2d")!; oc.setTransform(dpr, 0, 0, dpr, 0, 0); oc.clearRect(0, 0, ow, oh);
        ground(oc, cm, t, M, M);
      }
      c.drawImage(off, gx - M, gy - M, W + 2 * M, Hh + 2 * M);
    }
    /* the network */
    const nk = nodeK(cm.k), ex = -par.x * 15, ey = -par.y * 9, nx = -par.x * 18, ny = -par.y * 11;
    const P = nodes.map((n) => { const [x, y] = scr(cm, n.lon, n.lat); return [x + nx, y + ny] as [number, number]; });
    const pop = (n: Node) => clamp((t - n.t0) / 0.6);
    c.lineWidth = 1;
    /* arcs (under the objects) */
    edges.forEach((e) => {
      const q = o3((t - e.t0) / 1.2); if (q <= 0) return;
      const a = nodes[e.a], b = nodes[e.b], [ax, ay] = P[e.a], [bx, by] = P[e.b];
      const ay2 = ay - a.top * nk + ey - ny, by2 = by - b.top * nk + ey - ny, ax2 = ax + ex - nx, bx2 = bx + ex - nx;
      const dist = Math.hypot(bx2 - ax2, by2 - ay2), lift = Math.min(150, dist * 0.3);
      const mk = 1 - 0.85 * knockAt((ax2 + bx2) / 2, (ay2 + by2) / 2 - lift * 0.6);
      if (mk < 0.05) return;
      c.globalAlpha = (e.faint ? 0.3 : 0.5) * mk; c.strokeStyle = INK; c.setLineDash(e.faint ? [1, 3.5] : [3, 3.5]);
      c.beginPath(); const steps = 22;
      for (let s = 0; s <= steps; s++) { const u = (s / steps) * q, x = ax2 + (bx2 - ax2) * u, y = ay2 + (by2 - ay2) * u - lift * 4 * u * (1 - u); if (s) c.lineTo(x, y); else c.moveTo(x, y); }
      c.stroke(); c.setLineDash([]);
      /* the pulse: a green bead along the arc, now and then */
      if (e.pulse && !reduced && q >= 1) {
        const ph = (t - e.t0 - 1.2 + e.ph) % e.per;
        if (ph > 0 && ph < 1.7) {
          const u = io(ph / 1.7), x = ax2 + (bx2 - ax2) * u, y = ay2 + (by2 - ay2) * u - lift * 4 * u * (1 - u);
          c.globalAlpha = 0.22 * mk; c.fillStyle = GREEN; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill();
          c.globalAlpha = mk; c.beginPath(); c.arc(x, y, 2.6, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); c.lineWidth = 1;
        }
      }
    });
    c.globalAlpha = 1;
    /* the objects, back to front */
    const order = nodes.map((_, i) => i).sort((i, j) => P[i][1] - P[j][1]);
    for (const i of order) {
      const n = nodes[i], [x, y] = P[i]; if (x < -60 || x > W + 60 || y < -40 || y > Hh + 60) continue;
      const u = pop(n); if (u <= 0) continue;
      const mk = 1 - 0.9 * knockAt(x, y - n.top * nk * 0.5); if (mk < 0.04) continue;
      /* a ping: an iso ring that opens on the floor, now and then */
      if (!reduced && n.kind !== "person" && u >= 1) {
        const per = 6 + n.s * 5, ph = (t - n.t0 + n.s * per) % per;
        if (ph < 1.6) { const v = ph / 1.6; c.globalAlpha = (1 - v) * 0.55 * mk; c.strokeStyle = n.g || n.kind === "foundation" ? GREEN : INK; ring(c, x, y, nk, 8 + v * 16); c.globalAlpha = 1; }
      }
      c.save(); c.globalAlpha = clamp(u * 3) * mk; c.translate(x, y + (1 - o3(u)) * 12); const sc = oBack(u); c.scale(sc, sc); c.strokeStyle = INK;
      drawNode(c, n, nk, t); c.restore();
    }
    /* the chips ride their objects */
    chipEls.forEach((el, label) => {
      const i = nodes.findIndex((n) => n.chip === label); if (i < 0) return;
      const n = nodes[i], [x, y] = P[i], u = clamp((t - n.t0 - 0.35) / 0.5);
      let cx = x - nx - par.x * 22 + 12 * nk; const cy = y - ny - par.y * 13 - n.top * nk - 34, cw = chipW.get(el) || 120;
      if (cx + cw > W - 12) cx = x - nx - par.x * 22 - 12 * nk - cw;
      cx = Math.max(12, Math.min(W - 12 - cw, cx));
      // a chip only gives way when it actually runs into the copy, and goes when its place is off screen
      const off = x < 6 || x > W - 6 || y > Hh - 10;
      const mk = off ? 0 : knock.some((b) => cx < b.x1 - 14 && cx + cw > b.x0 + 14 && cy < b.y1 - 8 && cy + 24 > b.y0 + 8) ? 0.12 : 1;
      const v = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) scale(${(0.92 + 0.08 * o3(u)).toFixed(3)})|${(o3(u) * mk).toFixed(3)}`;
      if (chipMemo.get(el) === v) return; chipMemo.set(el, v);
      const [tf, op] = v.split("|"); el.style.transform = tf; el.style.opacity = op;
    });
    if (!reduced && visible) raf = requestAnimationFrame(frame);
  }

  function resize() {
    chipEls.forEach((el) => chipW.set(el, el.offsetWidth));
    const r = stage.getBoundingClientRect(); W = Math.round(r.width); Hh = Math.round(r.height); mobile = W < 860;
    cv.style.width = W + "px"; cv.style.height = Hh + "px"; offKey = "";
    if (reduced || !visible) { cancelAnimationFrame(raf); frame(performance.now()); }
  }
  const io_ = new IntersectionObserver((es) => es.forEach((e) => {
    visible = e.isIntersecting && !document.hidden;
    cancelAnimationFrame(raf); if (visible && !reduced) raf = requestAnimationFrame(frame);
  }));
  io_.observe(stage);
  const onVis = () => { const v = !document.hidden; if (v === visible) return; visible = v; cancelAnimationFrame(raf); if (v && !reduced) raf = requestAnimationFrame(frame); };
  document.addEventListener("visibilitychange", onVis);
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const onMove = (e: PointerEvent) => { if (mobile) return; par.tx = (e.clientX / innerWidth) * 2 - 1; par.ty = (e.clientY / innerHeight) * 2 - 1; };
  if (fine && !reduced) addEventListener("pointermove", onMove, { passive: true });
  const ro = new ResizeObserver(() => resize()); ro.observe(stage);
  resize(); schedule();
  if (!reduced) raf = requestAnimationFrame(frame);

  return {
    setP: (p) => { pT = clamp(p); if (reduced) { pS = pT; } },
    setKnock: (r) => { knock = r; offKey = ""; if (reduced) frame(performance.now()); },
    resize,
    dispose: () => { dead = true; cancelAnimationFrame(raf); io_.disconnect(); ro.disconnect(); document.removeEventListener("visibilitychange", onVis); removeEventListener("pointermove", onMove); },
  };
}
