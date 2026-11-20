// Protocol C · Chain Signatures, as a flow from left to right (no words). One account asks; a column of eight signers answers, and five of them (a
// threshold) light and send their part to one point, where a single green seal forms; the seal goes straight to another chain and lands on top of
// it as that chain's own next block, in that chain's own shape (squares, diamonds, bars: three different chains). No box in between: no bridge.
// A cycle every 3.6 s, to each of the three chains in turn.
import { clamp01, hash, lerp, smooth, rgba, fit, INK, GREEN } from "./stage";

const DW = 700, DH = 420, TAU = Math.PI * 2, CYC = 3.6;
const I = (a: number) => rgba(INK, a), G = (a: number) => rgba(GREEN, a);
const AX = 70, AY = 210, SX = 236, SEALX = 370, SEALY = 210, BASE = 352;
const CHAINS = [{ x: 480, sp: 34 }, { x: 574, sp: 34 }, { x: 664, sp: 20 }];
const SIGN = Array.from({ length: 8 }, (_, i) => 96 + i * 33);
const PAPER0 = "#f5f4f1";

/** a chain's block in its own shape */
function block(c: CanvasRenderingContext2D, k: number, x: number, y: number) {
  c.beginPath();
  if (k === 0) c.rect(x - 13, y - 13, 26, 26);
  else if (k === 1) { c.moveTo(x, y - 16); c.lineTo(x + 14, y); c.lineTo(x, y + 16); c.lineTo(x - 14, y); c.closePath(); }
  else { c.moveTo(x - 14, y + 6); c.lineTo(x - 8, y - 6); c.lineTo(x + 16, y - 6); c.lineTo(x + 10, y + 6); c.closePath(); }
}

export function createChains() {
  return (c: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const s = fit(c, w, h, DW, DH), hair = 1 / s;
    const cyc = Math.floor(t / CYC), u = (t % CYC) / CYC, target = cyc % 3;
    const chosen = new Set<number>();
    for (let q = 0; chosen.size < 5 && q < 40; q++) chosen.add(Math.floor(hash(cyc, q, 9) * 8));

    // the chains: each a stack of its own blocks (six shown), the newest on top. A signature lands as the next block: the stack settles down by one,
    // the bottom block lets go, and the new one stays green until the next cycle is under way.
    const SHOW = 6;
    CHAINS.forEach((ch, k) => {
      const now = target === k && u > 0.86;
      const n = 4 + (cyc - k + 2 >= 0 ? Math.floor((cyc - k + 2) / 3) : 0) + (now ? 1 : 0);   // blocks on this chain so far
      const settle = now ? smooth((u - 0.86) / 0.12) : 1;
      const green = now ? 1 : k === (cyc + 2) % 3 ? 1 - smooth(u / 0.4) : 0;
      c.lineWidth = hair; c.strokeStyle = I(0.3); c.beginPath(); c.moveTo(ch.x - 26, BASE + 22); c.lineTo(ch.x + 26, BASE + 22); c.stroke();
      const lo = Math.max(0, n - SHOW - 1);
      for (let b = lo; b < n; b++) {
        const lvl = b - Math.max(0, n - SHOW) + (n > SHOW ? 1 - settle : 0);
        if (lvl < -0.99) continue;
        const a = clamp01(lvl + 1) * (b === n - 1 ? (now ? settle : 1) : 1);
        const fresh = b === n - 1 && green > 0;
        c.fillStyle = fresh ? G(0.9 * green * a) : PAPER0; c.strokeStyle = fresh ? G(a) : I(0.62 * a);
        block(c, k, ch.x, BASE - lvl * ch.sp); c.fill(); c.stroke();
      }
    });

    // the account: a ring with a green heart
    c.lineWidth = 1.3 * hair; c.strokeStyle = I(0.85); c.fillStyle = PAPER0;
    c.beginPath(); c.arc(AX, AY, 24, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = G(1); c.beginPath(); c.arc(AX, AY, 6, 0, TAU); c.fill();

    // its request, out to the signers
    const ask = smooth(u / 0.16);
    c.lineWidth = hair;
    SIGN.forEach((y, i) => {
      const lit = chosen.has(i), on = lit ? smooth((u - 0.16 - i * 0.008) / 0.08) : 0;
      c.strokeStyle = I(0.1 + 0.1 * ask); c.beginPath(); c.moveTo(AX + 24, AY); c.lineTo(lerp(AX + 24, SX - 9, ask), lerp(AY, y, ask)); c.stroke();
      // the signer
      c.strokeStyle = I(lit ? 0.85 : 0.35); c.fillStyle = on > 0 ? I(0.85 * on) : PAPER0;
      c.beginPath(); c.rect(SX - 8, y - 8, 16, 16); c.fill(); c.stroke();
      // its part, on its way to the one point
      if (lit) {
        const go = smooth((u - 0.27) / 0.2);
        if (go > 0) {
          c.strokeStyle = I(0.55 * (1 - smooth((u - 0.6) / 0.15))); c.beginPath(); c.moveTo(SX + 8, y); c.lineTo(lerp(SX + 8, SEALX, go), lerp(y, SEALY, go)); c.stroke();
          if (go < 1) { c.fillStyle = I(0.9); c.beginPath(); c.arc(lerp(SX + 8, SEALX, go), lerp(y, SEALY, go), 2.6, 0, TAU); c.fill(); }
        }
      }
    });

    // the seal: forms at the point, then goes straight to its chain and becomes the chain's next block
    const form = smooth((u - 0.46) / 0.1), fly = smooth((u - 0.58) / 0.28), gone = u > 0.86;
    if (form > 0 && !gone) {
      const ch = CHAINS[target], tx = ch.x;
      const nNow = 4 + (cyc - target + 2 >= 0 ? Math.floor((cyc - target + 2) / 3) : 0);
      const toY = BASE - Math.min(SHOW, nNow) * ch.sp;   // just above its newest block
      const x = lerp(SEALX, tx, fly), y = lerp(SEALY, toY, fly) - Math.sin(Math.PI * fly) * 46;
      // its path, faint
      if (fly > 0) {
        c.strokeStyle = G(0.4); c.lineWidth = hair; c.setLineDash([2, 4]); c.beginPath();
        for (let q = 0; q <= 30 * fly; q++) { const v = q / 30; const px = lerp(SEALX, tx, v), py = lerp(SEALY, toY, v) - Math.sin(Math.PI * v) * 46; if (q === 0) c.moveTo(px, py); else c.lineTo(px, py); }
        c.stroke(); c.setLineDash([]);
      }
      c.fillStyle = G(form); c.beginPath(); c.arc(x, y, 7 * form, 0, TAU); c.fill();
      c.strokeStyle = G(0.7 * form * (1 - fly)); c.lineWidth = 1.2 * hair; c.beginPath(); c.arc(x, y, 14 * form, 0, TAU); c.stroke();
    }
  };
}
