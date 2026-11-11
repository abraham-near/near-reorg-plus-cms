// Foundation C's drawings in home v4's isometric hand (the rail's vig2 / Revenue A): floor rhombi with a fine dashed grid, slabs with white tops and light grey
// sides, ink outlines, dark chips with a green dot; green only as the accent. Each one's markup is its finished frame (reduced motion); motion.ts animates it.
import type { CSSProperties, ReactNode } from "react";
import { PILLARS, pBox } from "./hero-geo";
import { P, box, faces, wire, hidden, grid, coin, vbox, corners, pts, line, f, chipW, type Box, type V } from "./iso";

/* ---------------------------------------------------------------- primitives */
type Tone = "w" | "g" | "d" | "gl";   // white top · green top · dark (on ink) · glass
function Slab({ b, tone = "w", cls, style, draw }: { b: Box; tone?: Tone; cls?: string; style?: CSSProperties; draw?: boolean }) {
  const fc = faces(b);
  return (
    <g className={`fc-s fc-s--${tone}${cls ? " " + cls : ""}`} style={style}>
      <polygon className="fc-s__l" points={fc.left} />
      <polygon className="fc-s__r" points={fc.right} />
      <polygon className="fc-s__t" points={fc.top} />
      {draw && <path className="fc-s__w" d={wire(b)} pathLength={1} />}
    </g>
  );
}
function Floor({ x0, x1, y0, y1, z = 0, nx = 8, ny = 8, cls = "" }: { x0: number; x1: number; y0: number; y1: number; z?: number; nx?: number; ny?: number; cls?: string }) {
  const g = grid(x0, x1, y0, y1, z, nx, ny).slice(1, -1).filter((_, i) => i !== nx - 1 && i !== nx);
  return (
    <g className={`fc-floor ${cls}`}>
      <polygon className="fc-floor__f" points={pts(P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z))} />
      <g className="fc-floor__g">{g.map((d, i) => <path key={i} d={d} />)}</g>
      <path className="fc-floor__e" d={line(P(x0, y0, z), P(x1, y0, z), P(x1, y1, z))} pathLength={1} />
      <path className="fc-floor__e" d={line(P(x0, y0, z), P(x0, y1, z), P(x1, y1, z))} pathLength={1} />
    </g>
  );
}
function Coin({ x, y, z, r = 15, h = 6, green, cls, style }: { x: number; y: number; z: number; r?: number; h?: number; green?: boolean; cls?: string; style?: CSSProperties }) {
  const c = coin(x, y, z, r, h);
  return (
    <g className={`fc-coin${green ? " is-g" : ""}${cls ? " " + cls : ""}`} style={style}>
      <path className="fc-coin__s" d={c.side} />
      <ellipse className="fc-coin__f" cx={f(c.cx)} cy={f(c.cy)} rx={f(c.rx)} ry={f(c.ry)} />
      <ellipse className="fc-coin__i" cx={f(c.cx)} cy={f(c.cy)} rx={f(c.rx * 0.6)} ry={f(c.ry * 0.6)} />
    </g>
  );
}
export function Chip({ at, label, dark, cls = "" }: { at: V; label: string; dark?: boolean; cls?: string }) {
  const w = chipW(label), h = 24, x = at[0] - w / 2, y = at[1] - h;
  return (
    <g className={`fc-chip${dark ? " fc-chip--d" : ""} ${cls}`}>
      <rect x={f(x)} y={f(y)} width={f(w)} height={h} />
      <circle className="fc-chip__dot" cx={f(x + 13)} cy={f(y + h / 2)} r={4} />
      <text x={f(x + 24)} y={f(y + h / 2 + 4)}>{label}</text>
    </g>
  );
}
const Lead = ({ a, b, cls = "" }: { a: V; b: V; cls?: string }) => <path className={`fc-lead ${cls}`} d={line(a, b)} />;
function Svg({ ps, children, cls, m = 16 }: { ps: V[]; children: ReactNode; cls: string; m?: number }) {
  const vb = vbox(ps, m);
  return <svg className={`fc-ill ${cls}`} viewBox={vb.s} aria-hidden="true" focusable="false">{children}</svg>;
}
const floorPs = (x0: number, x1: number, y0: number, y1: number, z = 0): V[] => [P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)];
const sv = (o: Record<string, number | string>) => o as CSSProperties;

