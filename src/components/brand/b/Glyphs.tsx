// Brand B, the principles as small drawings on their plinths (one per cell of the ruled row): human: two people side by side, one in green; quiet: a
// low wide slab and a thin one laid on it, level, a green rule along its edge; proof: three blocks stepping up, the last one green. Each builds once as it
// arrives (kit.ts mountDraw). Decorative: the text beside each carries the meaning.
import type { ReactNode } from "react";
import { P, f, line, cornersOf, vbox, type B6, type V } from "./kit";
import { Pawn, Slab } from "./parts";

function Svg({ ps, children }: { ps: V[]; children: ReactNode }) {
  const vb = vbox(ps, 6);
  return <svg className="bb-svg bb-glyph" viewBox={vb.s} data-draw="" aria-hidden="true" focusable="false">{children}</svg>;
}

function Human() {
  const base: B6 = [0, 0, 72, 52, 0, 8];
  return (
    <Svg ps={[...cornersOf(base), P(26, 22, 8 + 32), P(50, 34, 8 + 32)]}>
      <Slab b={base} />
      <g className="d-p"><Pawn x={24} y={22} z={8} /></g>
      <g className="d-p"><Pawn x={50} y={32} z={8} g /></g>
    </Svg>
  );
}

function Quiet() {
  const base: B6 = [0, 0, 92, 44, 0, 8], top: B6 = [10, 8, 72, 28, 8, 5];
  return (
    <Svg ps={[...cornersOf(base), ...cornersOf(top)]}>
      <Slab b={base} />
      <g className="d-p"><Slab b={top} /></g>
      <path className="bb-level d-o" d={line(P(10, 36, 13), P(82, 36, 13))} />
      <circle className="bb-level__end d-o" cx={f(P(82, 36, 13)[0])} cy={f(P(82, 36, 13)[1])} r="3" />
    </Svg>
  );
}

function Proof() {
  const base: B6 = [0, 0, 84, 40, 0, 8], steps: B6[] = [[6, 8, 22, 24, 8, 12], [31, 8, 22, 24, 8, 24], [56, 8, 22, 24, 8, 38]];
  return (
    <Svg ps={[...cornersOf(base), ...steps.flatMap(cornersOf)]}>
      <Slab b={base} />
      {steps.map((b, i) => <g key={i} className="d-p"><Slab b={b} tone={i === 2 ? "g" : "w"} /></g>)}
    </Svg>
  );
}

export const GLYPHS: Record<string, () => ReactNode> = { human: Human, quiet: Quiet, proof: Proof };
