// Protocol D · the chapter's one object: an isometric model of the protocol that transforms, continuously, as the dark band is scrolled (the way the
// homepage's Stack builds and parts under the scroll). One model, five states, every value between them interpolated, so a scrub never cuts:
//   0  the network: shards (the light blocks) standing on the base, consensus (the lid) resting on them, its validators each carrying a full copy of
//      the state (the dotted boxes);
//   1  Nightshade 3.0: the lid lifts off: consensus apart from execution; the validators' heavy copies flatten to thin witnesses, and light green
//      witnesses rise from every shard to them (stateless validation);
//   2  dynamic resharding: one shard swells past its threshold (a ghost outline) and splits in two on its own; the others make room;
//   3  the private shard: the last shard goes dark; one drawer slides out of it, lit: the one thing disclosed;
//   4  quantum security: an account rises at the front with its key on it; the key turns once and comes back round as the new one (a lattice, green);
//      the account itself never changes.
// No text in the picture. Drawn on canvas in the site's iso hand (light tops, grey sides, ink hairlines, one green) on the ink band.
import { clamp01, hash, lerp, smooth } from "./stage";

const C30 = Math.cos(Math.PI / 6);
type V = [number, number];

/** a state of the model, everything numeric so two states can be mixed */
export type MorphState = {
  lift: number;      // the lid's lift above the shards (0 resting on them)
  heavy: number;     // 1: validators carry full copies; 0: thin witnesses
  witness: number;   // the green witnesses rising from the shards (0..1)
  swell: number;     // shard 1's growth toward its threshold (0..1)
  split: number;     // shard 1's split (0..1)
  thresh: number;    // the threshold's ghost outline (0..1)
  dark: number;      // the last shard going dark (0..1)
  drawer: number;    // the drawer out of it (0..1)
  account: number;   // the account rising (0..1)
  turn: number;      // the key's turn (0..1: half a turn, the new face after the middle)
  zoom: number;      // the camera: 0 the whole model, 1 a little closer
  fx: number;        // the camera's focus along the shards (0..1)
  fy: number;        // the camera's focus front/back (0 the shards, 1 the account)
};

export const STATES: MorphState[] = [
  { lift: 0, heavy: 1, witness: 0, swell: 0, split: 0, thresh: 0, dark: 0, drawer: 0, account: 0, turn: 0, zoom: 0, fx: 0.5, fy: 0.2 },
  { lift: 1, heavy: 0, witness: 1, swell: 0, split: 0, thresh: 0, dark: 0, drawer: 0, account: 0, turn: 0, zoom: 0, fx: 0.5, fy: 0.2 },
  { lift: 1, heavy: 0, witness: 0.35, swell: 1, split: 1, thresh: 1, dark: 0, drawer: 0, account: 0, turn: 0, zoom: 0.3, fx: 0.38, fy: 0.15 },
  { lift: 1, heavy: 0, witness: 0.35, swell: 1, split: 1, thresh: 0, dark: 1, drawer: 1, account: 0, turn: 0, zoom: 0.3, fx: 0.72, fy: 0.3 },
  { lift: 1, heavy: 0, witness: 0.35, swell: 1, split: 1, thresh: 0, dark: 1, drawer: 0.35, account: 1, turn: 1, zoom: 0.12, fx: 0.45, fy: 0.6 },
];

/** the chapter's progress (0..1 across the pinned scroll) → the model: each state holds a little, then eases into the next. Within a step, the parts
 *  that tell it run in order (the lift before the witnesses, the swell before the split, the turn after the account is up). */