/* ---------------------------------------------------------------- 2 · the three pillars */
// Nonprofit: the Stiftung: three plates (its structure) inside a dashed bound (legally bound to its purpose); the top plate is the green one.
export function IllNonprofit() {
  const plates = [0, 30, 60].map((z) => box(50, 50, 130, 130, z, 18));
  const bound = box(30, 30, 170, 170, 0, 126);
  const top = P(115, 115, 126 + 8);
  return (
    <Svg cls="fc-ill--np" ps={[...floorPs(0, 230, 0, 230), ...corners(bound), [top[0], top[1] - 70]]}>
      <Floor x0={0} x1={230} y0={0} y1={230} nx={10} ny={10} />
      <g className="fc-bound fc-bound--back">{hidden(bound).map((d, i) => <path key={i} d={d} />)}</g>
      {plates.map((b, i) => <Slab key={i} b={b} tone={i === 2 ? "g" : "w"} cls="fc-np-plate" style={sv({ "--i": i })} />)}
      <path className="fc-bound" d={wire(bound)} />
      <Lead a={P(115, 115, 126)} b={[top[0], top[1] - 40]} />
      <Chip at={[top[0], top[1] - 42]} label="STIFTUNG" />
    </Svg>
  );
}

// Ecosystem growth: one small source (the Foundation's resources) and the builders' towers around it; green coins travel the arcs out to them.
export const ECO_SRC: [number, number, number] = [120, 120, 34];
export const ECO_TOWERS: [number, number, number][] = [[22, 22, 112], [198, 34, 74], [34, 198, 58], [196, 196, 36]];
export function IllEcosystem() {
  const src = box(96, 96, 48, 48, 0, ECO_SRC[2]);
  const arcs = ECO_TOWERS.map(([x, y, h]) => {
    const a = P(ECO_SRC[0], ECO_SRC[1], ECO_SRC[2]), b = P(x + 17, y + 17, h), mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - 70;
    return `M${f(a[0])},${f(a[1])}Q${f(mx)},${f(my)} ${f(b[0])},${f(b[1])}`;
  });
  const tw = ECO_TOWERS.map(([x, y, h]) => box(x, y, 34, 34, 0, h));
  const order = [0, 1, 2, 3].sort((p, q) => ECO_TOWERS[p][0] + ECO_TOWERS[p][1] - (ECO_TOWERS[q][0] + ECO_TOWERS[q][1]));
  const lab = P(198 + 17, 34 + 17, 74);
  return (
    <Svg cls="fc-ill--eco" ps={[...floorPs(0, 240, 0, 240), ...tw.flatMap(corners), [P(22, 22, 112)[0], P(22, 22, 112)[1] - 60], [lab[0] + 130, lab[1] - 60]]}>
      <Floor x0={0} x1={240} y0={0} y1={240} nx={10} ny={10} />
      {order.filter((k) => ECO_TOWERS[k][0] + ECO_TOWERS[k][1] < 240).map((k) => <Slab key={k} b={tw[k]} cls="fc-eco-tw" style={sv({ "--i": k })} />)}
      <Slab b={src} tone="g" cls="fc-eco-src" />
      {order.filter((k) => ECO_TOWERS[k][0] + ECO_TOWERS[k][1] >= 240).map((k) => <Slab key={k} b={tw[k]} cls="fc-eco-tw" style={sv({ "--i": k })} />)}
      <g className="fc-eco-arcs">{arcs.map((d, i) => <path key={i} d={d} />)}</g>
      <g className="fc-eco-coins">{arcs.map((d, i) => <circle key={i} r="4.2" cx={f(P(ECO_TOWERS[i][0] + 17, ECO_TOWERS[i][1] + 17, ECO_TOWERS[i][2])[0])} cy={f(P(ECO_TOWERS[i][0] + 17, ECO_TOWERS[i][1] + 17, ECO_TOWERS[i][2])[1] - 6)} />)}</g>
      <Lead a={lab} b={[lab[0] + 40, lab[1] - 34]} />
      <Chip at={[lab[0] + 52, lab[1] - 34]} label="BUILDERS" />
    </Svg>
  );
}

