// Community B, the events drawing: a stage on a dotted floor. A platform with its steps, a backdrop whose screen shows the night's slide, a truss with two
// lamps whose green light sweeps the stage, the speaker at the lectern and the audience filling the rows (motion.ts: it builds as it arrives, the rows
// fill one by one, then the lights sweep while it is on screen). Decorative: the list beside it carries the events.
import type { ReactNode } from "react";
import { P, f, vbox, box, corners, dots, onLeft, type V } from "./kit";
import { Slab, Pawn } from "./parts";

const PL: [number, number, number, number, number, number] = [40, 40, 200, 112, 0, 24];
const WALL: [number, number, number, number, number, number] = [52, 42, 176, 8, 24, 80];
const LECTERN: [number, number, number, number, number, number] = [168, 96, 14, 11, 24, 21];
const POSTS: [number, number, number, number, number, number][] = [[30, 30, 6, 6, 0, 136], [246, 30, 6, 6, 0, 136]];
const BEAM: [number, number, number, number, number, number] = [30, 30, 222, 6, 130, 6];
export const LAMPS: { x: number; y: number; z: number }[] = [{ x: 96, y: 33, z: 124 }, { x: 186, y: 33, z: 124 }];
export const SEATS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) out.push([66 + c * 30 + (r % 2) * 9, 196 + r * 30]);
  return out;
})();
const SPEAKER: V = P(152, 104, 24);

/** a cone of light from a lamp to a spot on the stage (u: −1…1 along the stage) */
export function cone(i: number, u: number) {
  const L = LAMPS[i], a = P(L.x, L.y + 3, L.z - 6);
  const cx = 140 + u * 70, cy = 92 + Math.sin(u * 2.1 + i) * 16, c = P(cx, cy, 24.5), rx = 22, ry = 11;
  return { beam: `M${f(a[0])},${f(a[1])}L${f(c[0] - rx)},${f(c[1])}A${rx},${ry} 0 0 0 ${f(c[0] + rx)},${f(c[1])}Z`, spot: { cx: c[0], cy: c[1], rx, ry } };
}

const all: V[] = [...corners(box(...BEAM)), ...corners(box(...PL)), P(0, 340), P(340, 0), P(320, 330)];
export const VB = vbox(all, 10);

export function EventStage() {
  const c0 = cone(0, -0.4), c1 = cone(1, 0.45);
  const screenW = WALL[2] - 24;
  const slide: ReactNode = (
    <g className="es-screen d-o" transform={onLeft(WALL[0] + 12, WALL[1] + WALL[3], WALL[4] + WALL[5] - 12)}>
      <rect x="0" y="0" width={f(screenW)} height="54" />
      <rect className="es-screen__g" x="10" y="10" width="40" height="8" />
      <path d={`M10,28h${f(screenW - 70)}M10,36h${f(screenW - 94)}M10,44h${f(screenW - 82)}`} />
      <g className="es-screen__bars">{[0, 1, 2, 3, 4].map((k) => <rect key={k} x={f(screenW - 54 + k * 9)} y={f(46 - (8 + ((k * 7) % 11)))} width="5" height={f(8 + ((k * 7) % 11))} />)}</g>
    </g>
  );
  return (
    <svg className="cb-svg es" viewBox={VB.s} data-draw="self" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="es-fade" cx="50%" cy="60%" r="55%"><stop offset="0.45" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <mask id="es-mask" maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#es-fade)" /></mask>
      </defs>
      <path className="cb-dots d-floor" d={dots(-20, -20, 340, 340, 18)} mask="url(#es-mask)" />
      {POSTS.map((b, i) => <Slab key={i} b={b} />)}
      <Slab b={PL} />
      <Slab b={[108, 152, 64, 14, 0, 16]} />
      <Slab b={[108, 166, 64, 14, 0, 8]} />
      <Slab b={WALL} />
      {slide}
      <Pawn at={SPEAKER} g cls="es-speaker" />
      <Slab b={LECTERN} />
      <g className="es-light d-o">
        <path className="es-cone" d={c0.beam} /><path className="es-cone" d={c1.beam} />
        <ellipse className="es-spot" cx={f(c0.spot.cx)} cy={f(c0.spot.cy)} rx={c0.spot.rx} ry={c0.spot.ry} />
        <ellipse className="es-spot" cx={f(c1.spot.cx)} cy={f(c1.spot.cy)} rx={c1.spot.rx} ry={c1.spot.ry} />
      </g>
      <Slab b={BEAM} />
      {LAMPS.map((l, i) => <Slab key={i} b={[l.x - 6, l.y - 3, 12, 10, l.z - 8, 10]} tone="g" />)}
      {SEATS.map((s, i) => <Pawn key={i} at={P(s[0], s[1])} g={i === 15} cls="es-seat" i={i} />)}
    </svg>
  );
}
