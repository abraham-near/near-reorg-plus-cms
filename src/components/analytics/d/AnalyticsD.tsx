"use client";
// near.org/analytics, version D: "Drawn". The Foundation page's hand (paper, ink hairlines, white tops, light grey sides, one green; v3's ruled grid)
// drawing the numbers as things you could build: not a dashboard, a page that orients, shows a few figures and routes out. From the top (the doc's order):
//   1 hero: the headline, the subhead and the status line beside the plinth of columns (sixteen weeks of the revenue share, alive; HeroPlinth.tsx);
//   2 core stats: one ruled row of five, each with its small drawing, the figure counting once, its 24h / 30d deltas (Sample where the doc's are open);
//   3 revenue | network status, side by side: the revenue flow (fees → splitter → the vault) with the share and its 16-week line | the racks with their
//     lamps (#status), the four services with their 60-day strips;
//   4 Go deeper: a box: the hub and its eight instruments | the tools as a ruled list; pointing at a tool lights its instrument and trace;
//   5 Get exposure to NEAR: SVRN beside its vault (wide), the ETPs & Trusts as five strongboxes in a ruled row, the legal line closes the grid.
// Copy, links and figures: ../content.ts (SAMPLE figures until the feeds exist: [[TBD: live]]). No third-party logos: names are set as type.
import { useId, useRef, useState } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { HERO, STATS, REVENUE, STATUS, days, TOOLS_HEAD, TOOLS, PRODUCTS_HEAD, SVRN, ETPS_HEAD, ETPS, LEGAL, SAMPLE_NOTE } from "../content";
import { HeroPlinth } from "./HeroPlinth";
import { RevenueFlow, StatusGrid, ToolsHub, Vault } from "./Scenes";
import { STAT_GLYPHS } from "./Glyphs";
import { Arrow, Count, Delta, Ext, Sample, Words } from "./parts";
import { mountAll } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./analytics-d.css";

const idx = (i: number) => String(i + 1).padStart(2, "0");
const host = (u: string) => new URL(u).hostname.replace(/^www\./, "");
// five strongboxes, one per issuer (proportions only: [[TBD: logos]] the issuers are set as type)
const VAULTS = [{ w: 44, d: 36, h: 46, door: "round" }, { w: 52, d: 34, h: 36, door: "square" }, { w: 38, d: 38, h: 54, door: "round" }, { w: 56, d: 30, h: 40, door: "round" }, { w: 42, d: 40, h: 40, door: "square" }] as const;