// Decentralization: one block (the Foundation) has given itself out: the pieces stand over the floor's lattice, a few of them green; the block keeps a small core.
export const DEC_PIECES: { x: number; y: number; h: number; g: boolean }[] = (() => {
  const out: { x: number; y: number; h: number; g: boolean }[] = [];
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    if (i === 2 && j === 2) continue;
    if ((i * 3 + j * 7) % 6 === 0) continue;
    out.push({ x: 18 + i * 44, y: 18 + j * 44, h: 10 + ((i * 5 + j * 3) % 4) * 7, g: (i + j * 2) % 5 === 1 });
  }
  return out.sort((a, b) => a.x + a.y - (b.x + b.y));
})();
export function IllDecentral() {
  const core = box(104, 104, 32, 32, 0, 44);
  const lab = P(18 + 4 * 44 + 11, 18 + 0 * 44 + 11, 30);
  const cx = 120, cy = 120;
  const pieces = DEC_PIECES.map((p, i) => {
    const b = box(p.x, p.y, 22, 22, 0, p.h), c = P(cx - 11, cy - 11, 0), e = P(p.x, p.y, 0);
    return { b, g: p.g, i, dx: c[0] - e[0], dy: c[1] - e[1], back: p.x + p.y < 220 };
  });
  return (
    <Svg cls="fc-ill--dec" ps={[...floorPs(0, 240, 0, 240), ...corners(core), [lab[0] + 90, lab[1] - 70]]}>
      <Floor x0={0} x1={240} y0={0} y1={240} nx={10} ny={10} />
      {pieces.filter((q) => q.back).map((q) => <Slab key={q.i} b={q.b} tone={q.g ? "g" : "w"} cls="fc-dec-p" style={sv({ "--dx": f(q.dx), "--dy": f(q.dy), "--i": q.i })} />)}
      <Slab b={core} cls="fc-dec-core" />
      {pieces.filter((q) => !q.back).map((q) => <Slab key={q.i} b={q.b} tone={q.g ? "g" : "w"} cls="fc-dec-p" style={sv({ "--dx": f(q.dx), "--dy": f(q.dy), "--i": q.i })} />)}
      <Lead a={lab} b={[lab[0] + 30, lab[1] - 46]} />
      <Chip at={[lab[0] + 40, lab[1] - 46]} label="ECOSYSTEM" />
    </Svg>
  );
}

/* ---------------------------------------------------------------- 4 · the glass vault */
// A Stiftung's funds: visible through glass on every side, held for one purpose. The stacks inside, the box's back edges through the glass, a glint that passes.
export const VAULT_STACKS: [number, number, number][] = [[70, 80, 7], [130, 70, 10], [80, 140, 5], [140, 132, 8]];
export function IllVault() {
  const g = box(30, 30, 180, 180, 0, 170), base = box(46, 46, 148, 148, 0, 12);
  const fc = faces(g);
  const stacks = [...VAULT_STACKS].sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  const top = P(120, 120, 170);
  return (
    <Svg cls="fc-ill--vault" ps={[...floorPs(0, 240, 0, 240), ...corners(g), [top[0], top[1] - 80], [top[0] + 120, top[1]]]} m={20}>
      <defs>
        <clipPath id="fc-vault-clip"><polygon points={fc.left} /><polygon points={fc.right} /><polygon points={fc.top} /></clipPath>
        <linearGradient id="fc-vault-glint" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.9" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <Floor x0={0} x1={240} y0={0} y1={240} nx={12} ny={12} />
      <g className="fc-glass-back">{hidden(g).map((d, i) => <path key={i} d={d} />)}</g>
      <Slab b={base} cls="fc-vault-base" />
      {stacks.map(([x, y, n], s) => (
        <g key={s} className="fc-vault-stack" style={sv({ "--s": s })}>
          {Array.from({ length: n }, (_, k) => <Coin key={k} x={x} y={y} z={12 + k * 7} r={17} h={7} green={k === n - 1 && x === 130} cls="fc-vault-coin" style={sv({ "--k": k })} />)}
        </g>
      ))}
      <g className="fc-glass">
        <polygon className="fc-glass__l" points={fc.left} />
        <polygon className="fc-glass__r" points={fc.right} />
        <polygon className="fc-glass__t" points={fc.top} />
      </g>
      <g clipPath="url(#fc-vault-clip)"><rect className="fc-glint" x={f(P(30, 210, 0)[0] - 60)} y={f(top[1] - 100)} width="70" height="460" fill="url(#fc-vault-glint)" transform="skewX(-28)" /></g>
      <path className="fc-glass__w" d={wire(g)} pathLength={1} />
      <Lead a={top} b={[top[0], top[1] - 44]} />
      <Chip at={[top[0], top[1] - 46]} label="PURPOSE-BOUND" />
    </Svg>
  );
}

