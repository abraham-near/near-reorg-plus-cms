// Foundation E's hero drawing: Foundation C's (../c/hero-geo.ts: the stepped plinth, the field of green columns, the signals on its seams) on paper,
// in B's hand (white tops, light grey sides, ink hairlines) with the dark chips. The markup is the finished frame; motion.ts builds it, keeps it alive
// (columns breathe, signals run, it leans to the pointer) and, scrolled, lifts the columns and carries the drawing down into the pillars' stair.
import { BASE, TOP, GROUND_GRID, TOP_GRID, PILLARS, TONES, LANES, VB, ECO_LEAD, FND_LEAD, pFaces, pWire } from "../c/hero-geo";
import { faces, wire, P, pts, f } from "../c/iso";
import { Chip } from "../c/Illus";

const Slab = ({ b, cls }: { b: typeof BASE; cls: string }) => {
  const fc = faces(b);
  return (
    <g className={cls}>
      <polygon className="fc-h-fill fc-h-l" points={fc.left} />
      <polygon className="fc-h-fill fc-h-r" points={fc.right} />
      <polygon className="fc-h-fill fc-h-t" points={fc.top} />
      <path className="fc-h-edge" d={wire(b)} pathLength={1} />
    </g>
  );
};

const SIG = pts(P(-5, -5), P(5, -5), P(5, 5), P(-5, 5));

export function HeroColumns() {
  return (
    <div className="fe-art" aria-hidden="true">
      <div className="fe-art__cam">
        <svg className="fc-hiso" viewBox={VB.s} focusable="false">
          <defs>
            <radialGradient id="fe-h-fade" cx="50%" cy="58%" r="52%">
              <stop offset="0.35" stopColor="#fff" stopOpacity="1" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <mask id="fe-h-mask" maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}>
              <rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#fe-h-fade)" />
            </mask>
          </defs>
          <g className="fc-h-ground" mask="url(#fe-h-mask)">{GROUND_GRID.map((d, i) => <path key={i} d={d} />)}</g>
          <Slab b={BASE} cls="fc-h-base" />
          <Slab b={TOP} cls="fc-h-top" />
          <g className="fc-h-grid">{TOP_GRID.map((d, i) => <path key={i} d={d} />)}</g>
          <g className="fc-h-sig">{LANES.map((_, i) => <polygon key={i} points={SIG} transform={`translate(${f(LANES[i].a[0])} ${f(LANES[i].a[1])})`} />)}</g>
          <g className="fc-h-cols">
            {PILLARS.map((p, k) => {
              const fc = pFaces(p), tn = TONES[p.tone];
              return (
                <g key={k} className={p.ghost ? "fc-col is-ghost" : "fc-col"} data-k={k}>
                  {!p.ghost && (
                    <g className="fc-col__s">
                      <polygon className="fc-col__l" points={fc.left} fill={tn.l} stroke={tn.l} />
                      <polygon className="fc-col__r" points={fc.right} fill={tn.r} stroke={tn.r} />
                      <polygon className="fc-col__t" points={fc.top} fill={tn.t} stroke={tn.t} />
                    </g>
                  )}
                  <path className="fc-col__w" d={pWire(p)} pathLength={1} />
                </g>
              );
            })}
          </g>
          <g className="fc-h-lead">
            <path d={`M${f(ECO_LEAD[0][0])},${f(ECO_LEAD[0][1])}L${f(ECO_LEAD[1][0])},${f(ECO_LEAD[1][1])}`} />
            <path d={`M${f(FND_LEAD[0][0])},${f(FND_LEAD[0][1])}L${f(FND_LEAD[1][0])},${f(FND_LEAD[1][1])}`} />
          </g>
          <Chip at={[ECO_LEAD[1][0], ECO_LEAD[1][1] - 4]} label="ECOSYSTEM" />
          <Chip at={[FND_LEAD[1][0] + 40, FND_LEAD[1][1] + 26]} label="NEAR FOUNDATION" />
        </svg>
      </div>
    </div>
  );
}
