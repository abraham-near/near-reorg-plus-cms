// Solutions B, the spotlight's drawing: a NEAR private shard. A public chain on the left (its blocks open, their entries plain to see) sends a deposit
// arcing into the shard; on the shard every entry lies under its redaction bar (the closed layer, a padlock on its face), all but one, opened green to
// the institution standing by it (selective disclosure, its line in green). Motion (motion.ts): deposits arc in, and each lands as a new entry whose
// bar draws closed over it, one row after another. The markup is the finished, still frame. Decorative: the text beside it carries the meaning.
import { P, f, tr, arc, at, along, dots, vbox, cornersOf, line, onTop, onLeft, clamp01, type B6, type V } from "./kit";
import { Slab, Coin, Padlock } from "./parts";
import { env } from "./Scenes";

const SH: B6 = [-80, -56, 160, 112, 0, 22], LAYER: B6 = [-74, -50, 148, 100, 22, 6];
const ZT = LAYER[4] + LAYER[5];
/** the rows on the closed layer, in its own units (a along +x, b along +y from its back corner): each bar's length, and the disclosed row */
export const ROWS = [0.78, 0.56, 0.9, 0.64, 0.82, 0.5];
export const OPEN = 2;
const RW = LAYER[2] - 28, RH = 7, RY = (i: number) => 13 + i * 14.6;
const PUB: [number, number] = [-40, 160];
const PUB_B: B6[] = [at(PUB[0], PUB[1], 34, 34, 0, 16), at(PUB[0], PUB[1], 34, 34, 18, 16)];
export const DEPOSIT = arc([PUB[0], PUB[1], 36], [-50, 30, ZT + 2], 46, 30);
const WHO: [number, number] = [138, 6];
const LOOK: [V, V] = [P(WHO[0] - 4, WHO[1], 26), P(LAYER[0] + 14 + RW * 0.5, LAYER[1] + RY(OPEN), ZT)];

const all: V[] = [...cornersOf(SH), ...cornersOf(LAYER), ...PUB_B.flatMap(cornersOf), ...DEPOSIT.ps, P(WHO[0], WHO[1], 40)];
const VB = vbox(all, 12);

export function Shard() {
  const lx = LAYER[0], ly = LAYER[1];
  return (
    <svg className="sb-svg sb-shard" viewBox={VB.s} data-draw="" data-scene="shard" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="sh-fade-g" cx="50%" cy="55%" r="58%"><stop offset="0.45" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <mask id="sh-fade" maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#sh-fade-g)" /></mask>
      </defs>
      <path className="sb-dots d-floor" d={dots(-190, -190, 190, 190, 20)} mask="url(#sh-fade)" />
      {/* the shard: its body, the padlock on its face, the closed layer on top with its rows */}
      <g className="d-p">
        <Slab b={SH} />
        <Padlock m={onLeft(SH[0], SH[1] + SH[3], SH[4] + SH[5])} a={SH[2] - 22} b={6} s={0.9} />
        <Slab b={LAYER} />
        <g transform={onTop(lx, ly, ZT)}>
          {ROWS.map((w, i) => (
            <g key={i} className={`sh-row${i === OPEN ? " sh-row--open" : ""}`}>
              <path className="sh-entry" d={`M14,${f(RY(i))}h${f(RW * w)}`} />
              {i === OPEN
                ? <rect className="sh-open" x="10" y={f(RY(i) - RH / 2 - 1)} width={f(RW * w + 8)} height={f(RH + 2)} rx="1.5" />
                : <rect className="sh-bar" x="10" y={f(RY(i) - RH / 2)} width={f(RW * w + 8)} height={f(RH)} data-w={f(RW * w + 8)} />}
            </g>
          ))}
        </g>
      </g>
      {/* the public chain: open blocks */}
      <g className="d-p">
        {PUB_B.map((b, i) => <Slab key={i} b={b} />)}
        <g transform={onTop(PUB_B[1][0], PUB_B[1][1], 34)}>{[8, 15, 22].map((y, i) => <path key={i} className="sh-entry" d={`M7,${y}h${[18, 13, 20][i]}`} />)}</g>
      </g>
      {/* the institution, and its line to the one row opened to it */}
      <g className="d-p">
        <Slab b={at(WHO[0], WHO[1], 28, 28, 0, 6)} />
        <g transform={tr(P(WHO[0], WHO[1], 6))}>
          <path className="pw__b" d={coinSide(7, 15)} />
          <ellipse className="pw__t" cx="0" cy="-15" rx={f(7 * Math.SQRT2 * 0.866)} ry={f(7 * Math.SQRT2 * 0.5)} />
          <circle className="pw__h pw__h--g" cx="0" cy="-22.6" r="6.3" />
        </g>
      </g>
      <path className="sh-look d-o" d={line(...LOOK)} />
      <path className="sb-route d-o" d={DEPOSIT.d} />
      <g className="d-o"><g className="sh-coin" transform={tr(along(DEPOSIT.ps, 0.5))}><Coin r={8} h={4} /></g></g>
    </svg>
  );
}
/** a short cylinder's side, standing on the origin (the institution's body) */
function coinSide(r: number, h: number) {
  const rx = r * Math.SQRT2 * 0.866, ry = r * Math.SQRT2 * 0.5;
  return `M${f(-rx)},${f(-h)}L${f(-rx)},0A${f(rx)},${f(ry)} 0 0 0 ${f(rx)},0L${f(rx)},${f(-h)}Z`;
}

/** the shard's tick: a deposit arcs in, then the next row's bar draws closed over its entry */
export function liveShard(svg: SVGSVGElement) {
  const c = svg.querySelector<SVGGElement>(".sh-coin")!, bars = [...svg.querySelectorAll<SVGRectElement>(".sh-bar")];
  const T = 2.6;
  return (t: number) => {
    const k = Math.floor(t / T), u = (t % T) / T, run = clamp01(u / 0.5), i = k % bars.length;
    c.setAttribute("transform", tr(along(DEPOSIT.ps, run)));
    c.style.opacity = f(u < 0.5 ? env(run, 8) : 0);
    bars.forEach((b, j) => {
      const w = Number(b.dataset.w);
      // the row this deposit lands in: open while the coin flies, then its bar draws closed
      b.setAttribute("width", f(j === i ? w * clamp01((u - 0.5) / 0.3) : w));
    });
  };
}
