"use client";
// near.org/analytics, version C, "Living network": the doc's lean overview (near.org-analytics-airnauts, October 2026), told with the repo's iso hand.
//   1 hero: the headline, the subhead and the status line (→ #status) beside a living drawing of the network (HeroScene: shards, blocks, receipts, a beacon);
//   2 core stats as a scroll story: on desktop the stage holds while each stat gets its moment, its figure counting up as its drawing builds
//     (StoryScenes), and the five land in one clean row under it; phones and reduced motion get the same five as a plain stacked list;
//   3 the revenue card and the network status card, side by side (a sparkline that draws and scrubs; a heartbeat and 60-day strips that light up);
//   4 Go deeper: the third-party tools (Allium left out, as the doc says), each name on a small iso tile;
//   5 Get exposure to NEAR: SVRN featured wide, then the ETPs & Trusts; 6 the legal line.
// Copy, links and figures: ../content.ts (SAMPLE figures, said so under the stats). Motion: motion.ts. Styles: analytics-c.css (scoped under .an-c).
import { useRef, type CSSProperties } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import {
  HERO, STATS, deltaText, REVENUE, STATUS, days, TOOLS_HEAD, TOOLS, PRODUCTS_HEAD, SVRN, ETPS_HEAD, ETPS, LEGAL, SAMPLE_NOTE,
} from "../content";
import { HeroScene } from "./HeroScene";
import { SCENES, SvrnArt, Tile } from "./StoryScenes";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./analytics-c.css";

const idx = (i: number) => String(i + 1).padStart(2, "0");
// [[TBD: logos]] no logo files: each tool's name is set on a tile in our own type
const MONO: Record<string, string> = { "The Tie": "T", Blockworks: "B", Artemis: "A", Dune: "D", DefiLlama: "DL", "Token Terminal": "TT", PikeSpeak: "PS", "Yahoo Finance": "Y" };

