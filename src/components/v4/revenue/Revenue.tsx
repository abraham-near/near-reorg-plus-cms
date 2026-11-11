"use client";
// v4's revenue band, the hinge between the Stack and the figures. It keeps the Stack's ground (ink) and takes the figures' grammar (the ruled grid,
// its rows drawing in, crosshairs): the grid draws itself over the dark as it arrives. Its last rule is the proof strip's first, so the ground turns to
// paper on that line, where the strip's green rule lights. Inside: the doc's heading, lede and button, then a bento of the client's revenue dashboard
// (the total, the capture gauge, the cumulative chart, the last 30 days) in our type and lines. Rows: ProofDeeper's motion (data-row); the figures count up,
// the bars rise, the line draws and the gauge fills once the band is in view (./motion.ts). Figures: ./data.ts (a snapshot, not live).
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { REV, fmtK } from "./data";
import { mount } from "./motion";
import "./revenue.css";

// the chart: bars (monthly, left scale) and the cumulative line (right scale) in a 1000 × 400 box, stretched to its cell
const W = 1000, H = 400, N = REV.monthly.length;
const SUM = REV.monthly.reduce((a, b) => a + b, 0), K = (REV.total * 1000) / SUM;   // the bars, scaled to add up to the total
const MONTHS = REV.monthly.map((v) => v * K);
const maxL = REV.axisL[REV.axisL.length - 1], maxR = REV.axisR[REV.axisR.length - 1] * 1000;
const slot = W / (N + 1), barW = slot * 0.42;
const xAt = (i: number) => (i + 1) * slot;   // a month's centre (x = 0 is the start: nothing yet)
const pts: [number, number][] = [[0, H]];
MONTHS.reduce((acc, v, i) => { const c = acc + v; pts.push([xAt(i), H - (c / maxR) * H]); return c; }, 0);
pts.push([W, pts[pts.length - 1][1]]);
/** a monotone curve through the points (no overshoot: the total only grows) */
function monotone(p: [number, number][]) {
  const n = p.length, d: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0]));
  m.push(d[0]); for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; } }
  let s = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) { const h = (p[i + 1][0] - p[i][0]) / 3; s += ` C${(p[i][0] + h).toFixed(1)},${(p[i][1] + m[i] * h).toFixed(1)} ${(p[i + 1][0] - h).toFixed(1)},${(p[i + 1][1] - m[i + 1] * h).toFixed(1)} ${p[i + 1][0].toFixed(1)},${p[i + 1][1].toFixed(1)}`; }
  return s;
}
const LINE = monotone(pts);
// the gauge: a 270° arc open at the foot (from 135° round the top to 45°)
const ARC = "M43.4,156.6 A80,80 0 1 1 156.6,156.6";

/** a figure that counts up (motion.ts reads data-to / data-dec; the markup carries the final value) */
const Count = ({ to, dec, pre = "", suf = "" }: { to: number; dec: number; pre?: string; suf?: string }) => (
  <span data-count="" data-to={to} data-dec={dec} data-pre={pre} data-suf={suf}>{pre}{to.toFixed(dec)}{suf}</span>
);

export function Revenue() {
  const ref = useRef<HTMLElement>(null);
  useScrollMotion(ref, mount);
  return (
    <section ref={ref} className="l-sec l-rev" id="revenue" aria-labelledby="l-rev-t" data-nav-tone="dark">
      <div className="l-row rv-head" data-row="">
        <div className="l-cell rv-head__h"><h2 id="l-rev-t" className="l-h2" data-rv="">Real Usage, Real <span className="accent">Revenue</span></h2></div>
        <div className="l-cell rv-head__b" data-rv="">
          <p className="l-lede">NEAR Intents fees generate revenue that fuel NEAR buybacks, tracked live and onchain. On NEAR&nbsp;AI, staked NEAR pays for confidential inference, so intelligence runs on the token&nbsp;itself.</p>
          <p className="l-cta"><a className="l-btn" href={REV.href}><span>Explore NEAR’s revenue dashboard</span></a></p>
        </div>
      </div>

      <div className="l-row rv-a" data-row="">
        <div className="l-cell rv-total">
          <p className="rv-kick" data-rv="">NEAR is earning <span className="rv-g">revenue</span>, in real time.</p>
          <p className="rv-big" data-rv=""><Count to={REV.total} dec={2} pre="$" suf="M" /> <span className="rv-unit">USD</span></p>
          <p className="rv-note" data-rv="">NEAR captures a growing share of fees, feeding buybacks that permanently remove NEAR from circulation.</p>
        </div>
        <div className="l-cell rv-gauge">
          <div className="rv-gauge__dial" data-rv="">
            <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
              <path className="rv-gauge__track" d={ARC} pathLength={100} />
              <path className="rv-gauge__val" d={ARC} pathLength={100} style={{ strokeDasharray: `${REV.capture} 100` }} data-gauge={REV.capture} />
            </svg>
            <p className="rv-gauge__v"><Count to={REV.capture} dec={0} suf="%" /><span className="rv-gauge__l">Capture</span></p>
          </div>
          <p className="rv-gauge__c" data-rv="">Share of total fees captured as net revenue.</p>
        </div>
      </div>

      <div className="l-row rv-b" data-row="">
        <div className="l-cell rv-chart">
          <div className="rv-chart__top" data-rv=""><h3 className="rv-h3">Cumulative NEAR Revenue</h3><span className="rv-chip">All time</span></div>
          <figure className="rv-chart__fig" data-rv="">
            <div className="rv-ax rv-ax--l" aria-hidden="true">{REV.axisL.map((v) => <span key={v} style={{ top: `${100 - (v / maxL) * 100}%` }}>{fmtK(v)}</span>)}</div>
            <div className="rv-plot">
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Cumulative NEAR revenue, all time: $${REV.total.toFixed(2)}M, with each month's revenue as bars.`}>
                {REV.axisR.map((v) => <line key={v} className="rv-grid" x1="0" x2={W} y1={H - ((v * 1000) / maxR) * H} y2={H - ((v * 1000) / maxR) * H} />)}
                {MONTHS.map((v, i) => { const h = (v / maxL) * H; return <rect key={i} className="rv-bar" x={xAt(i) - barW / 2} y={H - h} width={barW} height={h} style={{ ["--i" as string]: i }} />; })}
                <path className="rv-line" d={LINE} pathLength={1} />
              </svg>
            </div>
            <div className="rv-ax rv-ax--r" aria-hidden="true">{REV.axisR.map((v) => <span key={v} style={{ top: `${100 - ((v * 1000) / maxR) * 100}%` }}>${v.toFixed(1)}M</span>)}</div>
          </figure>
        </div>
        <div className="l-cell rv-30">
          <p className="rv-30__h" data-rv="">Last 30 days</p>
          <dl className="rv-30__figs" data-rv="">
            <div><dt className="t-label">Net revenue</dt><dd><Count to={REV.net30} dec={2} pre="$" suf="M" /> <span className="rv-unit rv-unit--s">USD</span></dd></div>
            <div><dt className="t-label">Fees generated</dt><dd><Count to={REV.fees30} dec={2} pre="$" suf="M" /> <span className="rv-unit rv-unit--s">USD</span></dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}
