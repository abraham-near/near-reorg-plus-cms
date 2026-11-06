import type { Pt } from "../../cinematic/geom";
import { pt } from "../../cinematic/geom";
import { Arc, Axis, Brackets, Cross, Dot, Path, Ring, Square, Ticks, Trace } from "../../cinematic/vec";
import { ALT, AXIS_TOP, BASE, MARKS, RUNGS, LINES, ORB, PINS, SUMMIT, TOPS, TOP_DROP, needle, orbitRing, orbitSquare, type LineKey } from "./design";
import { at0, lineTicks } from "./lines";

// The layer at the move's first frame, drawn as SVG on the server: what phones, tablets, reduced motion and no-JS show
// over the still (the photo band). On desktop with motion the canvas (CloudsLayer) takes over and draws every frame.
// Lines are cut where cloud covers their crest on that frame, and the near slope and knoll are still below the picture.
export function Still() {
  const visible = (k: LineKey) => {
    const { pts, vis } = at0(k);
    const from = LINES[k].from ?? 0;
    // the longest run of clear points on screen
    let best: [number, number] = [0, 0], s = -1;
    for (let i = from; i <= pts.length; i++) {
      const on = i < pts.length && (!LINES[k].cloud || vis[i] > 0.5) && pts[i][1] < BASE.h - 4;
      if (on && s < 0) s = i;
      if (!on && s >= 0) { if (i - s > best[1] - best[0]) best = [s, i]; s = -1; }
    }
    return pts.slice(best[0], best[1]);
  };
  const vertex = (k: LineKey, i: number): Pt => { const p = at0(k).pts[i]; return [p[0], p[1] + TOP_DROP]; };
  const onScreen = (p: Pt) => p[1] < BASE.h - 20;
  return (
    <>
      {(Object.keys(LINES) as LineKey[]).map((k) => {
        const p = visible(k);
        if (p.length <= 4) return null;
        const st = LINES[k], d = lineTicks(p, { ...st, from: 0 }).map(([a, b]) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`).join("");
        return (
          <g key={k}>
            <Trace id={`clouds-${k}`} pts={p} every={st.every} tick={0} tone={st.tone} a={st.a} />
            <Path d={d} tone={st.tone} a={st.a * st.tickA} />
          </g>
        );
      })}
      {TOPS.map((t, n) => {
        const p = vertex(t.line, t.i);
        return onScreen(p) ? (t.ring ? <Ring key={n} p={p} r={5.2} tone="white" a={0.75} /> : <Cross key={n} p={p} s={5.2} tone="white" a={0.7} />) : null;
      })}
      {MARKS.map((m, n) => {
        const { pts, vis } = at0(m.line), q = pts[m.i];
        if ((LINES[m.line].cloud && vis[m.i] < 0.5) || q[1] > BASE.h - 20) return null;
        const p: Pt = [q[0], q[1] + m.drop];
        return m.kind === "ring" ? <Ring key={`m${n}`} p={p} r={m.r} tone={m.tone} a={m.a} /> : m.kind === "square" ? <Square key={`m${n}`} p={p} s={m.r} tone={m.tone} a={m.a} /> : <Cross key={`m${n}`} p={p} s={m.r} tone={m.tone} a={m.a} />;
      })}
      {PINS.map((q, n) => {
        const p = vertex(q.line, q.i);
        return onScreen(p) ? (
          <g key={n}>
            <Path d={`M${p[0]} ${p[1] - 9}V${p[1] - 40}M${p[0] - 4.5} ${p[1] - 24}h9`} tone="white" a={0.7} />
            <Ring p={[p[0], p[1] - 45]} r={5.2} tone={q.deep ? "deep" : "white"} a={0.85} />
          </g>
        ) : null;
      })}

      {/* The orbit round the peak: far side behind the rock, near side in front with its scale */}
      <Arc e={ORB} t0={180} t1={360} tone="ink" a={0.24} dash="5 7" />
      <Arc e={ORB} t0={0} t1={180} tone="ink" a={0.26} />
      <Ticks e={ORB} t0={10} t1={170} step={2} len={5} major={5} majorLen={13} tone="ink" a={0.3} />
      <Arc e={ORB} t0={20} t1={160} s={1.18} tone="ink" a={0.22} dash="1 5" />
      <Ring p={pt(ORB, orbitRing(0))} r={7} a={0.6} />
      <Square p={pt(ORB, orbitSquare(0))} s={4.3} a={0.55} />
      <Cross p={pt(ORB, 0)} s={7} a={0.45} />
      <Cross p={pt(ORB, 180)} s={7} a={0.3} />

      {/* The summit sighted: a laddered axis, the altimeter arc with its needle, brackets, the green node */}
      <Axis a={[SUMMIT[0], SUMMIT[1] - AXIS_TOP]} b={[SUMMIT[0], SUMMIT[1] - 26]} op={0.4} />
      <Path d={Array.from({ length: RUNGS }, (_, i) => `M${SUMMIT[0] - (i % 4 === 0 ? 8.7 : 4.35)} ${SUMMIT[1] - 35 - i * 8.7}h${i % 4 === 0 ? 17.4 : 8.7}`).join("")} tone="ink" a={0.35} />
      <Arc e={ALT} t0={226} t1={314} tone="ink" a={0.5} />
      <Ticks e={ALT} t0={226} t1={314} step={2} len={5} major={5} majorLen={10} tone="ink" a={0.45} />
      <Ticks e={ALT} t0={226} t1={314} step={1} len={-3.5} tone="ink" a={0.25} />
      <Arc e={ALT} t0={262} t1={270} tone="deep" a={1} w={1.5} />
      <Ticks e={ALT} t0={needle(0)} t1={needle(0)} step={1} len={17} s={0.93} tone="ink" a={0.6} />
      <Square p={pt(ALT, 246)} s={3.9} a={0.6} />
      <Ring p={pt(ALT, 298)} r={4.3} a={0.6} />
      <Brackets p={SUMMIT} w={30} h={30} l={9} a={0.5} />
      <Cross p={SUMMIT} s={21} a={0.45} />
      <Ring p={SUMMIT} r={11} tone="deep" a={0.9} />
      <Dot p={SUMMIT} r={4} tone="green" a={1} />
    </>
  );
}
