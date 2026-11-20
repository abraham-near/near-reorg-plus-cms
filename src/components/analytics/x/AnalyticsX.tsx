"use client";
// near.org/analytics, version X: "MVP". D ("Drawn") simplified after the Nov 19 review: mostly copy, two drawings kept from D (the hero's plinth and Go
// deeper's hub, both placeholders a designer redraws), no eyebrows or index numerals, two dot icons, and everything below the hero on ONE continuous ruled
// grid (the homepage's): the frame runs unbroken from the stats to the legal line, sections are spaced by empty ruled rows inside it (the homepage's
// .l-spacer), and the footnotes sit in their own ruled rows (the hero stays on bare paper, as on the homepage). From the top (the doc's order):
//   1 hero: the headline, the subhead, the revenue dashboard and the status line; the plinth beside it (HeroPlinth.tsx);
//   2 core stats: one ruled row of five figures with their 24h / 30d deltas, the sample note in a ruled row under it;
//   3 revenue | network status: two ruled cells (the share and its 16 weekly bars | the four services and their 60-day strips);
//   4 Go deeper (ruled, as on the homepage): the hub (ToolsHub.tsx) beside the tools as a plain list; pointing at a tool lights its instrument;
//   5 Get exposure to NEAR: SVRN as type, the ETPs & Trusts in one ruled row, the legal line as the grid's last row.
// Copy, links and figures: ../content.ts (SAMPLE figures until the feeds exist: [[TBD: live]]). No third-party logos: names are set as type.
import { useRef, useState } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { HERO, STATS, REVENUE, STATUS, days, TOOLS_HEAD, TOOLS, PRODUCTS_HEAD, SVRN, ETPS_HEAD, ETPS, LEGAL, SAMPLE_NOTE } from "../content";
import { HeroPlinth } from "./HeroPlinth";
import { ToolsHub } from "./ToolsHub";
import { Arrow, Count, Delta, Ext, Words } from "./parts";
import { mountAll } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./analytics-x.css";

const host = (u: string) => new URL(u).hostname.replace(/^www\./, "");

/* the revenue share's 16 weeks (SAMPLE): one bar a week, the last one green with its value (analytics C's bars), summarised for screen readers */
const B0 = 30, B1 = 66, GRID = [40, 50, 60];
const bh = (v: number) => ((v - B0) / (B1 - B0)) * 100;
function Bars() {
  const d = REVENUE.spark, n = d.length, last = d[n - 1];
  const say = `${REVENUE.metric.label}, ${n} weeks of sample figures: from ${d[0]}% to ${last}%, low ${Math.min(...d)}%, high ${Math.max(...d)}%.`;
  return (
    <figure className="anx-bars">
      <div className="anx-bars__plot" role="img" aria-label={say}>
        {GRID.map((g) => <i key={g} className="anx-bars__g" style={{ bottom: `${bh(g)}%` }} aria-hidden="true"><span>{g}%</span></i>)}
        <ol className="anx-bars__cols" aria-hidden="true">
          {d.map((v, i) => (
            <li key={i} className={i === n - 1 ? "is-now" : undefined} style={{ ["--h" as string]: `${bh(v)}%`, ["--i" as string]: i }} data-v={`${v}%`}><b /></li>
          ))}
        </ol>
      </div>
      <figcaption className="anx-bars__x" aria-hidden="true"><span>{n} wks ago</span><span>This week</span></figcaption>
    </figure>
  );
}

const STATE = (v: number) => (v >= 1 ? "up" : v > 0 ? "deg" : "down");
function Service({ name, uptime, d }: { name: string; uptime: number; d: number[] }) {
  const deg = d.filter((v) => v > 0 && v < 1).length, down = d.filter((v) => v <= 0).length;
  const sum = `${uptime.toFixed(2)}% uptime over the last ${d.length} days: ${deg ? `${deg} degraded day${deg > 1 ? "s" : ""}` : "no degraded days"}, ${down ? `${down} outage day${down > 1 ? "s" : ""}` : "no outages"}.`;
  return (
    <li className="anx-svc">
      <p className="anx-svc__top"><span>{name}</span><span className="anx-svc__u">{uptime.toFixed(2)}%</span></p>
      <p className="anx-svc__days" aria-label={sum} role="img">{d.map((v, k) => <i key={k} className={`is-${STATE(v)}`} />)}</p>
    </li>
  );
}

