// Protocol A's section drawings, one per idea, each there to explain it (live.ts runs them; the markup is the finished frame, what reduced motion shows):
//   ns · Nightshade 3.0: execution below (shards, the private one dark), consensus lifted above it, state witnesses carried up between (decoupled);
//   rs · Dynamic resharding: a glass shard fills to its state-size threshold and splits in two, with no vote;
//   sp · Speed: blocks every 600 ms, each final 1.2 s later, the height counting;
//   pv · Private Shard: a dark shard's rows hidden, one disclosed to an auditor (selective disclosure);
//   qt · Quantum security: one account, its key rotated to a quantum-safe one (ML-DSA);
//   cs · Chain Signatures: one NEAR account signs on Bitcoin, Ethereum, Solana and more, no bridge;
//   ag · AI layer: agents inside enclaves (TEEs) on the network, talking.
import { P, arc, at, box, coin, dots, f, faces, onTop, vbox, type B6, type V } from "./kit";
import { Blk, Glass, Key, Lab, Pawn, Plinth, labEnd } from "./parts";

const svgProps = (scene: string, label: string, vb: string) => ({ className: "pa-art", "data-draw": "", "data-scene": scene, viewBox: vb, role: "img", "aria-label": label });
const corners = (b: B6): V[] => { const x = box(...b); return [P(x.x0, x.y0, x.z1), P(x.x1, x.y0, x.z0), P(x.x1, x.y1, x.z0), P(x.x0, x.y1, x.z0), P(x.x1, x.y0, x.z1), P(x.x0, x.y1, x.z1)]; };

/* ───────────────────────── ns · Nightshade 3.0 ───────────────────────── */
export const NS = {
  plate: [-10, -10, 236, 100, -12, 12] as B6,
  shards: [10, 66, 122].map((x) => ({ x, y: 15, w: 40, d: 50 })),
  priv: [178, 15, 36, 50, 0, 30] as B6,
  top: 30, cons: 112, lift: 72,
};
const nsWit = NS.shards.map((s) => ({ a: P(s.x + s.w / 2, s.y + s.d / 2, NS.top), b: P(s.x + s.w / 2, s.y + s.d / 2, NS.cons) }));
export const NS_WIT = nsWit;
const nsAtom = arc([30, 40, NS.top], [86, 40, NS.top], 36);
const NS_FS = 6.4;
const NS_LABS = [
  { k: "c", a: P(226, 40, NS.cons + 6), d: [24, -10] as V, t: "consensus" },
  { k: "w", a: [nsWit[2].a[0], (nsWit[2].a[1] + nsWit[2].b[1]) / 2] as V, d: [64, 6] as V, t: "state witnesses" },
  { k: "e", a: P(226, 60, 0), d: [22, 14] as V, t: "execution" },
  { k: "p", a: P(196, 40, 30), d: [40, -30] as V, t: "private shard" },
];
const NS_VB = vbox([...corners(NS.plate), ...corners([-10, -10, 236, 100, NS.cons, 6]), ...NS_LABS.map((l) => labEnd(l.a, l.d, l.t, NS_FS))], 12);
export function ArtNightshade() {
  return (
    <svg {...svgProps("ns", "Nightshade 3.0: consensus lifted away from execution, state witnesses carried between them, and a private shard among the shards.", NS_VB.s)}>
      <path className="pa-dots d-floor" d={dots(-30, -30, 250, 110, 20, -12)} />
      <Blk b={NS.plate} cls="d-f" />
      {NS.shards.map((s) => <g key={s.x} className="d-p">{[0, 1].map((k) => <Blk key={k} b={[s.x, s.y, s.w, s.d, k * 17, 13]} />)}</g>)}
      <g className="d-p"><Blk b={NS.priv} cls="pa-dk" /></g>
      <path className="ns-atom d-o" d={nsAtom.d} />
      {nsWit.map((w, i) => <path key={i} className="ns-wit d-o" d={`M${f(w.a[0])},${f(w.a[1])}L${f(w.b[0])},${f(w.b[1])}`} />)}
      {nsWit.map((w, i) => <circle key={i} className="ns-wd" cx={f(w.a[0])} cy={f(w.a[1])} r="3" />)}
      <g className="ns-cons"><g className="d-p">
        <Glass b={[-10, -10, 236, 100, NS.cons, 6]} />
        {[0, 1, 2, 3].map((i) => <Blk key={i} b={at(14 + i * 58, 40, 22, 22, NS.cons + 6, 7)} />)}
      </g></g>
      {NS_LABS.map((l) => <Lab key={l.k} {...l} fs={NS_FS} cls="d-o" />)}
    </svg>
  );
}

