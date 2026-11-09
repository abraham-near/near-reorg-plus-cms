// r17 v1 js/field.js: the dot field of the ridges silhouette (/v1/rail/rail-ridges.webp), three parallax layers. In r17 v1 the field is NOT drawn (DUST = false); it stays the set of
// targets the leaving words drift to (each dot of a leaving word drifts into the nearest field dot, fading out on the way).
// The image's tone is read once (offscreen canvas, getImageData); each layer keeps the lattice points whose tone falls in its band (density from tone, ONE size per layer).
// Dots live in LAYER space (x along the layer, y on the stage); on screen: x + depth * worldX.
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const sstep = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export type Tone = { w: number; h: number; D: Float32Array; aspect: number };
type Grid = { cell: number; cols: number; rows: number; g: Map<number, number[]> };
export type FieldLayer = { k: number; r: number; a: number; x: Float32Array; y: Float32Array; n: number; Lw: number; grid: Grid };
export type Field = { layers: FieldLayer[]; pitch: number; count: number };

const rng = (a: number) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const tones = new Map<string, Promise<Tone>>();
export function loadTone(url: string): Promise<Tone> {
  const had = tones.get(url); if (had) return had;
  const p = new Promise<Tone>((res, rej) => {
    const im = new Image(); im.decoding = "async";
    im.onload = () => {
      const w = 1024, h = Math.round((w * im.naturalHeight) / im.naturalWidth), cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      const cx = cv.getContext("2d", { willReadFrequently: true }); if (!cx) { rej(new Error("no 2d")); return; }
      cx.drawImage(im, 0, 0, w, h);
      const px = cx.getImageData(0, 0, w, h).data, L = new Float32Array(w * h), D = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) L[i] = 0.299 * px[4 * i] + 0.587 * px[4 * i + 1] + 0.114 * px[4 * i + 2];
      /* the skyline: per column, the first row where the tone drops clearly below the sky's own (slowly adapting) level; above it there is no ridge, only haze */
      const sky = new Float32Array(w);
      for (let x = 0; x < w; x++) {
        let s = 0; for (let y = 0; y < 6; y++) s += L[y * w + x]; s /= 6; let found = h * 0.62;
        for (let y = 6; y < h; y++) { const l = (L[y * w + Math.max(0, x - 1)] + L[y * w + x] + L[y * w + Math.min(w - 1, x + 1)]) / 3; if (l < s - 15) { found = y; break; } s = 0.93 * s + 0.07 * l; }
        sky[x] = found;
      }
      const sm = new Float32Array(w); for (let x = 0; x < w; x++) { let m = 1e9; for (let k = -10; k <= 10; k++) m = Math.min(m, sky[clamp(x + k, 0, w - 1)]); sm[x] = m; }
      const sk = new Float32Array(w); for (let x = 0; x < w; x++) { let t = 0, n = 0; for (let k = -14; k <= 14; k++) { t += sm[clamp(x + k, 0, w - 1)]; n++; } sk[x] = t / n; }
      const Lref = 216, Ldark = 120;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; D[i] = y < sk[x] - 3 ? 0 : clamp((Lref - L[i]) / (Lref - Ldark), 0, 1); }
      res({ w, h, D, aspect: im.naturalHeight / im.naturalWidth });
    };
    im.onerror = () => rej(new Error("ridges image"));
    im.src = url;
  });
  p.catch(() => tones.delete(url));
  tones.set(url, p);
  return p;
}
const toneAt = (T: Tone, u: number, v: number) => { if (u < 0 || u > 0.9999 || v < 0 || v > 0.9999) return 0; const x = u * (T.w - 1), y = v * (T.h - 1), x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * T.w + x0; return (T.D[i] * (1 - fx) + T.D[i + 1] * fx) * (1 - fy) + (T.D[i + T.w] * (1 - fx) + T.D[i + T.w + 1] * fx) * fy; };

/* the three layers: depth (share of the track's travel), tone band, dot radius px, alpha */
const LAYERS = [
  { k: 0.15, lo: [0.0, 0.08], hi: [0.22, 0.36], r: 0.8, a: 0.28 },    /* far: the pale, hazy ridges */
  { k: 0.30, lo: [0.16, 0.3], hi: [0.5, 0.62], r: 0.9, a: 0.32 },     /* middle */
  { k: 0.50, lo: [0.44, 0.58], hi: [1.01, 1.02], r: 1.0, a: 0.36 },   /* near: the darkest ridges */
];

