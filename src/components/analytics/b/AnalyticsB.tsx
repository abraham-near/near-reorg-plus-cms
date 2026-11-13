"use client";
// near.org/analytics, version B: "Instrument panel". The official pages' hand (paper, ink, one green, Montreal + mono, the ruled grid of
// v3/proof-deeper) set like a well-made terminal printed on paper: precise, mono-led, every figure in a tabular column. Not a dashboard: it orients,
// shows a few numbers and routes out. From the top (the doc's order):
//   1 hero: the H1, the subhead and the status line beside a compact ticker of the five core stats (label, figure, 24h / 30d chips), the sample note under it;
//   2 two cards side by side: Revenue (the hero % and a weekly line with a crosshair readout) | Network status (#status: four services, 60-day strips);
//   3 Go deeper: the third-party tools as one dense table (platform · what you'll find · domain · ↗);
//   4 Get exposure to NEAR: SVRN featured on a dark panel, then the ETPs & Trusts as a ruled row of five; the legal line closes the grid.
// Copy, links and figures: ../content.ts (SAMPLE figures until the feeds exist: [[TBD: live]]). No third-party logos: names are set as type ([[TBD: logos]]).
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { mount as abMount } from "./motion";
import {
  HERO, STATS, REVENUE, STATUS, days, TOOLS_HEAD, TOOLS, PRODUCTS_HEAD, SVRN, ETPS_HEAD, ETPS, LEGAL, SAMPLE_NOTE,
} from "../content";
import { Arrow, Chip, Ext, Num, RevenueChart, Service } from "./parts";
import "../../v3/proof-deeper/proof-deeper.css";
import "./analytics-b.css";

const idx = (i: number) => String(i + 1).padStart(2, "0");
const host = (href: string) => new URL(href).hostname.replace(/^www\./, "");
// [[TBD: logos]] the issuers as a two-character monogram in our own type, not their artwork
const MONO: Record<string, string> = { Bitwise: "BW", Grayscale: "GS", "21Shares": "21", Virtune: "VT", Valour: "VL" };

