// History B, the drawings: the Transformer paper (the origin), one small scene for each milestone of the timeline (SCENES, in content.ts's order) and
// the three glyphs of "ahead" (OWNS). Every one is a line drawing in the Foundation's hand that builds as it arrives (data-draw: kit.ts mountDraw).
// Decorative (aria-hidden): the text beside each carries the meaning. World units; painter's order is written out by hand (back to front).
import type { ReactNode } from "react";
import { P, f, arc, dots, onTop, onLeft, Drawing, Slab, Pawn, Coin, GlassBack, GlassFront, Sheet, Miss, Sig, cornersOf, type B6, type V } from "./draw";

const mid = (ps: V[]) => ps[Math.round(ps.length / 2)];

/* ───────────────────────── the origin: "Attention Is All You Need" ───────────────────────── */
/** a paper on a desk; above it, a sentence as tokens, and one token attending to the others (the green arcs) */
export function PaperScene() {
  const desk: B6 = [0, 0, 128, 104, 0, 10], s1: B6 = [12, 18, 62, 78, 10, 1.5], s2: B6 = [44, 10, 62, 78, 11.5, 1.5];
  const toks = [0, 1, 2, 3, 4, 5].map((i) => [12 + i * 21, 52, 84] as [number, number, number]);
  const Q = 2, arcs = toks.map((t, i) => (i === Q ? null : arc(toks[Q], t, 10 + Math.abs(i - Q) * 9)));
  const top = arcs.flatMap((a) => (a ? a.ps : []));
  const lines: ReactNode[] = [];
  for (let k = 0; k < 6; k++) lines.push(<path key={k} d={`M6,${22 + k * 6}h${[48, 44, 50, 36, 46, 30][k]}`} />);
  return (
    <Drawing pts={[...cornersOf(desk), ...top, P(12, 52, 70)]} cls="hb-paper">
      <Slab b={desk} />
      <Sheet b={s1} />
      <Sheet b={s2} />
      <g className="hb-ink d-o" transform={onTop(s2[0], s2[1], s2[4] + s2[5])}>
        <path className="hb-ink__t" d="M6,9h34" />
        {lines}
        <rect x="6" y="60" width="20" height="12" />
        <path d="M31,62h22M31,67h16" />
      </g>
      {/* the tokens hang over the paper on dotted threads */}
      <g className="hb-thread d-o">{toks.map((t, i) => { const a = P(t[0], t[1], 14), b = P(t[0], t[1], t[2]); return <path key={i} d={`M${f(a[0])},${f(a[1])}V${f(b[1])}`} />; })}</g>
      <g className="hb-attn d-o">{arcs.map((a, i) => a && <path key={i} d={a.d} style={{ strokeOpacity: 1 - Math.abs(i - Q) * 0.16 }} />)}</g>
      <g className="d-p">{toks.map((t, i) => { const p = P(...t); return <circle key={i} className={`hb-tok${i === Q ? " hb-tok--q" : ""}`} cx={f(p[0])} cy={f(p[1])} r={i === Q ? 5 : 4} />; })}</g>
    </Drawing>
  );
}

/* ───────────────────────── the timeline, one scene per milestone ───────────────────────── */
/** 2017 · NEAR AI: a person, a keyboard and a screen where a sentence becomes code */
function CodeScene() {
  const desk: B6 = [0, 0, 112, 100, 0, 8], screen: B6 = [18, 10, 76, 6, 8, 56], kb: B6 = [30, 32, 48, 14, 8, 3];
  return (
    <Drawing pts={[...cornersOf(desk), ...cornersOf(screen)]}>
      <Slab b={desk} />
      <Slab b={screen} />
      <g className="hb-ink d-o" transform={onLeft(screen[0] + 6, screen[1] + screen[3], screen[4] + screen[5] - 6)}>
        <path className="hb-ink__q" d="M4,6h40" />
        <path d="M4,16h6M12,24h26M12,31h18M12,38h30M4,46h6" />
        <path className="hb-ink__g" d="M14,31h14" />
      </g>
      <Slab b={kb} />
      <Pawn at={P(58, 80, 8)} g />
    </Drawing>
  );
}