/* ───────────────────────── rs · Dynamic resharding ───────────────────────── */
export const RS = { x: 50, w: 50, y: 30, d: 60, h: 110, thr: 90, fill0: 18, ay: 18, by: 74, hd: 28, plate: [0, 0, 150, 120, -10, 10] as B6 };
const RS_THR = faces(box(RS.x, RS.y, RS.w, RS.d, RS.thr, 0)).top;
export const RS_CHECK: V = P(RS.x + RS.w, RS.y, RS.thr);
const RS_FS = 6.8;
const RS_LABS = [
  { k: "t", a: P(RS.x, RS.y + RS.d, RS.thr), d: [-26, -16] as V, t: "state-size threshold" },
  { k: "s", a: P(RS.x + RS.w, RS.by + RS.hd, 0), d: [30, 26] as V, t: "split · no vote" },
];
const RS_VB = vbox([...corners(RS.plate), P(RS.x, RS.y, RS.h + 4), ...RS_LABS.map((l) => labEnd(l.a, l.d, l.t, RS_FS)), [RS_CHECK[0] + 30, RS_CHECK[1] - 20]], 12);
/** the boxes the loop redraws: a fill and its glass, for the whole shard and each half */
export const rsFill = (y: number, d: number, z: number): B6 => [RS.x + 3, y + 3, RS.w - 6, d - 6, 0, Math.max(1, z)];
export const rsGlass = (y: number, d: number): B6 => [RS.x, y, RS.w, d, 0, RS.h];
export function ArtReshard() {
  const half = RS.thr / 2;
  return (
    <svg {...svgProps("rs", "Dynamic resharding: a shard fills to its state-size threshold, then splits in two automatically.", RS_VB.s)}>
      <path className="pa-dots d-floor" d={dots(-20, -20, 170, 140, 20, -10)} />
      <Blk b={RS.plate} cls="d-f" />
      <g className="rs-w" opacity="0"><Blk b={rsFill(RS.y, RS.d, RS.fill0)} cls="rs-fill" /><Glass b={rsGlass(RS.y, RS.d)} /></g>
      <g className="rs-a"><g className="d-p"><Blk b={rsFill(RS.ay, RS.hd, half)} cls="rs-fill" /><Glass b={rsGlass(RS.ay, RS.hd)} /></g></g>
      <g className="rs-b"><g className="d-p"><Blk b={rsFill(RS.by, RS.hd, half)} cls="rs-fill" /><Glass b={rsGlass(RS.by, RS.hd)} /></g></g>
      <polygon className="rs-thr d-o" points={RS_THR} />
      <g className="rs-ok d-o" transform={`translate(${f(RS_CHECK[0] + 14)} ${f(RS_CHECK[1] - 8)})`}><circle r="8" /><path d="M-3.4,0.2l2.3,2.4l4.6-5" /></g>
      {RS_LABS.map((l) => <Lab key={l.k} {...l} fs={RS_FS} cls="d-o" />)}
    </svg>
  );
}

/* ───────────────────────── sp · Speed (2D: a track of blocks) ───────────────────────── */
export const SP = { n: 9, pitch: 58, size: 44, right: 520, y: 92, h0: 148203117 };
export function ArtSpeed() {
  const xs = Array.from({ length: SP.n + 1 }, (_, i) => SP.right - SP.size - i * SP.pitch);
  return (
    <svg className="pa-art pa-art--2d" data-scene="sp" viewBox="0 0 560 230" preserveAspectRatio="xMaxYMid slice" role="img" aria-label="A block every 600 milliseconds; each is final 1.2 seconds later.">
      <text className="sp-h" x="544" y="40" textAnchor="end"><tspan className="sp-h__k">block </tspan><tspan className="sp-h__n">#{SP.h0.toLocaleString("en-US")}</tspan></text>
      <path className="sp-rail" d={`M0,${SP.y + SP.size / 2}H560`} />
      {xs.map((x, i) => (
        <g key={i} className={`sp-b ${i === 0 ? "is-new" : i === 1 ? "is-pend" : i === 2 ? "is-fin is-just" : "is-fin"}`} transform={`translate(${x} ${SP.y})`}>
          <rect width={SP.size} height={SP.size} rx="3" />
          <text x={SP.size / 2} y={SP.size / 2 + 4}>{String((SP.h0 - i) % 1000).padStart(3, "0")}</text>
        </g>
      ))}
      {/* 600 ms: one block's pitch, over the newest (a phone crops the track from its left: the newest blocks, the counter and both spans stay) */}
      <g className="sp-br sp-br--t" transform={`translate(${SP.right - SP.size - SP.pitch} ${SP.y - 14})`}>
        <path d={`M${SP.size / 2},6V0H${SP.pitch + SP.size / 2}V6`} /><text x={SP.pitch / 2 + SP.size / 2} y="-8">600 ms</text>
      </g>
      {/* 1.2 s: from the newest block to the one just final */}
      <g className="sp-br sp-br--b" transform={`translate(${SP.right - SP.size - 2 * SP.pitch} ${SP.y + SP.size + 14})`}>
        <path d={`M${SP.size / 2},-6V0H${2 * SP.pitch + SP.size / 2}V-6`} /><text x={SP.pitch + SP.size / 2} y="22">final in 1.2 s</text>
      </g>
    </svg>
  );
}