const Arrow = ({ cls = "l-arr" }: { cls?: string }) => (
  <svg className={cls} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
const Ext = () => (
  <svg className="anc-ext" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" /></svg>
);
const Tri = ({ v }: { v: number }) => (
  v === 0 ? <i className="anc-tri anc-tri--0" aria-hidden="true" /> : <i className={`anc-tri ${v > 0 ? "anc-tri--up" : "anc-tri--dn"}`} aria-hidden="true" />
);
/** "24h ▲ 0.8%": the triangle drawn, its meaning in words for screen readers */
function Delta({ k, v }: { k: string; v: number }) {
  const t = deltaText(v).replace(/^\S+\s/, "");
  return (
    <li className={`anc-delta${v > 0 ? " is-up" : v < 0 ? " is-dn" : ""}`}>
      <span className="anc-delta__k">{k}</span>
      <Tri v={v} />
      <span className="sr-only">{v > 0 ? "up" : v < 0 ? "down" : "flat"}</span>
      <span>{t}</span>
    </li>
  );
}

// the revenue sparkline's geometry (viewBox units)
const SW = 360, SH = 112, SP = 8;
const sx = (i: number) => SP + (i / (REVENUE.spark.length - 1)) * (SW - 2 * SP);
const sLo = Math.min(...REVENUE.spark) - 4, sHi = Math.max(...REVENUE.spark) + 2;
const sy = (v: number) => SH - 10 - ((v - sLo) / (sHi - sLo)) * (SH - 26);
const SPARK = REVENUE.spark.map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join("");
const SPARK_AREA = `${SPARK}L${sx(REVENUE.spark.length - 1).toFixed(1)},${SH}L${sx(0).toFixed(1)},${SH}Z`;
const sLast = REVENUE.spark.length - 1;

// the heartbeat's trace: flat, a beat, flat (viewBox 0 0 600 48)
const BEAT = (x: number) => `L${x},24 L${x + 8},24 L${x + 12},18 L${x + 16},24 L${x + 22},24 L${x + 26},6 L${x + 31},42 L${x + 36},20 L${x + 40},24 L${x + 52},24 L${x + 58},20 L${x + 66},24`;
const HEART = "M0,24 " + [30, 150, 270, 390, 510].map((x) => BEAT(x)).join(" ") + " L600,24";

export function AnalyticsC() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  const ok = STATUS.health === "ok";
  const N = STATS.length;
  return (
    <div ref={ref} className="l-page an-c" data-health={STATUS.health}>
      {/* 1 · hero */}
      <section className="anc-hero" aria-labelledby="anc-h1">
        <div className="anc-hero__txt">
          <p className="anc-eyebrow"><i aria-hidden="true" />NEAR Analytics</p>
          <h1 id="anc-h1" className="anc-h1">
            <span className="anc-h1__l">NEAR by the</span> <span className="anc-h1__l"><span className="accent">numbers</span><span className="anc-sq" aria-hidden="true" /></span>
          </h1>
          <p className="anc-lede">{HERO.sub}</p>
          <a className="anc-status" href="#status">
            <span className="anc-status__dot" aria-hidden="true" />
            <span>{ok ? HERO.status : STATUS.h.issue}</span>
            <svg className="anc-status__arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 2.5v10.5M3.5 9 8 13.5 12.5 9" /></svg>
          </a>
        </div>
        <div className="anc-hero__art">
          <div className="anc-hero__cam"><HeroScene /></div>
        </div>
      </section>

      {/* 2 · core stats: a scroll story on desktop, a stacked list elsewhere; the text is the same plain DOM either way */}
      <section className="anc-story" id="stats" aria-labelledby="anc-stats-t" style={{ "--n": N } as CSSProperties}>
        <div className="anc-stage">
          <div className="anc-stage__top">
            <h2 id="anc-stats-t" className="anc-kicker"><i aria-hidden="true" />Core stats</h2>
            <p className="anc-count" aria-hidden="true"><b className="anc-count__i">01</b> / {idx(N - 1)}</p>
          </div>
          <ol className="anc-steps">
            {STATS.map((s, i) => {
              const Scene = SCENES[s.key as keyof typeof SCENES];
              return (
                <li key={s.key} className="anc-step" data-i={i}>
                  <div className="anc-step__txt">
                    <p className="anc-step__k" aria-hidden="true">{idx(i)}</p>
                    <h3 className="anc-step__l">
                      {s.label}
                      {s.source && <> <a className="anc-src" href={s.source} target="_blank" rel="noopener noreferrer">(source<span className="sr-only">: Dune query, opens in a new tab</span>)</a></>}
                    </h3>
                    <p className="anc-num"><span className="anc-num__v" aria-hidden="true" data-v={s.value}>{s.value}</span><span className="sr-only">{s.value}</span></p>
                    <ul className="anc-deltas" aria-label="Change">
                      <Delta k="24h" v={s.delta.d24} />
                      <Delta k="30d" v={s.delta.d30} />
                    </ul>
                  </div>
                  <div className="anc-step__art">{Scene && <Scene />}</div>
                </li>
              );
            })}
          </ol>
          <nav className="l-row anc-rail" data-row="" aria-label="Core stats">
            {STATS.map((s, i) => (
              <button key={s.key} type="button" className="l-cell anc-rail__b" data-i={i}>
                <span className="anc-rail__bar" aria-hidden="true"><i /></span>
                <span className="anc-rail__l">{s.label}</span>
                <span className="anc-rail__v" aria-hidden="true">{s.value}</span>
              </button>
            ))}
          </nav>
          <p className="anc-note">{SAMPLE_NOTE}</p>
        </div>
      </section>

      {/* 3 & 4 · two cards side by side */}
      <section className="l-sec anc-cards" aria-label="Revenue and network health">
        <div className="l-row anc-cards__row" data-row="" data-start="">
          <article className="l-cell anc-card anc-rev" aria-labelledby="anc-rev-t">
            <p className="anc-eb" data-rv=""><i aria-hidden="true" />{REVENUE.eyebrow}</p>
            <h3 id="anc-rev-t" className="anc-card__h" data-rv="">NEAR is earning <span className="accent">revenue</span>, in real time.</h3>
            <p className="anc-card__b" data-rv="">{REVENUE.body}</p>
            <div className="anc-rev__fig" data-rv="">
              <p className="anc-rev__v"><span className="anc-rev__n" aria-hidden="true" data-v={REVENUE.metric.value}>{REVENUE.metric.value}</span><span className="sr-only">{REVENUE.metric.value}</span></p>
              <p className="anc-rev__l">{REVENUE.metric.label} <span className="anc-tag">Sample</span></p>
            </div>
            <figure className="anc-spark" data-rv="">
              <svg viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none" role="img" aria-label={`Sample trend over ${REVENUE.spark.length} weeks, from ${REVENUE.spark[0]}% to ${REVENUE.spark[sLast]}%.`}>
                <defs>
                  <linearGradient id="anc-spark-g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#00DC8D" stopOpacity="0.26" />
                    <stop offset="1" stopColor="#00DC8D" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((k) => <path key={k} className="anc-spark__grid" d={`M0,${(SH * k).toFixed(1)}H${SW}`} />)}
                <path className="anc-spark__area" d={SPARK_AREA} fill="url(#anc-spark-g)" />
                <path className="anc-spark__line" d={SPARK} />
                <line className="anc-spark__x" x1={sx(sLast)} x2={sx(sLast)} y1={0} y2={SH} />
              </svg>
              <span className="anc-spark__dot" aria-hidden="true" style={{ left: `${(sx(sLast) / SW) * 100}%`, top: `${(sy(REVENUE.spark[sLast]) / SH) * 100}%` }} />
              <figcaption className="anc-spark__r" aria-hidden="true"><span className="anc-spark__w">Week {sLast + 1}</span><b className="anc-spark__p">{REVENUE.spark[sLast]}%</b></figcaption>
            </figure>
            <p className="anc-card__cta" data-rv="">
              <a className="l-btn anc-btn" href={REVENUE.href} target="_blank" rel="noopener noreferrer">{REVENUE.cta}<Arrow cls="l-arr anc-btn__arr" /><span className="sr-only"> (opens in a new tab)</span></a>
            </p>
          </article>

          <article className="l-cell anc-card anc-st" id="status" aria-labelledby="anc-st-t">
            <p className="anc-eb" data-rv=""><i aria-hidden="true" />{STATUS.eyebrow}</p>
            <h3 id="anc-st-t" className="anc-card__h anc-st__h" data-rv="">
              <span className="anc-st__beacon" aria-hidden="true"><i /><i /></span>
              {STATUS.h[STATUS.health]}
            </h3>
            <div className="anc-heart" aria-hidden="true" data-rv="">
              <svg viewBox="0 0 600 48" preserveAspectRatio="none">
                <path className="anc-heart__base" d={HEART} />
                <path className="anc-heart__run" d={HEART} pathLength={1} />
              </svg>
            </div>
            <p className="anc-st__cap" data-rv="">60-day uptime <span className="anc-tag">Sample</span></p>
            <ul className="anc-svc" data-rv="">
              {STATUS.services.map((s, si) => (
                <li key={s.name} className="anc-svc__i">
                  <p className="anc-svc__n">{s.name}</p>
                  <p className="anc-svc__u">{s.uptime.toFixed(2)}%</p>
                  <span className="anc-strip" aria-hidden="true">
                    {days(s.uptime, si + 1).map((d, di) => <i key={di} className={d === 1 ? "" : d === 0 ? "is-down" : "is-deg"} style={{ "--i": di } as CSSProperties} />)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="anc-st__foot" data-rv="">
              <p className="anc-st__upd">Last updated {STATUS.updated}</p>
              <a className="l-link anc-link" href={STATUS.href} target="_blank" rel="noopener noreferrer">{STATUS.cta}<Arrow /><span className="sr-only"> (status.near.org, opens in a new tab)</span></a>
            </div>
          </article>
        </div>
      </section>

      {/* 5 · Go deeper: the third-party tools */}
      <section className="l-sec anc-tools" aria-labelledby="anc-tools-t">
        <div className="l-row anc-head" data-row="">
          <div className="l-cell anc-head__c">
            <h2 id="anc-tools-t" className="anc-h2" data-rv="">Go <span className="accent">deeper</span></h2>
            <p className="anc-head__s" data-rv="">{TOOLS_HEAD.sub}</p>
          </div>
        </div>
        {[TOOLS.slice(0, 4), TOOLS.slice(4)].map((row, ri) => (
          <ul key={ri} className="l-row anc-tools__row" data-row="">
            {row.map((t) => (
              <li key={t.name} className="l-cell anc-tool">
                <a className="anc-tool__a" href={t.href} target="_blank" rel="noopener noreferrer">
                  <span className="anc-tool__in">
                    <Tile mono={MONO[t.name] || t.name[0]} />
                    <span className="anc-tool__n">{t.name}</span>
                    <span className="anc-tool__d">{t.line}</span>
                    <Ext />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ))}
      </section>

      {/* 6 · Get exposure to NEAR: SVRN featured, then the ETPs & Trusts */}
      <section className="l-sec anc-prod" aria-labelledby="anc-prod-t">
        <div className="l-row anc-head" data-row="">
          <div className="l-cell anc-head__c">
            <h2 id="anc-prod-t" className="anc-h2" data-rv="">Get <span className="accent">exposure</span> to NEAR</h2>
            <div className="anc-head__r">
              <p className="anc-head__s" data-rv="">{PRODUCTS_HEAD.sub}</p>
              <p className="anc-disc" data-rv="">{PRODUCTS_HEAD.disclaimer}</p>
            </div>
          </div>
        </div>
        <div className="l-row anc-svrn" data-row="">
          <div className="l-cell anc-svrn__t">
            <p className="anc-eb" data-rv=""><i aria-hidden="true" />Featured</p>
            <h3 className="anc-svrn__h" data-rv="">{SVRN.h}</h3>
            <p className="anc-svrn__s" data-rv="">{SVRN.sub}</p>
            <p data-rv=""><a className="l-btn anc-btn" href={SVRN.href} target="_blank" rel="noopener noreferrer">{SVRN.cta}<Arrow cls="l-arr anc-btn__arr" /><span className="sr-only"> about SVRN (opens in a new tab)</span></a></p>
          </div>
          <div className="l-cell anc-svrn__art" aria-hidden="true"><SvrnArt /></div>
        </div>
        <div className="l-row anc-etph" data-row="">
          <div className="l-cell"><h3 className="anc-etph__h" data-rv="">{ETPS_HEAD}</h3></div>
        </div>
        <ul className="l-row anc-etps" data-row="">
          {ETPS.map((e) => (
            <li key={e.issuer} className="l-cell anc-etp">
              <a className="anc-etp__a" href={e.href} target="_blank" rel="noopener noreferrer">
                <span className="anc-etp__i">{e.issuer}</span>
                <span className="anc-etp__p">{e.product}</span>
                <span className="anc-etp__go" aria-hidden="true"><Arrow /></span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="anc-legal">{LEGAL}</p>
    </div>
  );
}
