// Version D's static illustrations, in the rail's isometric hand (./iso.tsx). Each is one inline SVG (aria-hidden); its parts carry classes that
// foundation-d.css moves (hover lifts in the pillars, flowing dashes, a hovering module) only under .fd[data-motion] and never with reduced motion.
import { Box, Quad, Floor, DotFloor, Coin, Person, Chip, P, arc, line, pts, vb, chipW, type V } from "./iso";

const Svg = ({ view, cls, children }: { view: string; cls: string; children: React.ReactNode }) => (
  <svg className={`fd-iso ${cls}`} viewBox={view} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">{children}</svg>
);
/** a dashed box outline (a volume that is open, or gone) */
function Ghost({ x, y, z = 0, w, d, h, cls = "i-ghost" }: { x: number; y: number; z?: number; w: number; d: number; h: number; cls?: string }) {
  const a = (i: number, j: number, k: number) => P(x + i * w, y + j * d, z + k * h);
  return (
    <g className={cls}>
      <path d={line(a(0, 0, 0), a(1, 0, 0), a(1, 1, 0), a(0, 1, 0), a(0, 0, 0)) + line(a(0, 0, 1), a(1, 0, 1), a(1, 1, 1), a(0, 1, 1), a(0, 0, 1))
        + line(a(1, 0, 0), a(1, 0, 1)) + line(a(1, 1, 0), a(1, 1, 1)) + line(a(0, 1, 0), a(0, 1, 1)) + line(a(0, 0, 0), a(0, 0, 1))} />
    </g>
  );
}

/* ── the three pillars ── */
export function IlloNonprofit() {
  const F: V[] = [P(0, 0), P(200, 0), P(200, 150), P(0, 150), P(70, 52, 128), [P(0, 0)[0] - 4, P(70, 52, 128)[1] - 30]];
  const lines = [[70, 132, 84], [70, 120, 76], [70, 136, 68], [70, 110, 60], [70, 128, 52]];
  return (
    <Svg view={vb(F, 10)} cls="fd-iso--np">
      <Floor w={200} d={150} n={10} />
      <Ghost x={48} y={42} w={104} d={66} h={118} cls="i-ghost fd-np__glass" />
      <Box x={48} y={42} w={104} d={66} h={10} />
      <g className="fd-np__sheet">
        <Box x={62} y={70} z={10} w={80} d={5} h={84} />
        {lines.map(([a, b, z], i) => <path key={i} className="i-ln" d={line(P(a, 75, z + 10), P(b, 75, z + 10))} />)}
      </g>
      <g className="fd-np__seal"><Coin x={128} y={96} z={10} r={9} h={3.5} tone="green" /></g>
      <Person x={36} y={124} cls="fd-np__p" />
      <Chip at={[P(0, 0)[0] - 4, P(70, 52, 128)[1] - 30]} label="STIFTUNG" />
    </Svg>
  );
}

export function IlloGrowth() {
  const towers: [number, number, number, boolean][] = [[118, 24, 30, false], [150, 58, 54, true], [112, 70, 20, false], [158, 104, 38, false]];
  const src: V = P(45, 112, 22);
  const F: V[] = [P(0, 0), P(210, 0), P(210, 160), P(0, 160), P(150, 58, 92), [P(0, 0)[0] - 30, P(150, 58, 92)[1] - 40]];
  return (
    <Svg view={vb(F, 10)} cls="fd-iso--gr">
      <Floor w={210} d={160} n={10} />
      <Box x={22} y={90} w={46} d={46} h={8} />
      <Coin x={45} y={113} z={8} r={10} h={3.5} />
      <Coin x={45} y={113} z={11.5} r={10} h={3.5} />
      <Coin x={45} y={113} z={15} r={10} h={3.5} tone="green" />
      {towers.map(([x, y, h], i) => <path key={i} className="i-arc fd-flow" d={arc(src, P(x + 11, y + 11, h + 4), 46 + i * 6)} />)}
      {towers.map(([x, y, h, g], i) => (
        <g key={i} className="fd-gr__t" style={{ ["--i" as string]: i }}>
          <Box x={x} y={y} w={22} d={22} h={h} tone={g ? "green" : "light"} />
        </g>
      ))}
      <Person x={104} y={44} />
      <Person x={180} y={86} green />
      <Person x={136} y={130} />
      <Chip at={[P(0, 0)[0] - 30, P(150, 58, 92)[1] - 40]} label="ECOSYSTEM" />
    </Svg>
  );
}

