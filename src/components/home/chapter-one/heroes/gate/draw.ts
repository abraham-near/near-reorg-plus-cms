import { type Ell, type Pt, arc, pt, ticks } from "../../cinematic/geom";

// The gate's layer, drawn on a canvas in the footage's own pixels (1920 × 1080) at frame f. The design is the static
// concept's (cinematic/layers/Gate.tsx, in the still's 2688 px; K converts): the grass edge traced either side, a ticked
// crown scale on the ring, a level ruler and a plumb axis crossing at the sphere, two gimbal orbits round it, a dial and
// brackets sighting it, and a mark where the ring stands. Each part rides what it belongs to: the crown and the stand
// ride the ring's fitted ellipse, the orbits, dial, brackets, ruler and axis ride the sphere (sized with the ring, so
// they grow as the camera pushes in), the traces ride the tracked grass edge. Life from the scroll (the frame): the
// gimbal turns a few degrees and its markers travel round it, the dial turns, a fine progress arc
// draws on along the crown, and a marker walks the grass edge.
// Idle life (`t`, seconds of ambient time, 0 with reduced motion), so the layer stays alive when the scroll rests, as
// the original's does (D43/D44, "alive, not lit"): the orbit markers carry on slowly round the sphere (dimmer and hidden
// behind it on the far side), the gimbal planes rock a degree or two, the dial's ticks breathe, a fine arc inside the
// crown draws on and off again, and the edge marker drifts. Only markers travel; nothing runs along a line.
// edge tracks: x, y × 10 per frame from `from` (-1 where the point is hidden behind the ring or off the frame)
export type Edge = { from: number; pts: number[] };
export type Track = { frames: number; fps?: number; w: number; h: number; ring: number[]; affine: number[]; sphere: number[]; left: Edge[]; right: Edge[]; foot?: number[] };
// foot: 0-1 per frame, how clear the ring's foot is of the near grass that rises in front of it late in the move

