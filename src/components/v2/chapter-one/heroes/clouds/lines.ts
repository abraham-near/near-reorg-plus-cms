import type { Pt } from "../../cinematic/geom";
import { BASE, type LineKey } from "./design";

// Where a ridge line's points sit at a frame: each line's controls (every 4th point) carry a displacement from their
// reference place (tenths of a px) and how clearly their crest shows (0-9); the points between controls take theirs
// linearly. `d` and `v` are one frame's values (or a blend of two sampled frames).
export type LineAt = { pts: Pt[]; vis: number[] };

export function lineAt(k: LineKey, d: ArrayLike<number>, v: ArrayLike<number>): LineAt {
  const L = BASE.lines[k], ctl = L.ctl, pts: Pt[] = [], vis: number[] = [];
  let c = 0;
  for (let i = 0; i < L.pts.length; i++) {
    while (c < ctl.length - 2 && ctl[c + 1] <= i) c++;
    const a = ctl[c], b = ctl[c + 1], u = b > a ? Math.min(1, Math.max(0, (i - a) / (b - a))) : 0;
    const dx = d[2 * c] + (d[2 * c + 2] - d[2 * c]) * u, dy = d[2 * c + 1] + (d[2 * c + 3] - d[2 * c + 1]) * u;
    pts.push([L.pts[i][0] + dx / 10, L.pts[i][1] + dy / 10]);
    vis.push((v[c] + (v[c + 1] - v[c]) * u) / 9);
  }
  return { pts, vis };
}

// The first frame (the still), from the bundled data
const cache = new Map<LineKey, LineAt>();
export function at0(k: LineKey): LineAt {
  let r = cache.get(k);
  if (!r) { r = lineAt(k, BASE.lines[k].d0, BASE.lines[k].v0); cache.set(k, r); }
  return r;
}

// A line's ticks: square to it, towards the sky, on every `tickEvery`-th point from `from` (and its last point), every
// third one `major` long; `scale` turns the style's px (the video's) into the drawing's. Returns [foot, tip, index].
export function lineTicks(S: readonly Pt[], st: { tickEvery: number; tick: number; major: number; from?: number }, scale = 1): [Pt, Pt, number][] {
  const out: [Pt, Pt, number][] = [], from = st.from ?? 0;
  let k = 0;
  for (let i = from; i < S.length; i += st.tickEvery, k++) {
    const q = S[Math.min(S.length - 1, i + 1)], o = S[Math.max(0, i - 1)];
    const dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1;
    let nx = dy / l, ny = -dx / l;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const len = (k % 3 === 0 ? st.major : st.tick) * scale;
    out.push([S[i], [S[i][0] + nx * len, S[i][1] + ny * len], i]);
  }
  return out;
}