export function IlloDecentral() {
  const nodes: [number, number, number, number][] = [[28, 30, 0, 12], [92, 18, 1, 0], [158, 28, 0, 18], [24, 92, 2, 0], [172, 86, 0, 10], [40, 146, 0, 22], [104, 148, 1, 0], [168, 140, 0, 14], [100, 84, 3, 0]];
  const links = [[0, 1], [1, 2], [0, 3], [2, 4], [3, 5], [5, 6], [6, 7], [4, 7], [3, 8], [8, 4], [1, 8], [8, 6]];
  const chip: V = [P(0, 170)[0] + 6, P(28, 30, 40)[1] - 36];
  const F: V[] = [P(0, 0), P(200, 0), P(200, 170), P(0, 170), P(28, 30, 40), chip, [chip[0] + chipW("DECENTRALIZED"), chip[1]]];
  return (
    <Svg view={vb(F, 10)} cls="fd-iso--dc">
      <Floor w={200} d={170} n={10} />
      <Ghost x={76} y={60} w={48} d={48} h={46} cls="i-ghost fd-dc__gone" />
      {links.map(([a, b], i) => <path key={i} className="i-link fd-flow" d={line(P(nodes[a][0], nodes[a][1]), P(nodes[b][0], nodes[b][1]))} />)}
      {nodes.map(([x, y, kind, h], i) => (
        <g key={i} className="fd-dc__n" style={{ ["--i" as string]: i, ["--dx" as string]: ((P(x, y)[0] - P(100, 84)[0]) * 0.05).toFixed(2), ["--dy" as string]: ((P(x, y)[1] - P(100, 84)[1]) * 0.05).toFixed(2) }}>
          {kind === 0 && <Box x={x - 7} y={y - 7} w={14} d={14} h={h} tone={i === 2 ? "green" : "light"} />}
          {kind === 1 && <Person x={x} y={y} green={i === 6} />}
          {kind === 2 && <><Box x={x - 10} y={y - 10} w={20} d={20} h={4} /><Person x={x} y={y} z={4} /></>}
          {kind === 3 && <Coin x={x} y={y} r={8} h={6} tone="green" />}
        </g>
      ))}
      <Chip at={chip} label="DECENTRALIZED" />
    </Svg>
  );
}

/* ── how the Foundation operates ── */
export function IlloAllocate() {
  const recv: [number, number][] = [[150, 6], [176, 66], [146, 124]];
  const top: V = P(55, 95, 40);
  const F: V[] = [P(0, 0), P(230, 0), P(230, 170), P(0, 170), P(55, 95, 60), [P(0, 0)[0] - 40, P(55, 95, 60)[1] - 46]];
  return (
    <Svg view={vb(F, 10)} cls="fd-iso--al">
      <Floor w={230} d={170} n={11} />
      <Box x={20} y={60} w={70} d={70} h={10} />
      <Box x={20} y={60} z={16} w={70} d={70} h={10} />
      <Coin x={46} y={86} z={26} r={11} h={4} />
      <Coin x={46} y={86} z={30} r={11} h={4} />
      <Coin x={66} y={104} z={26} r={11} h={4} />
      <Coin x={46} y={86} z={34} r={11} h={4} tone="green" />
      {recv.map(([x, y], i) => <path key={i} className="i-arc fd-flow" d={arc(top, P(x + 20, y + 20, 12), 60 - i * 8)} />)}
      {recv.map(([x, y], i) => (
        <g key={i} className="fd-al__r" style={{ ["--i" as string]: i }}>
          <Box x={x} y={y} w={40} d={40} h={6} />
          <Coin x={x + 20} y={y + 20} z={6} r={8} h={3.5} tone="green" />
        </g>
      ))}
      <Chip at={[P(0, 0)[0] - 40, P(55, 95, 60)[1] - 46]} label="TREASURY" />
    </Svg>
  );
}

