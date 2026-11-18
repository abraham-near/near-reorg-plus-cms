// Research B, "Keep reading": a small, quiet drawing for each link (blog: posts fanned out, the top one with a green mark; history: three steps up,
// green at the top; docs: a terminal block, a green cursor after its brackets). Each builds once as it arrives (kit.ts mountDraw). Decorative.
import type { ReactNode } from "react";
import { cornersOf, vbox, onTop, type B6, type V } from "./kit";
import { Slab, Text } from "./parts";

function Svg({ ps, children }: { ps: V[]; children: ReactNode }) {
  return <svg className="rb-svg rb-glyph" viewBox={vbox(ps, 4).s} data-draw="" aria-hidden="true" focusable="false">{children}</svg>;
}

function Blog() {
  const cards: B6[] = [[0, 0, 30, 40, 0, 2], [6, -5, 30, 40, 5, 2], [12, -10, 30, 40, 10, 2]];
  const t = cards[2];
  return (
    <Svg ps={cards.flatMap(cornersOf)}>
      {cards.map((b, i) => <g key={i} className="d-p"><Slab b={b} /></g>)}
      <g className="d-o">
        <rect className="rb-mark" width="6" height="6" transform={onTop(t[0] + 5, t[1] + 5, t[4] + 2)} />
        <Text x={t[0] + 5} y={t[1] + 16} z={t[4] + 2} w={20} rows={4} gap={5} />
      </g>
    </Svg>
  );
}

function History() {
  const steps: B6[] = [[0, 0, 14, 28, 0, 8], [14, 0, 14, 28, 0, 16], [28, 0, 14, 28, 0, 24]];
  return (
    <Svg ps={steps.flatMap(cornersOf)}>
      {steps.map((b, i) => <g key={i} className="d-p"><Slab b={b} tone={i === 2 ? "g" : "w"} /></g>)}
    </Svg>
  );
}

function Docs() {
  const b: B6 = [0, 0, 44, 32, 0, 9];
  return (
    <Svg ps={cornersOf(b)}>
      <Slab b={b} />
      <g className="d-o" transform={onTop(6, 8, 9)}>
        <path className="rb-code" d="M5,2L1,7L5,12M17,2L11,12M23,2L27,7L23,12" />
        <rect className="rb-mark" x="30" y="4" width="4" height="7" />
      </g>
    </Svg>
  );
}

export const GLYPHS: Record<string, () => ReactNode> = { Blog, History, Docs };
