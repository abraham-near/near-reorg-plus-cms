"use client";
// Revenue option B, "Screen": the Stack's dark becomes the dashboard.
// The band arrives as the Stack's own ground, full bleed, the heading on it. On desktop its stage holds (sticky) while the dark contracts, scrubbed, from the
// screen's edges to a framed screen inside the ruled grid (the homepage's bleeds, in reverse): the paper shows round it, the heading is left behind on paper
// (the dark wipes off it), crosshairs land on the screen's corners, and the figures fill once it settles. By the time the figures strip arrives the page is on
// paper, on the same frame lines. Phones, short screens and reduced motion: the settled state (the heading on paper, the framed screen), no hold.
// Motion: ./motion.ts; geometry: ./chart.ts; figures: ../data.ts.
import { useRef, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { REV, fmtK } from "../data";
import { W, H, MONTHS, maxL, maxR, barW, xAt, END, LINE, AREA, ARC, TICKS, MARK } from "./chart";
import { mount } from "./motion";
import "./revenue-b.css";

/** a figure that counts up (motion.ts reads data-to / data-dec; the markup carries the final value) */
const Count = ({ to, dec, pre = "", suf = "" }: { to: number; dec: number; pre?: string; suf?: string }) => (
  <span className="rvb-n" data-count="" data-to={to} data-dec={dec} data-pre={pre} data-suf={suf}>{pre}{to.toFixed(dec)}{suf}</span>
);

/** the heading row: once for real (on paper), once as the dark's copy (aria-hidden, inert: the dark wipes off the real one) */
function Head({ ghost }: { ghost?: boolean }): ReactNode {
  return (
    <div className={ghost ? "rvb-head rvb-head--ghost" : "rvb-head"} aria-hidden={ghost || undefined} inert={ghost || undefined} data-nav-tone={ghost ? undefined : "light"}>
      <div className="rvb-head__h">
        {ghost ? <p className="l-h2">Real Usage, Real <span className="accent">Revenue</span></p>
          : <h2 id="rvb-t" className="l-h2">Real Usage, Real <span className="accent">Revenue</span></h2>}
        <p className="rvb-cta"><a className="l-btn" href={REV.href} tabIndex={ghost ? -1 : undefined}><span>Explore NEAR’s revenue dashboard</span></a></p>
      </div>
      <div className="rvb-head__b">
        <p className="l-lede">NEAR Intents fees generate revenue that fuel NEAR buybacks, tracked live and onchain. On NEAR&nbsp;AI, staked NEAR pays for confidential inference, so intelligence runs on the token&nbsp;itself.</p>
      </div>
    </div>
  );
}

export function RevenueB() {
  const ref = useRef<HTMLElement>(null);
  useScrollMotion(ref, mount);
  const ratio = (REV.net30 / REV.fees30) * 100;
  return (
    <section ref={ref} className="l-sec rvb" id="revenue" aria-labelledby="rvb-t" data-nav-tone="dark">
      <div className="rvb-track">
        <div className="rvb-stage" data-nav-tone="light">
          <Head />
          {/* the Stack's ground: full bleed, contracting to the screen (motion.ts writes its clip-path) */}
          <div className="rvb-dark" aria-hidden="true"><Head ghost /></div>

          <div className="rvb-screen" data-nav-tone="dark">
            <p className="rvb-bar"><i className="rvb-live" aria-hidden="true" /><span>NEAR is earning <span className="rvb-g">revenue</span>, in real time.</span></p>

            <div className="rvb-c rvb-total">
              <p className="rvb-big"><Count to={REV.total} dec={2} pre="$" suf="M" /> <span className="rvb-unit">USD</span></p>
              <p className="rvb-note">NEAR captures a growing share of fees, feeding buybacks that permanently remove NEAR from circulation.</p>
            </div>

            <div className="rvb-c rvb-gauge">
              <div className="rvb-dial">
                <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
                  {TICKS.map((t, i) => <line key={i} className={t.major ? "rvb-tick rvb-tick--m" : "rvb-tick"} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />)}
                  <path className="rvb-dial__track" d={ARC} pathLength={100} />
                  <path className="rvb-dial__val" d={ARC} pathLength={100} style={{ strokeDasharray: `${REV.capture} 100` }} data-gauge={REV.capture} />
                  <line className="rvb-dial__mark" x1={MARK.x1} y1={MARK.y1} x2={MARK.x2} y2={MARK.y2} />
                </svg>
                <p className="rvb-dial__v"><Count to={REV.capture} dec={0} suf="%" /><span className="rvb-lbl">Capture</span></p>
              </div>
              <p className="rvb-cap">Share of total fees captured as net revenue.</p>
            </div>

            <div className="rvb-c rvb-chart">
              <div className="rvb-chart__top"><h3 className="rvb-h3">Cumulative NEAR Revenue</h3><span className="rvb-chip">All time</span></div>
              <figure className="rvb-fig">
                <div className="rvb-ax rvb-ax--l" aria-hidden="true">{REV.axisL.map((v) => <span key={v} style={{ top: `${100 - (v / maxL) * 100}%` }}>{fmtK(v)}</span>)}</div>
                <div className="rvb-plot">
                  <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Cumulative NEAR revenue, all time: $${REV.total.toFixed(2)}M USD, with each month's net revenue as bars.`}>
                    {REV.axisR.map((v) => { const y = H - ((v * 1000) / maxR) * H; return <line key={v} className="rvb-grid" x1="0" x2={W} y1={y} y2={y} />; })}
                    {MONTHS.map((v, i) => { const h = (v / maxL) * H; return <rect key={i} className="rvb-bar-m" x={xAt(i) - barW / 2} y={H - h} width={barW} height={h} />; })}
                    <path className="rvb-area" d={AREA} />
                    <path className="rvb-line" d={LINE} pathLength={1} />
                  </svg>
                  <i className="rvb-end" aria-hidden="true" style={{ left: `${(END[0] / W) * 100}%`, top: `${(END[1] / H) * 100}%` }} />
                </div>
                <div className="rvb-ax rvb-ax--r" aria-hidden="true">{REV.axisR.map((v) => <span key={v} style={{ top: `${100 - ((v * 1000) / maxR) * 100}%` }}>${v.toFixed(1)}M</span>)}</div>
              </figure>
            </div>

            <div className="rvb-c rvb-30">
              <p className="rvb-30__h">Last 30 days</p>
              <div className="rvb-30__body">
                <dl className="rvb-30__figs">
                  <div><dt className="rvb-lbl">Net revenue</dt><dd><Count to={REV.net30} dec={2} pre="$" suf="M" /> <span className="rvb-unit rvb-unit--s">USD</span></dd></div>
                  <div><dt className="rvb-lbl">Fees generated</dt><dd><Count to={REV.fees30} dec={2} pre="$" suf="M" /> <span className="rvb-unit rvb-unit--s">USD</span></dd></div>
                </dl>
                {/* net revenue as a share of the fees, drawn (the two figures above, nothing new) */}
                <div className="rvb-ratio" aria-hidden="true"><i style={{ width: `${ratio.toFixed(2)}%` }} /></div>
              </div>
            </div>

            {/* crosshairs: inside the screen where its lines meet (paper on the dark), and on its corners (ink on the paper) */}
            <b className="rvb-x rvb-x--in rvb-x--c" style={{ left: "var(--rvb-col)", top: "var(--rvb-r1)" }} aria-hidden="true" />
            <b className="rvb-x rvb-x--in rvb-x--c" style={{ left: "var(--rvb-col)", top: "var(--rvb-r2)" }} aria-hidden="true" />
            <b className="rvb-x rvb-x--in" style={{ left: "0%", top: "var(--rvb-r1)" }} aria-hidden="true" />
            <b className="rvb-x rvb-x--in" style={{ left: "100%", top: "var(--rvb-r1)" }} aria-hidden="true" />
            <b className="rvb-x rvb-x--in" style={{ left: "0%", top: "var(--rvb-r2)" }} aria-hidden="true" />
            <b className="rvb-x rvb-x--in" style={{ left: "100%", top: "var(--rvb-r2)" }} aria-hidden="true" />
            <b className="rvb-x rvb-x--out" style={{ left: "0%", top: "0%" }} aria-hidden="true" />
            <b className="rvb-x rvb-x--out rvb-x--c" style={{ left: "var(--rvb-col)", top: "0%" }} aria-hidden="true" />
            <b className="rvb-x rvb-x--out" style={{ left: "100%", top: "0%" }} aria-hidden="true" />
            <b className="rvb-x rvb-x--out" style={{ left: "0%", top: "100%" }} aria-hidden="true" />
            <b className="rvb-x rvb-x--out" style={{ left: "100%", top: "100%" }} aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