export function IlloFunctions() {
  const Z = 8, mods: [number, number, string][] = [[44, 40, "chat"], [94, 40, "link"], [44, 92, "vote"]];
  const glyph = (x: number, y: number, kind: string, z: number) => {
    const c = (a: number, b: number) => P(x + a, y + b, z);
    if (kind === "chat") return [0, 1, 2].map((i) => { const [a, b] = c(9 + i * 8, 26 - i * 8); return <circle key={i} className="i-inkdot" cx={a} cy={b} r="2" />; });
    if (kind === "link") { const q: V[] = [c(8, 8), c(26, 12), c(14, 26)]; return <><path className="i-ln" d={line(q[0], q[1], q[2], q[0])} />{q.map(([a, b], i) => <circle key={i} className={i === 1 ? "i-g" : "i-inkdot"} cx={a} cy={b} r="2.4" />)}</>; }
    return <polygon className="i-slot" points={pts(c(8, 15), c(26, 15), c(26, 19), c(8, 19))} />;
  };
  const F: V[] = [P(0, 0), P(220, 0), P(220, 180), P(0, 180), P(94, 92, 90), [P(0, 0)[0] - 30, P(44, 40, 60)[1] - 46]];
  return (
    <Svg view={vb(F, 10)} cls="fd-iso--fn">
      <Floor w={220} d={180} n={11} />
      <Box x={30} y={28} w={118} d={118} h={Z} />
      {mods.map(([x, y, k], i) => <Box key={i} x={x} y={y} z={Z} w={34} d={34} h={18}>{glyph(x, y, k, Z + 18)}</Box>)}
      <polygon className="i-socket" points={pts(P(94, 92, Z), P(128, 92, Z), P(128, 126, Z), P(94, 126, Z))} />
      <g className="fd-fn__guide">{[[94, 92], [128, 92], [128, 126], [94, 126]].map(([x, y], i) => <path key={i} className="i-guide" d={line(P(x, y, Z), P(x, y, Z + 42))} />)}</g>
      <g className="fd-fn__mod"><Box x={94} y={92} z={Z + 42} w={34} d={34} h={18} tone="green" /></g>
      <Person x={182} y={70} />
      <Person x={176} y={150} green />
      <Chip at={[P(0, 0)[0] - 30, P(44, 40, 60)[1] - 46]} label="FUNCTIONS" />
    </Svg>
  );
}

export function IlloChampion() {
  const net: [number, number, number][] = [[150, 30, 0], [196, 60, 1], [128, 84, 2], [180, 118, 0], [120, 140, 1], [196, 160, 2], [82, 158, 0]];
  const links = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5], [4, 6]];
  const src: V = P(42, 42, 16);
  const chip: V = [P(0, 180)[0] + 8, P(42, 42, 16)[1] - 70];
  const F: V[] = [P(0, 0), P(230, 0), P(230, 180), P(0, 180), P(42, 42, 40), chip, [chip[0] + chipW("DEVOLVE"), chip[1]]];
  const fly: V[] = [0, 2, 4].map((i) => { const [x, y] = net[i], b = P(x, y, 10); return [(src[0] + b[0]) / 2, (src[1] + b[1]) / 2 - 34] as V; });
  return (
    <Svg view={vb(F, 10)} cls="fd-iso--ch">
      <Floor w={230} d={180} n={11} />
      {links.map(([a, b], i) => <path key={i} className="i-link" d={line(P(net[a][0], net[a][1]), P(net[b][0], net[b][1]))} />)}
      <Box x={30} y={30} w={24} d={24} h={14} tone="ink"><Quad x={39} y={39} z={14} w={6} d={6} /></Box>
      {[0, 2, 4].map((i) => <path key={i} className="i-arc fd-flow" d={arc(src, P(net[i][0], net[i][1], 10), 68)} />)}
      {net.map(([x, y, k], i) => (
        <g key={i} className="fd-ch__n" style={{ ["--i" as string]: i }}>
          {k === 0 && <Box x={x - 8} y={y - 8} w={16} d={16} h={10} tone={i === 3 ? "green" : "light"} />}
          {k === 1 && <Person x={x} y={y} green={i === 4} />}
          {k === 2 && <><Box x={x - 11} y={y - 11} w={22} d={22} h={4} /><Person x={x} y={y} z={4} /></>}
        </g>
      ))}
      {fly.map(([a, b], i) => (
        <g key={i} transform={`translate(${a.toFixed(1)} ${b.toFixed(1)})`}>
          <g className="fd-ch__fly" style={{ ["--i" as string]: i }}><Box x={-3} y={-3} w={6} d={6} h={6} tone={i === 1 ? "green" : "light"} /></g>
        </g>
      ))}
      <Chip at={chip} label="DEVOLVE" />
    </Svg>
  );
}

