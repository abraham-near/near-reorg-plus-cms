// Brand B, the palette as one iso column: a block per colour, each as tall as its share of the page (WEIGHT, this version's reading of "a strong neutral
// base, with green as a thread": lots of paper and ink, a thin slice of green), stacked from ink at the foot to paper at the top, the two greens a thin
// band between. Each block's top is its hex, its sides the same, darker. Leaders run from each block to its name and hex, spread so none collide.
// The blocks drop in one by one as it arrives (kit.ts mountDraw); pointing at a swatch in the list lights its block (BrandB.tsx sets data-hl on the figure).
import { COLOR } from "../content";
import { P, f, line, cornersOf, dots, shade, vbox, type B6, type V } from "./kit";
import { Slab } from "./parts";

const ORDER = ["ink", "graphite", "green-text", "green", "paper-2", "paper-1", "paper"];   // foot to top
const WEIGHT: Record<string, number> = { ink: 24, graphite: 10, "green-text": 3, green: 3, "paper-2": 9, "paper-1": 14, paper: 30 };
const W = 120, H = 300, GAP = 3;
const total = ORDER.reduce((a, k) => a + WEIGHT[k], 0);

type Blk = { k: string; name: string; hex: string; b: B6; mid: V; ly: number };
const BLOCKS: Blk[] = (() => {
  let z = 0;
  const out = ORDER.map((k) => {
    const s = COLOR.swatches.find((x) => x.k === k)!, h = (WEIGHT[k] / total) * (H - GAP * (ORDER.length - 1));
    const b: B6 = [0, 0, W, W, z, h], mid = P(W, W / 2, z + h / 2);
    z += h + GAP;
    return { k, name: s.name, hex: s.hex, b, mid, ly: mid[1] };
  });
  // labels: top to bottom, at least 26 apart, then centred back on their blocks
  const byY = [...out].sort((a, b) => a.ly - b.ly), MIN = 26;
  for (let i = 1; i < byY.length; i++) byY[i].ly = Math.max(byY[i].ly, byY[i - 1].ly + MIN);
  const shift = (byY.reduce((a, x) => a + x.mid[1], 0) - byY.reduce((a, x) => a + x.ly, 0)) / byY.length;
  byY.forEach((x) => (x.ly += shift));
  return out;
})();
const LX = P(W, 0, 0)[0] + 70;   // where the labels start

const VIEW = vbox([...BLOCKS.flatMap((x) => cornersOf(x.b)), P(-24, -24), P(W + 24, W + 24), P(-24, W + 24), P(W + 24, -24), [LX + 150, BLOCKS[0].ly], [LX + 150, BLOCKS[BLOCKS.length - 1].ly - 12]], 12);

export function ColorStack() {
  return (
    <svg className="bb-svg bb-cs" viewBox={VIEW.s} data-draw="" aria-hidden="true" focusable="false">
      <path className="bb-dots d-floor" d={dots(-24, -24, W + 24, W + 24, 16)} />
      {BLOCKS.map((x) => (
        <g key={x.k} className="d-p bb-cs__blk" data-k={x.k}>
          <Slab b={x.b} fill={[x.hex, shade(x.hex, 0.07), shade(x.hex, 0.15)]} />
        </g>
      ))}
      <g className="bb-cs__labs d-o">
        {BLOCKS.map((x) => (
          <g key={x.k} className="bb-cs__lab" data-k={x.k}>
            <path d={line(x.mid, [LX - 34, x.ly], [LX - 8, x.ly])} />
            <circle cx={f(x.mid[0])} cy={f(x.mid[1])} r="2.2" />
            <text x={f(LX)} y={f(x.ly + 4)}><tspan className="bb-cs__name">{x.name}</tspan><tspan className="bb-cs__hex" dx="8">{x.hex}</tspan></text>
          </g>
        ))}
      </g>
    </svg>
  );
}
