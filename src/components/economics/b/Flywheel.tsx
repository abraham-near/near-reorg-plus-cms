// Economics B, the flywheel: the loop as a machine on a turntable. A disc with a track round it, the NEAR token at its centre, four stations round
// the track, one per step of LOOP (the doc's order, clockwise on screen from the left):
//   1 usage (left): people and an agent on a platform, where the fees start;
//   2 revenue (back): a vault with a slot; coins drop in, and a line runs from it to the token at the centre (the revenue flows back to NEAR);
//   3 supply (right): a press over a stack of coins, a line from the token to it (the buybacks pull tokens out);
//   4 strength (front): a stepped tower, its top green: a stronger base.
// The track between them draws in, one leg per step, and once the loop closes coins run round it. The same drawing is the hero (finished, alive:
// motion.ts) and the story of "The loop at the center of it all" (built step by step by the reading line). Everything is one function of the stage s
// (−1 empty, 0…3 the steps, 4 the loop closed) and a clock t, so the markup (any fixed stage) and the motion draw the same thing.
import type { ReactNode } from "react";
import { LOOP } from "../content";
import { P, f, tr, line, rad, seg, ease3, clamp01, at, coin, onCircle, floorArc, onTop, vbox, dots, type V } from "./kit";
import { Slab, Coin, Stack, Token, Pawn } from "./parts";

const RB = 210, HB = 18;            // the disc: radius, thickness (its top at z = 0)
const RT = 104;                      // the track's centre line (its rails at ±12)
const RS = 166, SW = 54, SH = 10;    // the stations: their ring, their platform's side and height
const TOKEN = { r: 40, h: 20 };
const ANG = [135, 225, 315, 405];    // the stations' angles (deg): left, back, right, front
const GAP = 13;                      // the track's legs stop this far (deg) short of a station
export const N_COINS = 6;
const SPIN = 0.5;                    // the coins' speed round the track (radians a second)

const C = ANG.map((a) => [RS * Math.cos(rad(a)), RS * Math.sin(rad(a))] as [number, number]);
const LEGS = ANG.map((a) => floorArc(RT, rad(a + GAP), rad(a + 90 - GAP), 0, 30));
const heads = LEGS.map((l) => { const a = l.ps[l.ps.length - 2], b = l.ps[l.ps.length - 1]; return { p: b, deg: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI }; });
/** the lines that carry value to and from the token: revenue → NEAR, NEAR → the press */
const SPOKES: [V, V][] = [
  [P(C[1][0] * 0.8, C[1][1] * 0.8), P(C[1][0] * 0.3, C[1][1] * 0.3)],
  [P(C[2][0] * 0.3, C[2][1] * 0.3), P(C[2][0] * 0.8, C[2][1] * 0.8)],
];

/** the scene at stage s: each station's drop and opacity, each leg's drawn share, the lit station, the coins' and the lead coin's visibility */
export function geo(s: number) {
  const st = C.map((_, k) => { const e = ease3(seg(s, k - 0.7, k - 0.1)); return { y: (1 - e) * -42, o: e }; });
  const legs = C.map((_, k) => seg(s, k + 0.15, k + 0.85));
  const spokes = [seg(s, 1.0, 1.5), seg(s, 2.0, 2.5)];
  const on = s < -0.5 ? -1 : s > 3.5 ? 4 : Math.max(0, Math.min(3, Math.round(s)));
  const closed = seg(s, 3.7, 3.98);
  // the lead coin rides the head of the track as it draws (from usage on), and gives way to the running coins when the loop closes
  const D = legs.reduce((a, b) => a + b, 0), kk = Math.min(3, Math.floor(D)), fr = D - kk;
  const head = fr > 0 || kk === 0 ? ANG[kk] + GAP + fr * (90 - 2 * GAP) : ANG[kk] - GAP;
  const lead = { a: rad(head), o: seg(s, -0.3, 0.1) * (1 - closed) };
  return { st, legs, spokes, on, closed, lead, token: seg(s, -1, -0.4) };
}

