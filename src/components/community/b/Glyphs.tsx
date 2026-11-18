// Community B, the small drawings: one for each community figure (in the stats row) and the channels' marks laid flat on iso tiles (the socials).
// Decorative (aria-hidden): the text beside each carries the meaning. The channels' marks are line drawings in the site's icon hand (the footer's
// public/nav/icons and the contact page's), not the platforms' logo artwork.
import type { ReactNode } from "react";
import { P, f, vbox, box, corners, onTop, type V } from "./kit";
import { Slab, Pawn } from "./parts";

const frame = (ps: V[], m = 6) => vbox(ps, m);
const cornersOf = (b: [number, number, number, number, number, number]) => corners(box(...b));

/* ───────────────────────── the stats' drawings (u: world units) ───────────────────────── */
function Svg({ vb, children, cls = "" }: { vb: ReturnType<typeof vbox>; children: ReactNode; cls?: string }) {
  return <svg className={`cb-svg cb-glyph ${cls}`} viewBox={vb.s} data-draw="" aria-hidden="true" focusable="false">{children}</svg>;
}
function Contributors() {
  const ppl: [number, number][] = [[10, 34], [30, 26], [22, 50], [44, 42]];
  const tile: [number, number, number, number, number, number] = [0, 10, 60, 56, -8, 8];
  return (
    <Svg vb={frame([...cornersOf(tile), P(10, 26, 40)])}>
      <Slab b={tile} />
      {ppl.sort((a, b) => a[0] + a[1] - (b[0] + b[1])).map((p, i) => <Pawn key={i} at={P(p[0], p[1])} g={i === 3} />)}
    </Svg>
  );
}
function Countries() {
  const t: [number, number, number, number, number, number][] = [[0, 0, 26, 26, 0, 6], [30, 0, 26, 26, 0, 12], [0, 30, 26, 26, 0, 10], [30, 30, 26, 26, 0, 4]];
  const pin = P(43, 43, 4), head = P(43, 43, 36);
  return (
    <Svg vb={frame([...t.flatMap(cornersOf), head])}>
      {t.map((b, i) => <Slab key={i} b={b} />)}
      <g className="d-o">
        <path className="cb-g-stem" d={`M${f(pin[0])},${f(pin[1])}V${f(head[1])}`} />
        <circle className="cb-g-pin" cx={f(head[0])} cy={f(head[1])} r="5" />
      </g>
    </Svg>
  );
}
function Groups() {
  const b: [number, number, number, number, number, number][] = [[0, 4, 18, 18, 0, 30], [34, 0, 18, 18, 0, 20], [16, 34, 18, 18, 0, 40]];
  const c = b.map((x) => P(x[0] + 9, x[1] + 9, 0));
  return (
    <Svg vb={frame(b.flatMap(cornersOf))}>
      <path className="cb-g-trace d-o" d={`M${f(c[0][0])},${f(c[0][1])}L${f(c[1][0])},${f(c[1][1])}L${f(c[2][0])},${f(c[2][1])}Z`} />
      {b.map((x, i) => <Slab key={i} b={x} tone={i === 2 ? "g" : "w"} />)}
    </Svg>
  );
}
function Events() {
  const b: [number, number, number, number, number, number] = [0, 0, 56, 56, 0, 12];
  const cells: ReactNode[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cells.push(<rect key={`${i}${j}`} className={i === 2 && j === 1 ? "cb-g-on" : ""} x={8 + i * 14} y={8 + j * 14} width="10" height="10" />);
  return (
    <Svg vb={frame([...cornersOf(b), P(0, 0, 22)])}>
      <Slab b={b} />
      <g className="cb-g-cal d-o" transform={onTop(0, 0, 12)}>{cells}</g>
      <Slab b={[6, -2, 6, 6, 12, 8]} /><Slab b={[44, -2, 6, 6, 12, 8]} />
    </Svg>
  );
}
export const STAT_GLYPHS = [Contributors, Countries, Groups, Events];

/* ───────────────────────── the channels' marks (24 grid, stroke only) ───────────────────────── */
export const MARKS: Record<string, ReactNode> = {
  x: <><path d="M4 4h4.5L20 20h-4.5z" /><path d="M19.5 4l-6.3 7.2M10.8 12.8L4.5 20" /></>,
  discord: <><path d="M8.3 6.2C6.6 6.5 5.1 7 3.8 7.8 1.9 11.4 1.6 14.6 2 17.6c1.5 1.1 3.1 1.8 4.7 2.2l1.1-1.9" /><path d="M15.7 6.2c1.7.3 3.2.8 4.5 1.6 1.9 3.6 2.2 6.8 1.8 9.8-1.5 1.1-3.1 1.8-4.7 2.2l-1.1-1.9" /><path d="M8.3 6.2l.6 1.3c2-.4 4.2-.4 6.2 0l.6-1.3" /><path d="M6.5 16.8c3.5 1.6 7.5 1.6 11 0" /><circle cx="9" cy="12.8" r="1.4" /><circle cx="15" cy="12.8" r="1.4" /></>,
  telegram: <><path d="M21 4L3 11.2l6 2.1 2 6.2 3.2-3.6 4.6 3.6z" /><path d="M9 13.3L21 4" /><path d="M11 19.5l1-5" /></>,
  github: <><path d="M15 21v-3.5c0-1-.3-1.7-.8-2.2 2.7-.3 5.3-1.3 5.3-5.8 0-1.3-.4-2.3-1.2-3.2.1-.3.5-1.6-.1-3.2 0 0-1-.3-3.2 1.2a11 11 0 0 0-6 0C6.8 2.8 5.8 3.1 5.8 3.1c-.6 1.6-.2 2.9-.1 3.2-.8.9-1.2 1.9-1.2 3.2 0 4.5 2.6 5.5 5.3 5.8-.5.4-.8 1.1-.8 1.9V21" /><path d="M9 18.5c-3 .9-3.5-1.3-5-1.8" /></>,
  reddit: <><ellipse cx="12" cy="14.5" rx="8" ry="5.5" /><path d="M12 9l1.5-5 4 1" /><circle cx="18.75" cy="5.25" r="1.5" /><circle cx="9" cy="13.5" r="1" /><circle cx="15" cy="13.5" r="1" /><path d="M9.25 16.75c1.7 1 3.8 1 5.5 0" /></>,
  youtube: <><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10 9v6l5-3z" /></>,
  farcaster: <><path d="M5 4.5h14" /><path d="M6.5 4.5V20M17.5 4.5V20" /><path d="M6.5 13a5.5 5.5 0 0 1 11 0" /><path d="M4.5 20h4M15.5 20h4" /></>,
  linkedin: <><rect x="3" y="3" width="18" height="18" rx="3.5" /><path d="M8 10.5v6M12 16.5v-6M12 13.2c0-1.6 1-2.7 2.4-2.7s2.4 1.1 2.4 2.7v3.3" /><circle cx="8" cy="7.6" r=".6" /></>,
};

/** a channel: its mark laid flat on the top of a small iso tile (the tile lifts on hover: community-b.css) */
export function ChannelTile({ k }: { k: string }) {
  const T = 34, H = 9, b: [number, number, number, number, number, number] = [0, 0, T, T, 0, H];
  const vb = frame([...cornersOf(b), P(0, 0, H + 10)], 4);
  return (
    <svg className="cb-svg cb-chan" viewBox={vb.s} aria-hidden="true" focusable="false">
      <ellipse className="cb-chan__shadow" cx={f(P(T / 2, T / 2)[0])} cy={f(P(T / 2, T / 2)[1] + 2)} rx="30" ry="9" />
      <g className="cb-chan__lift">
        <Slab b={b} edges={false} cls="cb-chan__tile" />
        <g className="cb-chan__mark" transform={`${onTop(T / 2 - 12 * 1.15, T / 2 - 12 * 1.15, H)} scale(1.15)`}>{MARKS[k]}</g>
      </g>
    </svg>
  );
}