/** 2018 · the problem: one GPU box, people far away; payments to them do not get through */
function ProblemScene() {
  const gpuT: B6 = [64, 64, 48, 48, 0, 10], gpu: B6 = [74, 74, 28, 28, 10, 34];
  const isl: B6[] = [[0, 0, 36, 36, 0, 8], [158, 14, 36, 36, 0, 8], [14, 158, 36, 36, 0, 8]];
  const from: [number, number, number] = [88, 88, 46];
  const arcs = isl.map((b) => arc(from, [b[0] + 18, b[1] + 18, 36], 30));
  return (
    <Drawing pts={[...isl.flatMap(cornersOf), ...cornersOf(gpuT), ...arcs.flatMap((a) => a.ps)]}>
      <Slab b={isl[0]} /><Pawn at={P(18, 18, 8)} />
      <Slab b={gpuT} />
      <Slab b={gpu} />
      <g className="hb-ink d-o" transform={onLeft(gpu[0] + 4, gpu[1] + gpu[3], gpu[4] + gpu[5] - 6)}>
        {[0, 1, 2, 3, 4].map((k) => <path key={k} d={`M0,${k * 5}h20`} />)}
      </g>
      <Slab b={isl[1]} /><Pawn at={P(176, 32, 8)} />
      <Slab b={isl[2]} /><Pawn at={P(32, 176, 8)} />
      <g className="hb-arc hb-arc--off d-o">{arcs.map((a, i) => <path key={i} d={a.d} />)}</g>
      <g className="d-o">{arcs.map((a, i) => <Miss key={i} at={mid(a.ps)} />)}</g>
    </Drawing>
  );
}

/** 2018 · sharding: one block, split into four lanes that run side by side (the outline of the whole stays, dotted) */
function ShardScene() {
  const H = [24, 36, 30, 44], lanes: B6[] = H.map((h, i) => [i * 34, 0, 28, 112, 0, h]);
  const whole: B6 = [0, 0, 130, 112, 0, 52];
  return (
    <Drawing pts={[...cornersOf(whole), ...lanes.flatMap(cornersOf)]}>
      {lanes.map((b, i) => (
        <g key={i}>
          <Slab b={b} tone={i === 3 ? "g" : "w"} />
          {[0, 1, 2].map((k) => (k + i) % 2 === 0 && <Slab key={k} b={[b[0] + 8, 14 + k * 32, 12, 14, b[5], 7]} />)}
        </g>
      ))}
      <path className="hb-ghost d-o" d={`M${P(0, 112, 52).map(f).join(",")}L${P(130, 112, 52).map(f).join(",")}L${P(130, 0, 52).map(f).join(",")}L${P(0, 0, 52).map(f).join(",")}Z`} />
    </Drawing>
  );
}

/** 2021 · Rainbow Bridge and Aurora: two platforms and a bridge between them; Aurora stands on NEAR's side */
function BridgeScene() {
  const L: B6 = [0, 0, 64, 64, 0, 26], R: B6 = [132, 0, 64, 64, 0, 26], deck: B6 = [64, 22, 68, 20, 22, 4];
  const piers: B6[] = [[84, 26, 6, 12, 0, 22], [106, 26, 6, 12, 0, 22]], aurora: B6 = [148, 12, 30, 30, 26, 20];
  const archPs: V[] = []; for (let i = 0; i <= 16; i++) { const t = i / 16; archPs.push(P(64 + t * 68, 42, 2 + 18 * Math.sin(Math.PI * t))); }
  return (
    <Drawing pts={[...cornersOf(L), ...cornersOf(R), ...cornersOf(aurora)]}>
      <Slab b={L} />
      <Pawn at={P(30, 34, 26)} />
      {piers.map((b, i) => <Slab key={i} b={b} />)}
      <path className="hb-arch d-o" d={"M" + archPs.map((p) => `${f(p[0])},${f(p[1])}`).join("L")} />
      <Slab b={deck} />
      <g className="d-p"><Coin x={96} y={32} z={26} r={6} h={3} g /></g>
      <Slab b={R} />
      <Slab b={aurora} tone="g" />
      <Pawn at={P(144, 54, 26)} /><Pawn at={P(186, 52, 26)} />
    </Drawing>
  );
}

