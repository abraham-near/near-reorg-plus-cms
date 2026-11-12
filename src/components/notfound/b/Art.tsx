// 404 B's drawing: the number itself, built from blocks in the rail's isometric hand (public/v1/vig2, foundation/d/iso.tsx). Three digits on a 4 x 5 grid (wide counters: iso shears a narrow glyph past reading),
// each stroke an extruded block standing on a strip of floor with its fine dashed grid: white tops, light grey sides, #111 outlines. One emerald accent
// (the top rim of the 0) and one black tag. Static, server-rendered SVG; the blocks' rise is CSS (./notfound-b.css), off under reduced motion.
import type { CSSProperties } from "react";
import { Box, Floor, P, line, vb, type V } from "@/components/foundation/d/iso";

const K = 30;                                      /* one grid cell in px (the viewBox is close to 1:1 at desktop size) */
const D = 0.8;                                     /* the digits' depth, in cells: thin, so their front faces carry the number */
const p = (x: number, y: number, z = 0): V => P(x * K, y * K, z * K);
const r2 = (n: number) => Math.round(n * 100) / 100;

/* each digit as its strokes: [column, bottom, width, height] on the 4 x 5 grid, z up; non-overlapping, so the seams read as blocks */
type Stroke = [number, number, number, number];
const FOUR: Stroke[] = [[0, 2, 1, 3], [1, 2, 2, 1], [3, 0, 1, 5]];
const ZERO: Stroke[] = [[0, 0, 1, 5], [1, 0, 2, 1], [1, 4, 2, 1], [3, 0, 1, 5]];
const DIGITS: { x: number; strokes: Stroke[]; green?: boolean }[] = [{ x: 0, strokes: FOUR }, { x: 5.5, strokes: ZERO, green: true }, { x: 11, strokes: FOUR }];

/* the blocks, back to front: by x, then from the floor up (a block at a larger x covers the right face of its neighbour; an upper block covers the top below) */
const BLOCKS = DIGITS.flatMap((d) => d.strokes.map(([c, z, w, h]) => ({ x: d.x + c, z, w, h, green: !!d.green && z + h === 5 })))
  .sort((a, b) => a.x - b.x || a.z - b.z);

const TAG = "NOT FOUND";
const TAG_H = 26, tagW = 40 + TAG.length * 8.1;

export function ArtB() {
  const fx0 = -1.5, fx1 = 16.5, fy0 = -1.5, fy1 = D + 2;
  const floor = [p(fx0, fy0), p(fx1, fy0), p(fx1, fy1), p(fx0, fy1)];
  const anchor = p(14.5, D / 2, 5);                 /* the top of the last 4's stem */
  const tag: V = [r2(anchor[0] - 18), r2(anchor[1] - 64)];
  const box = vb([...floor, p(0, 0, 5), tag, [tag[0] + tagW, tag[1]]], 10);
  return (
    <svg className="nfb-iso" viewBox={box} role="img" aria-label="404">
      <g className="nfb-floor"><Floor x={fx0 * K} y={fy0 * K} w={(fx1 - fx0) * K} d={(fy1 - fy0) * K} n={18} /></g>
      {BLOCKS.map((b, i) => (
        <g className="nfb-b" key={i} style={{ "--i": i } as CSSProperties}>
          <Box x={b.x * K} y={0} z={b.z * K} w={b.w * K} d={D * K} h={b.h * K} tone={b.green ? "green" : "light"} />
        </g>
      ))}
      <g className="nfb-tag">
        <path className="i-link" d={line([tag[0] + 18, tag[1] + TAG_H], anchor)} />
        <g className="nfb-tagbox">
          <rect className="i-chip__bg" x={tag[0]} y={tag[1]} width={r2(tagW)} height={TAG_H} />
          <circle className="i-chip__dot" cx={r2(tag[0] + 14)} cy={r2(tag[1] + TAG_H / 2)} r="4.4" />
          <text className="i-chip__t" x={r2(tag[0] + 26)} y={r2(tag[1] + TAG_H / 2 + 4.3)}>{TAG}</text>
        </g>
      </g>
    </svg>
  );
}
