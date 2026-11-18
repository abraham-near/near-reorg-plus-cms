"use client";
// near.org/analytics, version C · "Ruled grid": the page built from the lower half of the homepage (v3/proof-deeper: ruled rows that draw in, + crosshairs,
// the proof strip under its green rule, the full-bleed photo that opens to the whole screen, Get into NEAR's ink rows) with Blog J's ruled hero and its bar,
// and NEAR Foundation's Council band on the Stack's dark. Where A is an open overview and B an instrument panel, C reads like the homepage. From the top:
//   1 hero: Blog J's ruled head (the H1 | the subhead); its bar holds the status line and a 24h / 30d switch for the figures' change;
//   2 core stats: the homepage's proof strip, all five figures under the green rule, each with its line icon, counting up once; the sample note under it;
//   3 revenue | network status, side by side on the dark band (the Council's): the hero % over sixteen weekly bars | the four services as one 60-day matrix;
//   4 Go deeper: the heading cell beside the eight tools as two columns of Go deeper's tiles (glyph, domain, name, line, an arrow on hover);
//   5 Get exposure to NEAR: the head, SVRN on the full-bleed ridges (opens to the whole screen as it arrives), the ETPs & Trusts as Get into NEAR's ink rows;
//   6 the legal line closes the grid.
// Copy, links and figures: ../content.ts (figures are SAMPLE until the feeds exist: [[TBD: live]]). No third-party logos: names are set as type ([[TBD: logos]]).
import { useRef, useState } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import {
  ETPS, ETPS_HEAD, HERO, LEGAL, PRODUCTS_HEAD, REVENUE, SAMPLE_NOTE, STATS, STATUS, SVRN, TOOLS, TOOLS_HEAD, days,
} from "../content";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./analytics-c.css";

/** a heading from the content file with its Kepler word marked (the last occurrence of `a`) */
const Acc = ({ h, a }: { h: string; a: string }) => {
  const i = h.lastIndexOf(a);
  return i < 0 ? <>{h}</> : <>{h.slice(0, i)}<span className="accent">{a}</span>{h.slice(i + a.length)}</>;
};
const idx = (i: number) => String(i + 1).padStart(2, "0");
const host = (u: string) => new URL(u).hostname.replace(/^www\./, "");

/* the line icons (header/icons.ts draws them): one per figure, one per kind of tool */
const STAT_ICON: Record<string, string> = { fees: "economics", tvl: "quantum-security", volume: "near-intents", shards: "near-protocol", price: "analytics" };
const TOOL_ICON: Record<string, string> = {
  "The Tie": "research", Blockworks: "analytics", Artemis: "economics", Dune: "analytics", DefiLlama: "analytics", "Token Terminal": "analytics",
  PikeSpeak: "analytics", "Yahoo Finance": "economics",
};

const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
const Ext = () => (
  <svg className="l-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>
);
const Sample = ({ dark }: { dark?: boolean }) => <span className={`ac-tag${dark ? " is-dark" : ""}`}>Sample</span>;
const ExtSr = () => <span className="sr-only"> (opens another site)</span>;

/** a figure that counts once (motion.ts): the ghost holds the final width, the live copy counts, the screen reader reads the value */
const Count = ({ v, delay = 0 }: { v: string; delay?: number }) => (
  <span className="ac-num" data-count={v} data-delay={delay}>
    <span className="ac-num__ghost" aria-hidden="true">{v}</span>
    <span className="ac-num__live" aria-hidden="true" data-live="">{v}</span>
    <span className="sr-only">{v}</span>
  </span>
);

/** "▲ 6.2%": the triangle drawn (the fonts have none), the direction spoken */
function Delta({ v, k }: { v: number; k: string }) {
  const dir = v > 0 ? "up" : v < 0 ? "down" : "flat";
  return (
    <span className={`ac-d is-${dir}`}>
      <i className="ac-d__t" aria-hidden="true" />
      <span className="sr-only">{dir} </span>
      <span className="ac-d__v">{Math.abs(v).toFixed(1)}%</span>
      <span className="ac-d__k">{k}</span>
    </span>
  );
}

