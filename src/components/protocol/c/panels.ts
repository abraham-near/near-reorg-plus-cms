// Protocol C · the chapter's four drawings, on the dark band, each its own picture of its mechanism (no words: form, motion and the one green carry it).
// Each is drawn in a 720 × 440 design space, scaled to fit, and played by u (0 → 1: the panel's progress through the lateral scroll, or a loop on
// phones); time t keeps it breathing.
//   0 Nightshade 3.0: the chain of blocks (consensus) sits on the shards with every validator carrying a heavy stack of state; the chain lifts off the
//     shards (consensus decoupled from execution), the stacks melt away and each shard sends up a small witness instead (stateless validation); then
//     one green arc ties two shards into the same block (an atomic multi-contract call);
//   1 Dynamic resharding: one shard among others fills with state, dot by dot, up to its line; a seam opens and it divides in two, like a cell, each
//     half re-settling at half the height, while its neighbours make room (no vote, nobody steps in);
//   2 Private Shard: transactions ride a belt into a dark zone, where their contents vanish (only sealed shapes pass); the belt stops, a green lens
//     opens one of them and a green line hands what it shows to one viewer (selective disclosure);
//   3 Quantum security: an account, its holdings circling it, and its key; waves come from the right and break through the old key (curve pattern),
//     shaking the account; the key turns over once, comes back with a lattice and green, and the waves stop at it. The account never changes.
import { clamp01, hash, lerp, smooth, rgba, fit, rr, PAPER, GREEN } from "./stage";

const DW = 720, DH = 440, TAU = Math.PI * 2;
const P = (a: number) => rgba(PAPER, a), G = (a: number) => rgba(GREEN, a);
const BAND = "#262626";

export type PanelFrame = (c: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number, u: number) => void;

export function createPanel(i: number): PanelFrame {
  return [nightshade, resharding, privateShard, quantum][i]?.() ?? (() => {});
}

