"use client";
// near.org/analytics, version E · Editorial. "NEAR by the numbers" read as a magazine's figures page, in the homepage's editorial hand (big type in
// Montreal Book with one Kepler word, the green square, generous space, one dark band, a photo that bleeds). Not a dashboard: it orients, shows a few
// numbers large and routes out. From the top (the doc's order):
//   1 the hero: the H1 set big with the green square after "numbers", the subhead, the status line (a live dot + a link to #status);
//   2 the core figures: the top three, each a full-width row with its figure set very large (counted once), the label and the 24h / 30d deltas beside it;
//     Shards online and the NEAR price on one quiet line under them; the sample note;
//   3 the dark band: Revenue | Network status side by side (the share in green with its 16-week line; four services with their 60-day strips);
//   4 Go deeper: the tools as a refined index, a contents page (number, name, what you'll find, the domain);
//   5 Get exposure to NEAR: the head and the disclaimer as a callout; SVRN as a feature (its name set huge, its line wiped in, the colonnade photo bleeding
//     to the right edge); then the ETPs & Trusts as a clean ruled list; the legal line closes the page.
// Copy, links and figures: ../content.ts (the doc, verbatim; every figure is SAMPLE until the feeds exist, [[TBD: live]]). No third-party logos: names
// are set as type ([[TBD: logos]]). The photo shows no person.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { monotone } from "../../v4/revenue/d/iso";
import {
  ETPS, ETPS_HEAD, HERO, LEGAL, PRODUCTS_HEAD, REVENUE, SAMPLE_NOTE, STATS, STATUS, SVRN, TOOLS, TOOLS_HEAD, days, type Delta,
} from "../content";
import { Acc, Chip, Count, Ext, NewTab, Sample, WipeWords } from "./parts";
import { mount } from "./motion";
import "./analytics-e.css";

const CORE = STATS.slice(0, 3);   // the doc: "keep top 3 if it feels crowded"; the other two sit on one line under them
const MORE = STATS.slice(3);
const idx = (i: number) => String(i + 1).padStart(2, "0");
const host = (u: string) => new URL(u).hostname.replace(/^www\./, "");
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const Chips = ({ d }: { d: Delta }) => <span className="an-e-chips"><Chip k="24h" v={d.d24} /><Chip k="30d" v={d.d30} /></span>;

/* ── the revenue line: 16 weeks as a monotone line over a soft green area, the last week's dot (SAMPLE) ── */
const SW = 480, SH = 120, SP = 10;
const sMin = Math.min(...REVENUE.spark) - 3, sMax = Math.max(...REVENUE.spark) + 2;
const sPts: [number, number][] = REVENUE.spark.map((v, i) => [(i / (REVENUE.spark.length - 1)) * SW, SP + (1 - (v - sMin) / (sMax - sMin)) * (SH - SP * 2)]);
const sLine = monotone(sPts);
const sArea = `${sLine} L${SW},${SH} L0,${SH} Z`;
const sEnd = sPts[sPts.length - 1];

function Spark() {
  const first = REVENUE.spark[0], last = REVENUE.spark[REVENUE.spark.length - 1];
  return (
    <div className="an-e-spark">
      <div className="an-e-spark__plot">
        <svg viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none" role="img" aria-label={`The share rose from ${first}% to ${last}% over the last ${REVENUE.spark.length} weeks (sample data).`}>
          <defs>
            <linearGradient id="an-e-spark-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#00dc8d" stopOpacity="0.26" />
              <stop offset="1" stopColor="#00dc8d" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((t) => <line key={t} className="an-e-spark__grid" x1="0" x2={SW} y1={SH * t} y2={SH * t} vectorEffect="non-scaling-stroke" />)}
          <path className="an-e-spark__area" d={sArea} fill="url(#an-e-spark-g)" />
          <path className="an-e-spark__line" d={sLine} pathLength={1} vectorEffect="non-scaling-stroke" />
        </svg>
        <i className="an-e-spark__dot" aria-hidden="true" style={{ left: `${(sEnd[0] / SW) * 100}%`, top: `${(sEnd[1] / SH) * 100}%` }} />
      </div>
      <p className="an-e-spark__cap" aria-hidden="true"><span>{REVENUE.spark.length} weeks ago</span><span>Now</span></p>
    </div>
  );
}