/* ───────────────────────── pv · Private Shard ───────────────────────── */
export const PV = { b: [0, 0, 150, 96, 0, 38] as B6, rows: [12, 28, 44, 60, 76], open: 2, aud: [196, 30] as V };
export const pvRow = (i: number): V => P(75, PV.rows[i] + 4, PV.b[5]);
export const PV_EYE: V = P(PV.aud[0], PV.aud[1], 21);
const PV_FS = 9.6;
const PV_LABS = [
  { k: "h", a: P(150, 70, 14), d: [36, 26] as V, t: "shielded from public view" },
  { k: "d", a: [PV_EYE[0], PV_EYE[1] - 4] as V, d: [22, -26] as V, t: "selective disclosure" },
];
const PV_VB = vbox([...corners(PV.b), P(PV.aud[0] + 10, PV.aud[1] + 10, 0), ...PV_LABS.map((l) => labEnd(l.a, l.d, l.t, PV_FS))], 14);
export function ArtPrivate() {
  const z = PV.b[5], r0 = pvRow(PV.open);
  return (
    <svg {...svgProps("pv", "The private shard: its transactions hidden, one row disclosed to an auditor.", PV_VB.s)}>
      <path className="pa-dots d-floor" d={dots(-20, -20, 240, 120, 20, 0)} />
      <g className="d-f"><Blk b={PV.b} cls="pa-dk" /></g>
      <g transform={onTop(0, 0, z)} className="d-o">
        {PV.rows.map((y) => <rect key={y} className="pv-bar" x="16" y={y} width="118" height="8" rx="1" />)}
        <g className="pv-open" transform={`translate(0 ${PV.rows[PV.open]})`}>
          <rect className="pv-open__f" x="10" y="-3" width="130" height="14" rx="2" />
          <path className="pv-open__l" d="M20,4H54M62,4H80M88,4H126" />
        </g>
      </g>
      <path className="pv-look d-o" d={`M${f(PV_EYE[0])},${f(PV_EYE[1])}L${f(r0[0])},${f(r0[1])}`} />
      <g className="d-p"><Pawn x={PV.aud[0]} y={PV.aud[1]} /></g>
      {PV_LABS.map((l) => <Lab key={l.k} {...l} fs={PV_FS} cls="d-o" />)}
    </svg>
  );
}

/* ───────────────────────── qt · Quantum security ───────────────────────── */
export const QT = { b: [0, 0, 96, 64, 0, 24] as B6 };
const QT_TOP = P(48, 32, 24);
export const QT_KEY: V = [QT_TOP[0], QT_TOP[1] - 52];
const QT_FS = 5.8;
const QT_LABS = [
  { k: "a", a: P(96, 50, 12), d: [26, 18] as V, t: "account" },
  { k: "k", a: [QT_KEY[0] + 27, QT_KEY[1] - 2] as V, d: [20, -22] as V, t: "FIPS-204 · ML-DSA" },
];
const QT_VB = vbox([...corners(QT.b), [QT_KEY[0] - 40, QT_KEY[1] - 64], ...QT_LABS.map((l) => labEnd(l.a, l.d, l.t, QT_FS))], 12);
export function ArtQuantum() {
  return (
    <svg {...svgProps("qt", "One account, its key rotated to a quantum-safe signing scheme in a single transaction.", QT_VB.s)}>
      <path className="pa-dots d-floor" d={dots(-30, -30, 130, 100, 20, 0)} />
      <g className="d-f"><Blk b={QT.b} /></g>
      <g transform={onTop(0, 0, 24)} className="d-o"><rect className="qt-slot" x="34" y="24" width="28" height="16" rx="2" /></g>
      <path className="pa-teth d-o" d={`M${f(QT_KEY[0])},${f(QT_KEY[1] + 12)}L${f(QT_TOP[0])},${f(QT_TOP[1])}`} />
      <circle className="pa-halo" cx={f(QT_KEY[0])} cy={f(QT_KEY[1])} r="26" />
      <g className="qt-old"><Key c={QT_KEY} /></g>
      <g className="qt-new"><Key c={QT_KEY} q /></g>
      {QT_LABS.map((l) => <Lab key={l.k} {...l} fs={QT_FS} cls="d-o" />)}
    </svg>
  );
}

