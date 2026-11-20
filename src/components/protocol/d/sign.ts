// Protocol D · Chain Signatures: one account, native transactions on other chains, nothing in between. On the left, a NEAR account (an ink disc)
// in its ring of signers; on the right, three other chains, each a tower of its own kind of block (squares, hexagons, diamonds) growing at its own
// pace. Each time, a threshold of the signers lights (five of seven); a green seal leaves the account and flies straight to one chain, turning into
// that chain's own shape on the way, and lands as its newest block: a native transaction, no bridge, no wrapped copy. A function of time; no text.
import { clamp01, lerp, smooth } from "./stage";

const INK = "38,38,38", GREEN = "0,220,141", GREEN_D = "0,168,107";
const SIGN_EVERY = 3, FLY = 1.1, LIGHT = 0.9;   // a signature every 3 s: the signers light over 0.9 s, the seal flies 1.1 s
const PERIOD = [2.2, 1.3, 0.8];                  // each chain's own block time (illustrative)
const SHOW = 7;                                  // blocks shown per tower

function shape(c: CanvasRenderingContext2D, kind: number, x: number, y: number, r: number) {
  c.beginPath();
  if (kind === 0) c.rect(x - r * 0.86, y - r * 0.86, r * 1.72, r * 1.72);
  else if (kind === 1) { for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.closePath(); }
  else if (kind === 2) { c.moveTo(x, y - r * 1.05); c.lineTo(x + r * 1.05, y); c.lineTo(x, y + r * 1.05); c.lineTo(x - r * 1.05, y); c.closePath(); }
  else c.arc(x, y, r * 0.9, 0, Math.PI * 2);
}

/** the arrivals on chain k up to time t: its own blocks, and the seals that landed on it */
function arrivals(k: number, t: number) {
  const out: { at: number; seal: boolean }[] = [];
  const p = PERIOD[k], from = t - p * (SHOW + 3);
  for (let n = Math.max(0, Math.floor(from / p)); n * p <= t; n++) out.push({ at: n * p + k * 0.37, seal: false });
  for (let j = Math.max(0, Math.floor((from - LIGHT - FLY) / SIGN_EVERY)); j * SIGN_EVERY + LIGHT + FLY <= t + 0.0001; j++) if (j % 3 === k) out.push({ at: j * SIGN_EVERY + LIGHT + FLY, seal: true });
  return out.filter((a) => a.at <= t).sort((a, b) => a.at - b.at);
}