/* ---------------------------------------------------------------- 5 · the Council (on ink) */
export function IllCouncil() {
  const exec = box(0, 0, 260, 260, 0, 20), council = box(70, 70, 120, 120, 228, 20);
  const L0 = P(70, 190, 228), L1 = P(70, 190, 26), R0 = P(190, 70, 26), R1 = P(190, 70, 228);
  const mods = [[20, 20, 16], [110, 26, 24], [150, 82, 12], [40, 110, 18], [190, 190, 14], [112, 202, 10]] as const;
  const ex = P(260, 130, 0), co = P(190, 130, 248);
  return (
    <Svg cls="fc-ill--council" ps={[...floorPs(-40, 300, -40, 300, 0), ...corners(exec), ...corners(council), [ex[0] + 150, ex[1]], [co[0] + 150, co[1] - 30], [L0[0] - 130, L0[1]]]} m={10}>
      <Floor x0={-40} x1={300} y0={-40} y1={300} nx={17} ny={17} cls="fc-floor--d" />
      <Slab b={exec} tone="d" draw cls="fc-cn-exec" />
      {mods.map(([x, y, h], i) => <Slab key={i} b={box(x, y, 26, 26, 20, h)} tone="d" draw cls="fc-cn-mod" style={sv({ "--i": i })} />)}
      <g className="fc-cn-arrows">
        <path className="fc-cn-ar fc-cn-ar--down" d={line(L0, [L1[0], L1[1]])} pathLength={1} />
        <path className="fc-cn-head fc-cn-head--down" d={`M${f(L1[0] - 6)},${f(L1[1] - 10)}L${f(L1[0])},${f(L1[1])}L${f(L1[0] + 6)},${f(L1[1] - 10)}`} />
        <path className="fc-cn-ar fc-cn-ar--up" d={line(R0, R1)} pathLength={1} />
        <path className="fc-cn-head fc-cn-head--up" d={`M${f(R1[0] - 6)},${f(R1[1] + 10)}L${f(R1[0])},${f(R1[1])}L${f(R1[0] + 6)},${f(R1[1] + 10)}`} />
        <circle className="fc-cn-pulse fc-cn-pulse--down" r="3.6" cx={f(L0[0])} cy={f((L0[1] + L1[1]) / 2)} />
        <circle className="fc-cn-pulse fc-cn-pulse--up" r="3.6" cx={f(R0[0])} cy={f((R0[1] + R1[1]) / 2)} />
        <text className="fc-cn-t fc-cn-t--down" x={f(L0[0] - 14)} y={f((L0[1] + L1[1]) / 2 + 4)} textAnchor="end">EMPOWERS</text>
        <text className="fc-cn-t fc-cn-t--up" x={f(R0[0] + 14)} y={f((R0[1] + R1[1]) / 2 + 4)}>REPORTS BACK</text>
      </g>
      <Slab b={council} tone="g" draw cls="fc-cn-council" />
      <Lead a={co} b={[co[0] + 60, co[1] - 44]} cls="fc-lead--d" />
      <Chip at={[co[0] + 60 + chipW("COUNCIL") / 2, co[1] - 32]} label="COUNCIL" dark cls="fc-cn-chip" />
      <Lead a={ex} b={[ex[0] + 40, ex[1] + 0]} cls="fc-lead--d" />
      <Chip at={[ex[0] + 40 + chipW("EXECUTIVE TEAM") / 2, ex[1] + 12]} label="EXECUTIVE TEAM" dark cls="fc-cn-chip" />
    </Svg>
  );
}