/* ───────────────────────── cs · Chain Signatures ───────────────────────── */
export const CS = {
  acct: at(0, 0, 44, 44, 0, 24) as B6,
  chains: [{ t: "Bitcoin", x: 160, y: -70 }, { t: "Ethereum", x: 190, y: 30 }, { t: "Solana", x: 150, y: 130 }, { t: "30+ chains", x: 50, y: 190 }],
};
export const CS_ARCS = CS.chains.map((c) => arc([0, 0, 24], [c.x, c.y, 8], 70, 28));
export const CS_TOPS = CS.chains.map((c) => coin(c.x, c.y, 0, 16, 8));
const CS_MPC = P(0, 0, 24);
const CS_FS = 10;
const CS_LABS = [
  ...CS.chains.map((c, i) => ({ k: `c${i}`, a: [CS_TOPS[i].cx, CS_TOPS[i].cy] as V, d: (i === 3 ? [-30, 24] : [30, 14]) as V, t: c.t })),
  { k: "m", a: [CS_MPC[0], CS_MPC[1] - 20] as V, d: [-28, -24] as V, t: "one NEAR account · threshold MPC" },
];
const CS_VB = vbox([...corners(CS.acct), ...CS_ARCS.flatMap((a) => a.ps), ...CS_TOPS.map((t) => [t.cx, t.cy + 14] as V), ...CS_LABS.map((l) => labEnd(l.a, l.d, l.t, CS_FS))], 14);
export function ArtChains() {
  return (
    <svg {...svgProps("cs", "One NEAR account signs native transactions on Bitcoin, Ethereum, Solana and 30+ chains, with no bridge.", CS_VB.s)}>
      <path className="pa-dots d-floor" d={dots(-40, -100, 220, 230, 20, 0)} />
      {CS.chains.map((c, i) => <g key={c.t} className="d-p"><Plinth x={c.x} y={c.y} /><ellipse className="cs-flash" cx={f(CS_TOPS[i].cx)} cy={f(CS_TOPS[i].cy)} rx={f(CS_TOPS[i].rx)} ry={f(CS_TOPS[i].ry)} /></g>)}
      <g className="d-f"><Blk b={CS.acct} /></g>
      <g className="cs-mpc d-o" transform={`translate(${f(CS_MPC[0])} ${f(CS_MPC[1] - 20)})`}>
        <ellipse className="cs-mpc__ring" rx="26" ry="9" />
        {[0, 1, 2].map((i) => <circle key={i} className="cs-mpc__n" cx={f(26 * Math.cos((i * 2 * Math.PI) / 3))} cy={f(9 * Math.sin((i * 2 * Math.PI) / 3))} r="3" />)}
      </g>
      {CS_ARCS.map((a, i) => <path key={i} className="cs-arc d-o" d={a.d} />)}
      {CS_ARCS.map((_, i) => <circle key={i} className="cs-sig" r="3.4" cx="0" cy="0" opacity="0" />)}
      {CS_LABS.map((l) => <Lab key={l.k} {...l} fs={CS_FS} cls="d-o" />)}
    </svg>
  );
}

/* ───────────────────────── ag · A new operating layer for AI ───────────────────────── */
export const AG = { plate: [0, 0, 250, 90, -10, 10] as B6, tees: [15, 100, 185].map((x) => ({ x, y: 20, w: 50, d: 50, h: 58 })) };
export const AG_ARCS = [arc([40, 45, 58], [125, 45, 58], 34, 22), arc([125, 45, 58], [210, 45, 58], 34, 22)];
const AG_FS = 9.4;
const AG_LABS = [
  { k: "t", a: P(15, 70, 58), d: [-24, -22] as V, t: "TEE · confidential compute" },
  { k: "a", a: P(235, 45, 40), d: [34, -6] as V, t: "agents" },
];
const AG_VB = vbox([...corners(AG.plate), P(15, 20, 70), P(235, 20, 70), ...AG_ARCS.flatMap((a) => a.ps), ...AG_LABS.map((l) => labEnd(l.a, l.d, l.t, AG_FS))], 12);
export function ArtAgents() {
  return (
    <svg {...svgProps("ag", "Agents running inside enclaves on NEAR, exchanging signals.", AG_VB.s)}>
      <path className="pa-dots d-floor" d={dots(-20, -20, 270, 110, 20, -10)} />
      <Blk b={AG.plate} cls="d-f" />
      {AG.tees.map((t) => (
        <g key={t.x} className="d-p">
          <Pawn x={t.x + t.w / 2} y={t.y + t.d / 2} ant />
          <Glass b={[t.x, t.y, t.w, t.d, 0, t.h]} />
        </g>
      ))}
      {AG_ARCS.map((a, i) => <path key={i} className="ag-arc d-o" d={a.d} />)}
      {AG_ARCS.map((_, i) => <circle key={i} className="ag-sig" r="3.2" cx="0" cy="0" opacity="0" />)}
      {AG_LABS.map((l) => <Lab key={l.k} {...l} fs={AG_FS} cls="d-o" />)}
    </svg>
  );
}