/* the stations' pieces (world, round the station's centre); the alive parts carry a class the motion moves */
function station(k: number, tone: "w" | "on"): ReactNode {
  const [cx, cy] = C[k], Z = SH;
  const plat = <Slab key="plat" b={at(cx, cy, SW, SW, 0, SH)} tone={tone} cls="fw-plat" />;
  if (k === 0) {
    const ppl: [number, number, boolean][] = [[cx - 13, cy - 11, false], [cx + 9, cy - 15, false], [cx - 15, cy + 9, true]];
    return <>{plat}
      {ppl.map(([x, y, g], i) => <g key={i} className="fw-hop" data-i={i}><Pawn at={P(x, y, Z)} g={g} /></g>)}
      <Slab b={at(cx + 11, cy + 10, 13, 13, Z, 13)} tone="g" />
    </>;
  }
  if (k === 1) {
    const top = Z + 30;
    return <>{plat}
      <Slab b={at(cx, cy, 32, 30, Z, 30)} />
      <path className="fw-slot" d="M0,0h18" transform={onTop(cx - 9, cy, top)} />
      <g className="fw-drop" data-top={top}><Coin x={cx} y={cy} z={top + 22} r={7} h={3} g /></g>
    </>;
  }
  if (k === 2) {
    return <>{plat}
      <Slab b={at(cx - 21, cy, 5, 5, Z, 46)} />
      <Stack x={cx} y={cy} z={Z} n={4} r={11} h={4} g={3} />
      <Slab b={at(cx + 21, cy, 5, 5, Z, 46)} />
      <g className="fw-ram"><Slab b={at(cx, cy, 52, 11, Z + 26, 7)} /></g>
    </>;
  }
  return <>{plat}
    <Slab b={at(cx, cy, 42, 42, Z, 13)} />
    <Slab b={at(cx, cy, 30, 30, Z + 13, 13)} />
    <Slab b={at(cx, cy, 18, 18, Z + 26, 13)} tone="g" />
  </>;
}

const LAB_Z = [64, 82, 78, 70];
const labAt = (k: number) => P(C[k][0], C[k][1], LAB_Z[k]);
const GROUND = 260;
const DISC = coin(0, 0, -HB, RB, HB);
export const VB = vbox([[DISC.cx - DISC.rx, DISC.cy - DISC.ry], [DISC.cx + DISC.rx, DISC.cy + DISC.ry + HB], ...C.map((_, k) => { const p = labAt(k); return [p[0], p[1] - 14] as V; })], 10);

