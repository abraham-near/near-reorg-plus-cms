// Protocol C · Speed. Scale. Access.: a clock face of the network's rhythm (no words). A hand ticks once every 600 ms and leaves a block on the rim;
// each block is open while it is fresh and turns green two ticks later (final at 1.2 s), so a green trail always follows the hand with two open
// blocks at its tip. Around the dial, the shards; every few seconds a contract is set down once at the centre, one ring goes out, and the same contract
// appears in every shard at the same instant (global contracts: deploy once, run network-wide).
import { clamp01, smooth, rgba, fit, INK, GREEN } from "./stage";

const DW = 640, DH = 420, CX = 320, CY = 210, R = 118, OUT = 176, TICKS = 24, TAU = Math.PI * 2;
const I = (a: number) => rgba(INK, a), G = (a: number) => rgba(GREEN, a);
const angle = (m: number) => -Math.PI / 2 + (m * TAU) / TICKS;

const diamond = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath();
};

export function createSpeed() {
  return (c: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const s = fit(c, w, h, DW, DH), hair = 1 / s;
    // the dial: a hairline rim and its 24 marks
    c.lineWidth = hair; c.strokeStyle = I(0.22); c.beginPath(); c.arc(CX, CY, R, 0, TAU); c.stroke();
    c.strokeStyle = I(0.3);
    for (let m = 0; m < TICKS; m++) {
      const a = angle(m), r0 = R - 16, r1 = R - (m % 6 ? 10 : 6);
      c.beginPath(); c.moveTo(CX + Math.cos(a) * r0, CY + Math.sin(a) * r0); c.lineTo(CX + Math.cos(a) * r1, CY + Math.sin(a) * r1); c.stroke();
    }
    // the blocks the hand has left: open while fresh, green once final; the trail fades as it gets older
    const n = Math.floor(t / 0.6);
    for (let m = n - 21; m <= n; m++) {
      const age = t - m * 0.6;
      if (age < 0) continue;
      const a = angle(m), x = CX + Math.cos(a) * R, y = CY + Math.sin(a) * R;
      const pop = smooth(age / 0.18), fin = age >= 1.2, fade = 1 - clamp01((age - 1.2) / 12.4);
      const r = 6.2 * (0.6 + 0.4 * pop);
      c.lineWidth = 1.3 * hair;
      if (fin) {
        const turn = smooth((age - 1.2) / 0.22);
        c.fillStyle = G((0.25 + 0.75 * turn) * fade); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      } else {
        c.fillStyle = "#f5f4f1"; c.strokeStyle = I(0.85 * pop); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke();
      }
    }
    // the hand: a tick, not a sweep (each step lands in 120 ms)
    const step = n + smooth(((t % 0.6) / 0.6 - 0) / 0.2), ha = angle(step);
    c.strokeStyle = I(0.85); c.lineWidth = 1.5 * hair;
    c.beginPath(); c.moveTo(CX, CY); c.lineTo(CX + Math.cos(ha) * (R - 22), CY + Math.sin(ha) * (R - 22)); c.stroke();
    c.fillStyle = I(0.9); c.beginPath(); c.arc(CX, CY, 3.4, 0, TAU); c.fill();

    // the shards around it, and a global contract: set down once at the centre, then in every shard at once
    const cyc = 6.4, tau = t % cyc;
    const ring = smooth((tau - 0.5) / 0.55), land = tau > 1.02 ? 1 : 0, keep = 1 - smooth((tau - 4.6) / 1.2);
    const centre = smooth(tau / 0.35) * (1 - smooth((tau - 1.0) / 0.4));
    for (let k = 0; k < 12; k++) {
      const a = (k * TAU) / 12 + Math.PI / 12, x = CX + Math.cos(a) * OUT, y = CY + Math.sin(a) * OUT;
      c.lineWidth = hair; c.strokeStyle = I(0.4); c.fillStyle = "#f5f4f1";
      c.beginPath(); c.rect(x - 11, y - 11, 22, 22); c.fill(); c.stroke();
      if (land) {
        const flash = 1 - smooth((tau - 1.02) / 0.5);
        c.fillStyle = G(0.9 * keep); diamond(c, x, y, 5.2); c.fill();
        if (flash > 0) { c.strokeStyle = G(0.7 * flash); c.beginPath(); c.rect(x - 11 - 5 * (1 - flash), y - 11 - 5 * (1 - flash), 22 + 10 * (1 - flash), 22 + 10 * (1 - flash)); c.stroke(); }
      }
    }
    if (centre > 0) { c.fillStyle = G(centre); diamond(c, CX, CY - 1, 9 * centre); c.fill(); }
    if (ring > 0 && ring < 1) { c.strokeStyle = G(0.75 * (1 - ring)); c.lineWidth = 1.4 * hair; c.beginPath(); c.arc(CX, CY, 14 + (OUT - 14) * ring, 0, TAU); c.stroke(); }
  };
}
