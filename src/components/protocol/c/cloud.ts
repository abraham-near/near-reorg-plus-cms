// Protocol C · the hero's drawing: the network as one body of dots (the homepage hero's dot hand). A sphere of dots, turning slowly, cut into eleven
// segments like an orange: ten open shards and one dark one (the private shard), pulled a little apart so the cuts show, their cut faces dotted too.
// Every 600 ms a green band runs down one open shard, pole to pole, and the shard glows green as it lands (final at 1.2 s); the dark shard's work
// never shows. A few loose dots (transactions) drift in from around it and join the surface. No words: the picture is the explanation.
//   build 0 → 1: the dots gather from a scatter into the sphere, then the segments part and the dark one darkens (on load);
//   away 0 → 1: the hero leaves the view: the segments open wider and the turn quickens (scrubbed by the scroll);
//   px, py: the pointer's lean (−1..1), eased by the caller.
import { clamp01, hash, smooth, rgba, INK, GREEN } from "./stage";

export type CloudParams = { build: number; away: number; px: number; py: number };

const W = 11;          // segments: ten open shards and the private one
const PRIV = 7;        // the dark segment
const TAU = Math.PI * 2;
type Pt = { x: number; y: number; z: number; k: number; face: boolean; edge: boolean; lat: number; d: number; sx: number; sy: number; sz: number };

const wedgeOf = (lon: number) => Math.floor(((lon + Math.PI) / TAU) * W) % W;
const centre = (k: number) => -Math.PI + ((k + 0.5) * TAU) / W;