export function createSign() {
  return (c: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const narrow = w < 520, s = Math.max(0.7, Math.min(1.15, w / 640));
    const ax = w * (narrow ? 0.17 : 0.16), ay = h * 0.52, R = 50 * s, ring = 7, need = 5;
    const tx = narrow ? [0.5, 0.7, 0.9] : [0.56, 0.73, 0.9], base = h * 0.9, br = 11 * s, pitch = 30 * s;

    // the paper's dots
    c.fillStyle = `rgba(${INK},0.12)`;
    for (let y = 11 * s; y < h; y += 22 * s) for (let x = 11 * s; x < w; x += 22 * s) c.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);

    // this round's signature: which chain, how far the signers have lit, the seal's flight
    const j = Math.floor(t / SIGN_EVERY), u = t - j * SIGN_EVERY, target = ((j % 3) + 3) % 3;
    const lit = Math.floor(clamp01(u / LIGHT) * need + 0.0001), fly = clamp01((u - LIGHT) / FLY);

    // the towers: each chain's blocks, newest on top, the rest settling down a step at each arrival
    tx.forEach((fx, k) => {
      const x = w * fx, list = arrivals(k, t);
      // the ground line of each chain
      c.beginPath(); c.moveTo(x - 22 * s, base + br + 8 * s); c.lineTo(x + 22 * s, base + br + 8 * s); c.strokeStyle = `rgba(${INK},0.35)`; c.lineWidth = 1; c.stroke();
      const n = list.length;
      list.forEach((a, i) => {
        // how many arrived after this one, eased: its place in the tower from the top
        let r = 0;
        for (let m = i + 1; m < n; m++) r += smooth(clamp01((t - list[m].at) / 0.35));
        const y = base - (SHOW - 1) * pitch + r * pitch;
        if (y > base + 0.5) return;
        const grow = smooth(clamp01((t - a.at) / 0.3)), fade = clamp01((base - y) / pitch + 1) * clamp01(1 - (r - (SHOW - 1.5)));
        c.globalAlpha = Math.max(0, Math.min(1, fade));
        shape(c, k, x, y, br * (0.4 + 0.6 * grow));
        c.fillStyle = a.seal ? `rgba(${GREEN},0.9)` : "#fff"; c.fill();
        c.strokeStyle = a.seal ? `rgba(${GREEN_D},1)` : `rgba(${INK},0.85)`; c.lineWidth = 1.1; c.stroke();
        c.globalAlpha = 1;
      });
      // the faint spine of the tower
      c.beginPath(); c.moveTo(x, base - (SHOW - 1) * pitch - br); c.lineTo(x, base + br); c.strokeStyle = `rgba(${INK},0.1)`; c.stroke();
    });

    // the account and its ring of signers (a threshold of them lights for each signature)
    c.beginPath(); c.arc(ax, ay, R, 0, Math.PI * 2); c.strokeStyle = `rgba(${INK},0.18)`; c.lineWidth = 1; c.stroke();
    for (let i = 0; i < ring; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / ring, x = ax + Math.cos(a) * R, y = ay + Math.sin(a) * R, on = i < lit && u < LIGHT + FLY + 0.4;
      if (on) { c.beginPath(); c.moveTo(ax, ay); c.lineTo(x, y); c.strokeStyle = `rgba(${GREEN},0.45)`; c.lineWidth = 1; c.stroke(); }
      c.beginPath(); c.arc(x, y, 6 * s, 0, Math.PI * 2); c.fillStyle = on ? `rgba(${GREEN},1)` : "#fff"; c.fill();
      c.strokeStyle = on ? `rgba(${GREEN_D},1)` : `rgba(${INK},0.8)`; c.lineWidth = 1; c.stroke();
    }
    c.beginPath(); c.arc(ax, ay, 17 * s, 0, Math.PI * 2); c.fillStyle = `rgba(${INK},1)`; c.fill();
    c.beginPath(); c.arc(ax, ay, 5 * s, 0, Math.PI * 2); c.fillStyle = "#fff"; c.fill();

    // the seal: straight from the account to the chain, an arc over the gap, becoming that chain's own shape as it goes
    if (fly > 0 && fly < 1) {
      const x0 = ax + 20 * s, y0 = ay, x1 = w * tx[target], y1 = base - (SHOW - 1) * pitch;
      const e = smooth(fly), cx = lerp(x0, x1, 0.5), cy = Math.min(y0, y1) - h * 0.18;
      const m = 1 - e, px = m * m * x0 + 2 * m * e * cx + e * e * x1, py = m * m * y0 + 2 * m * e * cy + e * e * y1;
      // its path, drawn behind it
      c.beginPath();
      for (let k = 0; k <= 24; k++) { const q = (k / 24) * e, mm = 1 - q; const qx = mm * mm * x0 + 2 * mm * q * cx + q * q * x1, qy = mm * mm * y0 + 2 * mm * q * cy + q * q * y1; if (k) c.lineTo(qx, qy); else c.moveTo(qx, qy); }
      c.strokeStyle = `rgba(${GREEN},0.55)`; c.lineWidth = 1.2; c.stroke();
      // the shape: the account's round seal crossfading into the target chain's block
      const r = br * 0.95;
      c.globalAlpha = 1 - smooth(clamp01((fly - 0.25) / 0.5));
      shape(c, 3, px, py, r); c.fillStyle = `rgba(${GREEN},1)`; c.fill();
      c.globalAlpha = smooth(clamp01((fly - 0.25) / 0.5));
      shape(c, target, px, py, r); c.fillStyle = `rgba(${GREEN},0.95)`; c.fill(); c.strokeStyle = `rgba(${GREEN_D},1)`; c.lineWidth = 1.1; c.stroke();
      c.globalAlpha = 1;
    }
  };
}