/* ── a service's 60 days, one bar a day (1 up, 0.5 degraded, 0 down: SAMPLE) ── */
function Strip({ d }: { d: number[] }) {
  return (
    <svg className="an-e-strip" viewBox="0 0 60 14" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {d.map((s, i) => <rect key={i} className={s === 1 ? "is-up" : s === 0 ? "is-down" : "is-deg"} x={i + 0.2} width="0.6" y="0" height="14" style={{ ["--i" as string]: i }} />)}
    </svg>
  );
}
const say = (d: number[]) => {
  const deg = d.filter((s) => s === 0.5).length, down = d.filter((s) => s === 0).length;
  if (!deg && !down) return "No incidents in the last 60 days.";
  return [deg && `${deg} degraded ${deg === 1 ? "day" : "days"}`, down && `${down} ${down === 1 ? "outage" : "outages"}`].filter(Boolean).join(", ") + " in the last 60 days.";
};

export function AnalyticsE() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  const ok = STATUS.health === "ok";   // [[TBD: live]] from status.near.org
  const SERVICES = STATUS.services.map((s, i) => ({ ...s, days: days(s.uptime, i + 1) }));   // [[TBD: live]] the daily states

  return (
    <div ref={ref} className="an-e">
      {/* ───────────── 1 · hero */}
      <header className="an-e-hero" aria-labelledby="an-e-h1">
        <p className="an-e-eye" data-rv=""><i aria-hidden="true" />NEAR Analytics</p>
        <h1 id="an-e-h1" className="an-e-h1" data-rise="now"><Acc t={HERO.h1} a="numbers" sq /></h1>
        <div className="an-e-hero__foot">
          <p className="an-e-hero__sub" data-rv="" style={{ ["--rv" as string]: 2 }}>{HERO.sub}</p>
          <p className="an-e-live" data-rv="" style={{ ["--rv" as string]: 3 }}>
            <a className={`an-e-live__a${ok ? "" : " is-issue"}`} href="#status">
              <i className="an-e-pulse" aria-hidden="true" />
              <span>{ok ? HERO.status : STATUS.h.issue}</span>
              <svg className="an-e-down" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M6 1.5v9M2 6.5 6 10.5 10 6.5" /></svg>
            </a>
            <span className="an-e-live__t">Updated {STATUS.updated}</span>
          </p>
        </div>
      </header>

      {/* ───────────── 2 · the core figures, set large */}
      <section className="an-e-sec an-e-figs" aria-labelledby="an-e-figs-t">
        <h2 id="an-e-figs-t" className="sr-only">Core stats</h2>
        <ol className="an-e-figs__list">
          {CORE.map((s, i) => (
            /* [[TBD: live]] the figure and its 24h / 30d deltas */
            <li key={s.key} className="an-e-fig" data-rv="">
              <div className="an-e-fig__meta">
                <span className="an-e-fig__n" aria-hidden="true">{idx(i)}</span>
                <p className="an-e-fig__l">{s.label}</p>
                <p className="an-e-fig__d"><Chips d={s.delta} />{s.sample && <Sample />}</p>
              </div>
              <p className="an-e-fig__v"><Count v={s.value} /></p>
            </li>
          ))}
        </ol>
        <ul className="an-e-more" data-rv="">
          {MORE.map((s) => (
            <li key={s.key} className="an-e-more__i">
              <span className="an-e-more__l">{s.label}</span>
              <span className="an-e-more__v">{s.value}</span>
              <Chips d={s.delta} />
              {s.sample && <Sample />}
              {s.source && <a className="an-e-link an-e-link--s" href={s.source} {...ext}><span>Source</span><Ext /><NewTab /></a>}
            </li>
          ))}
        </ul>
        <p className="an-e-note" data-rv=""><Sample>Sample figures</Sample><span>{SAMPLE_NOTE}</span></p>
      </section>

      {/* ───────────── 3 · the dark band: revenue | network status */}
      <section className="an-e-band" aria-label="Revenue and network health" data-nav-tone="dark">
        <div className="an-e-band__in">
          <article className="an-e-rev" aria-labelledby="an-e-rev-t">
            <p className="an-e-eye an-e-eye--on" data-rv=""><i aria-hidden="true" />{REVENUE.eyebrow}</p>
            <h2 id="an-e-rev-t" className="an-e-band__h" data-rise=""><Acc t={REVENUE.h} a="revenue" /></h2>
            <p className="an-e-band__b" data-rv="">{REVENUE.body}</p>
            {/* [[TBD: live]] the share and its weekly trend, from revenue.near.org */}
            <div className="an-e-rev__fig" data-rv="">
              <p className="an-e-rev__v"><Count v={REVENUE.metric.value} /></p>
              <p className="an-e-rev__l">{REVENUE.metric.label}{REVENUE.metric.sample && <Sample />}</p>
              <Spark />
            </div>
            <p className="an-e-band__cta" data-rv=""><a className="an-e-link" href={REVENUE.href} {...ext}><span>{REVENUE.cta}</span><Ext /><NewTab /></a></p>
          </article>

          <article id="status" className={`an-e-st${ok ? "" : " is-issue"}`} aria-labelledby="an-e-st-t">
            <p className="an-e-eye an-e-eye--on" data-rv=""><i aria-hidden="true" />{STATUS.eyebrow}</p>
            {/* [[TBD: live]] the health, the uptimes and the days, from status.near.org */}
            <h2 id="an-e-st-t" className="an-e-band__h an-e-st__h" data-rise=""><Acc t={STATUS.h[STATUS.health]} a="detected" /></h2>
            <p className="an-e-band__b an-e-st__now" data-rv=""><i className="an-e-pulse" aria-hidden="true" />{ok ? HERO.status : STATUS.h.issue}<Sample /></p>
            <ul className="an-e-svc" data-rv="">
              {SERVICES.map((s) => (
                <li key={s.name} className="an-e-svc__i">
                  <p className="an-e-svc__top"><span className="an-e-svc__n">{s.name}</span><span className="an-e-svc__p">{s.uptime.toFixed(2)}%<span className="sr-only"> uptime over 60 days. {say(s.days)}</span></span></p>
                  <Strip d={s.days} />
                </li>
              ))}
            </ul>
            <div className="an-e-axis" aria-hidden="true">
              <span>60 days ago</span>
              <span className="an-e-legend"><span><i className="is-up" />Operational</span><span><i className="is-deg" />Degraded</span><span><i className="is-down" />Outage</span></span>
              <span>Today</span>
            </div>
            <p className="an-e-band__cta an-e-st__foot" data-rv="">
              <span className="an-e-st__upd">Last updated {STATUS.updated}</span>
              <a className="an-e-link" href={STATUS.href} {...ext}><span>{STATUS.cta}</span><Ext /><NewTab /></a>
            </p>
          </article>
        </div>
      </section>

      {/* ───────────── 4 · Go deeper: the tools as a contents page */}
      <section className="an-e-sec an-e-tools" aria-labelledby="an-e-tools-t">
        <div className="an-e-head">
          <h2 id="an-e-tools-t" className="an-e-h2" data-rise=""><Acc t={TOOLS_HEAD.h} a="deeper" /></h2>
          <p className="an-e-dek" data-rv="">{TOOLS_HEAD.sub}</p>
        </div>
        {/* [[TBD: logos]] each tool's name set as type, not its logo */}
        <ol className="an-e-toc">
          {TOOLS.map((t, i) => (
            <li key={t.name} className="an-e-toc__i" data-rv="" style={{ ["--rv" as string]: i % 2 }}>
              <a className="an-e-toc__a" href={t.href} {...ext}>
                <span className="an-e-toc__n" aria-hidden="true">{idx(i)}</span>
                <span className="an-e-toc__name">{t.name}</span>
                <span className="an-e-toc__line">{t.line}</span>
                <span className="an-e-toc__host" aria-hidden="true">{host(t.href)}</span>
                <Ext className="an-e-ext an-e-toc__go" /><NewTab />
              </a>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────────── 5 · Get exposure to NEAR: SVRN as a feature, then the ETPs & Trusts */}
      <section className="an-e-sec an-e-prod" aria-labelledby="an-e-prod-t">
        <div className="an-e-head">
          <h2 id="an-e-prod-t" className="an-e-h2" data-rise=""><Acc t={PRODUCTS_HEAD.h} a="exposure" /></h2>
          <div className="an-e-head__end">
            <p className="an-e-dek" data-rv="">{PRODUCTS_HEAD.sub}</p>
            <p className="an-e-callout" data-rv="">{PRODUCTS_HEAD.disclaimer}</p>
          </div>
        </div>

        <article className="an-e-svrn" aria-labelledby="an-e-svrn-t">
          <div className="an-e-svrn__txt">
            <p className="an-e-eye" data-rv=""><i aria-hidden="true" />Featured</p>
            <h3 id="an-e-svrn-t" className="an-e-svrn__h" data-rise="">{SVRN.h}</h3>
            <p className="an-e-svrn__q" data-wipe=""><WipeWords text={SVRN.sub} /></p>
            <p className="an-e-svrn__cta" data-rv="">
              <a className="an-e-btn an-e-btn--ink" href={SVRN.href} {...ext}><span>{SVRN.cta}</span><Ext /><span className="sr-only"> about {SVRN.h} (opens in a new tab)</span></a>
              <span className="an-e-svrn__host">{host(SVRN.href)}</span>
            </p>
          </div>
          <figure className="an-e-bleed an-e-svrn__ph" data-open="">
            <div className="an-e-plate" data-par="">
              {/* eslint-disable-next-line @next/next/no-img-element -- the Go deeper cover, with its 960 px version */}
              <img src="/v3/deeper/sovereign-economy.webp" srcSet="/v3/deeper/sovereign-economy-960.webp 960w, /v3/deeper/sovereign-economy.webp 1600w"
                sizes="(max-width: 859px) 100vw, 60vw" alt="" width={1600} height={900} loading="lazy" decoding="async" />
            </div>
          </figure>
        </article>

        <div className="an-e-etps">
          <div className="an-e-etps__head" data-rv="">
            <h3 className="an-e-h3">{ETPS_HEAD}</h3>
            <span className="an-e-etps__n">{String(ETPS.length).padStart(2, "0")} products</span>
          </div>
          {/* [[TBD: logos]] the issuer's name set as type, not its logo */}
          <ul className="an-e-etp">
            {ETPS.map((e, i) => (
              <li key={e.issuer + e.product} className="an-e-etp__i" data-rv="" style={{ ["--rv" as string]: i % 3 }}>
                <a className="an-e-etp__a" href={e.href} {...ext}>
                  <span className="an-e-etp__issuer">{e.issuer}</span>
                  <span className="an-e-etp__product">{e.product}</span>
                  <span className="an-e-etp__host" aria-hidden="true">{host(e.href)}</span>
                  <Ext className="an-e-ext an-e-etp__go" /><NewTab />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="an-e-legal" data-rv=""><span>{LEGAL}</span><span>{SAMPLE_NOTE}</span></p>
      </section>
    </div>
  );
}