export function createCloud({ dense = 1 }: { dense?: number } = {}) {
  const pts: Pt[] = [];
  const add = (x: number, y: number, z: number, k: number, face: boolean, i: number, edge = false) => {
    // where the dot starts on load: thrown outwards along its own direction, a little scattered
    const a = hash(i, 7) * TAU, b = (hash(i, 11) - 0.5) * 0.9, far = 1.7 + hash(i, 13) * 1.1;
    pts.push({ x, y, z, k, face, edge, lat: Math.asin(Math.max(-1, Math.min(1, y))), d: hash(i, 3), sx: (x + Math.cos(a) * 0.5) * far, sy: (y + b) * far, sz: (z + Math.sin(a) * 0.5) * far });
  };
  // the surface: a Fibonacci lattice (evenly spread dots)
  const N = Math.round(1500 * dense), ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), th = ga * i, x = Math.cos(th) * r, z = Math.sin(th) * r;
    add(x, y, z, wedgeOf(Math.atan2(z, x)), false, i);
  }
  // the dark segment twice as dense, so it reads as a solid dark slice
  const N2 = Math.round(900 * dense);
  for (let i = 0; i < N2; i++) {
    const y = 1 - (2 * (i + 0.5)) / N2, r = Math.sqrt(1 - y * y), th = ga * i + 0.37, x = Math.cos(th) * r, z = Math.sin(th) * r;
    const k = wedgeOf(Math.atan2(z, x));
    if (k === PRIV) add(x, y, z, k, false, 50000 + i);
  }
  // the cut faces: each cut is a half-disc on a meridian, dotted on both sides (each side belongs to its own segment)
  const M = Math.round(46 * dense);
  for (let b = 0; b < W; b++) {
    const ab = -Math.PI + (b * TAU) / W;
    for (const side of [-1, 1]) {
      const k = side < 0 ? (b + W - 1) % W : b, a = ab + side * 0.035;
      for (let j = 0; j < M; j++) {
        const s = Math.sqrt(hash(b * 97 + j, side + 5)) * 0.97, yy = (2 * hash(b * 89 + j, side + 9) - 1) * Math.sqrt(1 - s * s) * 0.97;
        add(Math.cos(a) * s, yy, Math.sin(a) * s, k, true, 90000 + b * 400 + j * 2 + (side > 0 ? 1 : 0));
      }
    }
  }
  // each segment's two edges on the surface, pole to pole, a little denser: they outline the shards like the segments of an orange
  const E = Math.round(64 * dense);
  for (let b = 0; b < W; b++) {
    const ab = -Math.PI + (b * TAU) / W;
    for (const side of [-1, 1]) {
      const k = side < 0 ? (b + W - 1) % W : b, a = ab + side * 0.045;
      for (let j = 0; j < E; j++) {
        const lat = -Math.PI / 2 + ((j + 0.5) / E) * Math.PI, r = Math.cos(lat);
        add(Math.cos(a) * r, Math.sin(lat), Math.sin(a) * r, k, false, 200000 + b * 300 + j * 2 + (side > 0 ? 1 : 0), true);
      }
    }
  }
  // the shard each 600 ms block runs down (never the dark one)
  const shardOf = (m: number) => { let k = Math.floor(hash(m, 41) * (W - 1)); if (k >= PRIV) k++; return k; };

  // reusable buckets: one path per colour and alpha step
  const STEPS = 14;
  return (c: CanvasRenderingContext2D, w: number, h: number, t: number, p: CloudParams) => {
    const cx = w * 0.5, cy = h * 0.5, R = Math.min(w, h) * 0.32;
    const ph = t * 0.11 + p.away * 1.4 + p.px * 0.35, tilt = 0.6 + p.py * 0.12;
    const cp = Math.cos(ph), sp = Math.sin(ph), ct = Math.cos(tilt), st = Math.sin(tilt);
    const part = smooth((p.build - 0.55) / 0.45);
    const gap = part * (0.19 + 0.025 * Math.sin(t * 0.8)) + p.away * 0.34;
    const dark = smooth((p.build - 0.68) / 0.32);
    const fade = 1 - p.away * 0.45;
    const scale = R / 230;

    // the blocks in flight: each 600 ms one starts down a shard; at 1.2 s it is final (the shard glows, then lets go)
    const n = Math.floor(t / 0.6), runs: { k: number; front: number; glow: number }[] = [];
    if (part > 0.6) for (let m = n - 3; m <= n; m++) {
      const age = t - m * 0.6;
      if (age < 0 || age > 2) continue;
      runs.push({ k: shardOf(m), front: age <= 1.2 ? Math.PI / 2 - (age / 1.2) * Math.PI : -9, glow: age > 1.2 ? 1 - (age - 1.2) / 0.8 : 0 });
    }

    const ink: Path2D[] = Array.from({ length: STEPS }, () => new Path2D()), grn: Path2D[] = Array.from({ length: STEPS }, () => new Path2D());
    const put = (set: Path2D[], a: number, x: number, y: number, r: number) => {
      const i = Math.min(STEPS - 1, Math.max(0, Math.round(a * (STEPS - 1))));
      if (i === 0) return;
      set[i].moveTo(x + r, y); set[i].arc(x, y, r, 0, TAU);
    };

    for (let i = 0; i < pts.length; i++) {
      const q = pts[i];
      const appear = smooth((p.build - q.d * 0.55) / 0.45);
      if (appear <= 0) continue;
      const ca = centre(q.k), gx = Math.cos(ca) * gap, gz = Math.sin(ca) * gap;
      const e = smooth(appear);
      const x = q.sx + (q.x + gx - q.sx) * e, y = q.sy + (q.y - q.sy) * e, z = q.sz + (q.z + gz - q.sz) * e;
      // turn about the vertical axis, then lean towards the viewer
      const x1 = x * cp + z * sp, z1 = -x * sp + z * cp;
      const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      const persp = 3.4 / (3.4 - z2);
      const X = cx + x1 * R * persp, Y = cy - y2 * R * persp;
      const depth = clamp01((z2 + 1.35) / 2.7);
      const priv = q.k === PRIV;
      // the far side stays faint, so the near side's cuts read; the edges of each segment a little stronger
      let a = (0.07 + 0.62 * Math.pow(depth, 1.35)) * (q.face ? 0.55 : 1) * (z2 < -0.05 && !q.face ? 0.38 : 1) * (q.edge ? 1.45 : 1);
      let r = (0.62 + 1.2 * depth) * scale * (q.edge ? 1.15 : 1);
      if (priv) { a += (0.36 + 0.5 * depth - a) * dark; r *= 1 + 0.32 * dark; }
      a *= appear * fade;
      // green: the band running down this shard, or the shard's glow once final
      let g = 0;
      if (!priv && !q.face) for (const run of runs) if (run.k === q.k) {
        if (run.front > -5) { const dd = (q.lat - run.front) / 0.16; g = Math.max(g, Math.exp(-dd * dd)); }
        if (run.glow > 0) g = Math.max(g, run.glow * 0.42 * (0.5 + 0.5 * depth));
      }
      if (g > 0.12) put(grn, Math.max(a, (0.35 + 0.6 * g) * appear * fade), X, Y, r * (1 + 0.25 * g));
      else put(ink, a, X, Y, r);
    }

    // a few loose dots (transactions) drifting in to the surface, turning with it
    if (part > 0.3) for (let j = 0; j < 22; j++) {
      const period = 3.4 + hash(j, 2) * 1.6, u = ((t + hash(j, 3) * period) % period) / period;
      const lon = hash(j, 5) * TAU, lat = (hash(j, 6) - 0.5) * 2.2;
      const dx = Math.cos(lat) * Math.cos(lon), dy = Math.sin(lat), dz = Math.cos(lat) * Math.sin(lon);
      const rad = 2.25 - 1.18 * smooth(u);
      const x = dx * rad, y = dy * rad, z = dz * rad;
      const x1 = x * cp + z * sp, z1 = -x * sp + z * cp, y2 = y * ct - z1 * st, z2 = y * st + z1 * ct, persp = 3.4 / (3.4 - z2);
      put(ink, Math.sin(Math.PI * u) * 0.5 * part * fade, cx + x1 * R * persp, cy - y2 * R * persp, 1.1 * scale);
    }

    for (let i = 1; i < STEPS; i++) {
      c.fillStyle = rgba(INK, i / (STEPS - 1)); c.fill(ink[i]);
    }
    for (let i = 1; i < STEPS; i++) {
      c.fillStyle = rgba(GREEN, i / (STEPS - 1)); c.fill(grn[i]);
    }
  };
}