/** 2023 · Chain Abstraction: one account in the middle, every chain around it within reach */
function AbstractScene() {
  const C = { x: 92, y: 92 }, tile: B6 = [70, 70, 44, 44, 0, 10];
  const cols = [0, 1, 2, 3, 4, 5].map((k) => {
    const a = -Math.PI * 0.75 + (k / 6) * Math.PI * 2, x = C.x + Math.cos(a) * 82, y = C.y + Math.sin(a) * 82;
    return { b: [x - 11, y - 11, 22, 22, 0, 22 + ((k * 13) % 30)] as B6, k: x + y };
  });
  const head = P(C.x, C.y, 10 + 22), back = cols.filter((c) => c.k < 2 * C.x), front = cols.filter((c) => c.k >= 2 * C.x);
  const link = (c: (typeof cols)[number]) => { const t = P(c.b[0] + 11, c.b[1] + 11, c.b[5]); return `M${f(head[0])},${f(head[1])}L${f(t[0])},${f(t[1])}`; };
  return (
    <Drawing pts={[...cols.flatMap((c) => cornersOf(c.b)), ...cornersOf(tile)]}>
      {back.sort((a, b) => a.k - b.k).map((c, i) => <Slab key={`b${i}`} b={c.b} />)}
      <Slab b={tile} />
      <g className="hb-arc d-o">{back.map((c, i) => <path key={i} d={link(c)} />)}</g>
      <Pawn at={P(C.x, C.y, 10)} g />
      {front.sort((a, b) => a.k - b.k).map((c, i) => <Slab key={`f${i}`} b={c.b} />)}
      <g className="hb-arc d-o">{front.map((c, i) => <path key={i} d={link(c)} />)}</g>
    </Drawing>
  );
}

/** 2024 · the blockchain for AI: a chip on its board (the green die: NEAR AI), signatures arcing out to two other chains */
function ChipScene() {
  const board: B6 = [0, 0, 96, 96, 0, 8], body: B6 = [22, 22, 52, 52, 8, 10], die: B6 = [36, 36, 24, 24, 18, 4];
  const far: B6[] = [[132, 4, 28, 28, 0, 16], [4, 132, 28, 28, 0, 16]];
  const from: [number, number, number] = [48, 48, 24];
  const arcs = far.map((b) => arc(from, [b[0] + 14, b[1] + 14, 16], 40));
  const pins: string[] = [];
  for (let k = 0; k < 5; k++) {
    const u = 28 + k * 10;
    const a = P(u, 74, 8), b = P(u, 86, 8), c = P(74, u, 8), d = P(86, u, 8);
    pins.push(`M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}M${f(c[0])},${f(c[1])}L${f(d[0])},${f(d[1])}`);
  }
  return (
    <Drawing pts={[...cornersOf(board), ...far.flatMap(cornersOf), ...arcs.flatMap((a) => a.ps)]}>
      <Slab b={board} />
      <g className="hb-pins d-o">{pins.map((d, i) => <path key={i} d={d} />)}</g>
      <Slab b={body} />
      <Slab b={die} tone="g" />
      {far.map((b, i) => <Slab key={i} b={b} />)}
      <g className="hb-arc d-o">{arcs.map((a, i) => <path key={i} d={a.d} />)}</g>
      <g className="d-o">{arcs.map((a, i) => <Sig key={i} at={a.ps[Math.round(a.ps.length * 0.62)]} />)}</g>
    </Drawing>
  );
}

/** 2025 · Intents expands: wallets fanned out in front of the intents network, each one wired in */
function IntentsScene() {
  const hub: B6 = [40, 20, 72, 56, 0, 18];
  const wal = [0, 1, 2, 3, 4].map((k) => { const a = Math.PI * (-0.15 + k * 0.2), x = 76 + Math.cos(a) * 104 - 14, y = 48 + Math.sin(a) * 104 - 9; return [x, y, 28, 18, 0, 8] as B6; });
  const hubTop: [number, number, number] = [76, 48, 18];
  const arcs = wal.map((b) => arc([b[0] + 14, b[1] + 9, 8], hubTop, 26));
  return (
    <Drawing pts={[...cornersOf(hub), ...wal.flatMap(cornersOf), ...arcs.flatMap((a) => a.ps)]}>
      <Slab b={hub} />
      <g className="hb-ink d-o" transform={onTop(hub[0], hub[1], hub[5])}>
        <path d="M18,22h34l-6,-5M52,34h-34l6,5" />
        <path className="hb-ink__g" d="M18,22h34" />
      </g>
      <g className="hb-arc d-o">{arcs.map((a, i) => <path key={i} d={a.d} />)}</g>
      {wal.sort((a, b) => a[0] + a[1] - (b[0] + b[1])).map((b, i) => (
        <g key={i}>
          <Slab b={b} />
          <g className="hb-ink d-o" transform={onTop(b[0], b[1], b[5])}><path d="M5,6h12M5,11h7" /></g>
        </g>
      ))}
      <g className="d-o">{arcs.filter((_, i) => i % 2 === 0).map((a, i) => <Sig key={i} at={a.ps[Math.round(a.ps.length * 0.4)]} />)}</g>
    </Drawing>
  );
}

