// Research B, each paper's drawn cover (one per card, all at one scale: parts.tsx Frame). Each builds once as it arrives (kit.ts mountDraw):
//   White Paper: the document open on the floor, its two pages of text, and the application layer it describes floating over it (apps on a platform,
//     one green), tied down to the pages;
//   Nightshade: one block split into parallel shard columns (the ghost of the whole block round them, one shard green), the block's header over them,
//     tied to each shard;
//   Proof-of-Response: two nodes; a ping arcs from one to the other and the response comes back low; a green check over the first. Signals run the two
//     arcs while the card is on screen (motion.ts);
//   DCML: an enclave chip: the chip and its pins, a glass enclave on it with a small model inside (three layers, its output green), and a lock on top.
// Decorative: each card's text carries the meaning.
import type { ReactNode } from "react";
import { P, f, dots, line, arc, box, wire, onLeft, onTop, cornersOf, type B6, type V } from "./kit";
import { Slab, Text, Frame, backEdges } from "./parts";

/** every cover's frame, in drawing units */
const FW = 250, FH = 168;
const Floor = ({ d }: { d: string }) => <path className="rb-dots d-floor" d={d} />;

/* ─────────────────────────────── 01 · the White Paper: an open document under its application layer */
function WhitePaper() {
  const back: B6 = [-2, -2, 86, 60, 0, 1.5], left: B6 = [0, 0, 40, 56, 1.5, 2], right: B6 = [42, 0, 40, 56, 1.5, 2];
  const Z = 34, layer: B6 = [4, 6, 74, 44, Z, 3];
  const apps: B6[] = [[10, 21, 14, 14, Z + 3, 9], [32, 21, 14, 14, Z + 3, 13], [54, 21, 14, 14, Z + 3, 7]];
  const ties: V[][] = [[P(4, 50, 3.5), P(4, 50, Z)], [P(78, 50, 3.5), P(78, 50, Z)], [P(78, 6, 3.5), P(78, 6, Z)]];
  return (
    <Frame ps={[...cornersOf(back), ...cornersOf(layer), ...apps.flatMap(cornersOf)]} w={FW} h={FH} cls="rb-cv rb-cv--wp">
      <Floor d={dots(-20, -16, 100, 74, 10)} />
      <Slab b={back} />
      <Slab b={left} />
      <Slab b={right} />
      <g className="d-o">
        <Text x={5} y={6} z={3.5} w={30} rows={9} gap={5} head={2} />
        <Text x={47} y={6} z={3.5} w={30} rows={9} gap={5} />
      </g>
      <g className="rb-ties d-o">{ties.map((t, i) => <path key={i} d={line(...t)} />)}</g>
      <g className="d-p">
        <Slab b={layer} tone="lit" />
        {apps.map((b, i) => <Slab key={i} b={b} tone={i === 1 ? "g" : "w"} />)}
      </g>
      <path className="rb-ties d-o" d={line(P(4, 6, 3.5), P(4, 6, Z))} />
    </Frame>
  );
}

/* ─────────────────────────────── 02 · Nightshade: a block split into parallel shards */
function Nightshade() {
  const H = 30, cols: B6[] = Array.from({ length: 4 }, (_, k) => [k * 17, 0, 13, 40, 0, H]);
  const Z = 80, head: B6 = [10, 6, 44, 28, Z, 4];
  return (
    <Frame ps={[...cornersOf([-4, -4, 72, 48, 0, H + 4]), ...cornersOf(head)]} w={FW} h={FH} cls="rb-cv rb-cv--ns">
      <Floor d={dots(-24, -18, 92, 64, 10)} />
      <path className="rb-ghost d-o" d={backEdges([-4, -4, 72, 48, 0, H + 4])} />
      <g className="rb-ties d-o">{cols.map((c, k) => <path key={k} d={line(P(c[0] + 6.5, 20, H), P(c[0] + 6.5, 20, Z))} />)}</g>
      <g className="d-p">
        {cols.map((c, k) => (
          <g key={k}>
            <Slab b={c} tone={k === 1 ? "g" : "w"} />
            <path className="rb-chunk" d="M0,6h7M0,12h7M0,18h7M0,24h5" transform={onTop(c[0] + 3, c[1] + 6, H)} />
          </g>
        ))}
      </g>
      <path className="rb-ghost d-o" d={wire(box(-4, -4, 72, 48, 0, H + 4))} />
      <g className="d-p">
        <Slab b={head} />
        <Text x={16} y={12} z={Z + 4} w={26} rows={3} gap={5} head={1} />
      </g>
    </Frame>
  );
}