/** W, H: the stage; railY: the horizon (the panorama's foot sits on it); travel: the track's total travel in px (a positive number) */
export function buildField(T: Tone, { W, H, railY, travel, budget = 9000 }: { W: number; H: number; railY: number; travel: number; budget?: number }): Field {
  let pitch = W < 760 ? 8.6 : Math.max(5.2, W / 230);
  let raw: Omit<FieldLayer, "grid">[] = [];
  for (let pass = 0; pass < 5; pass++) {
    raw = LAYERS.map((Ly, li) => {
      const Lw = W + travel * Ly.k, hImg = Lw * T.aspect, top = railY - hImg, xs: number[] = [], ys: number[] = [], rnd = rng(101 + li * 17);
      const rowH = pitch * 0.866;
      for (let j = 0, y = Math.max(0, top); y < railY - 1; y += rowH, j++) {
        for (let x = (j & 1 ? pitch / 2 : 0); x < Lw; x += pitch) {
          const jx = (rnd() - 0.5) * pitch * 0.8, jy = (rnd() - 0.5) * rowH * 0.8, th = rnd();
          const u = (x + jx) / Lw, v = (y + jy - top) / hImg, D = toneAt(T, u, v);
          const dd = 2.2 / T.w, g = Math.abs(toneAt(T, u + dd, v) - toneAt(T, u - dd, v)) + Math.abs(toneAt(T, u, v + dd * T.aspect * 1.2) - toneAt(T, u, v - dd * T.aspect * 1.2)), edge = clamp(g * 7, 0, 1);
          const w = sstep(Ly.lo[0], Ly.lo[1], D) * (1 - sstep(Ly.hi[0], Ly.hi[1], D)) * (0.78 + 1.1 * edge);
          if (w > 0.002 && Math.pow(Math.min(1, w), 0.8) * 0.96 > th) { const yy = y + jy; if (yy > 1 && yy < railY - 1) { xs.push(Math.max(0, x + jx)); ys.push(yy); } }
        }
      }
      return { k: Ly.k, r: Ly.r, a: Ly.a, x: Float32Array.from(xs), y: Float32Array.from(ys), n: xs.length, Lw };
    });
    const total = raw.reduce((s, l) => s + l.n, 0);
    if (total <= budget && total > budget * 0.78) break;
    pitch *= Math.pow(total / (budget * 0.9), 0.5);
  }
  /* sorted by x (for the visible window); a coarse grid per layer for "nearest dot" queries */
  const layers: FieldLayer[] = raw.map((l) => {
    const idx = [...Array(l.n).keys()].sort((a, b) => l.x[a] - l.x[b]), x = new Float32Array(l.n), y = new Float32Array(l.n);
    idx.forEach((i, n) => { x[n] = l.x[i]; y[n] = l.y[i]; });
    const cell = 44, cols = Math.ceil(l.Lw / cell) + 1, rows = Math.ceil(H / cell) + 1, g = new Map<number, number[]>();
    for (let n = 0; n < l.n; n++) { const key = ((y[n] / cell) | 0) * cols + ((x[n] / cell) | 0); let a = g.get(key); if (!a) g.set(key, (a = [])); a.push(n); }
    return { ...l, x, y, grid: { cell, cols, rows, g } };
  });
  return { layers, pitch, count: layers.reduce((s, l) => s + l.n, 0) };
}

/** the nearest field dot to a screen point, when the world sits at wx: -> { li, i } or null */
export function nearestDot(field: Field, sx: number, sy: number, wx: number, maxR = 150): { li: number; i: number } | null {
  let best: { li: number; i: number } | null = null, bd = maxR * maxR;
  field.layers.forEach((l, li) => {
    const lx = sx - l.k * wx, { cell, cols, rows, g } = l.grid, cx = (lx / cell) | 0, cy = (sy / cell) | 0, R = Math.ceil(maxR / cell);
    for (let yy = Math.max(0, cy - R); yy <= Math.min(rows - 1, cy + R); yy++) for (let xx = Math.max(0, cx - R); xx <= Math.min(cols - 1, cx + R); xx++) {
      const a = g.get(yy * cols + xx); if (!a) continue;
      for (let q = 0; q < a.length; q++) { const n = a[q], dx = l.x[n] - lx, dy = l.y[n] - sy, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = { li, i: n }; } }
    }
  });
  return best;
}