/** 2026 · now: private execution (the green core inside the glass), an agent beside it, quantum-safe lattice on the floor, and the flag of now */
function NowScene() {
  const floor: B6 = [0, 0, 136, 116, 0, 8], glass: B6 = [30, 18, 62, 62, 8, 52], core: B6 = [49, 37, 24, 24, 8, 24];
  const pole = { a: P(8, 112, 8), b: P(8, 112, 92) };
  const flag = [P(8, 112, 92), P(42, 112, 92), P(36, 112, 83), P(42, 112, 74), P(8, 112, 74)];
  return (
    <Drawing pts={[...cornersOf(floor), ...cornersOf(glass), pole.b, flag[1]]}>
      <Slab b={floor} />
      <path className="hb-lattice d-floor" d={dots(8, 88, 128, 110, 10, 8)} />
      <GlassBack b={glass} />
      <Slab b={core} tone="g" />
      <GlassFront b={glass} />
      <Pawn at={P(112, 62, 8)} />
      <g className="hb-flag d-o">
        <path className="hb-flag__pole" d={`M${f(pole.a[0])},${f(pole.a[1])}V${f(pole.b[1])}`} />
        <path className="hb-flag__cloth" d={"M" + flag.map((p) => `${f(p[0])},${f(p[1])}`).join("L") + "Z"} />
      </g>
    </Drawing>
  );
}

/** one scene per milestone, in content.ts's order */
export const SCENES = [CodeScene, ProblemScene, ShardScene, BridgeScene, AbstractScene, ChipScene, IntentsScene, NowScene];

/* ───────────────────────── ahead: the three things you own ───────────────────────── */
function Assets() {
  const t: B6 = [0, 0, 56, 56, 0, 6];
  return (
    <Drawing pts={[...cornersOf(t), P(28, 28, 40)]} m={4}>
      <Slab b={t} />
      <g className="d-p">{[0, 1, 2, 3].map((k) => <Coin key={k} x={28} y={28} z={6 + k * 7} r={16} h={6} g={k === 3} />)}</g>
    </Drawing>
  );
}
function Intelligence() {
  const t: B6 = [0, 0, 56, 56, 0, 6], body: B6 = [12, 12, 32, 32, 6, 8], die: B6 = [21, 21, 14, 14, 14, 4];
  const pins: string[] = [];
  for (let k = 0; k < 4; k++) { const u = 16 + k * 8, a = P(u, 44, 6), b = P(u, 52, 6), c = P(44, u, 6), d = P(52, u, 6); pins.push(`M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}M${f(c[0])},${f(c[1])}L${f(d[0])},${f(d[1])}`); }
  return (
    <Drawing pts={[...cornersOf(t), P(0, 0, 30)]} m={4}>
      <Slab b={t} />
      <g className="hb-pins d-o">{pins.map((d, i) => <path key={i} d={d} />)}</g>
      <Slab b={body} />
      <Slab b={die} tone="g" />
    </Drawing>
  );
}
function Alpha() {
  const t: B6 = [0, 0, 56, 56, 0, 6], bars: B6[] = [[6, 18, 12, 20, 6, 10], [22, 18, 12, 20, 6, 20], [38, 18, 12, 20, 6, 32]];
  return (
    <Drawing pts={[...cornersOf(t), ...cornersOf(bars[2])]} m={4}>
      <Slab b={t} />
      {bars.map((b, i) => <Slab key={i} b={b} tone={i === 2 ? "g" : "w"} />)}
    </Drawing>
  );
}
export const OWNS = [Assets, Intelligence, Alpha];
