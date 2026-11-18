// History B, today: the integrated stack as four layers drawn on the dark (the protocol at the bottom, near.com on top, in green), each named by a
// label on a leader line. The labels are HTML placed in % of the drawing, so they keep their size on a phone. motion.ts settles the layers down onto
// one another as the section scrolls in (scrubbed); the markup is the finished frame (reduced motion, no JS).
import { P, f, vbox, onTop, Slab, cornersOf, type B6 } from "./draw";

const S = 168, T = 14, GAP = 44;
export const LAYERS: B6[] = [0, 1, 2, 3].map((i) => [0, 0, S, S, i * GAP, T]);
const anchor = (i: number) => P(S, S * 0.5, i * GAP + T * 0.5);   // the middle of a layer's right face
const LEAD = 70;
const VB = vbox([...LAYERS.flatMap(cornersOf), ...LAYERS.map((_, i) => { const a = anchor(i); return [a[0] + LEAD + 160, a[1]] as [number, number]; })], 10);
const pct = (x: number, y: number) => ({ left: `${(((x - VB.x) / VB.w) * 100).toFixed(2)}%`, top: `${(((y - VB.y) / VB.h) * 100).toFixed(2)}%` });

/** a small mark laid on each layer's top: blocks, intents, a chip, a window */
function Mark({ i, z }: { i: number; z: number }) {
  const g = (d: string, cls = "") => <g className={`hb-ink hb-ink--n ${cls} d-o`} transform={onTop(0, 0, z)}><path d={d} /></g>;
  if (i === 0) { let d = ""; for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) d += `M${40 + a * 24},${40 + b * 24}h14v14h-14z`; return g(d); }
  if (i === 1) return g("M44,70h70l-12,-10M124,98h-70l12,10");
  if (i === 2) return g("M56,56h56v56h-56zM70,70h28v28h-28zM62,44v12M84,44v12M106,44v12M62,112v12M84,112v12M106,112v12");
  return g("M36,40h96v88h-96zM36,58h96M46,49h4M56,49h4M66,49h4", "hb-ink--g");
}

export function TodayStack({ layers }: { layers: string[] }) {
  return (
    <div className="hb-stack">
      <svg className="hb-svg hb-stack__svg" viewBox={VB.s} data-draw="self" aria-hidden="true" focusable="false">
        {LAYERS.map((b, i) => {
          const a = anchor(i);
          return (
            <g key={i} className="hb-ly" data-i={i}>
              <Slab b={b} tone={i === 3 ? "g" : "n"} />
              <Mark i={i} z={b[4] + b[5]} />
              <path className="hb-lead d-o" d={`M${f(a[0] + 4)},${f(a[1])}h${LEAD}`} />
              <circle className="hb-lead__dot d-o" cx={f(a[0] + 4)} cy={f(a[1])} r="2.4" />
            </g>
          );
        })}
      </svg>
      <ol className="hb-stack__ls">
        {[...layers].map((l, i) => {
          const a = anchor(i);
          return (
            <li key={l} className={`hb-stack__l${i === 3 ? " is-top" : ""}`} data-i={i} style={pct(a[0] + LEAD + 14, a[1])}>
              <span className="hb-stack__n">{String(i + 1).padStart(2, "0")}</span>{l}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