/* ─────────────────────────────── 03 · Proof-of-Response: a ping, its response and a check */
const A: [number, number, number] = [13, 53, 30], B: [number, number, number] = [83, -7, 30];
/** the two routes (screen points), for the signals that run them (motion.ts) */
export const PING = arc([A[0] + 3, A[1] - 3, A[2] + 2], [B[0] - 3, B[1] + 3, B[2] + 2], 34, 28);
export const RESP = arc([B[0] + 1, B[1] + 5, B[2] - 2], [A[0] + 5, A[1] + 1, A[2] - 2], 12, 28);
/** an arrowhead at the end of a route */
function head(ps: V[], s = 6) {
  const [a, b] = [ps[ps.length - 3], ps[ps.length - 1]], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  return line([b[0] - ux * s - uy * s * 0.6, b[1] - uy * s + ux * s * 0.6], b, [b[0] - ux * s + uy * s * 0.6, b[1] - uy * s - ux * s * 0.6]);
}
function Node({ x, y, cls = "" }: { x: number; y: number; cls?: string }) {
  const plinth: B6 = [x - 13, y - 13, 26, 26, 0, 4], body: B6 = [x - 10, y - 10, 20, 20, 4, 26];
  return (
    <g className={cls}>
      <Slab b={plinth} />
      <Slab b={body} />
      {/* its racks: three slots and a light on the face towards us */}
      <g className="rb-rack" transform={onLeft(x - 10, y + 10, 26)}>
        <path d="M4,5h12M4,10h12M4,15h12" />
        <circle cx="16" cy="20" r="1.6" />
      </g>
    </g>
  );
}
function ProofOfResponse() {
  const chk = P(A[0], A[1], A[2] + 22);
  return (
    <Frame ps={[...cornersOf([A[0] - 13, A[1] - 13, 26, 26, 0, 30]), ...cornersOf([B[0] - 13, B[1] - 13, 26, 26, 0, 30]), ...PING.ps]} w={FW} h={FH} cls="rb-cv rb-cv--por">
      <Floor d={dots(-6, -24, 104, 70, 10)} />
      <Node x={B[0]} y={B[1]} cls="d-p" />
      <Node x={A[0]} y={A[1]} cls="d-p" />
      <g className="rb-route rb-route--ping d-o"><path d={PING.d} /><path className="rb-route__head" d={head(PING.ps)} /></g>
      <g className="rb-route rb-route--resp d-o"><path d={RESP.d} /><path className="rb-route__head" d={head(RESP.ps)} /></g>
      <g className="rb-sigs"><circle r="3.2" /><circle r="3.2" /></g>
      <g className="rb-check d-o" transform={`translate(${f(chk[0])} ${f(chk[1])})`}>
        <circle r="9" />
        <path d="M-4,0.3l2.8,2.8l5.4,-5.6" />
      </g>
    </Frame>
  );
}

/* ─────────────────────────────── 04 · DCML: an enclave chip, locked, a model inside */
function Dcml() {
  const chip: B6 = [0, 0, 64, 64, 0, 6], glass: B6 = [10, 10, 44, 44, 6, 34], Zt = 40;
  const pins = [8, 20, 32, 44, 56];
  // the model: a small network drawn upright in the enclave (on the plane through its middle, facing us): three in, four hidden, one out
  const L: [number, number][][] = [
    [[1, 4], [1, 13], [1, 22]],
    [[19, 0], [19, 8.7], [19, 17.3], [19, 26]],
    [[37, 13]],
  ];
  let wires = "";
  for (let k = 0; k < L.length - 1; k++) for (const a of L[k]) for (const b of L[k + 1]) wires += `M${a[0]},${a[1]}L${b[0]},${b[1]}`;
  // the lock on the enclave's lid: its shackle (closed) behind the body, the body, a green keyhole on its front
  const body: B6 = [21, 26, 22, 12, Zt, 13], Zb = Zt + 13, r = 7;
  const u: V[] = [P(39, 32, Zb - 1), P(39, 32, Zb + 6)];
  for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI; u.push(P(32 + r * Math.cos(a), 32, Zb + 6 + r * Math.sin(a))); }
  u.push(P(25, 32, Zb + 6), P(25, 32, Zb - 1));
  const shackle = line(...u);
  return (
    <Frame ps={[...cornersOf(chip), ...cornersOf([0, 0, 69, 69, 0, 6]), P(32, 32, Zb + 6 + r + 2)]} w={FW} h={FH} cls="rb-cv rb-cv--dcml">
      <Floor d={dots(-18, -18, 86, 86, 10)} />
      <Slab b={chip} />
      <g className="d-p">
        {pins.map((x) => <Slab key={`y${x}`} b={[x - 2, 64, 4, 5, 1.5, 2]} edges={false} />)}
        {pins.map((y) => <Slab key={`x${y}`} b={[64, y - 2, 5, 4, 1.5, 2]} edges={false} />)}
      </g>
      <path className="rb-die d-o" d="M0,0h40v40h-40z" transform={onTop(12, 12, 6)} />
      <path className="rb-glass__back d-o" d={backEdges(glass)} />
      <g className="rb-model d-o" transform={onLeft(12, 34, 34)}>
        <path d={wires} />
        {L.map((ly, k) => ly.map(([x, y], j) => <circle key={`${k}-${j}`} className={k === L.length - 1 ? "is-g" : ""} cx={x} cy={y} r={k === L.length - 1 ? 3.8 : 2.8} />))}
      </g>
      <Slab b={glass} tone="glass" />
      <g className="d-p">
        <path className="rb-shk rb-shk--o" d={shackle} />
        <path className="rb-shk rb-shk--i" d={shackle} />
        <Slab b={body} />
        <g className="rb-key" transform={onLeft(32, 38, Zb - 4.5)}><circle cx="0" cy="0" r="2.8" /><path d="M0,1.4V6.4" /></g>
      </g>
    </Frame>
  );
}

export const COVERS: Record<string, () => ReactNode> = { whitepaper: WhitePaper, nightshade: Nightshade, por: ProofOfResponse, dcml: Dcml };
