"use client";
// near.org/analytics, version A · Overview: the doc read faithfully and leanly, on the homepage's ruled grid (proof-deeper.css: hairlines, + crosshairs,
// rows drawing in, [data-rv] reveals) in Blog J's hand (a display heading with one Kepler word, a quiet lede). From the top:
//   1 the hero (open paper, no cells): "NEAR by the numbers", the subhead, the status line (a live dot + a link to the status card, by STATUS.health);
//   2 core stats: ONE ruled row of the top three (the doc: "keep top 3 if it feels crowded"; five big numbers crowd the row), each a big number, its
//     label and the 24h / 30d delta chips; the sample note on a thin row under it;
//   3 + 4 the revenue card and the network status card, side by side in one row (revenue: the hero number and a drawn sparkline; status: the headline by
//     health, a 2×2 of the four services with their 60-day uptime and a 60-bar strip each, "Last updated … UTC", the CTA);
//   5 Go deeper: the eight tools as a ruled grid of cards (the name set as type, the one-liner, the host and an arrow; the whole card is the link);
//   6 Get exposure to NEAR: the head (sub + disclaimer), SVRN as a wide featured card, then "Active NEAR ETPs & Trusts." as a row of issuer cards;
//   7 the legal line, closing the grid.
// Copy, links and figures: ../content.ts (the doc, verbatim; figures are SAMPLE data). [[TBD: live]] every figure; [[TBD: logos]] names drawn as type.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { monotone } from "../../v4/revenue/d/iso";
import {
  ETPS, ETPS_HEAD, HERO, LEGAL, PRODUCTS_HEAD, REVENUE, SAMPLE_NOTE, STATS, STATUS, SVRN, TOOLS, TOOLS_HEAD, days, type Delta,
} from "../content";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./analytics-a.css";

const CORE = STATS.slice(0, 3);   // the top three; Shards online and NEAR Price stay in content.ts for later
const host = (u: string) => new URL(u).hostname.replace(/^www\./, "");
const idx = (i: number) => String(i + 1).padStart(2, "0");

const Ext = () => (
  <svg className="l-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>
);

/** "24h ▲ 0.8%": the triangle drawn (the fonts have no ▲), the direction spoken */
function Chip({ k, v }: { k: string; v: number }) {
  const dir = v > 0 ? "up" : v < 0 ? "down" : "flat";
  return (
    <span className={`an-a-chip is-${dir}`}>
      <span className="an-a-chip__k">{k}</span>
      <i className="an-a-chip__t" aria-hidden="true" />
      <span className="sr-only">{dir} </span>
      <span className="an-a-chip__v">{Math.abs(v).toFixed(1)}%</span>
    </span>
  );
}
const Chips = ({ d }: { d: Delta }) => <span className="an-a-chips"><Chip k="24h" v={d.d24} /><Chip k="30d" v={d.d30} /></span>;

/** a figure that counts up once (motion.ts): the final value is in the markup (SSR, reduced motion, screen readers); the counting copy is aria-hidden */
const Count = ({ v, className }: { v: string; className: string }) => (
  <span className={className}><span className="sr-only">{v}</span><span aria-hidden="true" data-count={v}>{v}</span></span>
);

/* ── the revenue sparkline: the 16 weeks as a monotone line over a soft area, the last week's dot (SAMPLE) ── */
const SW = 320, SH = 96, SP = 8;
const sMin = Math.min(...REVENUE.spark) - 3, sMax = Math.max(...REVENUE.spark) + 2;
const sPts: [number, number][] = REVENUE.spark.map((v, i) => [(i / (REVENUE.spark.length - 1)) * SW, SP + (1 - (v - sMin) / (sMax - sMin)) * (SH - SP * 2)]);
const sLine = monotone(sPts);
const sArea = `${sLine} L${SW},${SH} L0,${SH} Z`;
const sEnd = sPts[sPts.length - 1];

function Spark() {
  const first = REVENUE.spark[0], last = REVENUE.spark[REVENUE.spark.length - 1];
  return (
    <figure className="an-a-spark">
      <div className="an-a-spark__plot">
        <svg viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none" role="img" aria-label={`Sparkline: the share rose from ${first}% to ${last}% over ${REVENUE.spark.length} weeks (sample data).`}>
          <defs>
            <linearGradient id="an-a-spark-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#00dc8d" stopOpacity="0.22" />
              <stop offset="1" stopColor="#00dc8d" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((t) => <line key={t} className="an-a-spark__grid" x1="0" x2={SW} y1={SH * t} y2={SH * t} vectorEffect="non-scaling-stroke" />)}
          <path className="an-a-spark__area" d={sArea} fill="url(#an-a-spark-g)" />
          <path className="an-a-spark__line" d={sLine} vectorEffect="non-scaling-stroke" />
          <line className="an-a-spark__base" x1="0" x2={SW} y1={SH - 0.5} y2={SH - 0.5} vectorEffect="non-scaling-stroke" />
        </svg>
        <i className="an-a-spark__dot" aria-hidden="true" style={{ left: `${(sEnd[0] / SW) * 100}%`, top: `${(sEnd[1] / SH) * 100}%` }} />
      </div>
      <figcaption className="an-a-spark__cap" aria-hidden="true"><span>{REVENUE.spark.length} weeks ago</span><span>Now</span></figcaption>
    </figure>
  );
}