/* ────────────────────────────── 0 · Nightshade 3.0 */
function nightshade(): PanelFrame {
  let off = 0;
  const COLS = [150, 290, 430, 570], CW = 84, TOP = 236, BOT = 418;
  return (c, w, h, t, dt, u) => {
    const s = fit(c, w, h, DW, DH), hair = 1 / s;
    const lift = smooth((u - 0.16) / 0.32), heavy = 1 - smooth((u - 0.08) / 0.42), wit = smooth((u - 0.42) / 0.26), atom = smooth((u - 0.78) / 0.2);
    const yB = lerp(TOP - 14, 84, lift);
    off += dt * lerp(10, 34, wit);

    // the shards: tall frames, chunks rising inside
    COLS.forEach((x, j) => {
      c.lineWidth = hair; c.strokeStyle = P(0.28);
      rr(c, x - CW / 2, TOP, CW, BOT - TOP, 4); c.stroke();
      for (let m = 0; m < 6; m++) {
        const y = BOT - 14 - ((t * lerp(9, 22, wit) + m * 31 + j * 11) % (BOT - TOP - 24));
        const edge = clamp01((BOT - 10 - y) / 24) * clamp01((y - TOP - 6) / 24);
        const hot = atom > 0 && (j === 0 || j === 2) && m === 0;
        c.fillStyle = hot ? G(0.9 * atom * edge + 0.0) : P(0.16 * edge);
        c.strokeStyle = hot ? G(edge) : P(0.55 * edge);
        rr(c, x - 28, y - 6, 56, 12, 2); c.fill(); c.stroke();
      }
    });

    // the gap that opens between consensus and execution: a soft band

    // the chain of blocks: squares joined by a line, sliding left
    c.lineWidth = hair; c.strokeStyle = P(0.45);
    c.beginPath(); c.moveTo(30, yB); c.lineTo(690, yB); c.stroke();
    const sp = 40;
    for (let k = -1; k < 18; k++) {
      const x = 40 + ((k * sp - off) % (sp * 17) + sp * 17) % (sp * 17);
      const e = clamp01((x - 30) / 50) * clamp01((690 - x) / 50);
      const green = atom > 0.5 && x > 560;
      c.fillStyle = green ? G(0.85 * e) : BAND;
      c.strokeStyle = green ? G(e) : P(0.7 * e);
      c.fillRect(x - 9, yB - 9, 18, 18); c.strokeRect(x - 9, yB - 9, 18, 18);
    }

    // the validators on the chain, each with what it carries: first a heavy stack of state, then nothing (a witness comes up to it)
    COLS.forEach((x, j) => {
      const n = 5 * heavy;
      for (let m = 0; m < Math.ceil(n); m++) {
        const a = Math.min(1, n - m), y = yB - 30 - m * 15;
        if (y < 6) continue;
        c.fillStyle = P(0.12 * a); c.strokeStyle = P(0.6 * a); c.lineWidth = hair;
        rr(c, x - 30, y - 6, 60, 12, 2); c.fill(); c.stroke();
        // hatch: the weight of a full state
        c.save(); rr(c, x - 30, y - 6, 60, 12, 2); c.clip(); c.strokeStyle = P(0.18 * a); c.beginPath();
        for (let q = -12; q < 72; q += 7) { c.moveTo(x - 30 + q, y + 6); c.lineTo(x - 30 + q + 12, y - 6); }
        c.stroke(); c.restore();
      }
      // the witness line and the witnesses rising up it
      if (wit > 0) {
        c.setLineDash([2, 5]); c.strokeStyle = P(0.28 * wit); c.beginPath(); c.moveTo(x, TOP - 4); c.lineTo(x, yB + 14); c.stroke(); c.setLineDash([]);
        const per = 1.1, ph = ((t + j * 0.27) % per) / per, y = lerp(TOP - 6, yB + 12, smooth(ph));
        c.fillStyle = P(0.95 * wit * Math.sin(Math.PI * ph)); c.fillRect(x - 4, y - 4, 8, 8);
      }
      const ph = ((t + j * 0.27) % 1.1) / 1.1, pulse = wit > 0 && ph > 0.8 ? wit * (1 - (ph - 0.8) / 0.2) : 0;
      c.fillStyle = BAND; c.strokeStyle = P(0.9); c.lineWidth = 1.3 * hair;
      c.beginPath(); c.arc(x, yB, 8, 0, TAU); c.fill(); c.stroke();
      if (pulse > 0) { c.strokeStyle = P(0.45 * pulse); c.beginPath(); c.arc(x, yB, 8 + (1 - pulse) * 10, 0, TAU); c.stroke(); }
    });

    // the atomic call: one arc across two shards, into one block
    if (atom > 0) {
      const x0 = COLS[0], x1 = COLS[2], y0 = TOP - 10, top = lerp(y0, yB + 40, 0.55);
      c.strokeStyle = G(0.95 * atom); c.lineWidth = 1.6 * hair;
      c.beginPath(); c.moveTo(x0, y0);
      const steps = 40, k = atom;
      for (let q = 1; q <= steps * k; q++) { const v = q / steps; c.lineTo(lerp(x0, x1, v), y0 - Math.sin(Math.PI * v) * (y0 - top)); }
      c.stroke();
      const v = (t * 0.6) % 1;
      c.fillStyle = G(atom); c.beginPath(); c.arc(lerp(x0, x1, v), y0 - Math.sin(Math.PI * v) * (y0 - top), 3.2, 0, TAU); c.fill();
    }
  };
}