/* the revenue share's 16 weeks: a plain line with its end dot (SAMPLE), summarised for screen readers */
function Trend() {
  const d = REVENUE.spark, n = d.length, lo = 35, hi = 65, Wd = 320, Ht = 88;
  const x = (i: number) => (i / (n - 1)) * Wd, y = (v: number) => Ht - ((v - lo) / (hi - lo)) * Ht;
  const path = d.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const id = useId();
  return (
    <figure className="ad-trend" aria-describedby={`${id}-s`}>
      <svg viewBox={`-4 -6 ${Wd + 10} ${Ht + 12}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {[40, 50, 60].map((t) => <path key={t} className="ad-trend__g" d={`M0,${y(t).toFixed(1)}H${Wd}`} />)}
        <path className="ad-trend__a" d={`${path}L${Wd},${Ht}L0,${Ht}Z`} />
        <path className="ad-trend__l" d={path} pathLength={1} />
        {d.map((v, i) => <circle key={i} className={i === n - 1 ? "ad-trend__end" : "ad-trend__p"} cx={x(i).toFixed(1)} cy={y(v).toFixed(1)} r={i === n - 1 ? 4 : 1.6} />)}
      </svg>
      <div className="ad-trend__ax" aria-hidden="true"><span>{n} wks ago</span><span>This week</span></div>
      <figcaption id={`${id}-s`} className="sr-only">{`${REVENUE.metric.label}, ${n} weeks of sample figures: from ${d[0]}% to ${d[n - 1]}%.`}</figcaption>
    </figure>
  );
}

const STATE = (v: number) => (v >= 1 ? "up" : v > 0 ? "deg" : "down");
function Service({ name, uptime, d }: { name: string; uptime: number; d: number[] }) {
  const deg = d.filter((v) => v > 0 && v < 1).length, down = d.filter((v) => v <= 0).length;
  const sum = `${uptime.toFixed(2)}% uptime over the last ${d.length} days: ${deg ? `${deg} degraded day${deg > 1 ? "s" : ""}` : "no degraded days"}, ${down ? `${down} outage day${down > 1 ? "s" : ""}` : "no outages"}.`;
  return (
    <li className="ad-svc">
      <p className="ad-svc__top"><span className="ad-svc__n"><i className="ad-lamp" aria-hidden="true" />{name}</span><span className="ad-svc__u">{uptime.toFixed(2)}%</span></p>
      <p className="ad-svc__days" aria-label={sum} role="img">{d.map((v, k) => <i key={k} className={`is-${STATE(v)}`} />)}</p>
    </li>
  );
}

export function AnalyticsD() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mountAll);
  const [on, setOn] = useState<number | null>(null);
  const ok = STATUS.health === "ok";
  const SERVICES = STATUS.services.map((s, i) => ({ ...s, d: days(s.uptime, i + 1) }));   // [[TBD: live]]

  return (
    <div ref={ref} className="l-page an-d" data-health={STATUS.health}>
      {/* ───────────── 1 · hero: the plinth of columns */}
      <section className="ad-hero" aria-labelledby="ad-h1">
        <div className="ad-hero__stage">
          <HeroPlinth />
          <div className="ad-hero__copy">
            <p className="ad-kick" data-hero-up=""><i aria-hidden="true" />NEAR Analytics</p>
            <h1 id="ad-h1" className="ad-h1"><Words text={HERO.h1} accent={["numbers"]} /></h1>
            <p className="ad-hero__sub" data-hero-up="">{HERO.sub}</p>
            <p className="ad-live" data-hero-up="">
              <a className="ad-live__a" href="#status"><i className="ad-pulse" aria-hidden="true" /><span>{ok ? HERO.status : STATUS.h.issue}</span><Arrow /></a>
              <span className="ad-live__t">Updated {STATUS.updated}</span>
            </p>
          </div>
        </div>
      </section>

      {/* ───────────── 2 · core stats: one ruled row of five */}
      <section className="l-sec ad-stats" aria-labelledby="ad-stats-t">
        <h2 id="ad-stats-t" className="sr-only">Core stats</h2>
        <ul className="l-row ad-stats__row" data-row="">
          {STATS.map((s, i) => {
            const G = STAT_GLYPHS[s.key];
            return (
              <li key={s.key} className="l-cell ad-stat">
                <div className="ad-stat__art">{G && <G />}</div>
                <p className="ad-stat__l"><span>{s.label}</span>{s.source && <a className="ad-src" href={s.source}>Source<Ext /></a>}</p>
                <p className="ad-stat__v"><Count v={s.value} delay={i * 90} /></p>
                <p className="ad-stat__d"><Delta k="24h" v={s.delta.d24} /><Delta k="30d" v={s.delta.d30} />{s.sample && <Sample />}</p>
              </li>
            );
          })}
        </ul>
        <div className="l-row ad-note" data-row=""><div className="l-cell"><p><Sample /> {SAMPLE_NOTE}</p></div></div>
      </section>

      {/* ───────────── 3 · revenue | network status */}
      <section className="l-sec ad-cards" aria-label="Revenue and network health">
        <div className="l-row ad-cards__row" data-row="">
          <article className="l-cell ad-card" aria-labelledby="ad-rev-t">
            <p className="ad-eb" data-rv=""><span className="ad-n">01</span>{REVENUE.eyebrow}<Sample /></p>
            <h2 id="ad-rev-t" className="ad-card__h" data-rv="">{REVENUE.h}</h2>
            <p className="ad-card__b" data-rv="">{REVENUE.body}</p>
            <figure className="ad-card__art"><RevenueFlow /></figure>
            <div className="ad-rev__fig">
              <p className="ad-rev__num"><Count v={REVENUE.metric.value} delay={120} /></p>
              <p className="ad-rev__lbl">{REVENUE.metric.label}</p>
            </div>
            <Trend />
            <p className="ad-card__cta"><a className="ad-btn" href={REVENUE.href}><span>{REVENUE.cta}</span><Ext /></a></p>
          </article>

          <article className="l-cell ad-card" id="status" aria-labelledby="ad-st-t">
            <p className="ad-eb" data-rv=""><span className="ad-n">02</span>{STATUS.eyebrow}<Sample /></p>
            <h2 id="ad-st-t" className="ad-card__h" data-rv=""><i className="ad-pulse ad-pulse--l" aria-hidden="true" />{STATUS.h[STATUS.health]}</h2>
            <p className="ad-card__b" data-rv="">Last updated {STATUS.updated}</p>
            <figure className="ad-card__art"><StatusGrid /></figure>
            <p className="ad-st__cols" aria-hidden="true"><span>Service</span><span>60-day uptime</span></p>
            <ul className="ad-svcs">{SERVICES.map((s) => <Service key={s.name} name={s.name} uptime={s.uptime} d={s.d} />)}</ul>
            <p className="ad-st__legend" aria-hidden="true"><span><i className="is-up" />Operational</span><span><i className="is-deg" />Degraded</span><span><i className="is-down" />Outage</span></p>
            <p className="ad-card__cta"><a className="ad-btn" href={STATUS.href}><span>{STATUS.cta}</span><Ext /></a></p>
          </article>
        </div>
      </section>

      {/* ───────────── 4 · go deeper: the hub | the tools */}
      <section className="l-sec ad-tools" aria-labelledby="ad-tools-t">
        <div className="l-row ad-head" data-row="">
          <div className="l-cell">
            <p className="ad-eb" data-rv=""><span className="ad-n">03</span>Analytics &amp; research</p>
            <h2 id="ad-tools-t" className="ad-h2" data-rv="">Go <span className="accent">deeper</span></h2>
          </div>
          <div className="l-cell ad-head__end"><p className="l-lede" data-rv="">{TOOLS_HEAD.sub}</p></div>
        </div>
        <div className="l-row ad-tools__row" data-row="">
          <div className="l-cell ad-tools__art"><figure className="ad-fig"><ToolsHub on={on} /></figure></div>
          <div className="l-cell ad-tools__list">
            <ol className="ad-tl" onMouseLeave={() => setOn(null)}>
              {TOOLS.map((t, i) => (
                <li key={t.name} style={{ ["--r" as string]: i }}>
                  <a className="ad-tool" href={t.href} onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)} onBlur={() => setOn(null)}>
                    <span className="ad-tool__i" aria-hidden="true">{idx(i)}</span>
                    <span className="ad-tool__t"><span className="ad-tool__n">{t.name}</span><span className="ad-tool__l">{t.line}</span></span>
                    <span className="ad-tool__d" aria-hidden="true">{host(t.href)}</span>
                    <Ext className="ad-ext ad-tool__go" />
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ───────────── 5 · public products: SVRN, then the ETPs & Trusts */}
      <section className="l-sec ad-prod" aria-labelledby="ad-prod-t">
        <div className="l-row ad-head" data-row="">
          <div className="l-cell">
            <p className="ad-eb" data-rv=""><span className="ad-n">04</span>Public products</p>
            <h2 id="ad-prod-t" className="ad-h2" data-rv="">Get <span className="accent">exposure</span> to NEAR</h2>
          </div>
          <div className="l-cell ad-head__end">
            <p className="l-lede" data-rv="">{PRODUCTS_HEAD.sub}</p>
            <p className="ad-disc" data-rv="">{PRODUCTS_HEAD.disclaimer}</p>
          </div>
        </div>
        <div className="l-row ad-svrn" data-row="">
          <div className="l-cell ad-svrn__txt">
            <p className="ad-eb" data-rv=""><i className="ad-sq" aria-hidden="true" />Featured</p>
            <h3 className="ad-svrn__h" data-rv="">{SVRN.h}</h3>
            <p className="ad-svrn__sub" data-rv="">{SVRN.sub}</p>
            <p className="ad-svrn__cta" data-rv=""><a className="ad-btn ad-btn--fill" href={SVRN.href} aria-label={`${SVRN.cta} about ${SVRN.h}`}><span>{SVRN.cta}</span><Ext /></a><span className="ad-svrn__d">{host(SVRN.href)}</span></p>
          </div>
          <div className="l-cell ad-svrn__art"><figure className="ad-fig"><Vault w={130} d={96} h={118} big /></figure></div>
        </div>
        <div className="l-row ad-etp-head" data-row="">
          <div className="l-cell"><h3 className="ad-etp-head__t">{ETPS_HEAD}</h3><span className="ad-etp-head__n" aria-hidden="true">{String(ETPS.length).padStart(2, "0")}</span></div>
        </div>
        <ul className="l-row ad-etps" data-row="">
          {ETPS.map((e, i) => (
            <li key={e.issuer + e.product} className="l-cell ad-etp">
              <a className="ad-etp__a" href={e.href}>
                <span className="ad-etp__art"><Vault {...VAULTS[i]} /></span>
                <span className="ad-etp__i">{e.issuer}</span>
                <span className="ad-etp__p">{e.product}</span>
                <span className="ad-etp__go">{host(e.href)}<Ext /></span>
              </a>
            </li>
          ))}
        </ul>
        <div className="l-row ad-legal" data-row="">
          <div className="l-cell"><p>{LEGAL}</p><p>{SAMPLE_NOTE}</p></div>
        </div>
      </section>
    </div>
  );
}