export function AnalyticsB() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, gridMount);
  useScrollMotion(ref, abMount);
  const ok = STATUS.health === "ok";   // [[TBD: live]] from status.near.org
  const SERVICES = STATUS.services.map((s, i) => ({ ...s, days: days(s.uptime, i + 1) }));   // [[TBD: live]] the daily states

  return (
    <div ref={ref} className="l-page an-b" data-health={STATUS.health}>
      {/* ───────────── 1 · hero: the headline beside the ticker */}
      <section className="l-sec ab-hero" aria-labelledby="ab-h1">
        <div className="l-row ab-hero__row" data-row="">
          <div className="l-cell ab-hero__l">
            <p className="ab-eb" data-rv=""><i className="ab-sq" aria-hidden="true" />NEAR <span aria-hidden="true">/</span> Analytics</p>
            <h1 id="ab-h1" className="ab-h1" data-rv="">NEAR by the <span className="accent">numbers</span></h1>
            <p className="ab-lede" data-rv="">{HERO.sub}</p>
            <p className="ab-live" data-rv="">
              <a className="ab-live__a" href="#status">
                <i className="ab-pulse" aria-hidden="true" />
                <span>{ok ? HERO.status : STATUS.h.issue}</span>
                <svg className="ab-down" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M6 2v8M2.5 6.5 6 10l3.5-3.5" /></svg>
              </a>
              <span className="ab-live__t">Updated {STATUS.updated}</span>
            </p>
          </div>

          <div className="l-cell ab-hero__r">
            <div className="ab-tk" role="region" aria-labelledby="ab-tk-t">
              <p className="ab-tk__head">
                <span id="ab-tk-t"><i className="ab-sq" aria-hidden="true" />Core stats</span>
                <span aria-hidden="true">Δ 24h · 30d</span>
              </p>
              <ul className="ab-tk__list">
                {STATS.map((s, i) => (
                  <li key={s.key} className="ab-tk__row" style={{ ["--r" as string]: i }}>
                    <span className="ab-tk__i" aria-hidden="true">{idx(i)}</span>
                    <div className="ab-tk__main">
                      <p className="ab-tk__l">
                        <span>{s.label}</span>
                        {s.source && <a className="ab-src" href={s.source}>Source<Ext /></a>}
                      </p>
                      <p className="ab-tk__v"><Num value={s.value} delay={200 + i * 90} /></p>
                    </div>
                    <p className="ab-tk__d"><Chip k="24h" v={s.delta.d24} /><Chip k="30d" v={s.delta.d30} /></p>
                  </li>
                ))}
              </ul>
              <p className="ab-tk__foot"><span className="ab-tag">Sample</span>{SAMPLE_NOTE}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 2 · revenue | network status, side by side */}
      <section className="l-sec ab-cards-sec" aria-label="Revenue and network health">
        <div className="l-row ab-cards" data-row="">
          <article className="l-cell ab-card ab-rev" aria-labelledby="ab-rev-t">
            <p className="ab-card__eb"><span><span className="ab-n">02</span>{REVENUE.eyebrow}</span><span className="ab-tag">Sample</span></p>
            <h2 id="ab-rev-t" className="ab-card__h" data-rv="">{REVENUE.h}</h2>
            <p className="ab-card__b" data-rv="">{REVENUE.body}</p>
            <div className="ab-rev__fig">
              <p className="ab-rev__num"><Num value={REVENUE.metric.value} delay={150} /></p>
              <p className="ab-rev__lbl">{REVENUE.metric.label}</p>
            </div>
            {/* [[TBD: live]] the weekly share from revenue.near.org */}
            <RevenueChart data={REVENUE.spark} label={REVENUE.metric.label} />
            <p className="ab-card__cta"><a className="l-link" href={REVENUE.href}><span>{REVENUE.cta}</span><Arrow /></a></p>
          </article>

          <article className="l-cell ab-card ab-st" id="status" aria-labelledby="ab-st-t">
            <p className="ab-card__eb"><span><span className="ab-n">03</span>{STATUS.eyebrow}</span><span className="ab-tag">Sample</span></p>
            <h2 id="ab-st-t" className="ab-card__h ab-st__h" data-rv=""><i className="ab-pulse ab-pulse--l" aria-hidden="true" />{STATUS.h[STATUS.health]}</h2>
            <p className="ab-st__cols" aria-hidden="true"><span>Service</span><span>60-day uptime</span></p>
            <ul className="ab-svcs">
              {SERVICES.map((s, i) => <Service key={s.name} name={s.name} uptime={s.uptime} days={s.days} order={i} />)}
            </ul>
            <div className="ab-st__axis" aria-hidden="true">
              <span>60 days ago</span>
              <span className="ab-legend"><span><i className="ab-key is-up" />Operational</span><span><i className="ab-key is-deg" />Degraded</span><span><i className="ab-key is-down" />Outage</span></span>
              <span>Today</span>
            </div>
            <p className="ab-card__cta ab-st__foot">
              <span className="ab-st__upd">Last updated {STATUS.updated}</span>
              <a className="l-link" href={STATUS.href}><span>{STATUS.cta}</span><Arrow /></a>
            </p>
          </article>
        </div>
      </section>

      {/* ───────────── 3 · go deeper: the tools as one table */}
      <section className="l-sec ab-tools-sec" aria-labelledby="ab-tools-t">
        <div className="l-row ab-head" data-row="">
          <div className="l-cell">
            <p className="ab-eb" data-rv=""><span className="ab-n">04</span>Analytics &amp; research</p>
            <h2 id="ab-tools-t" className="ab-h2" data-rv="">Go <span className="accent">deeper</span></h2>
          </div>
          <div className="l-cell ab-head__end"><p className="ab-sub" data-rv="">{TOOLS_HEAD.sub}</p></div>
        </div>
        <div className="l-row ab-tools" data-row="">
          <div className="l-cell ab-tools__cell">
            <p className="ab-tools__cols" aria-hidden="true"><span>#</span><span>Platform</span><span>What you&rsquo;ll find</span><span>Domain</span><span /></p>
            <ul className="ab-tools__list">
              {TOOLS.map((t, i) => (
                <li key={t.name} style={{ ["--r" as string]: i }}>
                  {/* [[TBD: logos]] the platform's name set as type */}
                  <a className="ab-tool" href={t.href}>
                    <span className="ab-tool__i" aria-hidden="true">{idx(i)}</span>
                    <span className="ab-tool__n">{t.name}</span>
                    <span className="ab-tool__l">{t.line}</span>
                    <span className="ab-tool__d" aria-hidden="true">{host(t.href)}</span>
                    <Ext className="ab-ext ab-tool__go" />
                  </a>
                </li>
              ))}
            </ul>
            <i className="ab-scan" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ───────────── 4 · public products: SVRN featured, then the ETPs & Trusts */}
      <section className="l-sec ab-prod-sec" aria-labelledby="ab-prod-t">
        <div className="l-row ab-head" data-row="">
          <div className="l-cell">
            <p className="ab-eb" data-rv=""><span className="ab-n">05</span>Public products</p>
            <h2 id="ab-prod-t" className="ab-h2" data-rv="">Get <span className="accent">exposure</span> to NEAR</h2>
          </div>
          <div className="l-cell ab-head__end">
            <p className="ab-sub" data-rv="">{PRODUCTS_HEAD.sub}</p>
            <p className="ab-disc" data-rv="">{PRODUCTS_HEAD.disclaimer}</p>
          </div>
        </div>
        <div className="l-row ab-svrn" data-row="">
          <div className="l-cell ab-svrn__l">
            <p className="ab-svrn__k" data-rv=""><i className="ab-sq" aria-hidden="true" />Featured</p>
            <h3 className="ab-svrn__h" data-rv="">{SVRN.h}</h3>
          </div>
          <div className="l-cell ab-svrn__r">
            <p className="ab-svrn__sub" data-rv="">{SVRN.sub}</p>
            <p className="ab-svrn__cta" data-rv=""><a className="l-link" href={SVRN.href} aria-label={`${SVRN.cta} about ${SVRN.h}`}><span>{SVRN.cta}</span><Arrow /></a><span className="ab-svrn__d">{host(SVRN.href)}</span></p>
          </div>
        </div>
        <div className="l-row ab-etp-head" data-row="">
          <div className="l-cell"><h3 className="ab-etp-head__t">{ETPS_HEAD}</h3><span className="ab-etp-head__n" aria-hidden="true">{String(ETPS.length).padStart(2, "0")}</span></div>
        </div>
        <ul className="l-row ab-etps" data-row="">
          {ETPS.map((e) => (
            <li key={e.issuer + e.product} className="l-cell ab-etp">
              <a className="ab-etp__a" href={e.href}>
                <span className="ab-etp__m" aria-hidden="true">{MONO[e.issuer] ?? e.issuer.slice(0, 2).toUpperCase()}</span>
                <span className="ab-etp__t"><span className="ab-etp__i">{e.issuer}</span><span className="ab-etp__p">{e.product}</span></span>
                <Ext className="ab-ext ab-etp__go" />
              </a>
            </li>
          ))}
        </ul>
        <div className="l-row ab-legal" data-row="">
          <div className="l-cell"><p>{LEGAL}</p><p>{SAMPLE_NOTE}</p></div>
        </div>
      </section>
    </div>
  );
}