/* ── the Council (on ink): the Council's plate floats over the executive team's; it empowers (down), they report back (up) ── */
export function IlloCouncil() {
  const ZC = 118, members: [number, number][] = [[104, 98], [124, 92], [144, 98], [110, 118], [134, 116]];
  const ops: [number, number, number][] = [[62, 82, 0], [86, 150, 1], [168, 72, 2], [190, 130, 0], [58, 128, 1], [140, 162, 2], [112, 186, 1]];
  const dn: [V, V] = [P(96, 128, ZC), P(96, 128, 12)], up: [V, V] = [P(166, 92, 12), P(166, 92, ZC)];
  const cC: V = [P(150, 80, ZC + 40)[0] + 26, P(150, 80, ZC + 40)[1] - 18], cE: V = [P(232, 200, 12)[0] + 14, P(232, 200, 12)[1] - 6];
  const F: V[] = [P(0, 0), P(280, 0), P(280, 240), P(0, 240), P(124, 98, ZC + 30), [cC[0] + chipW("COUNCIL"), cC[1]], [cE[0] + chipW("EXECUTIVE TEAM"), cE[1] + 22]];
  return (
    <Svg view={vb(F, 14)} cls="fd-iso--co">
      <DotFloor w={280} d={240} step={10} />
      <g className="fd-co__exec">
        <Box x={36} y={52} w={196} d={148} h={12} />
        {ops.map(([x, y, k], i) => (
          <g key={i}>
            {k === 0 && <Box x={x - 9} y={y - 9} z={12} w={18} d={18} h={12} />}
            {k === 1 && <Person x={x} y={y} z={12} />}
            {k === 2 && <Box x={x - 12} y={y - 12} z={12} w={24} d={24} h={5} />}
          </g>
        ))}
      </g>
      <path className="i-guide i-guide--soft" d={line(P(84, 70, 12), P(84, 70, ZC)) + line(P(184, 70, 12), P(184, 70, ZC)) + line(P(184, 146, 12), P(184, 146, ZC)) + line(P(84, 146, 12), P(84, 146, ZC))} />
      <path className="i-flow i-flow--dn" d={line(dn[0], dn[1])} />
      <path className="i-head i-head--dn" d={`M${dn[1][0] - 4},${dn[1][1] - 7}L${dn[1][0]},${dn[1][1]}L${dn[1][0] + 4},${dn[1][1] - 7}`} />
      <path className="i-flow i-flow--up" d={line(up[0], up[1])} />
      <path className="i-head i-head--up" d={`M${up[1][0] - 4},${up[1][1] + 7}L${up[1][0]},${up[1][1]}L${up[1][0] + 4},${up[1][1] + 7}`} />
      <g className="fd-co__council">
        <Box x={84} y={70} z={ZC} w={100} d={76} h={9}><Quad x={98} y={84} z={ZC + 9} w={72} d={48} cls="i-g i-g--soft" /></Box>
        {members.map(([x, y], i) => <Person key={i} x={x} y={y} z={ZC + 9} green={i === 2} />)}
      </g>
      <text className="i-note" x={dn[0][0] - 10} y={dn[0][1] + 34} textAnchor="end">EMPOWERS</text>
      <text className="i-note" x={up[0][0] + 10} y={up[1][1] + 40}>REPORTS BACK</text>
      <Chip at={cC} label="COUNCIL" />
      <Chip at={cE} label="EXECUTIVE TEAM" />
    </Svg>
  );
}
