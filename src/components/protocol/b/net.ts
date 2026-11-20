// Protocol B · the network, drawn: the page's one picture, in three places (the hero's live scene, the chapter on the dark band, Speed's metronome).
// Time runs right to left. Each shard is a lane; transactions come in from the right (the incoming side) and, every 600 ms, each shard closes a chunk
// at the "now" line that carries them; the chunks drift left as history. Two blocks later (1.2 s) they pass the green "final" line: from there on the
// ruler's green rule (the homepage's proof-strip rule) marks them final. The private shard's chunks are shielded (solid, their contents unseen).
// Resharding: one lane fills (its meter under its label) and splits in two at the now line, with no vote; in the hero's cycle it later merges back.
// The chapter adds three overlays: the consensus band (block headers above the lanes, state witnesses rising from each new chunk), the selective
// disclosure lens on the private shard, and an account rotating its key to ML-DSA in one transaction.
// Everything is a function of time T (and the params): the same moment always draws the same frame, so a scrub, a still frame (reduced motion) and the
// live loop share one code path. An illustrative simulation: the cadence (600 ms blocks, 1.2 s finality) and the shard count are NEAR's; the traffic is not.
import { clamp01, hash, lerp, smooth } from "./stage";

export const BT = 0.6;   // block time, s
export const FIN = 1.2;  // finality, s

export type Tone = "paper" | "ink";
export type NetOpts = {
  shards: number;                       // shard lanes, at most (S0, S1 …)
  tone: Tone;
  reshard: "cycle" | "scrub" | "off";   // the hero splits and merges on its own; the chapter splits by scroll; Speed never
  ruler?: boolean; labels?: boolean; dots?: boolean; globals?: boolean;
  mono: string; sans: string;
  now?: number;                         // where the now line sits, as a share of the lanes' width
  maxLane?: number;                     // a lane's height at most, px
};
export type NetParams = {
  shardsF: number;    // shard lanes on show (a fraction fades the last one in)
  priv: number;       // the private shard's lane, 0..1
  privHi: number;     // the private shard brought forward (the others dim), 0..1
  consensus: number;  // the consensus band over the lanes, 0..1
  reshardU: number;   // scrub mode: 0..0.5 the lane fills, 0.5 it splits, then the new lane runs
  lens: number;       // the selective-disclosure lens, 0..1
  account: number;    // the account overlay (quantum), 0..1
  rot: number;        // its key rotation, 0..1
  dim: number;        // every lane dimmed (an overlay speaks), 0..1
  reveal: number;     // the intro's wipe, left to right, 0..1
};
export const PARAMS: NetParams = { shardsF: 10, priv: 1, privHi: 0, consensus: 0, reshardU: 0, lens: 0, account: 0, rot: 0, dim: 0, reveal: 1 };
export const mix = (a: NetParams, b: NetParams, k: number): NetParams => {
  const o = { ...a };
  (Object.keys(a) as (keyof NetParams)[]).forEach((key) => { o[key] = lerp(a[key], b[key], k); });
  return o;
};

type Lane = { kind: "shard" | "child" | "private"; seed: number; label: string; w: number; y: number; h: number };
type Reshard = { meter: number; meterA: number; split: number | null; merge: number | null; cw: number };

const CYCLE = 40, SPLIT_AT = 9, MERGE_AT = 19;   // the hero's resharding cycle, s