/* ────────────────────────────── 1 · Dynamic resharding */
function resharding(): PanelFrame {
  const W = 112, H = 260, GAP = 34, Y0 = 118, SP = 11.6, COLS = 8, LINE = 17;
  const dotsIn = (x: number, w: number, n: number, cols: number, out: [number, number][]) => {
    const pad = (w - (cols - 1) * SP) / 2;
    for (let i = 0; i < n; i++) out.push([x + pad + (i % cols) * SP, Y0 + H - 12 - Math.floor(i / cols) * SP]);
  };
  return (c, w, h, t, _dt, u) => {
    const s = fit(c, w, h, DW, DH), hair = 1 / s, cx = DW / 2;
    const fill = smooth(u / 0.46), seam = smooth((u - 0.45) / 0.08), split = smooth((u - 0.53) / 0.24), grow = smooth((u - 0.66) / 0.28);
    const flash = Math.sin(Math.PI * clamp01((u - 0.74) / 0.22));
    const rows = lerp(4, LINE, fill), n = Math.round(rows * COLS);

    // the neighbours: other shards, steady, stepping aside as the new one needs room
    [-1, 1].forEach((side, j) => {
      const x = cx + side * (W + GAP) * (1 + 0.5 * split) - W / 2;
      c.lineWidth = hair; c.strokeStyle = P(0.3); rr(c, x, Y0, W, H, 8); c.stroke();
      const pts: [number, number][] = []; dotsIn(x, W, (j ? 9 : 6) * COLS, COLS, pts);
      c.fillStyle = P(0.32); pts.forEach(([px, py], q) => { const tw = 0.75 + 0.25 * Math.sin(t * 1.3 + q); c.globalAlpha = tw; c.beginPath(); c.arc(px, py, 2.1, 0, TAU); c.fill(); });
      c.globalAlpha = 1;
    });

    // the shard that grows: one cell, then two halves moving apart, each growing back to a full width
    const halfW = lerp(W / 2, W, grow);
    const cL = lerp(cx - W / 4, cx - (W + GAP) / 2, split), cR = lerp(cx + W / 4, cx + (W + GAP) / 2, split);
    const lineY = Y0 + H - 12 - LINE * SP + SP / 2;
    c.lineWidth = 1.2 * hair;
    if (split <= 0.001) {
      c.strokeStyle = P(0.85); rr(c, cx - W / 2, Y0, W, H, 8); c.stroke();
    } else {
      [cL, cR].forEach((x) => { c.strokeStyle = flash > 0 ? G(0.5 + 0.5 * flash) : P(0.85); rr(c, x - halfW / 2, Y0, halfW, H, 8); c.stroke(); });
    }
    // its line: the state-size threshold (green once reached)
    const reached = fill > 0.97;
    if (split < 0.6) {
      c.setLineDash([3, 5]); c.lineWidth = hair; c.strokeStyle = reached ? G(0.9 * (1 - split)) : P(0.38 * (1 - split));
      c.beginPath(); c.moveTo(cx - W / 2 - 10, lineY); c.lineTo(cx + W / 2 + 10, lineY); c.stroke(); c.setLineDash([]);
    }
    // the seam: drawn down the middle, then it opens
    if (seam > 0 && split < 1) {
      c.strokeStyle = G(0.95 * (1 - split)); c.lineWidth = 1.5 * hair;
      c.beginPath(); c.moveTo(cx, Y0 - 8); c.lineTo(cx, lerp(Y0 - 8, Y0 + H + 8, seam)); c.stroke();
    }
    // its state, dot by dot: from the cell's grid to each half's own grid
    c.fillStyle = P(0.85);
    for (let i = 0; i < n; i++) {
      const col = i % COLS, row = Math.floor(i / COLS), half = col < COLS / 2 ? 0 : 1;
      const mx = cx - W / 2 + (W - (COLS - 1) * SP) / 2 + col * SP, my = Y0 + H - 12 - row * SP;
      const hc = half ? cR : cL, home = half ? cx + W / 4 : cx - W / 4;
      const sx = mx - home + hc;   // held in its half while the halves part
      const k = row * (COLS / 2) + (col % (COLS / 2)), dx = hc - halfW / 2 + (halfW - (COLS - 1) * SP * (halfW / W)) / 2 + (k % COLS) * SP * (halfW / W), dy = Y0 + H - 12 - Math.floor(k / COLS) * SP;
      const x = lerp(sx, dx, grow), y = lerp(my, dy, grow);
      const fresh = i >= n - COLS && fill < 1 ? 0.5 + 0.5 * Math.sin(t * 6 + i) : 1;
      c.globalAlpha = fresh; c.beginPath(); c.arc(x, y, 2.3, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
    // state still coming in from above while it fills
    if (fill < 1) for (let j = 0; j < 5; j++) {
      const per = 1.4, ph = ((t + j * 0.28) % per) / per, x = cx - W / 2 + 18 + hash(j, Math.floor((t + j * 0.28) / per)) * (W - 36);
      c.fillStyle = P(0.7 * Math.sin(Math.PI * ph) * (1 - fill)); c.beginPath(); c.arc(x, lerp(40, Y0 + 20, ph), 2.3, 0, TAU); c.fill();
    }
  };
}

/* ────────────────────────────── 2 · Private Shard */
function privateShard(): PanelFrame {
  let off = 0;
  const ZX = 240, ZW = 380, ZY = 118, ZH = 224, CW = 74, CH = 48, SP = 104, CY = 230, LEN = SP * 9;
  const content = (c: CanvasRenderingContext2D, x: number, y: number, id: number, col: (a: number) => string) => {
    c.fillStyle = col(0.75); c.fillRect(x - CW / 2 + 10, y - CH / 2 + 10, 10, 10);
    for (let l = 0; l < 3; l++) { const lw = 22 + hash(id, l) * 28; c.fillStyle = col(l === 0 ? 0.75 : 0.45); c.fillRect(x - CW / 2 + 26 + (l ? -16 : 0), y - CH / 2 + 12 + l * 10, l ? lw : Math.min(lw, 30), 2.4); }
  };
  return (c, w, h, t, dt, u) => {
    const s = fit(c, w, h, DW, DH), hair = 1 / s;
    const priv = smooth(u / 0.3), stop = smooth((u - 0.4) / 0.16), lens = smooth((u - 0.52) / 0.22), see = smooth((u - 0.76) / 0.2);
    off += dt * 46 * (1 - stop);
    // the belt
    c.strokeStyle = P(0.22); c.lineWidth = hair; c.beginPath(); c.moveTo(20, CY + CH / 2 + 10); c.lineTo(700, CY + CH / 2 + 10); c.stroke();
    const cards: { x: number; id: number }[] = [];
    for (let k = 0; k < 9; k++) {
      const raw = k * SP + off, id = k - 9 * Math.floor(raw / LEN), x = -60 + ((raw % LEN) + LEN) % LEN;
      cards.push({ x, id });
    }
    const vis = (x: number) => clamp01((x + 10) / 60) * clamp01((720 - x) / 60);
    // open cards
    cards.forEach(({ x, id }) => {
      const a = vis(x);
      c.fillStyle = BAND; c.strokeStyle = P(0.75 * a); c.lineWidth = hair;
      rr(c, x - CW / 2, CY - CH / 2, CW, CH, 4); c.fill(); c.stroke();
      c.globalAlpha = a; content(c, x, CY, id, P); c.globalAlpha = 1;
    });
    // the dark zone: what enters shows only its shape
    if (priv > 0) {
      c.save(); rr(c, ZX, ZY, ZW, ZH, 10); c.clip();
      c.fillStyle = `rgba(22,22,22,${(0.97 * priv).toFixed(3)})`; c.fillRect(ZX, ZY, ZW, ZH);
      cards.forEach(({ x }) => {
        c.fillStyle = `rgba(52,52,52,${priv.toFixed(3)})`; c.strokeStyle = P(0.24 * priv);
        rr(c, x - CW / 2, CY - CH / 2, CW, CH, 4); c.fill(); c.stroke();
      });
      c.restore();
      c.strokeStyle = P(0.2 * priv); c.lineWidth = hair; rr(c, ZX, ZY, ZW, ZH, 10); c.stroke();
    }
    // the lens: one card, opened for one viewer
    if (lens > 0) {
      const target = cards.reduce((b, k) => (Math.abs(k.x - 430) < Math.abs(b.x - 430) ? k : b), cards[0]);
      const ex = 650, ey = 66;
      const lx = lerp(ex - 40, target.x, smooth(lens)), ly = lerp(ey + 30, CY, smooth(lens)), r = 44 * (0.6 + 0.4 * lens);
      c.save(); c.beginPath(); c.arc(lx, ly, r, 0, TAU); c.clip();
      c.fillStyle = BAND; c.fillRect(lx - r, ly - r, r * 2, r * 2);
      c.strokeStyle = G(0.9 * lens); c.lineWidth = hair; rr(c, target.x - CW / 2, CY - CH / 2, CW, CH, 4); c.stroke();
      c.globalAlpha = lens; content(c, target.x, CY, target.id, G); c.globalAlpha = 1;
      c.restore();
      c.strokeStyle = G(lens); c.lineWidth = 1.6 * hair; c.beginPath(); c.arc(lx, ly, r, 0, TAU); c.stroke();
      // the one who may see: an eye, outside the zone, joined to the lens
      if (see > 0) {
        const ang = Math.atan2(ey - ly, ex - lx), sx = lx + Math.cos(ang) * r, sy = ly + Math.sin(ang) * r;
        c.strokeStyle = G(0.9 * see); c.lineWidth = 1.4 * hair; c.beginPath(); c.moveTo(sx, sy); c.lineTo(lerp(sx, ex, see), lerp(sy, ey, see)); c.stroke();
        c.save(); c.translate(ex, ey); c.scale(1.6, 1.6); c.globalAlpha = see;
        c.strokeStyle = G(1); c.lineWidth = 1.4 * hair; c.beginPath(); c.moveTo(-18, 0); c.quadraticCurveTo(0, -14, 18, 0); c.quadraticCurveTo(0, 14, -18, 0); c.stroke();
        c.fillStyle = G(1); c.beginPath(); c.arc(0, 0, 4.5 + Math.sin(t * 2) * 0.4, 0, TAU); c.fill();
        c.restore();
      }
    }
  };
}

/* ────────────────────────────── 3 · Quantum security */
function quantum(): PanelFrame {
  const AX = 214, AY = 220, AR = 62, KX = 420, KR = 38;
  return (c, w, h, t, _dt, u) => {
    const s = fit(c, w, h, DW, DH), hair = 1 / s;
    const threat = smooth(u / 0.22), rot = smooth((u - 0.38) / 0.22), safe = rot > 0.5 ? 1 : 0;
    const flipped = smooth((u - 0.5) / 0.12);

    // the waves: from the right, as arcs; before the turn they run through to the account, after it they stop at the key
    const stopX = safe ? KX + KR + 8 : 30;
    let hitAcc = 0, hitKey = 0;
    for (let j = 0; j < 7; j++) {
      const r = ((t * 70 + j * 62) % 434);
      const x = 760 - r;
      if (x < stopX) continue;
      const a = threat * 0.5 * clamp01(r / 60) * clamp01((x - stopX) / 50 + (safe ? 0 : 1));
      c.strokeStyle = P(a); c.lineWidth = hair;
      c.beginPath(); c.arc(760, AY, r, Math.PI - 0.5, Math.PI + 0.5); c.stroke();
      if (!safe && Math.abs(x - (AX + AR)) < 40) hitAcc = Math.max(hitAcc, 1 - Math.abs(x - (AX + AR)) / 40);
      if (Math.abs(x - (KX + KR)) < 30) hitKey = Math.max(hitKey, 1 - Math.abs(x - (KX + KR)) / 30);
    }
    const shake = !safe ? hitAcc * threat * 2.2 : 0;
    const jx = shake ? (hash(Math.floor(t * 30), 1) - 0.5) * shake : 0, jy = shake ? (hash(Math.floor(t * 30), 2) - 0.5) * shake : 0;

    // the account: a ring, a green heart (yours), its holdings circling it
    c.save(); c.translate(jx, jy);
    c.strokeStyle = P(0.85); c.lineWidth = 1.3 * hair; c.beginPath(); c.arc(AX, AY, AR, 0, TAU); c.stroke();
    c.strokeStyle = P(0.22); c.lineWidth = hair; c.beginPath(); c.arc(AX, AY, AR - 12, 0, TAU); c.stroke();
    c.fillStyle = G(1); c.beginPath(); c.arc(AX, AY, 9, 0, TAU); c.fill();
    for (let k = 0; k < 9; k++) {
      const a = t * 0.22 + (k * TAU) / 9;
      c.fillStyle = P(0.6); c.beginPath(); c.arc(AX + Math.cos(a) * (AR + 26), AY + Math.sin(a) * (AR + 26), k % 3 ? 2.6 : 3.6, 0, TAU); c.fill();
    }
    c.restore();
    // the tie between account and key; one green pulse runs along it as the key turns (one rotation, one transaction)
    c.strokeStyle = P(0.5); c.lineWidth = hair; c.beginPath(); c.moveTo(AX + AR, AY); c.lineTo(KX - KR, AY); c.stroke();
    const pulse = clamp01((u - 0.38) / 0.22);
    if (pulse > 0 && pulse < 1) { c.fillStyle = G(1); c.beginPath(); c.arc(lerp(AX + AR, KX - KR, pulse), AY, 3.4, 0, TAU); c.fill(); }

    // the key: head and shaft, turned over once about its axis (scaleY = cos)
    const sy = Math.cos(Math.PI * rot) || 0.0001;
    c.save(); c.translate(0, AY); c.scale(1, Math.abs(sy) < 0.04 ? 0.04 : Math.abs(sy)); c.translate(0, -AY);
    const col = flipped > 0 ? (a: number) => rgba("0,220,141", a) : P;
    const crack = !safe ? hitKey * threat : 0;
    c.lineWidth = 1.4 * hair; c.strokeStyle = col(0.95); c.fillStyle = BAND;
    c.beginPath(); c.arc(KX, AY, KR, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(KX + KR, AY); c.lineTo(610, AY); c.moveTo(574, AY); c.lineTo(574, AY + 18); c.moveTo(598, AY); c.lineTo(598, AY + 12); c.stroke();
    // the pattern in the head: before, a curve (elliptic, smooth); after, a lattice
    c.save(); c.beginPath(); c.arc(KX, AY, KR - 6, 0, TAU); c.clip();
    if (!safe) {
      c.strokeStyle = P(0.85 * (1 - crack * (0.4 + 0.6 * hash(Math.floor(t * 24), 3)))); c.lineWidth = 1.2 * hair; c.beginPath();
      for (const sgn of [1, -1]) {
        let first = true;
        for (let q = 0; q <= 60; q++) {
          const x = -1.3247 + (q / 60) * 3.2, y2 = x * x * x - x + 1;
          if (y2 < 0) continue;
          const px = KX - 13 + x * 12, py = AY - sgn * Math.sqrt(y2) * 7.5;
          if (first) { c.moveTo(px, py); first = false; } else c.lineTo(px, py);
        }
      }
      c.stroke();
      // cracks while a wave goes through
      if (crack > 0.2) { c.strokeStyle = P(0.6 * crack); c.beginPath(); c.moveTo(KX - 20, AY - 14); c.lineTo(KX - 4, AY + 2); c.lineTo(KX + 8, AY - 6); c.lineTo(KX + 22, AY + 12); c.stroke(); }
    } else {
      c.fillStyle = G(0.95);
      for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) {
        const px = KX + a * 8 + b * 3, py = AY + b * 7;
        c.beginPath(); c.arc(px, py, 1.5, 0, TAU); c.fill();
      }
    }
    c.restore();
    c.restore();
    // after the turn: where a wave meets the key it breaks into a soft green rim
    if (safe && hitKey > 0) { c.strokeStyle = G(0.5 * hitKey * threat); c.lineWidth = 2 * hair; c.beginPath(); c.arc(KX, AY, KR + 6 + (1 - hitKey) * 6, -0.9, 0.9); c.stroke(); }
  };
}