export function stateAt(p: number): { s: MorphState; on: number } {
  const n = STATES.length - 1, q = clamp01(p) * n, i = Math.min(n - 1, Math.floor(q)), u = q - i;
  const a = STATES[i], b = STATES[i + 1], k = smooth(clamp01((u - 0.08) / 0.8));   // a short hold at each end
  const s = {} as MorphState;
  (Object.keys(a) as (keyof MorphState)[]).forEach((key) => { s[key] = lerp(a[key], b[key], k); });
  // the order inside a step
  if (i === 0) { s.lift = smooth(clamp01(k / 0.55)); s.heavy = 1 - smooth(clamp01((k - 0.25) / 0.5)); s.witness = smooth(clamp01((k - 0.55) / 0.45)); }
  if (i === 1) { s.swell = smooth(clamp01(k / 0.55)); s.thresh = smooth(clamp01(k / 0.25)); s.split = smooth(clamp01((k - 0.55) / 0.45)); }
  if (i === 2) { s.dark = smooth(clamp01(k / 0.5)); s.drawer = smooth(clamp01((k - 0.45) / 0.55)); s.thresh = 1 - smooth(clamp01(k / 0.3)); }
  if (i === 3) { s.account = smooth(clamp01(k / 0.45)); s.turn = clamp01((k - 0.4) / 0.6); s.drawer = lerp(1, 0.35, smooth(clamp01(k / 0.4))); }
  return { s, on: u > 0.5 ? i + 1 : i };
}

/* ── the iso hand on canvas ──────────────────────────────────────────────────────────────────────────────────────── */
type Look = { top: string; left: string; right: string; line: string; lw?: number };
const LIGHT: Look = { top: "#f5f4f1", left: "#d6d3cc", right: "#b3afa7", line: "rgba(38,38,38,0.95)" };
const LID: Look = { top: "#ecebe6", left: "#cfccc4", right: "#aaa69e", line: "rgba(38,38,38,0.95)" };
const DARK: Look = { top: "#3a3a39", left: "#2e2e2d", right: "#1f1f1e", line: "rgba(245,244,241,0.55)" };
const BASE: Look = { top: "rgba(245,244,241,0.05)", left: "rgba(245,244,241,0.09)", right: "rgba(245,244,241,0.04)", line: "rgba(245,244,241,0.3)" };
const VAL: Look = { top: "#4a4a49", left: "#363635", right: "#262626", line: "rgba(245,244,241,0.6)" };
const GREEN = "#00dc8d", GREEN_L = "#7befc3", GREEN_D = "#00a86b";

const hex = (s: string) => { const m = s.match(/[\d.]+/g); if (s.startsWith("#")) { const n = parseInt(s.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]; } return m ? m.map(Number) : [0, 0, 0, 1]; };
const mixC = (a: string, b: string, k: number) => { const A = hex(a), B = hex(b); const r = (i: number) => lerp(A[i], B[i], k); return `rgba(${Math.round(r(0))},${Math.round(r(1))},${Math.round(r(2))},${(lerp(A[3] ?? 1, B[3] ?? 1, k)).toFixed(3)})`; };
const mixLook = (a: Look, b: Look, k: number): Look => ({ top: mixC(a.top, b.top, k), left: mixC(a.left, b.left, k), right: mixC(a.right, b.right, k), line: mixC(a.line, b.line, k) });

