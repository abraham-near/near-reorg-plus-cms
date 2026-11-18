// Economics B, "Built on a foundation that's already set": the four facts as small drawings on their plinths (one per cell of the ruled row):
//   supply: a padlock, its shackle lifted out (unlocked); inflation: a ghost column and a solid one half its height, its top green (halved);
//   governance: a ballot box with a slip going in, a green tick on it (the vote, onchain); uptime: a fence of six posts, one a year, under one
//   unbroken green rail. Each builds once as it arrives (kit.ts mountDraw). Decorative: the text beside each carries the meaning.
import type { ReactNode } from "react";
import { P, f, line, box, wireAll, onLeft, onTop, vbox, cornersOf, type B6, type V } from "./kit";
import { Slab } from "./parts";

function Svg({ ps, children }: { ps: V[]; children: ReactNode }) {
  const vb = vbox(ps, 6);
  return <svg className="eb-svg eb-plinth" viewBox={vb.s} data-draw="" aria-hidden="true" focusable="false">{children}</svg>;
}

function Supply() {
  const base: B6 = [0, 0, 60, 60, 0, 8], body: B6 = [12, 23, 36, 14, 8, 28];
  const z1 = 36, top = 60, r = 10;
  const u: V[] = [P(40, 30, z1 - 2), P(40, 30, top)];
  for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI; u.push(P(30 + r * Math.cos(a), 30, top + r * Math.sin(a))); }
  u.push(P(20, 30, top), P(20, 30, z1 + 11));
  const d = line(...u);
  return (
    <Svg ps={[...cornersOf(base), P(30, 30, top + r + 4)]}>
      <Slab b={base} />
      <Slab b={body} />
      <g className="d-o">
        <path className="eb-shk eb-shk--o" d={d} />
        <path className="eb-shk eb-shk--i" d={d} />
        <g className="eb-key" transform={onLeft(30, 37, 26)}><circle cx="0" cy="0" r="3.4" /><path d="M0,1.5V8" /></g>
      </g>
    </Svg>
  );
}

function Inflation() {
  const base: B6 = [0, 0, 64, 36, 0, 8];
  return (
    <Svg ps={[...cornersOf(base), P(8, 8, 8 + 52), P(28, 8, 8 + 52)]}>
      <Slab b={base} />
      <path className="eb-ghost d-o" d={wireAll(box(8, 8, 20, 20, 8, 52))} />
      <g className="d-p"><Slab b={[36, 8, 20, 20, 8, 26]} tone="g" /></g>
      <path className="eb-half d-o" d={line(P(28, 8, 34), P(36, 8, 34))} />
    </Svg>
  );
}

function Governance() {
  const base: B6 = [0, 0, 60, 60, 0, 8], urn: B6 = [12, 15, 36, 30, 8, 28], slip: B6 = [19, 29.5, 22, 1.4, 30, 22];
  return (
    <Svg ps={[...cornersOf(base), ...cornersOf(slip)]}>
      <Slab b={base} />
      <Slab b={urn} />
      <path className="eb-slot" d="M0,0h26" transform={onTop(17, 30, 36)} />
      <g className="d-p">
        <Slab b={slip} />
        <path className="eb-tick" d="M6,8l4,4l7,-7" transform={onLeft(19, 30.9, 52)} />
      </g>
    </Svg>
  );
}

function Uptime() {
  // a long plinth with a fence along it: six posts, one a year, and the green rail over them unbroken
  const base: B6 = [0, 0, 104, 24, 0, 8], Z = 8, H = 16;
  const posts = Array.from({ length: 6 }, (_, i) => 6 + i * 18.4);
  return (
    <Svg ps={[...cornersOf(base), P(posts[0], 12, Z + H + 4), P(posts[5], 12, Z + H + 4)]}>
      <Slab b={base} />
      <g className="d-p">{posts.map((x, i) => <Slab key={i} b={[x - 1.5, 10.5, 3, 3, Z, H]} edges={false} />)}</g>
      <path className="eb-level d-o" d={line(P(posts[0], 12, Z + H), P(posts[5], 12, Z + H))} />
      <circle className="eb-level__end d-o" cx={f(P(posts[5], 12, Z + H)[0])} cy={f(P(posts[5], 12, Z + H)[1])} r="3.2" />
    </Svg>
  );
}

export const PLINTHS: Record<string, () => ReactNode> = { supply: Supply, inflation: Inflation, governance: Governance, uptime: Uptime };
