// Protocol D · Speed. Scale. Access.: deploy once, run everywhere. A field of shards seen from above (rounded squares on the paper's dots), all
// beating together on NEAR's 600 ms. A contract (one green mark) drops into the middle one; on the very next beat it is in every shard at once, no
// copies sent around. Then the network uses it: here and there a call lights a shard. It fades, and the next contract (another shape) comes in.
// A function of time (the same moment draws the same): the loop, the arrival and the reduced-motion still share it. No text in the picture.
import { clamp01, hash, smooth } from "./stage";

const INK = "38,38,38";
const BEAT = 0.6, CYCLE = 12 * BEAT;   // a cycle: 12 blocks

/** the contract's shape this cycle: a diamond, a triangle, a ring */
function mark(c: CanvasRenderingContext2D, kind: number, x: number, y: number, r: number, fill: string) {
  c.beginPath();
  if (kind === 0) { c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); c.fillStyle = fill; c.fill(); }
  else if (kind === 1) { c.moveTo(x, y - r); c.lineTo(x + r * 0.95, y + r * 0.7); c.lineTo(x - r * 0.95, y + r * 0.7); c.closePath(); c.fillStyle = fill; c.fill(); }
  else { c.arc(x, y, r * 0.85, 0, Math.PI * 2); c.lineWidth = Math.max(1.4, r * 0.42); c.strokeStyle = fill; c.stroke(); }
}

export function createSpeed() {
  return (c: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const cell = Math.max(34, Math.min(58, w / 11)), node = cell * 0.48;
    const cols = Math.max(5, Math.floor((w - cell * 0.4) / cell)), rows = Math.max(4, Math.floor((h - cell * 0.4) / cell));
    const ox = (w - cols * cell) / 2 + cell / 2, oy = (h - rows * cell) / 2 + cell / 2;
    const mc = Math.floor(cols / 2), mr = Math.floor(rows / 2), mx = ox + mc * cell, my = oy + mr * cell;
    const cyc = Math.floor(t / CYCLE), u = t - cyc * CYCLE, kind = ((cyc % 3) + 3) % 3;
    const beatK = t / BEAT, beat = 1 - clamp01((beatK - Math.floor(beatK)) / 0.35);    // the heartbeat, every 600 ms
    // the cycle: the contract drops (blocks 0..1), lands at block 2 everywhere at once, runs, fades from block 10
    const LAND = 2 * BEAT, FADE = 10 * BEAT;
    const drop = clamp01((u - 0.3) / (LAND - 0.3)), landed = u >= LAND, life = landed ? 1 - smooth(clamp01((u - FADE) / (CYCLE - FADE - 0.3))) : 0;
    const flash = landed ? 1 - clamp01((u - LAND) / 0.5) : 0;

    // the paper's dots between the shards
    c.fillStyle = `rgba(${INK},0.14)`;
    for (let r = 0; r <= rows; r++) for (let q = 0; q <= cols; q++) c.fillRect(ox - cell / 2 + q * cell - 0.6, oy - cell / 2 + r * cell - 0.6, 1.2, 1.2);

    // the one block's reach: a single quick ring from the middle as it lands (everywhere in the same beat)
    if (flash > 0) {
      const R = (1 - flash) * Math.hypot(w, h) * 0.75;
      c.beginPath(); c.arc(mx, my, R, 0, Math.PI * 2); c.strokeStyle = `rgba(0,220,141,${0.55 * flash})`; c.lineWidth = 1.5; c.stroke();
    }

    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const x = ox + q * cell, y = oy + r * cell, centre = q === mc && r === mr;
      // a call: now and then a shard runs the contract (its square fills a moment)
      const callSeed = Math.floor(beatK), call = landed && u < FADE && hash(q, r, callSeed) < 0.07 ? 1 - clamp01((beatK - callSeed) / 0.9) : 0;
      const s = node * (1 + 0.05 * beat);
      c.beginPath(); (c as CanvasRenderingContext2D & { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(x - s / 2, y - s / 2, s, s, s * 0.22);
      c.fillStyle = call > 0 ? `rgba(0,220,141,${0.18 + 0.3 * call})` : "#fff"; c.fill();
      c.strokeStyle = `rgba(${INK},${0.55 + 0.35 * beat})`; c.lineWidth = 1; c.stroke();
      if (life > 0) mark(c, kind, x, y, node * 0.2 * (1 + 0.6 * flash), `rgba(0,168,107,${life})`);
      else if (centre && drop >= 1) mark(c, kind, x, y, node * 0.2, "rgba(0,168,107,1)");
    }

    // the contract on its way in: one mark dropping into the middle shard
    if (!landed && drop > 0) {
      const e = smooth(drop), y = my - (1 - e) * (my + node);
      c.globalAlpha = clamp01(drop * 3);
      mark(c, kind, mx, y, node * 0.26, "rgba(0,220,141,1)");
      c.beginPath(); c.moveTo(mx, Math.max(0, y - node * 1.6)); c.lineTo(mx, y - node * 0.4); c.strokeStyle = "rgba(0,220,141,0.5)"; c.lineWidth = 1; c.stroke();
      c.globalAlpha = 1;
    }
  };
}