export function createNet(o: NetOpts) {
  const paper = o.tone === "paper";
  const ink = (a: number) => (paper ? `rgba(38,38,38,${a})` : `rgba(245,244,241,${a})`);
  const GREEN = "#00dc8d", GREEN_T = paper ? "#00a86b" : "#00dc8d";
  const finalFill = paper ? "#ffffff" : "rgba(245,244,241,0.07)";
  const ground = paper ? "#f5f4f1" : "#262626";
  let dotsCache: HTMLCanvasElement | null = null, dotsKey = "";

  const setFont = (c: CanvasRenderingContext2D, px: number, mono = true) => {
    c.font = `${px}px ${mono ? o.mono : o.sans}`;
    if ("letterSpacing" in c) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = mono ? "0.06em" : "0px";
  };

  /** the paper's dots (the homepage's dotted ground), drawn once per size */
  const dotsLayer = (w: number, h: number) => {
    const key = `${w}x${h}`;
    if (dotsCache && dotsKey === key) return dotsCache;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = document.createElement("canvas"); cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const c = cv.getContext("2d"); if (!c) return null;
    c.scale(dpr, dpr); c.fillStyle = ink(0.13);
    const s = 22;
    for (let y = s / 2; y < h; y += s) for (let x = s / 2; x < w; x += s) { c.beginPath(); c.arc(x, y, 0.8, 0, Math.PI * 2); c.fill(); }
    dotsCache = cv; dotsKey = key; return cv;
  };

  const reshard = (T: number, p: NetParams, visSecs: number): Reshard => {
    if (o.reshard === "cycle") {
      const tau = ((T % CYCLE) + CYCLE) % CYCLE, base = T - tau;
      const split = tau >= SPLIT_AT ? base + SPLIT_AT : null, merge = tau >= MERGE_AT ? base + MERGE_AT : null;
      const up = smooth((tau - SPLIT_AT) / 0.9), down = 1 - smooth((tau - MERGE_AT - visSecs) / 0.9);
      return { meter: tau < SPLIT_AT ? tau / SPLIT_AT : 0, meterA: 1 - smooth((tau - SPLIT_AT) / 0.6) + smooth((tau - MERGE_AT - visSecs) / 2), split, merge, cw: split === null ? 0 : Math.min(up, down) };
    }
    if (o.reshard === "scrub") {
      const u = p.reshardU;
      return { meter: clamp01(u / 0.5), meterA: 1 - smooth((u - 0.5) / 0.08), split: u >= 0.5 ? T - ((u - 0.5) / 0.5) * 5 : null, merge: null, cw: smooth((u - 0.5) / 0.1) };
    }
    return { meter: 0, meterA: 0, split: null, merge: null, cw: 0 };
  };

  return function draw(c: CanvasRenderingContext2D, w: number, h: number, T: number, p: NetParams) {
    const narrow = w < 640;
    const padL = o.labels ? (narrow ? 46 : 70) : 14, padR = 14;
    const top = o.ruler ? 34 : 12, bottom = h - 12;
    const bw = Math.max(narrow ? 13 : 18, Math.min(40, w * 0.026)), gap = Math.max(2, Math.min(5, bw * 0.14)), slot = bw + gap, speed = slot / BT;
    const nowX = padL + (w - padL - padR) * (o.now ?? 0.7), finX = nowX - FIN * speed, xEnd = w - padR, vt = speed * 1.5;
    const visSecs = (nowX - padL) / speed + BT;
    const rs = reshard(T, p, visSecs);

    /* the lanes: shards (fading in one by one), the new one beside its parent, the private shard last */
    const parent = Math.min(3, o.shards - 1);
    const lanes: Lane[] = [];
    for (let i = 0; i < o.shards; i++) {
      const lw = clamp01(p.shardsF - i);
      if (lw > 0) lanes.push({ kind: "shard", seed: i + 1, label: `S${i}`, w: lw, y: 0, h: 0 });
      if (i === parent && rs.cw > 0) lanes.push({ kind: "child", seed: 101, label: `S${o.shards}`, w: rs.cw * lw, y: 0, h: 0 });
    }
    if (p.priv > 0) lanes.push({ kind: "private", seed: 202, label: narrow ? "PRIV" : "PRIVATE", w: p.priv, y: 0, h: 0 });
    // the band (if any) and the lanes, as one block centred between the ruler and the foot
    const bandH = p.consensus * Math.max(44, Math.min(96, (bottom - top) * 0.2)), bandGap = 22 * p.consensus;
    const sumW = lanes.reduce((s, l) => s + l.w, 0) || 1;
    const laneH = Math.min(o.maxLane ?? 46, (bottom - top - bandH - bandGap) / sumW);
    const bTop = top + (bottom - top - bandH - bandGap - laneH * sumW) / 2;
    const lTop = bTop + bandH + bandGap;
    let y = lTop;
    lanes.forEach((l) => { l.h = laneH * l.w; l.y = y + l.h / 2; y += l.h; });
    const ch = Math.max(5, Math.min(18, laneH * 0.5));
    const cols = Math.max(1, Math.floor((bw - 4) / 5)), rows = ch >= 12 ? 2 : 1, cap = cols * rows;

    const kNow = Math.floor(T / BT), kMin = Math.floor((T - visSecs) / BT) - 1;
    const inWin = (l: Lane, t: number) => l.kind !== "child" || (rs.split !== null && t >= rs.split && (rs.merge === null || t < rs.merge));
    const count = (l: Lane, k: number) => {
      let load = 0.35 + 0.55 * hash(l.seed, 999);
      if (l.kind === "shard" && l.seed === parent + 1) load = rs.split !== null && inWin({ ...l, kind: "child" }, k * BT) ? load * 0.55 : Math.min(1, load + 0.5 * rs.meter);
      return Math.floor(hash(l.seed, k) * (cap + 1) * load);
    };
    const laneAlpha = (l: Lane) => (1 - 0.72 * p.dim) * (l.kind === "private" ? 1 : 1 - 0.62 * p.privHi);

    c.save();
    if (p.reveal < 1) { c.beginPath(); c.rect(0, 0, w * p.reveal, h); c.clip(); }

    /* the paper's dots */
    if (o.dots) { const d = dotsLayer(w, h); if (d) c.drawImage(d, 0, 0, w, h); }

    /* the consensus band: one header per block, chained; state witnesses rise into it from each new chunk */
    if (p.consensus > 0.01) {
      const bm = bTop + bandH / 2;
      c.globalAlpha = p.consensus;
      c.strokeStyle = ink(0.16); c.lineWidth = 1;
      c.strokeRect(padL + 0.5, bTop + 0.5, xEnd - padL - 1, bandH - 1);
      c.strokeStyle = ink(0.4); c.beginPath(); c.moveTo(padL, bm); c.lineTo(nowX, bm); c.stroke();
      for (let k = kMin; k <= kNow; k++) {
        const age = T - k * BT; if (age < 0.45) continue;
        const xc = nowX - age * speed - bw / 2; if (xc < padL + 4) continue;
        const s = 7 * smooth((age - 0.45) / 0.15);
        c.fillStyle = age >= FIN ? (paper ? "#fff" : ink(0.9)) : ground; c.strokeStyle = ink(0.85);
        c.fillRect(xc - s / 2, bm - s / 2, s, s); c.strokeRect(xc - s / 2 + 0.5, bm - s / 2 + 0.5, s - 1, s - 1);
      }
      // witnesses for the newest chunk of every lane
      const age = T - kNow * BT, k = smooth((age - 0.05) / 0.38);
      if (age > 0.05 && age < 0.46) {
        const xc = nowX - age * speed - bw / 2;
        c.fillStyle = ink(0.95);
        lanes.forEach((l) => {
          if (l.w < 0.5 || !inWin(l, kNow * BT)) return;
          const wy = lerp(l.y - ch / 2, bm, k);
          c.beginPath(); c.moveTo(xc, wy - 3.4); c.lineTo(xc + 3.4, wy); c.lineTo(xc, wy + 3.4); c.lineTo(xc - 3.4, wy); c.closePath(); c.fill();
        });
      }
      if (o.labels) {
        setFont(c, 10); c.fillStyle = ink(0.6); c.textAlign = "right"; c.textBaseline = "middle";
        c.fillText(narrow ? "CONS." : "CONSENSUS", padL - 10, bm);
        c.textAlign = "left";
        c.fillText("BLOCK HEADERS", padL + 10, bTop + 12);
        c.fillStyle = ink(0.8); c.fillText("STATE WITNESS ↑", Math.min(nowX + 12, xEnd - 110), lTop - bandGap / 2);
      }
      c.globalAlpha = 1;
    }

    /* lane lines (the new lane's forks off its parent where it split, and back in where it merged) */
    c.lineWidth = 1;
    lanes.forEach((l) => {
      const a = laneAlpha(l) * Math.min(1, l.w * 1.4);
      if (l.kind !== "child") {
        c.strokeStyle = ink(0.13 * a); c.beginPath(); c.moveTo(padL, l.y); c.lineTo(xEnd, l.y); c.stroke();
        return;
      }
      const par = lanes.find((q) => q.kind === "shard" && q.seed === parent + 1); if (!par || rs.split === null) return;
      const sx = nowX - (T - rs.split) * speed, mx = rs.merge === null ? xEnd : nowX - (T - rs.merge) * speed, k = slot * 0.7;
      if (mx < padL) return;
      c.strokeStyle = ink(0.3 * a); c.beginPath();
      if (sx > padL) { c.moveTo(sx - k, par.y); c.bezierCurveTo(sx - k / 2, par.y, sx - k / 2, l.y, sx, l.y); } else c.moveTo(padL, l.y);
      if (rs.merge === null) c.lineTo(xEnd, l.y); else { c.lineTo(mx, l.y); c.bezierCurveTo(mx + k / 2, l.y, mx + k / 2, par.y, mx + k, par.y); }
      c.stroke();
      // the split's note, for a few seconds after it
      const since = T - rs.split;
      if (o.labels && since < 7 && sx > padL + 4) {
        setFont(c, 10); c.textAlign = "left"; c.textBaseline = "middle";
        c.fillStyle = ink(0.85 * a * (1 - smooth((since - 5) / 2)));
        c.fillText(narrow ? "SPLIT" : "SPLIT · NO VOTE", sx + 6, l.y + Math.max(10, l.h / 2 + 2));
      }
      if (o.labels && rs.merge !== null && T - rs.merge < 6 && mx > padL + 4) {
        setFont(c, 10); c.textAlign = "right"; c.textBaseline = "middle";
        c.fillStyle = ink(0.7 * a * (1 - smooth((T - rs.merge - 4) / 2)));
        c.fillText("MERGE", mx - 6, l.y + Math.max(10, l.h / 2 + 2));
      }
    });

    /* the now line and the final line (green: from here on, final) */
    const rTop = o.ruler ? top - 14 : top;
    c.strokeStyle = ink(0.42); c.beginPath(); c.moveTo(nowX + 0.5, rTop); c.lineTo(nowX + 0.5, bottom); c.stroke();
    c.strokeStyle = GREEN; c.globalAlpha = paper ? 0.9 : 0.8; c.beginPath(); c.moveTo(finX + 0.5, rTop); c.lineTo(finX + 0.5, bottom); c.stroke(); c.globalAlpha = 1;

    /* the chunks: pending (dashed) until final, then solid; the private shard's shielded; each carries its transactions as dots */
    const dotPath = new Path2D(), privOpen = new Path2D();
    let globalsK = -1;
    lanes.forEach((l) => {
      const a = laneAlpha(l) * Math.min(1, l.w * 1.3);
      if (a < 0.02) return;
      const lch = ch * Math.min(1, l.w * 1.2);
      for (let k = kMin; k <= kNow; k++) {
        const tb = k * BT, age = T - tb;
        if (age < 0 || !inWin(l, tb)) continue;
        const xr = nowX - age * speed, xl = xr - bw;
        if (xr < padL) continue;
        const born = smooth(age / 0.2), x0 = Math.max(xl, padL), cw = xr - x0;
        const edge = clamp01((xl - padL) / 36 + 0.35);
        // a chunk of the new lane, in scrub mode, fades out at the fork (older than the split)
        const fork = l.kind === "child" && rs.split !== null ? clamp01((tb - rs.split) / 0.3) : 1;
        const ca = a * edge * fork;
        const hh = lch * born, y0 = l.y - hh / 2;
        const fin = age >= FIN;
        c.globalAlpha = ca;
        if (l.kind === "private") {
          c.fillStyle = ink(fin ? 0.88 : 0.5); c.fillRect(x0, y0, cw, hh);
          if (p.lens > 0) privOpen.rect(x0, y0, cw, hh);
        } else {
          c.fillStyle = fin ? finalFill : ground; c.fillRect(x0, y0, cw, hh);
          c.strokeStyle = ink(fin ? 0.82 : 0.5);
          if (!fin) c.setLineDash([2, 2]);
          c.strokeRect(x0 + 0.5, y0 + 0.5, cw - 1, hh - 1);
          c.setLineDash([]);
          if (born > 0.9 && ca > 0.25) {
            const n = count(l, k);
            for (let i = 0; i < n; i++) {
              const dx = xl + 3 + (i % cols) * 5, dy = l.y - (rows - 1) * 2.5 + Math.floor(i / cols) * 5 - 0.8;
              if (dx > padL + 1) dotPath.rect(dx, dy, 1.6, 1.6);
            }
          }
        }
        if (o.globals && k % 9 === 4) globalsK = Math.max(globalsK, k);
      }
    });
    /* the chunk forming at the now line: the transactions that have landed since the last one */
    const formW = (T - kNow * BT) * speed - gap;
    if (formW > 2) lanes.forEach((l) => {
      const a = laneAlpha(l) * Math.min(1, l.w * 1.3);
      if (a < 0.05 || !inWin(l, T)) return;
      const lch = ch * Math.min(1, l.w * 1.2), x0 = nowX - formW;
      c.globalAlpha = a * 0.55; c.strokeStyle = ink(0.45); c.setLineDash([1.5, 2.5]);
      c.strokeRect(x0 + 0.5, l.y - lch / 2 + 0.5, formW - 1, lch - 1); c.setLineDash([]);
      if (l.kind === "private") return;
      const k = kNow + 1, n = count(l, k);
      let j = 0;
      for (let i = 0; i < n; i++) {
        if ((k - 1) * BT + hash(l.seed, k, i + 7) * BT > T) continue;
        const dx = nowX - 4 - (j % cols) * 5, dy = l.y - (rows - 1) * 2.5 + Math.floor(j / cols) * 5 - 0.8; j++;
        if (dx > x0 + 1) dotPath.rect(dx, dy, 1.6, 1.6);
      }
    });
    c.globalAlpha = 1;
    c.fillStyle = ink(0.62 * (1 - 0.72 * p.dim) * (1 - 0.62 * p.privHi)); c.fill(dotPath);

    /* Speed's global contracts: deployed once, on every shard at the same block */
    if (o.globals) {
      for (let k = kMin; k <= kNow; k++) {
        if (k % 9 !== 4) continue;
        const age = T - k * BT, xc = nowX - age * speed - bw / 2;
        if (xc < padL + 6 || age < 0) continue;
        const a = clamp01((xc - padL) / 60) * smooth(age / 0.3);
        c.globalAlpha = a; c.strokeStyle = ink(0.5); c.beginPath(); c.moveTo(xc + 0.5, lanes[0].y); c.lineTo(xc + 0.5, lanes[lanes.length - 1].y); c.stroke();
        c.fillStyle = ink(0.95);
        lanes.forEach((l) => { c.beginPath(); c.moveTo(xc, l.y - 5); c.lineTo(xc + 5, l.y); c.lineTo(xc, l.y + 5); c.lineTo(xc - 5, l.y); c.closePath(); c.fill(); });
        if (k === globalsK) { setFont(c, 10); c.textAlign = "center"; c.textBaseline = "bottom"; c.fillStyle = ink(0.7); c.fillText("GLOBAL CONTRACT", xc, lanes[0].y - 10); }
      }
      c.globalAlpha = 1;
    }

    /* the incoming side: each transaction travels in to the now line and lands in the next chunk */
    const txs = new Path2D(), hollow: [number, number][] = [];
    const ahead = Math.ceil((xEnd - nowX) / vt / BT) + 1;
    lanes.forEach((l) => {
      const a = laneAlpha(l) * Math.min(1, l.w * 1.3);
      if (a < 0.05) return;
      for (let k = kNow + 1; k <= kNow + ahead; k++) {
        const n = count(l, k);
        for (let i = 0; i < n; i++) {
          const at = (k - 1) * BT + hash(l.seed, k, i + 7) * BT;
          if (at <= T || !inWin(l, at)) continue;
          const x = nowX + (at - T) * vt; if (x > xEnd - 2) continue;
          const yy = l.y + (hash(l.seed, k, i + 31) - 0.5) * Math.min(l.h, laneH) * 0.42;
          if (l.kind === "private") hollow.push([x, yy]); else { txs.moveTo(x + 1.6, yy); txs.arc(x, yy, 1.6, 0, Math.PI * 2); }
        }
      }
    });
    c.fillStyle = ink(0.55 * (1 - 0.72 * p.dim) * (1 - 0.62 * p.privHi)); c.fill(txs);
    if (hollow.length) { c.strokeStyle = ink(0.75 * (1 - 0.72 * p.dim)); c.beginPath(); hollow.forEach(([x, yy]) => { c.moveTo(x + 2, yy); c.arc(x, yy, 2, 0, Math.PI * 2); }); c.stroke(); }

    /* the selective-disclosure lens: one window on the private shard, its chunks' contents shown inside it */
    const pl = lanes.find((l) => l.kind === "private");
    if (pl && p.lens > 0.01) {
      const lw = slot * 1.6, lx = finX - slot * 2.2 - lw / 2, lh = Math.max(pl.h, ch + 10) * 1.15, ly = pl.y - lh / 2;
      c.save();
      c.globalAlpha = p.lens;
      c.beginPath(); c.roundRect(lx, ly, lw * p.lens, lh, 6); c.clip();
      c.fillStyle = ground; c.fill(privOpen);
      c.strokeStyle = GREEN_T; c.lineWidth = 1; c.stroke(privOpen);
      c.fillStyle = GREEN_T;
      for (let k = kMin; k <= kNow; k++) {
        const age = T - k * BT, xl = nowX - age * speed - bw; if (xl + bw < lx || xl > lx + lw) continue;
        const n = count(pl, k);
        for (let i = 0; i < n; i++) c.fillRect(xl + 3 + (i % cols) * 5, pl.y - (rows - 1) * 2.5 + Math.floor(i / cols) * 5 - 0.8, 1.8, 1.8);
      }
      c.restore();
      c.globalAlpha = p.lens; c.strokeStyle = GREEN; c.lineWidth = 1.5;
      c.beginPath(); c.roundRect(lx, ly, lw, lh, 6); c.stroke(); c.lineWidth = 1;
      if (o.labels) { setFont(c, 10); c.textAlign = "center"; c.textBaseline = "bottom"; c.fillStyle = GREEN_T; c.fillText("SELECTIVE DISCLOSURE", lx + lw / 2, ly - 6); }
      c.globalAlpha = 1;
    }

    /* the ruler: one tick per block, the green rule under every final block (the homepage's proof-strip rule), and the two lines' names */
    if (o.ruler) {
      const ry = top - 14;
      c.strokeStyle = ink(0.16); c.beginPath(); c.moveTo(padL, ry + 0.5); c.lineTo(xEnd, ry + 0.5); c.stroke();
      c.strokeStyle = ink(0.42); c.beginPath();
      for (let k = kMin; k <= kNow; k++) { const xc = nowX - (T - k * BT) * speed - bw / 2; if (xc > padL) { c.moveTo(xc + 0.5, ry - 3); c.lineTo(xc + 0.5, ry + 0.5); } }
      c.stroke();
      c.fillStyle = GREEN; c.fillRect(padL, ry - 0.5, Math.max(0, finX - padL), 2);
      setFont(c, 10); c.textBaseline = "bottom";
      c.fillStyle = GREEN_T; c.textAlign = "right"; c.fillText(narrow ? "FINAL" : "FINAL · 1.2 S", finX - 6, ry - 5);
      c.fillStyle = ink(0.75); c.textAlign = "left"; c.fillText("NOW", nowX + 6, ry - 5);
      if (!narrow) { c.fillStyle = ink(0.5); c.textAlign = "right"; c.fillText("INCOMING", xEnd, ry - 5); }
    }

    /* lane names, and the filling lane's meter under its name */
    if (o.labels) {
      setFont(c, 10); c.textAlign = "right"; c.textBaseline = "middle";
      lanes.forEach((l) => {
        const a = laneAlpha(l) * clamp01(l.w * 1.6 - 0.4); if (a < 0.03) return;
        c.fillStyle = l.kind === "private" ? ink(0.85 * a) : ink(0.55 * a);
        c.fillText(l.label, padL - 12, l.y);
        if (l.kind === "shard" && l.seed === parent + 1 && rs.meterA > 0.02 && o.reshard !== "off") {
          const mw = narrow ? 22 : 28, mx = padL - 12 - mw, my = l.y + 8;
          c.globalAlpha = a * clamp01(rs.meterA);
          c.fillStyle = ink(0.16); c.fillRect(mx, my, mw, 2);
          c.fillStyle = rs.meter > 0.85 ? GREEN_T : ink(0.8); c.fillRect(mx, my, mw * rs.meter, 2);
          c.globalAlpha = 1;
        }
      });
    }

    /* the account (quantum): one transaction rotates its key to a post-quantum scheme */
    if (p.account > 0.01) {
      const ax = lerp(nowX, xEnd, narrow ? 0.62 : 0.55), first = lanes.find((l) => l.kind === "shard") ?? lanes[0];
      const ay = first ? Math.min(bottom - 40, Math.max(top + 30, (lTop + bottom) / 2)) : h / 2;
      c.globalAlpha = p.account;
      c.fillStyle = ground; c.strokeStyle = ink(0.9); c.lineWidth = 1.2;
      c.beginPath(); c.arc(ax, ay, 15, 0, Math.PI * 2); c.fill(); c.stroke(); c.lineWidth = 1;
      c.beginPath(); c.arc(ax, ay - 4, 4.5, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(ax, ay + 11, 8, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      setFont(c, 12, false); c.textAlign = "center"; c.textBaseline = "top"; c.fillStyle = ink(0.9);
      c.fillText("alice.near", ax, ay + 22);
      // the key: the old scheme, then (once the rotation lands) ML-DSA in green
      const sw = smooth((p.rot - 0.5) / 0.14);
      setFont(c, 10); c.textBaseline = "middle";
      const kOld = "KEY · ED25519", kNew = "KEY · ML-DSA (FIPS-204)";
      const by = ay + 50, tw = (s: string) => c.measureText(s).width + 20;
      const bwd = lerp(tw(kOld), tw(kNew), sw);
      c.strokeStyle = sw > 0.5 ? GREEN : ink(0.6); c.fillStyle = ground; c.lineWidth = sw > 0.5 ? 1.4 : 1;
      c.beginPath(); c.roundRect(ax - bwd / 2, by - 11, bwd, 22, 11); c.fill(); c.stroke(); c.lineWidth = 1;
      c.globalAlpha = p.account * (1 - sw); c.fillStyle = ink(0.8); c.fillText(kOld, ax, by);
      c.globalAlpha = p.account * sw; c.fillStyle = GREEN_T; c.fillText(kNew, ax, by);
      // the rotation itself: one transaction, out to the now line
      const tk = clamp01((p.rot - 0.12) / 0.36);
      if (tk > 0 && tk < 1 && first) {
        const tx = lerp(ax - 18, nowX + 2, smooth(tk)), ty = lerp(ay, first.y, smooth(tk));
        c.globalAlpha = p.account; c.fillStyle = GREEN; c.strokeStyle = ink(0.9);
        c.beginPath(); c.arc(tx, ty, 4, 0, Math.PI * 2); c.fill(); c.stroke();
      }
      c.globalAlpha = p.account * clamp01(p.rot * 6) * (1 - smooth((p.rot - 0.85) / 0.15) * 0.4);
      c.fillStyle = ink(0.7); c.textAlign = "center"; c.textBaseline = "bottom";
      c.fillText("ONE KEY ROTATION", ax, ay - 24);
      c.globalAlpha = 1;
    }

    c.restore();
    return { nowX, finX, padL, speed };
  };
}
