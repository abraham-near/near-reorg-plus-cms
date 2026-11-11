// The hero's drawing (data: hero-data.ts; motion: hero-motion.ts). Server markup is the first frame: the block whole, its cubes waiting inside it.
// One SVG (1 unit = 1 screen px; the camera group is placed by the motion) and the chips as HTML over it, so their type stays crisp at any zoom.
import { B0, BH, BN, CHIPS, EDGES, G, M, PIECES, U, W } from "./hero-data";
import { box, boxOutline, line, INK, TOP, SIDE_L, SIDE_R, GREEN, P, f } from "./iso";

// the floor's dots, in rings (each fainter outwards: the floor dissolves into the page, no mask needed)
const RINGS = (() => {
  const d = ["", "", "", "", ""];
  for (let x = 0; x <= G; x++) for (let y = 0; y <= G; y++) {
    const r = Math.hypot(x - M, y - M) / M, k = r < 0.42 ? 0 : r < 0.62 ? 1 : r < 0.8 ? 2 : r < 0.98 ? 3 : r < 1.16 ? 4 : -1;
    if (k < 0) continue;
    const [a, b] = W(x, y); d[k] += `M${f(a)},${f(b)}h0`;
  }
  return d;
})();
const RING_O = [0.62, 0.48, 0.34, 0.2, 0.09];

// the block whole: its faces, its outline, and the seams where it will part
const b = { x: B0 - M, y: B0 - M };
const SHELL = box(b.x, b.y, 0, BN, BN, BH, U);
const OUTLINE = boxOutline(b.x, b.y, 0, BN, BN, BH, U);
const SEAMS = (() => {
  const s: string[] = [], x1 = b.x + BN, y1 = b.y + BN;
  for (let i = 1; i < BN; i++) {
    s.push(line([P(b.x + i, b.y, BH), P(b.x + i, y1, BH)], U), line([P(b.x, b.y + i, BH), P(x1, b.y + i, BH)], U));   // the top
    s.push(line([P(x1, b.y + i, BH), P(x1, b.y + i, 0)], U), line([P(b.x + i, y1, BH), P(b.x + i, y1, 0)], U));      // the sides' verticals
  }
  for (let z = 1; z < BH; z++) s.push(line([P(x1, b.y, z), P(x1, y1, z), P(b.x, y1, z)], U));                     // the sides' layers
  return s;
})();
const CUBE = box(0, 0, 0, 1, 1, 1, U);

export function HeroIso() {
  return (
    <div className="fb-iso" aria-hidden="true">
      <svg className="fb-iso__svg" viewBox="0 0 1440 900" focusable="false">
        <g className="fb-cam">
          <g className="fb-floor" fill="none" stroke={INK} strokeLinecap="round">
            {RINGS.map((d, i) => <path key={i} className="fb-dots" d={d} strokeOpacity={RING_O[i]} />)}
          </g>
          <g className="fb-edges" fill="none" stroke={INK} strokeLinejoin="round" strokeLinecap="round">
            {EDGES.map((e, i) => <path key={i} className="fb-edge" d={e.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} />)}
          </g>
          <g className="fb-shell-in">
            <g className="fb-shell" stroke={INK} strokeLinejoin="round">
              <polygon points={SHELL.r} fill={SIDE_R} />
              <polygon points={SHELL.l} fill={SIDE_L} />
              <polygon points={SHELL.t} fill={TOP} />
              <path className="fb-outline" d={OUTLINE} fill="none" pathLength={1} />
              <g className="fb-seams" strokeOpacity={0.32} fill="none">{SEAMS.map((d, i) => <path key={i} d={d} pathLength={1} />)}</g>
            </g>
          </g>
          <g className="fb-pcs" stroke={INK} strokeLinejoin="round">
            {PIECES.map((p, i) => {
              const [tx, ty] = W(p.sx, p.sy, p.sz);
              return (
                <g key={i} className="fb-pc" data-i={i} transform={`translate(${f(tx)} ${f(ty)})`}>
                  <polygon points={CUBE.r} fill={SIDE_R} />
                  <polygon points={CUBE.l} fill={SIDE_L} />
                  <polygon points={CUBE.t} fill={TOP} />
                  {p.g && <polygon className="fb-pc__g" points={CUBE.t} fill={GREEN} opacity={0} />}
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      <div className="fb-chips">
        {CHIPS.map((c) => (
          <span key={c.k} className="fb-chip" data-k={c.k}><span className="fb-chip__in"><i />{c.label}</span></span>
        ))}
      </div>
    </div>
  );
}