/* ── a service's 60 days, one bar a day (1 up, 0.5 degraded, 0 down: SAMPLE) ── */
function Strip({ uptime, seed }: { uptime: number; seed: number }) {
  const d = days(uptime, seed);
  return (
    <svg className="an-a-strip" viewBox="0 0 60 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {d.map((s, i) => <rect key={i} className={s === 1 ? "is-up" : s === 0 ? "is-down" : "is-deg"} x={i + 0.24} width="0.52" y={s === 0.5 ? 4 : 0} height={s === 0.5 ? 8 : 12} />)}
    </svg>
  );
}
const stripSay = (uptime: number, seed: number) => {
  const d = days(uptime, seed), deg = d.filter((s) => s === 0.5).length, down = d.filter((s) => s === 0).length;
  if (!deg && !down) return "No incidents in the last 60 days.";
  return [deg && `${deg} degraded ${deg === 1 ? "day" : "days"}`, down && `${down} ${down === 1 ? "outage" : "outages"}`].filter(Boolean).join(", ") + " in the last 60 days.";
};

export function AnalyticsA() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  const ok = STATUS.health === "ok";
  const tools = [TOOLS.slice(0, 4), TOOLS.slice(4)];
  return (
    <div ref={ref} className="l-page an-a">
      {/* 1 · the hero: open paper, Blog J's hand */}
      <header className="an-a-hero" aria-labelledby="an-a-h1">
        <h1 id="an-a-h1" className="an-a-h1">NEAR by the <span className="accent">numbers</span></h1>
        <div className="an-a-hero__foot">
          <p className="an-a-lede" data-in="">{HERO.sub}</p>
          {/* [[TBD: live]] STATUS.health from status.near.org */}
          <p className="an-a-live" data-in="">
            <a href="#status" className={`an-a-live__a${ok ? "" : " is-issue"}`}>
              <i className="an-a-pulse" aria-hidden="true" />
              <span>{ok ? HERO.status : STATUS.h.issue}</span>
              <svg className="an-a-down" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M6 1.5v9M2 6.5 6 10.5 10 6.5" /></svg>
            </a>
          </p>
        </div>
      </header>

      {/* 2 · core stats: one ruled row, then the sample note */}
      <section className="l-sec an-a-stats" aria-labelledby="an-a-stats-t">
        <h2 id="an-a-stats-t" className="sr-only">Core stats</h2>
        <ul className="l-row an-a-stats__row" data-row="">
          {CORE.map((s) => (
            /* [[TBD: live]] the figure and its 24h / 30d deltas */
            <li key={s.key} className="l-cell an-a-stat">
              <p className="an-a-stat__v" data-rv=""><Count v={s.value} className="an-a-num" /></p>
              <p className="an-a-stat__l" data-rv="">{s.label}</p>
              <p className="an-a-stat__d" data-rv=""><Chips d={s.delta} /></p>
            </li>
          ))}
        </ul>
        <div className="l-row an-a-note" data-row="">
          <p className="l-cell an-a-note__c" data-rv=""><i className="an-a-note__i" aria-hidden="true" />{SAMPLE_NOTE}</p>
        </div>
      </section>

      {/* 3 + 4 · the revenue card and the network status card, side by side */}
      <section className="l-sec an-a-pair" aria-label="Revenue and network health">
        <div className="l-row an-a-pair__row" data-row="">
          <article className="l-cell an-a-card an-a-rev" aria-labelledby="an-a-rev-t">
            <p className="t-label an-a-eye" data-rv="">{REVENUE.eyebrow}</p>
            <h2 id="an-a-rev-t" className="an-a-card__h" data-rv="">{REVENUE.h}</h2>
            <p className="an-a-card__b" data-rv="">{REVENUE.body}</p>
            {/* [[TBD: live]] the share and its weekly trend, from revenue.near.org */}
            <div className="an-a-rev__pv" data-rv="">
              <p className="an-a-rev__m"><Count v={REVENUE.metric.value} className="an-a-num an-a-rev__v" /><span className="an-a-rev__l">{REVENUE.metric.label}</span></p>
              <Spark />
            </div>
            <p className="an-a-card__foot" data-rv="">
              <span className="an-a-card__meta">Sample figures</span>
              <a className="l-link" href={REVENUE.href} target="_blank" rel="noopener noreferrer"><span>{REVENUE.cta}</span><Ext /><span className="sr-only"> (opens in a new tab)</span></a>
            </p>
          </article>

          <article id="status" className={`l-cell an-a-card an-a-st${ok ? "" : " is-issue"}`} aria-labelledby="an-a-st-t">
            <p className="t-label an-a-eye" data-rv="">{STATUS.eyebrow}</p>
            {/* [[TBD: live]] the health, the uptimes and the days, from status.near.org */}
            <h2 id="an-a-st-t" className="an-a-card__h an-a-st__h" data-rv=""><i className="an-a-pulse" aria-hidden="true" />{STATUS.h[STATUS.health]}</h2>
            <ul className="an-a-svc" data-rv="">
              {STATUS.services.map((s, i) => (
                <li key={s.name} className="an-a-svc__i">
                  <p className="an-a-svc__n">{s.name}</p>
                  <Strip uptime={s.uptime} seed={i + 1} />
                  <p className="an-a-svc__u"><span>60 days</span><span className="an-a-svc__p">{s.uptime.toFixed(2)}%<span className="sr-only"> uptime. {stripSay(s.uptime, i + 1)}</span></span></p>
                </li>
              ))}
            </ul>
            <p className="an-a-card__foot" data-rv="">
              <span className="an-a-card__meta">Last updated {STATUS.updated} · Sample</span>
              <a className="l-link" href={STATUS.href} target="_blank" rel="noopener noreferrer"><span>{STATUS.cta}</span><Ext /><span className="sr-only"> (opens in a new tab)</span></a>
            </p>
          </article>
        </div>
      </section>

      {/* 5 · Go deeper: the tools, the whole card the link */}
      <section className="l-sec an-a-tools" aria-labelledby="an-a-tools-t">
        <div className="l-row an-a-head" data-row="">
          <div className="l-cell an-a-head__c">
            <h2 id="an-a-tools-t" className="l-h2 an-a-h2" data-rv="">Go <span className="accent">deeper</span></h2>
            <p className="l-lede an-a-head__sub" data-rv="">{TOOLS_HEAD.sub}</p>
          </div>
        </div>
        {/* [[TBD: logos]] each tool's name set as type, not its logo */}
        {tools.map((row, r) => (
          <ul key={r} className="l-row an-a-grid an-a-grid--4" data-row="">
            {row.map((t, i) => (
              <li key={t.name} className="l-cell an-a-tile">
                <a className="an-a-tile__a" href={t.href} target="_blank" rel="noopener noreferrer">
                  <span className="an-a-tile__i" data-rv="">{idx(r * 4 + i)}</span>
                  <span className="an-a-tile__n" data-rv="">{t.name}</span>
                  <span className="an-a-tile__l" data-rv="">{t.line}</span>
                  <span className="an-a-tile__f" data-rv=""><span>{host(t.href)}</span><Ext /></span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        ))}
      </section>

      {/* 6 · Get exposure to NEAR: SVRN featured, then the ETPs & Trusts */}
      <section className="l-sec an-a-exp" aria-labelledby="an-a-exp-t">
        <div className="l-row an-a-head" data-row="">
          <div className="l-cell an-a-head__c">
            <h2 id="an-a-exp-t" className="l-h2 an-a-h2" data-rv="">Get <span className="accent">exposure</span> to NEAR</h2>
            <div className="an-a-head__sub">
              <p className="l-lede" data-rv="">{PRODUCTS_HEAD.sub}</p>
              <p className="an-a-disc" data-rv="">{PRODUCTS_HEAD.disclaimer}</p>
            </div>
          </div>
        </div>
        <div className="l-row an-a-svrn" data-row="">
          <a className="l-cell an-a-svrn__a" href={SVRN.href} target="_blank" rel="noopener noreferrer">
            <span className="t-label an-a-eye" data-rv="">Featured</span>
            <span className="an-a-svrn__w" data-rv="">{SVRN.h}</span>
            <span className="an-a-svrn__b">
              <span className="an-a-svrn__s" data-rv="">{SVRN.sub}</span>
              <span className="an-a-svrn__cta" data-rv=""><span className="an-a-svrn__lbl">{SVRN.cta}</span><Ext /><span className="sr-only"> about SVRN (opens in a new tab)</span></span>
            </span>
          </a>
        </div>
        <div className="l-row an-a-sub" data-row="">
          <div className="l-cell an-a-sub__c">
            <h3 className="an-a-h3" data-rv="">{ETPS_HEAD}</h3>
            <p className="an-a-sub__n" data-rv="">{ETPS.length} products</p>
          </div>
        </div>
        {/* [[TBD: logos]] the issuer's name set as type, not its logo */}
        <ul className="l-row an-a-grid an-a-grid--5" data-row="">
          {ETPS.map((e) => (
            <li key={e.issuer} className="l-cell an-a-tile an-a-etp">
              <a className="an-a-tile__a" href={e.href} target="_blank" rel="noopener noreferrer">
                <span className="an-a-tile__n" data-rv="">{e.issuer}</span>
                <span className="an-a-tile__l" data-rv="">{e.product}</span>
                <span className="an-a-tile__f" data-rv=""><span>{host(e.href)}</span><Ext /></span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* 7 · the legal line closes the grid */}
      <section className="l-sec an-a-legal" aria-label="Legal">
        <div className="l-row an-a-legal__row" data-row="">
          <p className="l-cell an-a-legal__c" data-rv="">{LEGAL}</p>
        </div>
      </section>
    </div>
  );
}