type Tone = "ink" | "deep" | "green";
const K = 1920 / 2688; // the still's pixels to the footage's
const TOK: Record<Tone, string> = { ink: "--color-ink", deep: "--color-green-text", green: "--color-green" };
let RGB: Record<Tone, string> | null = null;
function rgb(): Record<Tone, string> {
  if (RGB) return RGB;
  const css = getComputedStyle(document.documentElement);
  const parse = (v: string) => {
    if (v.startsWith("#")) { const h = v.length === 4 ? v.replace(/(\w)/g, "$1$1").slice(1) : v.slice(1); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(","); }
    return (v.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).join(",");
  };
  RGB = Object.fromEntries((Object.keys(TOK) as Tone[]).map((t) => [t, parse(css.getPropertyValue(TOK[t]).trim())])) as Record<Tone, string>;
  return RGB;
}
const col = (t: Tone, a: number) => `rgba(${rgb()[t]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function at(arr: number[], n: number, f: number): number[] {
  const i = Math.floor(f), j = Math.min(i + 1, arr.length / n - 1), u = f - i;
  return Array.from({ length: n }, (_, k) => lerp(arr[i * n + k], arr[j * n + k], u));
}

// An edge point at frame f, or null where it is hidden
function edgeAt(e: Edge, f: number): Pt | null {
  const k = f - e.from, n = e.pts.length / 2;
  if (k < 0 || k > n - 1) return null;
  const i = Math.min(Math.floor(k), n - 2), u = k - i;
  const x0 = e.pts[2 * i], y0 = e.pts[2 * i + 1];
  if (n === 1) return x0 < 0 ? null : [x0 / 10, y0 / 10];
  const x1 = e.pts[2 * i + 2], y1 = e.pts[2 * i + 3];
  if (x0 < 0 || x1 < 0) return u < 0.5 && x0 >= 0 ? [x0 / 10, y0 / 10] : u >= 0.5 && x1 >= 0 ? [x1 / 10, y1 / 10] : null;
  return [lerp(x0, x1, u) / 10, lerp(y0, y1, u) / 10];
}

export function draw(g: CanvasRenderingContext2D, d: Track, f: number, px0: number, t = 0) {
  const wave = (period: number, phase = 0) => (t ? Math.sin((2 * Math.PI * t) / period + phase) : 0);
  let px = px0;
  const u = f / (d.frames - 1);
  // The ring: frame 0's fitted ellipse, carried by this frame's affine map (the ring is rigid, so a point on it keeps
  // its angle on the ellipse; the map also carries the view's slight turn as the camera arcs round it)
  const R: Ell = { cx: d.ring[0], cy: d.ring[1], rx: d.ring[2], ry: d.ring[3], rot: d.ring[4] };
  const [a, b, c, e, h, k] = at(d.affine, 6, f);
  const map = (p: Pt): Pt => [a * p[0] + b * p[1] + c, e * p[0] + h * p[1] + k];
  const sc = Math.sqrt(Math.abs(a * h - b * e)); // how much the ring has grown since frame 0
  const [sx, sy] = at(d.sphere, 3, f);
  const P: Pt = [sx, sy];
  const SR = d.sphere[2] * sc; // the sphere's radius, from frame 0's (steadier than each frame's own)
  const q = K * sc; // the static design's still pixels, at this frame
  const clear = d.foot ? at(d.foot, 1, f)[0] : 1;

  g.lineCap = "round"; g.lineJoin = "round";
  const stroke = (path: string | Path2D, tone: Tone, a: number, w = 0.75, dash?: number[]) => {
    g.strokeStyle = col(tone, a); g.lineWidth = w * px;
    g.setLineDash(dash ? dash.map((v) => v * px) : []);
    g.stroke(typeof path === "string" ? new Path2D(path) : path);
  };
  const ringAt = (p: Pt, r: number, tone: Tone = "ink", a = 0.75) => { const c = new Path2D(); c.arc(p[0], p[1], r, 0, Math.PI * 2); stroke(c, tone, a); };
  const dot = (p: Pt, r: number, tone: Tone = "ink", a = 0.85) => { g.fillStyle = col(tone, a); g.beginPath(); g.arc(p[0], p[1], r, 0, Math.PI * 2); g.fill(); };
  const square = (p: Pt, s: number, a = 0.7) => { const c = new Path2D(); c.rect(p[0] - s, p[1] - s, 2 * s, 2 * s); stroke(c, "ink", a); };
  const cross = (p: Pt, s: number, a = 0.7) => stroke(`M${p[0] - s} ${p[1]}h${2 * s}M${p[0]} ${p[1] - s}v${2 * s}`, "ink", a);
  // A stroke from a to b, full at the ends and `mid` in the middle (D59/D60: lines are strongest at their dots and ticks)
  const grad = (path: string, a: Pt, b: Pt, tone: Tone, op: number, mid: number, w = 0.75) => {
    const gr = g.createLinearGradient(a[0], a[1], b[0], b[1]);
    for (const t of [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1]) gr.addColorStop(t, col(tone, (mid + (1 - mid) * Math.pow(Math.abs(2 * t - 1), 1.2)) * op));
    g.strokeStyle = gr; g.lineWidth = w * px; g.setLineDash([]);
    g.stroke(new Path2D(path));
  };

  // Parts that ride the ring are drawn in frame 0's coordinates under the affine map (widths and dashes held)
  const onRing = (fn: () => void) => {
    g.save(); g.transform(a, e, b, h, c, k);
    const keep = px; px = px / sc; fn(); px = keep;
    g.restore();
  };

  // The grass edge, either side of the ring: runs between ticks dip in the middle (D60), ticks stand up from the land.
  // The left run fades out over its last anchors towards the headline.
  const trace = (edges: Edge[], every: number, fadeLeft: boolean, walker: number | null) => {
    const ps = edges.map((e) => edgeAt(e, f));
    const run: { p: Pt; i: number }[][] = [];
    let cur: { p: Pt; i: number }[] = [];
    ps.forEach((p, i) => { if (p) cur.push({ p, i }); else if (cur.length) { run.push(cur); cur = []; } });
    if (cur.length) run.push(cur);
    for (const r of run) {
      if (r.length < 2) continue;
      const fade = (i: number) => (fadeLeft ? smooth(i / 8) : 1);
      const idx: number[] = [];
      for (let k = 0; k < r.length; k++) if (r[k].i % every === 0 || k === 0 || k === r.length - 1) idx.push(k);
      let td = "";
      idx.forEach((k) => {
        const p = r[k].p, nx = r[Math.min(r.length - 1, k + 1)].p, pv = r[Math.max(0, k - 1)].p;
        const dx = nx[0] - pv[0], dy = nx[1] - pv[1], l = Math.hypot(dx, dy) || 1;
        let ux = dy / l, uy = -dx / l;
        if (uy > 0) { ux = -ux; uy = -uy; }
        const tl = 8 * K * fade(r[k].i);
        td += `M${p[0]} ${p[1]}L${p[0] + ux * tl} ${p[1] + uy * tl}`;
      });
      for (let j = 1; j < idx.length; j++) {
        const a = r[idx[j - 1]], b = r[idx[j]];
        const seg = r.slice(idx[j - 1], idx[j] + 1).map((o, k) => `${k ? "L" : "M"}${o.p[0]} ${o.p[1]}`).join("");
        grad(seg, a.p, b.p, "ink", 0.4 * fade(a.i), 0.3);
      }
      g.globalAlpha = 1;
      stroke(td, "ink", 0.4);
    }
    // A small square walks the edge with the scroll
    if (walker !== null) {
      const live = ps.map((p, i) => [p, i] as const).filter(([p]) => p);
      if (live.length > 2) {
        const pos = walker * (live.length - 1), i = Math.floor(pos), t = pos - i;
        const a = live[i][0]!, b = live[Math.min(i + 1, live.length - 1)][0]!;
        square([lerp(a[0], b[0], t), lerp(a[1], b[1], t)], 3.2 * K, 0.6);
      }
    }
  };
  trace(d.left, 4, true, null);
  trace(d.right, 3, false, clamp(0.15 + 0.6 * smooth(u) + 0.05 * wave(23)));

  // The crown scale, low enough to clear the nav; a fine progress arc draws on just outside its long ticks as the
  // scroll reaches it
  const pr = smooth(u * 1.15), sOut = 1.08 + (26 * K) / R.ry;
  onRing(() => {
    stroke(arc(R, 236, 304, 1.08), "ink", 0.5);
    stroke(ticks(R, 236, 304, 2, 7 * K, 5, 16 * K, 1.08), "ink", 0.42);
    stroke(ticks(R, 236, 304, 1, -4 * K, 0, -4 * K, 1.08), "ink", 0.25);
    stroke(arc(R, 264, 276, 1.08), "deep", 0.95, 1.4);
    stroke(arc(R, 128, 232, 1.07), "ink", 0.26, 0.75, [5, 7]);
    stroke(arc(R, -50, 50, 1.07), "ink", 0.2, 0.75, [1, 5]);
    if (pr > 0.005) stroke(arc(R, 236, 236 + 68 * pr, sOut), "ink", 0.34);
  });
  square(map(pt(R, 248, 1.08)), 4.5 * q, 0.6);
  ringAt(map(pt(R, 292, 1.08)), 5 * q, "ink", 0.6);
  if (pr > 0.005) dot(map(pt(R, 236 + 68 * pr, sOut)), 2.2 * q, "ink", 0.6);
  // Idle: a fine arc just inside the crown draws on from its left end over 7 s and off again the same way
  if (t) {
    const ph = (t % 14) / 14, on = smooth(ph < 0.5 ? ph * 2 : 2 - ph * 2), sIn = 1.08 - (12 * K) / R.ry;
    if (on > 0.01) onRing(() => stroke(arc(R, 236, 236 + 68 * on, sIn), "ink", 0.28));
  }

  // Level and plumb, crossing at the sphere; the ruler's ticks ride the sphere, and it fades out at both ends
  {
    const step = 14 * q, x0 = P[0] - (1996 - 1380) * q, x1 = d.w, y = P[1];
    let path = `M${x0} ${y}H${x1}`;
    const j0 = Math.ceil((x0 - P[0]) / step), j1 = Math.floor((x1 - P[0]) / step);
    for (let j = j0; j <= j1; j++) path += `M${P[0] + j * step} ${y}v${(j % 5 === 0 ? 13 : 5) * q}`;
    const gr = g.createLinearGradient(x0, y, x1, y), span = x1 - x0, a = 0.42;
    gr.addColorStop(0, col("ink", 0)); gr.addColorStop(clamp(360 * q / span), col("ink", a));
    gr.addColorStop(clamp(1 - 260 * q / span), col("ink", a)); gr.addColorStop(1, col("ink", 0));
    g.strokeStyle = gr; g.lineWidth = 0.75 * px; g.setLineDash([]); g.stroke(new Path2D(path));
  }
  const axis = (a: Pt, b: Pt, op: number) => {
    stroke(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`, "ink", op, 0.75, [14, 6, 2, 6]);
    dot(a, 3 * K, "ink", op + 0.2); dot(b, 3 * K, "ink", op + 0.2);
  };
  axis([P[0], P[1] - (680 - 222) * q], [P[0], P[1] - SR - 44 * q], 0.36);
  axis([P[0], P[1] + SR + 44 * q], [P[0], P[1] + (1150 - 680) * q], 0.3 * (0.35 + 0.65 * clear));

  // The gimbal: two orbits round the sphere, turning a few degrees with the scroll; their markers travel round them
  const O1: Ell = { cx: P[0], cy: P[1], rx: 290 * q, ry: 80 * q, rot: -14 + 9 * u + 2.2 * wave(17) };
  const O2: Ell = { cx: P[0], cy: P[1], rx: 104 * q, ry: 262 * q, rot: 22 - 7 * u + 1.8 * wave(21, 1.3) };
  stroke(arc(O1, 180, 360), "ink", 0.3, 0.75, [4, 6]);
  stroke(arc(O1, 0, 180), "ink", 0.62);
  stroke(ticks(O1, 20, 160, 3, 6 * q, 5, 14 * q), "ink", 0.4);
  stroke(arc(O2, 90, 270), "ink", 0.28, 0.75, [4, 6]);
  stroke(arc(O2, -90, 90), "ink", 0.55);
  // A marker at angle `a` on an orbit: full on the near half (from near0 to near0 + 180), dimmer on the far half, hidden where the sphere covers it
  const onOrbit = (o: Ell, a: number, near0: number, draw1: (p: Pt, k: number) => void) => {
    const m = ((a % 360) + 360) % 360, p = pt(o, m), far = (((m - near0) % 360) + 360) % 360 > 180;
    if (far && Math.hypot(p[0] - P[0], p[1] - P[1]) < SR + 6 * q) return;
    draw1(p, far ? 0.45 : 1);
  };
  onOrbit(O1, 118 - 46 * u - 5 * t, 0, (p, k) => ringAt(p, 9 * q, "ink", 0.7 * k));
  onOrbit(O2, -60 + 34 * u + 4 * t, -90, (p, k) => cross(p, 9 * q, 0.6 * k));
  onOrbit(O1, 30 + 40 * u + 3.5 * t, 0, (p, k) => square(p, 4 * q, 0.55 * k));

  // The sphere sighted: its dial turns with the scroll
  const D = SR + 30 * q;
  ringAt(P, D, "ink", 0.32);
  const dial: Ell = { cx: P[0], cy: P[1], rx: D, ry: D };
  const br = 1 + 0.28 * wave(6.5);
  stroke(ticks(dial, 24 * u, 24 * u + 354, 6, -6 * q * (1 + 0.12 * wave(6.5)), 5, -12 * q * br), "ink", 0.35);
  stroke(arc({ cx: P[0], cy: P[1], rx: SR + 70 * q, ry: SR + 70 * q }, 0, 360), "ink", 0.2, 0.75, [1, 5]);
  {
    const w = SR + 52 * q, l = 14 * q, [x, y] = P;
    stroke([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => `M${x + a * w} ${y + b * (w - l)}V${y + b * w}H${x + a * (w - l)}`).join(""), "ink", 0.45);
  }
  square(map(pt(R, 182)), 5 * q, 0.6);
  square(map(pt(R, -2)), 5 * q, 0.6);

  // Where it stands; it fades as the near grass covers the foot
  const base = map(pt(R, 90)), by = base[1] + 4 * q;
  if (clear > 0.01) {
    stroke(`M${base[0] - 70 * q} ${by}H${base[0] + 70 * q}`, "ink", 0.45 * clear);
    square([base[0], by], 5 * q, 0.6 * clear);
  }
}