export function Flywheel({ stage = 4, cls = "", hero, draw }: { stage?: number; cls?: string; hero?: boolean; draw?: boolean }) {
  const g = geo(stage), disc = DISC;
  // the stations in the order they are painted: the back one before the coins, the others after the token
  const st = (k: number) => (
    <g key={k} className="d-p"><g className={`fw-st${g.on === k ? " is-on" : ""}`} data-k={k} transform={`translate(0 ${f(g.st[k].y)})`} opacity={f(g.st[k].o)}>{station(k, "w")}</g></g>
  );
  return (
    <svg className={`eb-svg fw ${cls}`} viewBox={VB.s} data-draw={hero ? "self" : draw ? "" : undefined} data-stage={stage} aria-hidden="true" focusable="false">
      {hero && (
        <>
          <defs>
            <radialGradient id="fw-fade" cx="50%" cy="56%" r="50%"><stop offset="0.45" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
            <mask id="fw-mask" maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#fw-fade)" /></mask>
          </defs>
          <path className="eb-dots d-floor" d={dots(-GROUND, -GROUND, GROUND, GROUND, 20, -HB)} mask="url(#fw-mask)" />
        </>
      )}
      {/* the turntable and its track */}
      <g className="fw-disc d-f">
        <path className="fw-disc__s" d={disc.side} />
        <ellipse className="fw-disc__t" cx={f(disc.cx)} cy={f(disc.cy)} rx={f(disc.rx)} ry={f(disc.ry)} />
      </g>
      <g className="fw-rails d-o">
        {[RT - 12, RT + 12].map((r) => { const [rx, ry] = [r * Math.SQRT2 * 0.866, r * Math.SQRT2 * 0.5]; return <ellipse key={r} cx="0" cy="0" rx={f(rx)} ry={f(ry)} />; })}
        <ellipse className="fw-rails__mid" cx="0" cy="0" rx={f(RT * Math.SQRT2 * 0.866)} ry={f(RT * Math.SQRT2 * 0.5)} />
      </g>
      <g className="fw-spokes">{SPOKES.map(([a, b], i) => <path key={i} d={line(a, b)} pathLength={1} style={{ strokeDashoffset: f(1 - g.spokes[i]) }} />)}</g>
      <g className="fw-legs">{LEGS.map((l, k) => <path key={k} d={l.d} pathLength={1} style={{ strokeDashoffset: f(1 - g.legs[k]) }} />)}</g>
      <g className="fw-heads">{heads.map((h, k) => <path key={k} d="M-6,-4.5L0,0L-6,4.5" transform={`${tr(h.p)} rotate(${f(h.deg)})`} opacity={g.legs[k] > 0.97 ? 1 : 0} />)}</g>
      <g className="fw-sigs">{SPOKES.map(([a], i) => <circle key={i} r="3.2" transform={tr(a)} opacity="0" />)}</g>
      {st(1)}
      <g className="fw-coins">
        {Array.from({ length: N_COINS }, (_, i) => { const a = rad(ANG[0]) + (i / N_COINS) * Math.PI * 2; return <g key={i} className="fw-coin" transform={tr(onCircle(RT, a))} opacity={f(g.closed)}><Coin r={7} h={3.5} g /></g>; })}
        <g className="fw-lead" transform={tr(onCircle(RT, g.lead.a))} opacity={f(g.lead.o)}><Coin r={8} h={4} g /></g>
      </g>
      <g className="d-p"><g className={`fw-token${g.on === 4 ? " is-on" : ""}`} opacity={f(g.token)}><Token r={TOKEN.r} h={TOKEN.h} /></g></g>
      {st(0)}{st(2)}{st(3)}
      <g className="fw-labs d-o">
        {LOOP.steps.map((s, k) => {
          const p = labAt(k);
          return (
            <g key={k} className={`fw-lab${g.on === k ? " is-on" : ""}`} data-k={k} transform={tr(p)} opacity={f(g.st[k].o)}>
              {/* centred on an estimate of the mono label's width (11 px, 0.08em tracking) */}
              <g transform={`translate(${f(-(14 + (s.short.length + 3) * 7.5) / 2)} 0)`}>
                <circle cx="3" cy="-4" r="3" />
                <text x="14" y="0">{`0${s.n} ${s.short}`}</text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/** the elements the motion moves, and the painters: the stage (scroll) and the clock (alive) */
export function collect(svg: SVGSVGElement) {
  const q = <T extends Element>(s: string) => [...svg.querySelectorAll<T>(s)];
  return {
    st: q<SVGGElement>(".fw-st"), labs: q<SVGGElement>(".fw-lab"), legs: q<SVGPathElement>(".fw-legs path"), heads: q<SVGPathElement>(".fw-heads path"),
    spokes: q<SVGPathElement>(".fw-spokes path"), sigs: q<SVGCircleElement>(".fw-sigs circle"), coins: q<SVGGElement>(".fw-coin"),
    lead: svg.querySelector<SVGGElement>(".fw-lead"), token: svg.querySelector<SVGGElement>(".fw-token"),
    drop: svg.querySelector<SVGGElement>(".fw-drop"), ram: svg.querySelector<SVGGElement>(".fw-ram"), hops: q<SVGGElement>(".fw-hop"),
  };
}
export type FwEls = ReturnType<typeof collect>;

export function paintStage(el: FwEls, s: number) {
  const g = geo(s);
  el.st.forEach((n) => { const k = Number(n.dataset.k), q = g.st[k]; n.setAttribute("transform", `translate(0 ${f(q.y)})`); n.setAttribute("opacity", f(q.o)); n.classList.toggle("is-on", g.on === k); });
  el.labs.forEach((n) => { const k = Number(n.dataset.k); n.setAttribute("opacity", f(g.st[k].o)); n.classList.toggle("is-on", g.on === k); });
  el.legs.forEach((p, k) => { p.style.strokeDashoffset = f(1 - g.legs[k]); });
  el.heads.forEach((p, k) => p.setAttribute("opacity", g.legs[k] > 0.97 ? "1" : "0"));
  el.spokes.forEach((p, i) => { p.style.strokeDashoffset = f(1 - g.spokes[i]); });
  el.token?.setAttribute("opacity", f(g.token));
  el.token?.classList.toggle("is-on", g.on === 4);
  el.coins.forEach((c) => c.setAttribute("opacity", f(g.closed)));
  if (el.lead) { el.lead.setAttribute("transform", tr(onCircle(RT, g.lead.a))); el.lead.setAttribute("opacity", f(g.lead.o)); }
  return g;
}

/** the living parts at clock t: the coins run the track, coins drop into the vault, the press works, people shift on their feet, value runs the spokes */
export function paintClock(el: FwEls, t: number, spokes = [1, 1]) {
  const a0 = rad(ANG[0]);
  el.coins.forEach((c, i) => c.setAttribute("transform", tr(onCircle(RT, a0 + (i / N_COINS) * Math.PI * 2 + t * SPIN))));
  if (el.drop) {
    const u = (t * 0.55) % 1;   // falls into the slot, fades as it goes in, waits, comes again
    el.drop.setAttribute("transform", `translate(0 ${f(ease3(seg(u, 0, 0.7)) * 22)})`);
    el.drop.setAttribute("opacity", f(seg(u, 0, 0.1) * (1 - seg(u, 0.66, 0.74))));
  }
  if (el.ram) { const k = Math.pow(Math.max(0, Math.sin(t * 1.6)), 3); el.ram.setAttribute("transform", `translate(0 ${f(k * 7 - 7)})`); }
  el.hops.forEach((h) => { const i = Number(h.dataset.i), k = Math.sin(t * 1.4 + i * 2.1), dy = -Math.pow(Math.max(0, k), 10) * 3.4; h.setAttribute("transform", `translate(0 ${f(dy)})`); });
  el.sigs.forEach((c, i) => {
    const u = (t * 0.45 + i * 0.5) % 1, [a, b] = SPOKES[i];
    c.setAttribute("transform", tr([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]));
    c.setAttribute("opacity", f(clamp01(Math.min(u, 1 - u) * 6) * (spokes[i] > 0.97 ? 1 : 0)));
  });
}