export function AnalyticsX() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mountAll);
  const [on, setOn] = useState<number | null>(null);
  const ok = STATUS.health === "ok";
  const SERVICES = STATUS.services.map((s, i) => ({ ...s, d: days(s.uptime, i + 1) }));   // [[TBD: live]]

  return (
    <div ref={ref} className="l-page an-x" data-health={STATUS.health}>
      {/* ───────────── 1 · hero: bare paper, no rules near the header */}
      <section className="anx-hero" aria-labelledby="anx-h1">
        <div className="anx-hero__stage">
          <div className="anx-hero__copy">
            <h1 id="anx-h1" className="anx-h1"><Words text={HERO.h1} accent={["numbers"]} /></h1>
            <p className="anx-hero__sub" data-hero-up="">{HERO.sub}</p>
            <p className="anx-hero__cta" data-hero-up="">
              <a className="anx-btn anx-btn--fill" href={REVENUE.href}><span>{REVENUE.cta}</span><Ext /></a>
              <a className="anx-live" href="#status"><i className="anx-pulse" aria-hidden="true" /><span>{ok ? HERO.status : STATUS.h.issue}</span><Arrow /></a>
            </p>
            <p className="anx-hero__t" data-hero-up="">Updated {STATUS.updated}</p>
          </div>
          {/* [[TBD: graphic by Ali]] the hero's one drawing (D's plinth of columns, kept as a placeholder) */}
          <HeroPlinth />
        </div>
      </section>

      {/* ───────────── 2 · core stats: one ruled row */}
      <section className="l-sec anx-stats" aria-labelledby="anx-stats-t">
        <h2 id="anx-stats-t" className="sr-only">Core stats</h2>
        <ul className="l-row anx-stats__row" data-row="">
          {STATS.map((s, i) => (
            <li key={s.key} className="l-cell anx-stat">
              <p className="anx-stat__l" data-rv=""><span>{s.label}</span>{s.source && <a className="anx-src" href={s.source}>Source<Ext /></a>}</p>
              <p className="anx-stat__v"><Count v={s.value} delay={i * 90} /></p>
              <p className="anx-stat__d"><Delta k="24h" v={s.delta.d24} /><Delta k="30d" v={s.delta.d30} /></p>
            </li>
          ))}
        </ul>
        <div className="l-row anx-foot" data-row=""><p className="l-cell anx-note">{SAMPLE_NOTE}</p></div>
      </section>

      {/* ───────────── 3 · revenue | network status: two ruled cells */}
      <section className="l-sec anx-cards" aria-label="Revenue and network health">
        <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>
        <div className="l-row anx-cards__row" data-row="">
          <article className="l-cell anx-card" aria-labelledby="anx-rev-t">
            <i className="anx-ic" data-icon="economics" aria-hidden="true" />
            <h2 id="anx-rev-t" className="anx-card__h" data-rv="">{REVENUE.h}</h2>
            <p className="anx-card__b" data-rv="">{REVENUE.body}</p>
            <div className="anx-rev__fig">
              <p className="anx-rev__num"><Count v={REVENUE.metric.value} delay={120} /></p>
              <p className="anx-rev__lbl">{REVENUE.metric.label}</p>
            </div>
            <Bars />
            <p className="anx-card__cta"><a className="anx-btn" href={REVENUE.href}><span>{REVENUE.cta}</span><Ext /></a></p>
          </article>

          <article className="l-cell anx-card" id="status" aria-labelledby="anx-st-t">
            <i className="anx-ic" data-icon="near-protocol" aria-hidden="true" />
            <h2 id="anx-st-t" className="anx-card__h" data-rv=""><i className="anx-pulse anx-pulse--l" aria-hidden="true" />{STATUS.h[STATUS.health]}</h2>
            <p className="anx-card__b" data-rv="">Last updated {STATUS.updated}. Uptime over the last 60 days.</p>
            <ul className="anx-svcs">{SERVICES.map((s) => <Service key={s.name} name={s.name} uptime={s.uptime} d={s.d} />)}</ul>
            <p className="anx-st__legend" aria-hidden="true"><span><i className="is-up" />Operational</span><span><i className="is-deg" />Degraded</span><span><i className="is-down" />Outage</span></p>
            <p className="anx-card__cta"><a className="anx-btn" href={STATUS.href}><span>{STATUS.cta}</span><Ext /></a></p>
          </article>
        </div>
      </section>

      {/* ───────────── 4 · go deeper: ruled like the homepage's, the hub | the tools */}
      <section className="l-sec anx-tools" aria-labelledby="anx-tools-t">
        <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>
        <div className="l-row anx-head" data-row="">
          <div className="l-cell"><h2 id="anx-tools-t" className="anx-h2" data-rv="">Go <span className="accent">deeper</span></h2></div>
          <div className="l-cell anx-head__end"><p className="l-lede" data-rv="">{TOOLS_HEAD.sub}</p></div>
        </div>
        <div className="l-row anx-tools__row" data-row="">
          {/* [[TBD: graphic by Ali]] the page's second and last drawing (D's hub of instruments, kept as a placeholder) */}
          <div className="l-cell anx-tools__art"><figure className="anx-fig"><ToolsHub on={on} /></figure></div>
          <div className="l-cell anx-tools__list">
            <ul className="anx-tl" onMouseLeave={() => setOn(null)}>
              {TOOLS.map((t, i) => (
                <li key={t.name} style={{ ["--r" as string]: i }}>
                  <a className="anx-tool" href={t.href} onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)} onBlur={() => setOn(null)}>
                    <span className="anx-tool__t"><span className="anx-tool__n">{t.name}</span><span className="anx-tool__l">{t.line}</span></span>
                    <span className="anx-tool__d" aria-hidden="true">{host(t.href)}</span>
                    <Ext className="anx-ext anx-tool__go" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────────── 5 · public products: ruled, SVRN as type, then the ETPs & Trusts */}
      <section className="l-sec anx-prod" aria-labelledby="anx-prod-t">
        <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>
        <div className="l-row anx-head" data-row="">
          <div className="l-cell"><h2 id="anx-prod-t" className="anx-h2" data-rv="">Get <span className="accent">exposure</span> to NEAR</h2></div>
          <div className="l-cell anx-head__end">
            <p className="l-lede" data-rv="">{PRODUCTS_HEAD.sub}</p>
            <p className="anx-disc" data-rv="">{PRODUCTS_HEAD.disclaimer}</p>
          </div>
        </div>
        <div className="l-row anx-svrn" data-row="">
          <div className="l-cell"><h3 className="anx-svrn__h" data-rv="">{SVRN.h}</h3></div>
          <div className="l-cell anx-svrn__txt">
            <p className="anx-svrn__sub" data-rv="">{SVRN.sub}</p>
            <p className="anx-svrn__cta" data-rv=""><a className="anx-btn anx-btn--fill" href={SVRN.href} aria-label={`${SVRN.cta} about ${SVRN.h}`}><span>{SVRN.cta}</span><Ext /></a><span className="anx-svrn__d">{host(SVRN.href)}</span></p>
          </div>
        </div>
        <div className="l-row anx-etp-head" data-row="">
          <div className="l-cell"><h3 className="anx-etp-head__t" data-rv="">{ETPS_HEAD}</h3></div>
        </div>
        <ul className="l-row anx-etps" data-row="">
          {ETPS.map((e) => (
            <li key={e.issuer + e.product} className="l-cell anx-etp">
              <a className="anx-etp__a" href={e.href}>
                <span className="anx-etp__i">{e.issuer}</span>
                <span className="anx-etp__p">{e.product}</span>
                <span className="anx-etp__go">{host(e.href)}<Ext /></span>
              </a>
            </li>
          ))}
        </ul>
        <div className="l-row anx-foot anx-ruled" data-row=""><p className="l-cell anx-legal">{LEGAL} {SAMPLE_NOTE}</p></div>
      </section>
    </div>
  );
}