/* ---------------------------------------------------------------- 6 · the three activities: small glyphs, each with a hover */
export function GlyphAllocate() {
  const st: [number, number, number][] = [[34, 70, 3], [80, 40, 5], [86, 100, 4]];
  const sorted = [...st].sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  return (
    <Svg cls="fc-glyph fc-glyph--alloc" ps={[...floorPs(0, 140, 0, 140), P(80, 40, 5 * 7 + 30)]} m={6}>
      <Floor x0={0} x1={140} y0={0} y1={140} nx={7} ny={7} />
      {sorted.map(([x, y, n], s) => (
        <g key={s} className="fc-gl-stack" style={sv({ "--s": s })}>
          {Array.from({ length: n }, (_, k) => <Coin key={k} x={x} y={y} z={k * 7} r={14} h={7} green={k === n - 1 && n === 5} cls={k === n - 1 ? "fc-gl-top" : undefined} />)}
        </g>
      ))}
    </Svg>
  );
}
export function GlyphFunctions() {
  const base = box(10, 10, 120, 120, 0, 14);
  const mods: [number, number, number, boolean][] = [[22, 22, 22, false], [76, 22, 14, false], [22, 76, 16, false], [76, 76, 26, true]];
  return (
    <Svg cls="fc-glyph fc-glyph--func" ps={[...floorPs(0, 140, 0, 140), ...corners(box(22, 22, 42, 42, 14, 22 + 26))]} m={6}>
      <Floor x0={0} x1={140} y0={0} y1={140} nx={7} ny={7} />
      <Slab b={base} />
      {mods.map(([x, y, h, g], i) => <Slab key={i} b={box(x, y, 42, 42, 14, h)} tone={g ? "g" : "w"} cls="fc-gl-mod" style={sv({ "--i": i })} />)}
    </Svg>
  );
}
export function GlyphDevolve() {
  const cubes: [number, number, number, boolean, number, number][] = [[44, 44, 28, false, -1, -1], [72, 44, 22, false, 1, -1], [44, 72, 18, false, -1, 1], [72, 72, 34, true, 1, 1]];
  return (
    <Svg cls="fc-glyph fc-glyph--dev" ps={[...floorPs(0, 140, 0, 140), P(44, 44, 40)]} m={6}>
      <Floor x0={0} x1={140} y0={0} y1={140} nx={7} ny={7} />
      {cubes.map(([x, y, h, g, sx, sy], i) => {
        const o = P(sx * 26, sy * 26, 0);
        return <Slab key={i} b={box(x, y, 24, 24, 0, h)} tone={g ? "g" : "w"} cls="fc-gl-cube" style={sv({ "--ox": f(o[0]), "--oy": f(o[1]) })} />;
      })}
    </Svg>
  );
}

/* ---------------------------------------------------------------- 8 · the close: the hero's columns again, now standing on their own (no plinth), in ink line */
export function IllClose() {
  const g = grid(-60, 420, -60, 420, 0, 16, 16), T = 0.62;
  const ps: V[] = [...floorPs(-60, 420, -60, 420), ...PILLARS.flatMap((p) => corners(pBox(p, T)))];
  return (
    <Svg cls="fc-ill--close" ps={ps} m={4}>
      <defs>
        <radialGradient id="fc-cl-fade" cx="50%" cy="62%" r="50%"><stop offset="0.4" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <mask id="fc-cl-mask" maskUnits="userSpaceOnUse" x="-500" y="-400" width="1000" height="900"><rect x="-500" y="-400" width="1000" height="900" fill="url(#fc-cl-fade)" /></mask>
      </defs>
      <g className="fc-floor__g fc-cl-ground" mask="url(#fc-cl-mask)">{g.map((d, i) => <path key={i} d={d} />)}</g>
      {/* where the plinth stood: only its trace is left */}
      <path className="fc-cl-trace" d={line(P(-40, -40), P(400, -40), P(400, 400), P(-40, 400)) + "Z"} />
      {PILLARS.map((p, k) => p.ghost
        ? <path key={k} className="fc-cl-ghost" d={wire(pBox(p, T))} />
        : <Slab key={k} b={pBox(p, T)} tone={(p.i === 1 && p.j === 1) || (p.i === 4 && p.j === 3) ? "g" : "w"} cls="fc-cl-col" style={sv({ "--i": k })} />)}
    </Svg>
  );
}