/* ── the revenue preview: sixteen weekly bars (SAMPLE), the last one green ── */
const B0 = 30, B1 = 66, GRID = [40, 50, 60];
const bh = (v: number) => ((v - B0) / (B1 - B0)) * 100;
function Bars() {
  const d = REVENUE.spark, n = d.length, last = d[n - 1];
  const say = `${REVENUE.metric.label}, ${n} weeks of sample figures: from ${d[0]}% to ${last}%, low ${Math.min(...d)}%, high ${Math.max(...d)}%.`;
  return (
    <figure className="ac-bars">
      <div className="ac-bars__plot" role="img" aria-label={say}>
        {GRID.map((g) => <i key={g} className="ac-bars__g" style={{ bottom: `${bh(g)}%` }} aria-hidden="true"><span>{g}%</span></i>)}
        <ol className="ac-bars__cols" aria-hidden="true">
          {d.map((v, i) => (
            <li key={i} className={i === n - 1 ? "is-now" : undefined} style={{ ["--h" as string]: `${bh(v)}%`, ["--i" as string]: i }} data-v={`${v}%`}><b /></li>
          ))}
        </ol>
      </div>
      <figcaption className="ac-bars__x" aria-hidden="true"><span>{n} wks ago</span><span>This week</span></figcaption>
    </figure>
  );
}

/* ── the network: four services × sixty days, one matrix (SAMPLE: 1 up, 0.5 degraded, 0 down) ── */
const SERVICES = STATUS.services.map((s, i) => ({ ...s, d: days(s.uptime, i + 1) }));
const sayDays = (d: number[]) => {
  const deg = d.filter((s) => s === 0.5).length, down = d.filter((s) => s === 0).length;
  if (!deg && !down) return "no incidents in the last 60 days";
  return [deg && `${deg} degraded ${deg === 1 ? "day" : "days"}`, down && `${down} ${down === 1 ? "outage" : "outages"}`].filter(Boolean).join(", ") + " in the last 60 days";
};

