"use client";
// Revenue option A · "Shutter": the hinge between the Stack (ink, isometric) and the figures (paper, ruled). The section is a paper ledger page in the
// figures' grammar (ProofDeeper's ruled rows, crosshairs, [data-rv] rising); over its top lies a sheet of the Stack's ink (the shutter) that carries the
// heading row in paper type. Scrolling in, the shutter rolls up (scrubbed, eased) on a thin emerald edge, faster than the page: the ledger shows below
// the edge and the heading turns from paper-on-ink to ink-on-paper as the edge crosses it; at the end the edge folds into the Stack's foot.
// Inside: the doc's heading, lede and button, then the dashboard as a bento of ledger cells (the total, the fees → buybacks isometric, the capture
// dial; the chart and the last 30 days), whose last rule is the figures' first. Motion: ./motion.ts. Figures: ../data.ts (a snapshot). Reduced motion: no shutter, final values.
import { useRef, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { REV, fmtK } from "../data";
import { mount } from "./motion";
import { IsoBuyback } from "./IsoBuyback";
import "./revenue-a.css";

// the chart (the current band's maths): monthly bars (left scale) and the cumulative line (right scale) in a 1000 × 400 box, stretched to its cell
const W = 1000, H = 400, N = REV.monthly.length;
const SUM = REV.monthly.reduce((a, b) => a + b, 0), K = (REV.total * 1000) / SUM;   // the bars, scaled to add up to the total
const MONTHS = REV.monthly.map((v) => v * K);
const maxL = REV.axisL[REV.axisL.length - 1], maxR = REV.axisR[REV.axisR.length - 1] * 1000;
const slot = W / (N + 1), barW = slot * 0.5;
const xAt = (i: number) => (i + 1) * slot;
const pts: [number, number][] = [[0, H]];
MONTHS.reduce((acc, v, i) => { const c = acc + v; pts.push([xAt(i), H - (c / maxR) * H]); return c; }, 0);
const END = pts[pts.length - 1];
pts.push([W, END[1]]);
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

// the dial: a 270° arc open at the foot (135° round the top to 45°), r 80 in a 200 box, with a tick every 5 % (longer every 25 %)
const ARC = "M43.4,156.6 A80,80 0 1 1 156.6,156.6";
const TICKS = Array.from({ length: 21 }, (_, i) => {
  const a = ((135 + 270 * (i / 20)) * Math.PI) / 180, major = i % 5 === 0, r0 = major ? 90 : 92, r1 = 98;
  return { x1: 100 + r0 * Math.cos(a), y1: 100 + r0 * Math.sin(a), x2: 100 + r1 * Math.cos(a), y2: 100 + r1 * Math.sin(a), major };
});

/** a figure that counts up (motion.ts reads data-to / data-dec; the markup carries the final value) */
const Count = ({ to, dec, pre = "", suf = "" }: { to: number; dec: number; pre?: string; suf?: string }) => (
  <span data-count="" data-to={to} data-dec={dec} data-pre={pre} data-suf={suf}>{pre}{to.toFixed(dec)}{suf}</span>
);

/** the heading row: once for the page (real), once on the shutter (paper type on ink, inert) */
function Head({ id, shut }: { id?: string; shut?: boolean }): ReactNode {
  const H2 = shut ? "p" : "h2";
  return (
    <div className="l-row rva-head" data-row="">
      <div className="l-cell rva-head__h"><H2 id={id} className="l-h2" data-rv="">Real Usage, Real <span className="accent">Revenue</span></H2></div>
      <div className="l-cell rva-head__b" data-rv="">
        <p className="l-lede">NEAR Intents fees generate revenue that fuel NEAR buybacks, tracked live and onchain. On NEAR&nbsp;AI, staked NEAR pays for confidential inference, so intelligence runs on the token&nbsp;itself.</p>
        <p className="l-cta"><a className="l-btn" href={REV.href} tabIndex={shut ? -1 : undefined}><span>Explore NEAR’s revenue dashboard</span></a></p>
      </div>
    </div>
  );
}

export function RevenueA() {
  const ref = useRef<HTMLElement>(null);
  useScrollMotion(ref, mount);
  return (
    <section ref={ref} className="l-sec rva" id="revenue" aria-labelledby="rva-t" data-nav-tone="light">
      {/* the shutter: the Stack's ink over the section's top, rolled up by motion.ts (--rva-h: its height); hidden without motion */}
      <div className="rva-sh" aria-hidden="true" inert>
        <div className="rva-sh__ink"><Head shut /></div>
        <i className="rva-sh__edge" />
      </div>

      <Head id="rva-t" />

      <div className="l-row rva-r2" data-row="">
        <div className="l-cell rva-total">
          <p className="rva-kick" data-rv=""><i className="rva-live" aria-hidden="true" /><span>NEAR is earning <span className="rva-g">revenue</span>, in real time.</span></p>
          <p className="rva-big" data-rv=""><Count to={REV.total} dec={2} pre="$" suf="M" /><span className="rva-unit">USD</span></p>
          <p className="rva-note" data-rv="">NEAR captures a growing share of fees, feeding buybacks that permanently remove NEAR from circulation.</p>
        </div>
        <div className="l-cell rva-isocell">
          {/* fees → buybacks, in the rail's isometric hand, framed by the rail's viewfinder corners */}
          <div className="rva-fin" data-rv=""><IsoBuyback /><i className="tl" /><i className="tr" /><i className="bl" /><i className="br" /></div>
        </div>
        <div className="l-cell rva-gauge">
          <div className="rva-dial" data-rv="">
            <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
              {TICKS.map((t, i) => <line key={i} className={t.major ? "rva-tick rva-tick--m" : "rva-tick"} x1={t.x1.toFixed(2)} y1={t.y1.toFixed(2)} x2={t.x2.toFixed(2)} y2={t.y2.toFixed(2)} />)}
              <path className="rva-dial__track" d={ARC} />
              <path className="rva-dial__val" d={ARC} pathLength={100} style={{ strokeDasharray: `${REV.capture} 100` }} data-gauge={REV.capture} />
            </svg>
            <p className="rva-dial__v"><Count to={REV.capture} dec={0} suf="%" /><span className="t-label">Capture</span></p>
          </div>
          <p className="rva-gauge__c" data-rv="">Share of total fees captured as net revenue.</p>
        </div>
      </div>

      <div className="l-row rva-r3" data-row="">
        <div className="l-cell rva-chart">
          <div className="rva-chart__top" data-rv=""><h3 className="rva-h3">Cumulative NEAR Revenue</h3><span className="rva-chip">All time</span></div>
          <figure className="rva-chart__fig" data-rv="">
            <div className="rva-ax rva-ax--l" aria-hidden="true">{REV.axisL.map((v) => <span key={v} style={{ top: `${100 - (v / maxL) * 100}%` }}>{fmtK(v)}</span>)}</div>
            <div className="rva-plot">
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Cumulative NEAR revenue, all time: $${REV.total.toFixed(2)}M USD, with each month's revenue as bars.`}>
                {REV.axisR.map((v) => <line key={v} className="rva-grid" x1="0" x2={W} y1={H - ((v * 1000) / maxR) * H} y2={H - ((v * 1000) / maxR) * H} />)}
                {MONTHS.map((v, i) => { const h = (v / maxL) * H; return <rect key={i} className="rva-bar" x={xAt(i) - barW / 2} y={H - h} width={barW} height={h} />; })}
                {MONTHS.map((_, i) => <line key={`t${i}`} className="rva-xt" x1={xAt(i)} x2={xAt(i)} y1={H} y2={H + 14} />)}
                <path className="rva-line" d={LINE} pathLength={1} />
              </svg>
              <i className="rva-end" aria-hidden="true" style={{ left: `${(END[0] / W) * 100}%`, top: `${(END[1] / H) * 100}%` }} />
            </div>
            <div className="rva-ax rva-ax--r" aria-hidden="true">{REV.axisR.map((v) => <span key={v} style={{ top: `${100 - ((v * 1000) / maxR) * 100}%` }}>${v.toFixed(1)}M</span>)}</div>
          </figure>
        </div>
        <div className="l-cell rva-30">
          <h3 className="rva-h3" data-rv="">Last 30 days</h3>
          <dl className="rva-30__figs" data-rv="">
            <div><dt className="t-label">Net revenue</dt><dd><Count to={REV.net30} dec={2} pre="$" suf="M" /><span className="rva-unit">USD</span></dd></div>
            <div><dt className="t-label">Fees generated</dt><dd><Count to={REV.fees30} dec={2} pre="$" suf="M" /><span className="rva-unit">USD</span></dd></div>
          </dl>
          {/* net against fees, as a share of the rule (derived from the two figures above) */}
          <div className="rva-share" aria-hidden="true" data-rv=""><i style={{ width: `${((REV.net30 / REV.fees30) * 100).toFixed(1)}%` }} /></div>
        </div>
      </div>
    </section>
  );
}
