"use client";
// Revenue option C · "Dots". The hinge between the Stack (ink) and the figures (paper, the ruled grid): a short band where the Stack's ink hangs in twelve
// columns, one per grid column, that retract upward as it scrolls (centre first, an emerald line on each moving foot), so the paper opens like the bars
// of a chart; then the section is on paper, on the ruled grid, and its dashboard is drawn in dots: the monthly bars as columns of ink dots, the cumulative line as emerald dots, the capture gauge as rings of dots
// lit emerald to its share, the last 30 days as two rows of dots (net revenue against fees: the same share). Its last rule is the figures' first.
// Drawings: ./dots.ts (canvas), maths: ./geometry.ts, motion: ./motion.ts; the rows' rules, crosshairs and text are ProofDeeper's (data-row / data-rv).
import { useRef, type CSSProperties } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { REV, fmtK } from "../data";
import { MAX_L, MAX_R } from "./geometry";
import { mount } from "./motion";
import "./revenue-c.css";

const money = (v: number) => `$${v.toFixed(2)}M`;

export function RevenueC() {
  const ref = useRef<HTMLElement>(null);
  useScrollMotion(ref, mount);
  return (
    <section ref={ref} className="l-sec rvc" id="revenue" aria-labelledby="rvc-t" data-nav-tone="light">
      {/* the band: the Stack's ink in twelve columns that open onto the paper (the two halves tell the header which ground it is over) */}
      <div className="rvc-melt" aria-hidden="true">
        <span className="rvc-melt__tone" data-nav-tone="dark" />
        <span className="rvc-melt__tone" data-nav-tone="light" />
        <span className="rvc-cols">{Array.from({ length: 12 }, (_, i) => <span key={i} className="rvc-col" />)}</span>
        <span className="rvc-melt__v" />
      </div>

      <div className="l-row rvc-head" data-row="">
        <div className="l-cell rvc-head__h"><h2 id="rvc-t" className="l-h2" data-rv="">Real Usage, Real <span className="accent">Revenue</span></h2></div>
        <div className="l-cell rvc-head__b" data-rv="">
          <p className="l-lede">NEAR Intents fees generate revenue that fuel NEAR buybacks, tracked live and onchain. On NEAR&nbsp;AI, staked NEAR pays for confidential inference, so intelligence runs on the token&nbsp;itself.</p>
          <p className="rvc-cta"><a className="l-btn" href={REV.href}><span>Explore NEAR’s revenue dashboard</span></a></p>
        </div>
      </div>

      <div className="l-row rvc-a" data-row="">
        <div className="l-cell rvc-total">
          <p className="rvc-kick" data-rv=""><i className="rvc-live" aria-hidden="true" />NEAR is earning revenue, in real time.</p>
          <p className="rvc-big" data-rv="">{money(REV.total)} <span className="rvc-usd">USD</span></p>
          <p className="rvc-note" data-rv="">NEAR captures a growing share of fees, feeding buybacks that permanently remove NEAR from circulation.</p>
        </div>
        <div className="l-cell rvc-gauge">
          <div className="rvc-dial" data-rv="">
            <canvas className="rvc-dial__c" aria-hidden="true" />
            <p className="rvc-dial__v"><span className="rvc-dial__n">{REV.capture}%</span><span className="rvc-dial__l">Capture</span></p>
          </div>
          <p className="rvc-gauge__c" data-rv="">Share of total fees captured as net revenue.</p>
        </div>
      </div>

      <div className="l-row rvc-b" data-row="">
        <div className="l-cell rvc-chart">
          <div className="rvc-chart__top" data-rv=""><h3 className="rvc-h3">Cumulative NEAR Revenue</h3><span className="rvc-chip">All time</span></div>
          <figure className="rvc-fig" data-rv="">
            <div className="rvc-ax rvc-ax--l" aria-hidden="true">{REV.axisL.map((v) => <span key={v} style={{ top: `${100 - (v / MAX_L) * 100}%` }}>{fmtK(v)}</span>)}</div>
            <div className="rvc-plot" role="img" aria-label={`Cumulative NEAR revenue, all time: ${money(REV.total)} USD, with each month's revenue as a column of dots.`}>
              <canvas className="rvc-plot__c" aria-hidden="true" />
            </div>
            <div className="rvc-ax rvc-ax--r" aria-hidden="true">{REV.axisR.map((v) => <span key={v} style={{ top: `${100 - ((v * 1000) / MAX_R) * 100}%` }}>${v.toFixed(1)}M</span>)}</div>
          </figure>
        </div>
        <div className="l-cell rvc-30">
          <p className="rvc-30__h" data-rv="">Last 30 days</p>
          <dl className="rvc-30__figs" data-rv="">
            <div>
              <dt className="rvc-label">Net revenue</dt>
              <dd><span className="rvc-30__v">{money(REV.net30)} <span className="rvc-u">USD</span></span>
                <span className="rvc-row" aria-hidden="true"><span className="rvc-row__on rvc-row__on--g" style={{ "--w": REV.net30 / REV.fees30 } as CSSProperties} /></span></dd>
            </div>
            <div>
              <dt className="rvc-label">Fees generated</dt>
              <dd><span className="rvc-30__v">{money(REV.fees30)} <span className="rvc-u">USD</span></span>
                <span className="rvc-row" aria-hidden="true"><span className="rvc-row__on" style={{ "--w": 1 } as CSSProperties} /></span></dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
