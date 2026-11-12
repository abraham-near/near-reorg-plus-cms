"use client";
// Revenue option D · "Scroll story": the transition is the scroll. The section is a finished paper bento on the figures' grid (five columns, so its
// dividers run on into the strip's), and on desktop (motion on) it is told in one sticky 100vh stage that starts on the Stack's ink: the heading, the
// total counting up, the ground turning to paper on a rising line, then the grid drawing itself while the chart, the gauge and the last 30 days build.
// When the stage lets go, its last line is the figures' first rule. Phones, short screens and reduced motion: the finished bento, no hold. Motion: ./motion.ts.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { REV, fmtK } from "../data";
import { mount } from "./motion";
import { ISO } from "./iso";
import { FLAT } from "./flat";
import "./revenue-d.css";


// the gauge: a 270° arc open at the foot (from 135° round the top to 45°)
const ARC = "M43.4,156.6 A80,80 0 1 1 156.6,156.6";

/** a figure: the final value for everyone (sr-only), and a display copy that motion.ts counts up (data-to / data-dec / data-pre / data-suf) */
const Count = ({ to, dec, pre = "", suf = "" }: { to: number; dec: number; pre?: string; suf?: string }) => (
  <><span className="sr-only">{pre}{to.toFixed(dec)}{suf}</span><span aria-hidden="true" data-count="" data-to={to} data-dec={dec} data-pre={pre} data-suf={suf}>{pre}{to.toFixed(dec)}{suf}</span></>
);

/** a cell's lines: its top rule (a + at each end) and, unless it starts the row, its left divider */
const Lines = ({ left = false }: { left?: boolean }) => (
  <>
    <i className="rvd-hr" aria-hidden="true" />
    <b className="rvd-x rvd-x--l" aria-hidden="true" />
    <b className="rvd-x rvd-x--r" aria-hidden="true" />
    {left && <i className="rvd-vr" aria-hidden="true" />}
  </>
);

/** flat: the chart in 2D (bars + line, ./flat.ts) instead of the isometric scene (home v5) */
export function RevenueD({ flat = false }: { flat?: boolean }) {
  const G = flat ? FLAT : ISO, FULL = G.line(1);
  const ref = useRef<HTMLElement>(null);
  useScrollMotion(ref, mount);
  return (
    <section ref={ref} className="l-sec rvd" id="revenue" aria-labelledby="rvd-t" data-nav-tone="light" data-chart={flat ? "flat" : undefined}>
      <div className="rvd-stage">
        <div className="rvd-paper" aria-hidden="true" />
        <div className="rvd-edge" aria-hidden="true" />
        <div className="rvd-bento">
          <i className="rvd-fl" aria-hidden="true" />
          <i className="rvd-fr" aria-hidden="true" />

          <div className="rvd-cell rvd-h">
            <Lines />
            <div className="rvd-in"><h2 id="rvd-t" className="l-h2 rvd-ink rvd-h2">Real Usage, Real <span className="accent">Revenue</span></h2></div>
          </div>
          <div className="rvd-cell rvd-l">
            <Lines left />
            <div className="rvd-in"><p className="l-lede rvd-ink rvd-lede">NEAR Intents fees generate revenue that fuel NEAR buybacks, tracked live and onchain. On NEAR&nbsp;AI, staked NEAR pays for confidential inference, so intelligence runs on the token&nbsp;itself.</p></div>
          </div>

          <div className="rvd-cell rvd-t">
            <Lines />
            <div className="rvd-in">
              <p className="rvd-ink rvd-kick">NEAR is earning <span className="rvd-ink rvd-g">revenue</span>, in real time.</p>
              <p className="rvd-ink rvd-big"><Count to={REV.total} dec={2} pre="$" suf="M" /> <span className="rvd-ink rvd-unit">USD</span></p>
              <p className="rvd-ink rvd-note">NEAR captures a growing share of fees, feeding buybacks that permanently remove NEAR from circulation.</p>
            </div>
          </div>

          <div className="rvd-cell rvd-c">
            <Lines left />
            <div className="rvd-c__top"><h3 className="rvd-h3">Cumulative NEAR Revenue</h3><span className="rvd-chip">All time</span></div>
            <figure className="rvd-fig">
              <div className="rvd-iso" style={{ ["--ar" as string]: (G.VW / G.VH).toFixed(4) }}>
                <svg viewBox={`${G.VX.toFixed(3)} ${G.VY.toFixed(3)} ${G.VW.toFixed(3)} ${G.VH.toFixed(3)}`} role="img"
                  aria-label={`Cumulative NEAR revenue, all time: $${REV.total.toFixed(2)}M, with each month's revenue as a column.`}>
                  <g className="rvd-stage3">
                    <path className="rvd-wall" d={G.WALL} />
                    <path className="rvd-wall-t" d={G.WALL_TICKS} />
                    <path className="rvd-floor" d={G.FLOOR} />
                    <path className="rvd-floor-g" d={G.GRID} />
                  </g>
                  {G.COL_H.map((h, i) => ({ h, i })).reverse().map(({ h, i }) => {
                    const c = G.column(i, h);
                    return <g key={i} className="rvd-col" data-i={i}><path className="rvd-col-l" d={c.l} /><path className="rvd-col-r" d={c.r} /><path className="rvd-col-t" d={c.t} /></g>;
                  })}
                  <path className="rvd-run" d={FULL.d} />
                  <circle className="rvd-head" cx={FULL.hx} cy={FULL.hy} r={G.HEAD_R} />
                </svg>
                <div className="rvd-ticks" aria-hidden="true">
                  {G.TICKS_L.map((t) => <span key={t.v} className="rvd-tick rvd-tick--l" style={t.at}>{fmtK(t.v)}</span>)}
                  {G.TICKS_R.map((t) => <span key={t.v} className="rvd-tick rvd-tick--r" style={t.at}>${t.v.toFixed(1)}M</span>)}
                </div>
                <span className="rvd-tag" style={G.END} aria-hidden="true"><b><i />${REV.total.toFixed(2)}M</b></span>
                <span className="rvd-fin" aria-hidden="true"><i className="tl" /><i className="tr" /><i className="bl" /><i className="br" /></span>
              </div>
            </figure>
            <p className="rvd-cta"><a className="l-btn" href={REV.href}><span>Explore NEAR’s revenue dashboard</span></a></p>
          </div>

          <div className="rvd-cell rvd-g8">
            <Lines />
            <div className="rvd-gauge">
              <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
                <path className="rvd-gauge__track" d={ARC} pathLength={100} />
                <path className="rvd-gauge__val" d={ARC} pathLength={100} style={{ strokeDasharray: `${REV.capture} 100` }} data-gauge={REV.capture} />
              </svg>
              <p className="rvd-gauge__v"><Count to={REV.capture} dec={0} suf="%" /><span className="rvd-gauge__l">Capture</span></p>
            </div>
            <p className="rvd-gauge__c">Share of total fees captured as net revenue.</p>
          </div>

          <div className="rvd-cell rvd-d">
            <Lines left />
            <p className="rvd-d__h">Last 30 days</p>
            <dl className="rvd-d__figs">
              <div><dt>Net revenue</dt><dd><Count to={REV.net30} dec={2} pre="$" suf="M" /> <span className="rvd-d__u">USD</span></dd></div>
              <div><dt>Fees generated</dt><dd><Count to={REV.fees30} dec={2} pre="$" suf="M" /> <span className="rvd-d__u">USD</span></dd></div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