export function createMorph() {
  return (c: CanvasRenderingContext2D, w: number, h: number, t: number, s: MorphState) => {
    /* the model, in its own units: x along the shards (right-down), y front-back (left-down), z up */
    const D = 2.6;                                   // a shard's depth
    const SPAN = 10.2, GAP = 0.55, W0 = (SPAN - 3 * GAP) / 4, W1 = (SPAN - 4 * GAP) / 5;
    const H0 = 2.4;                                  // a shard's height
    const sw = smooth(s.swell), sp = smooth(s.split);
    // the shards' widths: four, then shard 1 swells and splits into two while the others narrow to make room
    const wOther = lerp(W0, W1, sp), wSplit = lerp(W0, 2 * W1 + GAP, sp), inner = lerp(0, GAP, sp);
    const hSplit = lerp(H0 + 1.35 * sw, H0 * 0.86, sp), hThr = H0 + 1.05;
    type Shard = { x: number; w: number; h: number; dark?: number; split?: boolean };
    const shards: Shard[] = [];
    let x = 0;
    for (let i = 0; i < 4; i++) {
      if (i === 1) {
        const half = (wSplit - inner) / 2;
        // before the split, one block; as it splits the two halves part (a hairline seam first, then a gap)
        if (sp <= 0.001) shards.push({ x, w: wSplit, h: hSplit, split: true });
        else { shards.push({ x, w: half, h: hSplit, split: true }); shards.push({ x: x + half + inner, w: half, h: hSplit, split: true }); }
        x += wSplit + GAP;
      } else { shards.push({ x, w: wOther, h: H0, dark: i === 3 ? s.dark : 0 }); x += wOther + GAP; }
    }
    // the lid rests on the shards, then lifts well clear of the tallest a shard ever gets (its threshold)
    const lidBase = lerp(H0, H0 + 1.45 + 1.9, smooth(s.lift));

    /* the camera: fit the whole model (fixed bounds, so nothing rescales between states), then zoom a little toward the step's focus */
    const P0 = (X: number, Y: number, Z = 0): V => [(X - Y) * C30, (X + Y) * 0.5 - Z];
    const bounds = [P0(-1.2, -1.4, 0), P0(SPAN + 1.2, -1.4, 0), P0(-1.2, D + 4.4, 0), P0(SPAN + 1.2, D + 4.4, 0), P0(-1.2, -1.4, 7), P0(SPAN + 1.2, -1.4, 7)];
    const minX = Math.min(...bounds.map((b) => b[0])), maxX = Math.max(...bounds.map((b) => b[0])), minY = Math.min(...bounds.map((b) => b[1])), maxY = Math.max(...bounds.map((b) => b[1]));
    const fit = Math.min(w / (maxX - minX), h / (maxY - minY)) * 0.96;
    const sc = fit * (1 + 0.42 * s.zoom), k = clamp01(s.zoom / 0.3) * 0.4;
    const mid: V = [(minX + maxX) / 2, (minY + maxY) / 2], foc = P0(lerp(0, SPAN, s.fx), lerp(D * 0.5, D + 2.6, s.fy), 1.6);
    const cx = lerp(mid[0], foc[0], k), cy = lerp(mid[1], foc[1], k);
    const camX = w / 2 - cx * sc, camY = h / 2 - cy * sc;
    const P = (X: number, Y: number, Z = 0): V => { const p = P0(X, Y, Z); return [camX + p[0] * sc, camY + p[1] * sc]; };
    const lw = Math.max(0.8, Math.min(1.4, sc / 34));

    const poly = (pts: V[], fill: string, line: string, width = lw) => {
      c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (line) { c.strokeStyle = line; c.lineWidth = width; c.lineJoin = "round"; c.stroke(); }
    };
    /** a box: its three visible faces (top, the front-left y = y1 face, the front-right x = x1 face) */
    const box = (x0: number, y0: number, z0: number, bw: number, bd: number, bh: number, look: Look, alpha = 1) => {
      if (alpha <= 0.001 || bh < -0.001) return;
      const x1 = x0 + bw, y1 = y0 + bd, z1 = z0 + Math.max(0.0001, bh);
      c.globalAlpha = alpha;
      poly([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], look.left, look.line, look.lw ?? lw);
      poly([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], look.right, look.line, look.lw ?? lw);
      poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], look.top, look.line, look.lw ?? lw);
      c.globalAlpha = 1;
    };
    /** dots laid on a box's top (its data) */
    const topDots = (x0: number, y0: number, z: number, bw: number, bd: number, color: string, step = 0.42) => {
      c.fillStyle = color;
      for (let a = step / 2; a < bw; a += step) for (let b = step / 2; b < bd; b += step) { const p = P(x0 + a, y0 + b, z); c.fillRect(p[0] - lw * 0.7, p[1] - lw * 0.7, lw * 1.4, lw * 1.4); }
    };

    /* the floor: the band's dots, then the base the network stands on */
    c.fillStyle = "rgba(245,244,241,0.12)";
    for (let a = -3; a <= SPAN + 3; a += 0.8) for (let b = -3; b <= D + 6; b += 0.8) { const p = P(a, b, 0); c.fillRect(p[0] - 0.7, p[1] - 0.7, 1.4, 1.4); }
    box(-0.9, -0.9, -0.35, SPAN + 1.8, D + 1.8 + 2.6 * smooth(s.account) + 0.0, 0.35, BASE);

    const WIT: Look = { top: GREEN, left: GREEN_D, right: GREEN_D, line: "rgba(0,90,58,0.9)" };
    /* the shards, back to front (along x); each with its witness rising to the lid once consensus has lifted */
    shards.forEach((q, i) => {
      const look = q.dark ? mixLook(LIGHT, DARK, smooth(q.dark)) : LIGHT;
      // shard 1: its top warms as it nears the threshold, flashes green as it splits
      const flash = q.split ? Math.max(Math.sin(Math.PI * clamp01((sp - 0.02) / 0.5)), 0.35 * sw * (1 - sp)) : 0;
      const lk = flash > 0 ? { ...look, top: mixC(look.top, GREEN_L, flash * 0.9) } : look;
      box(q.x, 0, 0, q.w, D, q.h, lk);
      topDots(q.x, 0, q.h, q.w, D, q.dark ? `rgba(245,244,241,${0.25 * smooth(q.dark)})` : `rgba(38,38,38,${0.32})`, 0.46);
      // the drawer: a thin tray pulled out of the dark shard's front face, lit (the one thing disclosed)
      if (q.dark && s.drawer > 0.001) {
        const out = smooth(s.drawer) * 1.5, dz = q.h * 0.42, dh = q.h * 0.18, inset = q.w * 0.16;
        box(q.x + inset, D - 0.02, dz, q.w - inset * 2, out + 0.02, dh, { top: "#ffffff", left: "#e6e3dc", right: "#c7c3bb", line: "rgba(38,38,38,0.95)" }, clamp01(s.drawer * 4));
        const it = P(q.x + q.w / 2, D + out * 0.55, dz + dh);
        c.globalAlpha = clamp01((s.drawer - 0.35) / 0.4);
        c.beginPath(); c.arc(it[0], it[1] - lw * 2, Math.max(2.5, sc * 0.09), 0, Math.PI * 2); c.fillStyle = GREEN; c.fill();
        c.globalAlpha = 1;
      }
      // the witness: a dotted path from the shard's top up to the lid, and one small green wafer climbing it
      const span = lidBase - q.h - 0.1;
      if (s.witness > 0.01 && span > 0.4) {
        const cx = q.x + q.w / 2, cy = D * 0.78, a0 = P(cx, cy, q.h + 0.02), a1 = P(cx, cy, lidBase);
        c.setLineDash([2, 4]); c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]);
        c.strokeStyle = `rgba(0,220,141,${0.8 * s.witness})`; c.lineWidth = 1.2; c.stroke(); c.setLineDash([]);
        const u = (t * 0.42 + hash(i, 3)) % 1, z = q.h + 0.05 + u * (span - 0.1), ww = 0.7;
        box(cx - ww / 2, cy - ww / 2, z, ww, ww, 0.07, WIT, s.witness * clamp01(Math.min(u / 0.12, (1 - u) / 0.12)));
      }
    });

    /* the threshold: a ghost outline at the height a shard splits at, over shard 1 (drawn over it: a mark, not a thing) */
    if (s.thresh > 0.01) {
      const s1 = shards[1], s2 = shards[sp > 0.001 ? 2 : 1];
      const x0 = s1.x - 0.14, x1 = s2.x + s2.w + 0.14, y0 = -0.14, y1 = D + 0.14;
      c.setLineDash([4, 4]);
      poly([P(x0, y0, hThr), P(x1, y0, hThr), P(x1, y1, hThr), P(x0, y1, hThr)], "", `rgba(245,244,241,${0.75 * s.thresh})`, 1.2);
      // its corners dropped to the base, so it reads as a level, not a box
      [[x0, y1], [x1, y1], [x1, y0]].forEach(([X, Y]) => { const t0 = P(X, Y, hThr), t1 = P(X, Y, hThr - 0.5); c.beginPath(); c.moveTo(t0[0], t0[1]); c.lineTo(t1[0], t1[1]); c.strokeStyle = `rgba(245,244,241,${0.4 * s.thresh})`; c.stroke(); });
      c.setLineDash([]);
    }

    /* the lid (consensus): a thin slab over every shard; it lifts off */
    const lx0 = -0.45, lw0 = SPAN + 0.9, ly0 = -0.45, ld0 = D + 0.9;
    box(lx0, ly0, lidBase, lw0, ld0, 0.26, LID);
    // its validators, in a row on the lid, each with what it holds: a full copy of the state (a big dotted box) that flattens to a small green witness
    const vz = lidBase + 0.26, hv = smooth(s.heavy);
    for (let v = 0; v < 4; v++) {
      const vx = 0.55 + v * (SPAN / 4), vy = 0.5;
      const bw = lerp(0.62, 1.15, hv), bd = lerp(0.62, 1.6, hv), hh = lerp(0.07, 1.55, hv);
      const look: Look = mixLook(LIGHT, WIT, smooth(clamp01((0.6 - s.heavy) / 0.6)));
      box(vx + 0.75, vy - 0.1 + (1.6 - bd) / 2, vz, bw, bd, hh, look);
      if (s.heavy > 0.02) topDots(vx + 0.75, vy - 0.1 + (1.6 - bd) / 2, vz + hh, bw, bd, `rgba(38,38,38,${0.4 * hv})`, 0.32);
      box(vx, vy + 0.15, vz, 0.55, 0.55, 0.62, VAL);
      const cap = P(vx + 0.275, vy + 0.425, vz + 0.62);
      c.beginPath(); c.arc(cap[0], cap[1], Math.max(1.6, sc * 0.05), 0, Math.PI * 2); c.fillStyle = "rgba(245,244,241,0.85)"; c.fill();
    }

    /* the account at the front: a block that rises, with its key standing over it; the key turns half round about its upright axis and comes back
       as the new one (its bow a green lattice). The account never changes; its top answers green once the new key is in. */
    if (s.account > 0.001) {
      const ax = SPAN * 0.4, ay = D + 1.3, aw = 1.7, ah = lerp(0, 1.2, smooth(s.account)), done = smooth(clamp01((s.turn - 0.82) / 0.18));
      box(ax, ay, 0, aw, aw, ah, { ...LIGHT, top: mixC(LIGHT.top, "#bff5df", done) }, clamp01(s.account * 3));
      const th = -Math.PI / 4 + Math.PI * smooth(s.turn), L = 1.5, kx = ax + aw / 2, ky = ay + aw / 2, kz = ah + 0.32;
      const KV = 1.4, S = (u: number, v: number): V => P(kx + Math.cos(th) * u * L, ky + Math.sin(th) * u * L, kz + v * KV);
      const fresh = s.turn > 0.5, a = clamp01((s.account - 0.55) / 0.35);
      const ink = fresh ? "rgba(0,120,78,1)" : "rgba(38,38,38,0.95)", fill = fresh ? "#ffffff" : "#efece6";
      c.globalAlpha = a;
      // the post it stands on
      const p0 = S(-0.5, -0.32), p1 = S(-0.5, 0.06);
      c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.strokeStyle = "rgba(245,244,241,0.6)"; c.lineWidth = lw; c.stroke();
      // the blade: shaft and teeth
      const blade: [number, number][] = [[-0.2, 0.44], [0.98, 0.44], [0.98, 0.28], [0.86, 0.28], [0.86, 0.36], [0.74, 0.36], [0.74, 0.24], [0.62, 0.24], [0.62, 0.36], [0.5, 0.36], [0.5, 0.3], [0.4, 0.3], [0.4, 0.36], [-0.2, 0.36]];
      poly(blade.map(([u, v]) => S(u, v + 0.06)), fill, ink, lw * 1.1);
      // the bow: a ring (sampled in the key's own plane, so it turns with it)
      const bow = (r: number) => { const pts: V[] = []; for (let k = 0; k < 36; k++) { const q = (k / 36) * Math.PI * 2; pts.push(S(-0.5 + (Math.cos(q) * r * KV) / L, 0.46 + Math.sin(q) * r)); } return pts; };
      poly(bow(0.44), fill, ink, lw * 1.1);
      if (!fresh) poly(bow(0.17), "#262626", "");
      else {
        // the new bow: a lattice of points (the post-quantum key)
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const o = S(-0.5 + (i * 0.17 * KV) / L, 0.46 + j * 0.17); c.beginPath(); c.arc(o[0], o[1], Math.max(1.6, sc * 0.06), 0, Math.PI * 2); c.fillStyle = (i + j) % 2 ? GREEN_D : GREEN; c.fill(); }
        poly(bow(0.3), "", "rgba(0,220,141,0.9)", lw);
      }
      c.globalAlpha = 1;
    }
  };
}