export function AnalyticsC() {
  const ref = useRef<HTMLDivElement>(null);
  const [per, setPer] = useState<"d24" | "d30">("d24");
  useScrollMotion(ref, mount);
  const ok = STATUS.health === "ok";   // [[TBD: live]] from status.near.org
  const perK = per === "d24" ? "24h" : "30d";
  const tools = [TOOLS.slice(0, 4), TOOLS.slice(4)];

  return (
    <div ref={ref} className="l-page an-c" data-health={STATUS.health}>
      {/* ───────────── 1 · hero: Blog J's ruled head and its bar */}
      <section className="l-sec ac-hero" aria-labelledby="ac-h1">
        <div className="l-row ac-hero__row" data-row="" data-start="">
          <div className="l-cell ac-hero__title">
            <p className="ac-k" data-in=""><i className="ac-sq" aria-hidden="true" />NEAR <span aria-hidden="true">/</span> Analytics</p>
            <h1 id="ac-h1" className="ac-h1" data-h1=""><Acc h={HERO.h1} a="numbers" /></h1>
          </div>
          <div className="l-cell ac-hero__intro">
            <p className="l-lede" data-in="">{HERO.sub}</p>
          </div>
        </div>
        <div className="l-row ac-bar" data-row="">
          <div className="l-cell ac-bar__cell">
            <p className="ac-live">
              <a className={`ac-live__a${ok ? "" : " is-issue"}`} href="#status">
                <i className="ac-pulse" aria-hidden="true" />
                <span>{ok ? HERO.status : STATUS.h.issue}</span>
                <svg className="ac-down" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M6 1.5v9M2 6.5 6 10.5 10 6.5" /></svg>
              </a>
              <span className="ac-live__t">Updated {STATUS.updated}</span>
            </p>
            {/* the figures' change: one period at a time (a pair of toggle buttons) */}
            <div className="ac-per" role="group" aria-labelledby="ac-per-l">
              <span id="ac-per-l" className="ac-per__l">Change over</span>
              <span className="ac-per__opts" data-on={per}>
                <i className="ac-per__dot" aria-hidden="true" />
                <button type="button" className="ac-per__b" aria-pressed={per === "d24"} onClick={() => setPer("d24")}>24h</button>
                <button type="button" className="ac-per__b" aria-pressed={per === "d30"} onClick={() => setPer("d30")}>30d</button>
              </span>
              <span className="sr-only" aria-live="polite">{per === "d24" ? "Showing the change over 24 hours" : "Showing the change over 30 days"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 2 · core stats: the proof strip, all five */}
      <section className="l-sec ac-stats" aria-labelledby="ac-stats-t">
        <h2 id="ac-stats-t" className="sr-only">Core stats</h2>
        <ul className="l-row l-proof__row ac-stats__row" data-row="">
          <li className="l-green" aria-hidden="true" role="presentation" />
          {STATS.map((s, i) => (
            /* [[TBD: live]] the figure and its 24h / 30d change */
            <li key={s.key} className="l-cell ac-fig" style={{ ["--i" as string]: i }}>
              <i className="l-ic" data-icon={STAT_ICON[s.key] ?? "analytics"} data-icon-size="20" aria-hidden="true" />
              <p className="ac-fig__k">{idx(i)}</p>
              <p className="ac-fig__v"><Count v={s.value} delay={i * 90} /></p>
              <p className="ac-fig__l">{s.label}</p>
              <p className="ac-fig__d">
                <Delta v={s.delta[per]} k={perK} />
                {s.source && <a className="ac-src" href={s.source} target="_blank" rel="noopener noreferrer">Source<Ext /><ExtSr /></a>}
              </p>
            </li>
          ))}
        </ul>
        <div className="l-row ac-note" data-row="">
          <p className="l-cell ac-note__c"><Sample />{SAMPLE_NOTE}</p>
        </div>
      </section>

      {/* ───────────── 3 · revenue | network status, on the dark band */}
      <section className="l-sec ac-dark" aria-label="Revenue and network health">
        <div className="l-row ac-pair" data-row="">
          <article className="l-cell ac-card ac-rev" aria-labelledby="ac-rev-t">
            <p className="ac-card__k" data-rv=""><span><i className="ac-sq" aria-hidden="true" />{REVENUE.eyebrow}</span><Sample dark /></p>
            <h2 id="ac-rev-t" className="ac-card__h" data-rv="">{REVENUE.h}</h2>
            <p className="ac-card__b" data-rv="">{REVENUE.body}</p>
            <div className="ac-rev__fig" data-rv="">
              <p className="ac-rev__v"><Count v={REVENUE.metric.value} delay={120} /></p>
              <p className="ac-rev__l">{REVENUE.metric.label}</p>
            </div>
            {/* [[TBD: live]] the weekly share from revenue.near.org */}
            <Bars />
            <p className="ac-card__foot">
              <span className="ac-card__meta">Weekly · sample figures</span>
              <a className="l-link" href={REVENUE.href} target="_blank" rel="noopener noreferrer"><span>{REVENUE.cta}</span><Ext /><ExtSr /></a>
            </p>
          </article>

          <article className="l-cell ac-card ac-st" id="status" aria-labelledby="ac-st-t">
            <p className="ac-card__k" data-rv=""><span><i className="ac-sq" aria-hidden="true" />{STATUS.eyebrow}</span><Sample dark /></p>
            <h2 id="ac-st-t" className={`ac-card__h ac-st__h${ok ? "" : " is-issue"}`} data-rv=""><i className="ac-pulse" aria-hidden="true" />{STATUS.h[STATUS.health]}</h2>
            <p className="ac-card__b" data-rv="">Mainnet, RPC, testnet and explorer, day by day.</p>
            <ul className="ac-mx" aria-label="60-day uptime by service">
              {SERVICES.map((s, r) => (
                <li key={s.name} className="ac-mx__row" style={{ ["--r" as string]: r }}>
                  <span className="ac-mx__n">{s.name}</span>
                  <span className="ac-mx__u">{s.uptime.toFixed(2)}%</span>
                  <span className="ac-mx__days" aria-hidden="true">
                    {s.d.map((v, i) => <i key={i} className={v === 1 ? "is-up" : v === 0 ? "is-down" : "is-deg"} style={{ ["--i" as string]: i }} />)}
                  </span>
                  <span className="sr-only">: {s.uptime.toFixed(2)}% uptime, {sayDays(s.d)}.</span>
                </li>
              ))}
            </ul>
            <div className="ac-mx__axis" aria-hidden="true">
              <span>60 days ago</span>
              <span className="ac-mx__key"><span><i className="is-up" />No incident</span><span><i className="is-deg" />Degraded</span><span><i className="is-down" />Outage</span></span>
              <span>Today</span>
            </div>
            <p className="ac-card__foot">
              <span className="ac-card__meta">Last updated {STATUS.updated}</span>
              <a className="l-link" href={STATUS.href} target="_blank" rel="noopener noreferrer"><span>{STATUS.cta}</span><Ext /><ExtSr /></a>
            </p>
          </article>
        </div>
      </section>

      {/* ───────────── 4 · go deeper: the heading cell beside the tools */}
      <section className="l-sec ac-tools" aria-labelledby="ac-tools-t">
        <div className="l-row ac-tools__row" data-row="">
          <div className="l-cell ac-tools__head">
            <p className="ac-k" data-rv=""><i className="ac-sq" aria-hidden="true" />Analytics &amp; research</p>
            <h2 id="ac-tools-t" className="l-h2" data-rv=""><Acc h={TOOLS_HEAD.h} a="deeper" /></h2>
            <p className="l-lede ac-tools__sub" data-rv="">{TOOLS_HEAD.sub}</p>
            <p className="ac-tools__n" data-rv="" aria-hidden="true"><span>{String(TOOLS.length).padStart(2, "0")}</span> platforms</p>
          </div>
          {tools.map((col, c) => (
            <div key={c} className="l-cell ac-tools__col">
              <ul className="ac-tiles">
                {col.map((t, j) => (
                  <li key={t.name} className="ac-tile" style={{ ["--j" as string]: j + c * 4 }}>
                    {/* [[TBD: logos]] the platform's name set as type */}
                    <a className="ac-tile__a" href={t.href} target="_blank" rel="noopener noreferrer">
                      <i className="ac-tile__ic" data-icon={TOOL_ICON[t.name] ?? "analytics"} aria-hidden="true" />
                      <span className="ac-tile__k">{host(t.href)}</span>
                      <span className="ac-tile__t">{t.name}<ExtSr /></span>
                      <span className="ac-tile__l">{t.line}</span>
                      <span className="ac-tile__go" aria-hidden="true"><Arrow /></span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── 5 · public products: the head, SVRN on the ridges, the ETPs & Trusts */}
      <section className="l-sec ac-prod" aria-labelledby="ac-prod-t">
        <div className="l-row ac-head" data-row="">
          <div className="l-cell ac-head__h">
            <p className="ac-k" data-rv=""><i className="ac-sq" aria-hidden="true" />Public products</p>
            <h2 id="ac-prod-t" className="l-h2" data-rv=""><Acc h={PRODUCTS_HEAD.h} a="exposure" /></h2>
          </div>
          <div className="l-cell ac-head__end">
            <p className="l-lede" data-rv="">{PRODUCTS_HEAD.sub}</p>
            <p className="ac-disc" data-rv="">{PRODUCTS_HEAD.disclaimer}</p>
          </div>
        </div>
        <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>
        <div className="l-bleed-wrap">
          <article className="l-bleed ac-svrn" data-bleed="" aria-labelledby="ac-svrn-t">
            <div className="l-ph l-bleed__ph" data-ph="">
              <div className="l-plate"><img className="l-img" src="/v3/bleed-ridges.webp" alt="" loading="lazy" decoding="async" /></div>
            </div>
            <div className="l-bleed__in ac-svrn__in">
              <p className="ac-k ac-svrn__k" data-rv=""><i className="ac-sq" aria-hidden="true" />Featured</p>
              <h3 id="ac-svrn-t" className="ac-svrn__h" data-rv="">{SVRN.h}</h3>
              <p className="ac-svrn__sub" data-rv="">{SVRN.sub}</p>
              <p className="ac-svrn__cta" data-rv="">
                <a className="l-btn ac-btn" href={SVRN.href} target="_blank" rel="noopener noreferrer"><span>{SVRN.cta}</span><span className="sr-only"> about {SVRN.h} (opens another site)</span></a>
                <span className="ac-svrn__d" aria-hidden="true">{host(SVRN.href)}</span>
              </p>
            </div>
          </article>
        </div>
        <div className="l-row ac-etp-head" data-row="" data-after-bleed="">
          <div className="l-cell ac-etp-head__c">
            <h3 className="ac-etp-head__t" data-rv="">{ETPS_HEAD}</h3>
            <span className="ac-etp-head__n" data-rv="">{String(ETPS.length).padStart(2, "0")} products</span>
          </div>
        </div>
        <div className="l-row ac-etps" data-row="">
          <div className="l-cell ac-etps__c">
            <ul>
              {ETPS.map((e, i) => (
                <li key={e.issuer + e.product} className="l-gi__item ac-etp" style={{ ["--j" as string]: i }}>
                  <span className="l-gi__idx" aria-hidden="true">{idx(i)}</span>
                  <div className="ac-etp__txt" data-rv="">
                    <h4 className="ac-etp__i">{e.issuer}</h4>
                    <p className="ac-etp__p">{e.product}</p>
                  </div>
                  <p className="l-gi__act" data-rv="">
                    <a className="l-gi__a" href={e.href} target="_blank" rel="noopener noreferrer" aria-label={`${e.issuer}, ${e.product} (opens ${host(e.href)})`}>
                      <span className="l-gi__go"><span className="ac-etp__h">{host(e.href)}</span><Ext /></span>
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="l-row ac-legal" data-row="">
          <div className="l-cell ac-legal__c"><p>{LEGAL}</p><p><Sample />{SAMPLE_NOTE}</p></div>
        </div>
      </section>
    </div>
  );
}
