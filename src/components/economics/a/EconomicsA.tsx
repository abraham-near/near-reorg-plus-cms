"use client";
// near.org/economics, version A · "Ruled grid": the page built from the homepage's ruled grid (v3/proof-deeper: ruled rows that draw in, + crosshairs, the proof
// strip under its green rule), Blog J's ruled hero and bar, and NEAR Foundation's Council band on the Stack's dark.
// Precise and quiet: no photo until the close. From the top (the doc's order):
//   1 hero: Blog J's ruled head (the H1 and the two actions | the subhead), its bar (on this page · the live numbers at revenue.near.org);
//   2 mature: the head, then the four structural facts as the proof strip (a big figure, its mono label, the fact), under the green rule;
//   3 the loop: the head, then the diagram (four cells around the centre +, joined by a ring with an arrow on each divider) sticking beside the four steps;
//     the step in the middle of the view lights its cell and its quarter of the ring, and a dot runs the ring as the steps scroll; the flywheel line closes it;
//   4 sources: the head, the two products as two ruled columns, the line that ties them to the loop;
//   5 the centre, on the dark band: the head, one asset (NEAR, set large) over its three job cells, the body | the forward line;
//   6 the close: the homepage's scene (shared/CloseScene), set after this component in the route (app/(site)/economics-a/page.tsx).
// Copy and links: ../content.ts (the doc, verbatim). Only the bar's section names are local (NAV below). No figures beyond the doc's structural facts.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { CENTER, HERO, LOOP, MATURE, REVENUE_URL, SOURCES } from "../content";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./economics-a.css";

/** a heading from the content file with its Kepler word marked (the last occurrence of `a`) */
const Acc = ({ h, a }: { h: string; a: string }) => {
  const i = h.lastIndexOf(a);
  return i < 0 ? <>{h}</> : <>{h.slice(0, i)}<span className="accent">{a}</span>{h.slice(i + a.length)}</>;
};
const idx = (i: number) => String(i + 1).padStart(2, "0");
const isExt = (h: string) => /^https?:/.test(h);
const host = (u: string) => (isExt(u) ? new URL(u).hostname.replace(/^www\./, "") : "near.org");
const ext = (h: string) => (isExt(h) ? { target: "_blank", rel: "noopener noreferrer" } : {});

const Arrow = ({ down }: { down?: boolean }) => (
  <svg className={`l-arr${down ? " ea-down" : ""}`} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
const Ext = () => (
  <svg className="l-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>
);
const ExtSr = ({ h }: { h: string }) => (isExt(h) ? <span className="sr-only"> (opens another site)</span> : null);

/** the bar's section names (local labels: the doc has none) */
const NAV = [
  { href: `#${MATURE.id}`, label: "Foundation" },
  { href: `#${LOOP.id}`, label: "The loop" },
  { href: `#${SOURCES.id}`, label: "Revenue" },
  { href: `#${CENTER.id}`, label: "One asset" },
];
const FACT_ICON: Record<string, string> = { supply: "economics", inflation: "roadmap", governance: "governance", uptime: "clock" };
const SOURCE_ICON: Record<string, string> = { intents: "near-intents", ai: "near-ai" };

/* the diagram: a 100 × 100 square, the ring (r 24) round its centre; each step owns a quarter, clockwise from 9 o'clock (1 top left, 2 top right,
   3 bottom right, 4 bottom left); an arrow sits where the ring crosses each divider, pointing into the next step */
const R = 24;
const ARCS = [
  `M${50 - R} 50A${R} ${R} 0 0 1 50 ${50 - R}`,
  `M50 ${50 - R}A${R} ${R} 0 0 1 ${50 + R} 50`,
  `M${50 + R} 50A${R} ${R} 0 0 1 50 ${50 + R}`,
  `M50 ${50 + R}A${R} ${R} 0 0 1 ${50 - R} 50`,
];
/* into step 2 (12 o'clock, pointing right), 3 (3 o'clock, down), 4 (6 o'clock, left), 1 (9 o'clock, up) */
const HEADS = [
  { into: 2, d: `M48 ${48 - R}L50 ${50 - R}L48 ${52 - R}` },
  { into: 3, d: `M${48 + R} 48L${50 + R} 50L${52 + R} 48` },
  { into: 4, d: `M52 ${48 + R}L50 ${50 + R}L52 ${52 + R}` },
  { into: 1, d: `M${48 - R} 52L${50 - R} 50L${52 - R} 52` },
];
const CROSS = [0, 50, 100].flatMap((y) => [0, 50, 100].map((x) => ({ x, y })));

function LoopDiagram() {
  return (
    <div className="ea-dia" aria-hidden="true">
      <div className="ea-dia__sq">
        {LOOP.steps.map((s, i) => (
          <div key={s.n} className="ea-q" data-q={i + 1}>
            <span className="ea-q__n">{idx(i)}</span>
            <span className="ea-q__s">{s.short}</span>
          </div>
        ))}
        <svg className="ea-ring" viewBox="0 0 100 100" focusable="false">
          <circle className="ea-ring__base" cx="50" cy="50" r={R} vectorEffect="non-scaling-stroke" />
          {ARCS.map((d, i) => <path key={i} className="ea-ring__arc" data-a={i + 1} d={d} pathLength={1} />)}
          {HEADS.map((h) => <path key={h.into} className="ea-ring__head" data-h={h.into} d={h.d} vectorEffect="non-scaling-stroke" />)}
          <circle className="ea-ring__dot" data-dot="" cx={50 - R} cy="50" r="1.5" />
        </svg>
        {CROSS.map((c) => (
          <b key={`${c.x}-${c.y}`} className={`ea-x${c.x === 50 && c.y === 50 ? " ea-x--c" : ""}`} style={{ left: `${c.x}%`, top: `${c.y}%` }} />
        ))}
      </div>
    </div>
  );
}

export function EconomicsA() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);

  return (
    <div ref={ref} className="l-page ec-a">
      {/* ───────────── 1 · hero: Blog J's ruled head and its bar */}
      <section className="l-sec ea-hero" aria-labelledby="ea-h1">
        <div className="l-row ea-hero__row" data-row="" data-start="">
          <div className="l-cell ea-hero__title">
            <p className="ea-k" data-in=""><i className="ea-sq" aria-hidden="true" />NEAR <span aria-hidden="true">/</span> {HERO.eyebrow}</p>
            <h1 id="ea-h1" className="ea-h1" data-h1=""><Acc h={HERO.h1} a={HERO.accent} /></h1>
          </div>
          <div className="l-cell ea-hero__intro">
            <p className="l-lede" data-in="">{HERO.sub}</p>
            <p className="ea-acts" data-in="">
              <a className="l-btn ea-btn" href={HERO.primary.href} {...ext(HERO.primary.href)}><span>{HERO.primary.label}</span><Ext /><ExtSr h={HERO.primary.href} /></a>
              <a className="l-link" href={HERO.secondary.href}><span>{HERO.secondary.label}</span><Arrow down /></a>
            </p>
          </div>
        </div>
        <div className="l-row ea-bar" data-row="">
          <div className="l-cell ea-bar__cell">
            <nav className="ea-nav" aria-label="On this page">
              {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
            </nav>
            <a className="ea-live" href={REVENUE_URL} {...ext(REVENUE_URL)}>
              <span className="ea-live__k"><i aria-hidden="true" />Live</span>
              <span className="ea-live__t">{host(REVENUE_URL)}</span><Ext /><ExtSr h={REVENUE_URL} />
            </a>
          </div>
        </div>
      </section>

      {/* ───────────── 2 · mature: the four facts as the proof strip */}
      <section className="l-sec ea-mature" id={MATURE.id} aria-labelledby="ea-mt-t">
        <div className="l-row ea-head" data-row="">
          <div className="l-cell ea-head__h">
            <p className="ea-k" data-rv=""><i className="ea-sq" aria-hidden="true" />Foundation</p>
            <h2 id="ea-mt-t" className="l-h2 l-h2--m" data-split=""><Acc h={MATURE.h} a="foundation" /></h2>
          </div>
          <div className="l-cell ea-head__end"><p className="l-lede" data-rv="">{MATURE.intro}</p></div>
        </div>
        <ul className="l-row l-proof__row ea-facts" data-row="">
          <li className="l-green" aria-hidden="true" role="presentation" />
          {MATURE.facts.map((f, i) => (
            <li key={f.k} className="l-cell ea-fact" style={{ ["--i" as string]: i }}>
              <i className="l-ic" data-icon={FACT_ICON[f.k]} data-icon-size="20" aria-hidden="true" />
              <p className="ea-fact__v">{f.figure}</p>
              <p className="ea-fact__l">{f.figureLabel}</p>
              <h3 className="ea-fact__t"><span className="ea-fact__n" aria-hidden="true">{f.n}</span>{f.title}</h3>
              <p className="ea-fact__b">{f.body}</p>
              {"href" in f && f.href && (
                <p className="ea-fact__a"><a className="l-link" href={f.href} {...ext(f.href)}><span>{host(f.href)}</span><Ext /><ExtSr h={f.href} /></a></p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── 3 · the loop: the diagram beside the four steps */}
      <section className="l-sec ea-loop" id={LOOP.id} aria-labelledby="ea-lp-t">
        <div className="l-row ea-head" data-row="">
          <div className="l-cell ea-head__h">
            <p className="ea-k" data-rv=""><i className="ea-sq" aria-hidden="true" />{HERO.secondary.label}</p>
            <h2 id="ea-lp-t" className="l-h2 l-h2--m" data-split=""><Acc h={LOOP.h} a="loop" /></h2>
          </div>
          <div className="l-cell ea-head__end"><p className="l-lede" data-rv="">{LOOP.intro}</p></div>
        </div>
        <div className="l-row ea-loop__row" data-row="" data-loop="" data-step="1">
          <div className="l-cell ea-dia__c"><LoopDiagram /></div>
          <ol className="l-cell ea-steps">
            {LOOP.steps.map((s, i) => (
              <li key={s.n} className="ea-st" data-step-i={i} style={{ ["--j" as string]: i }}>
                <p className="ea-st__n"><i aria-hidden="true" />{idx(i)} <span aria-hidden="true">/</span> {s.short}</p>
                <h3 className="ea-st__t">{s.title}</h3>
                <p className="ea-st__b">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="l-row ea-loop__end" data-row="">
          <div className="l-cell ea-loop__k"><p className="ea-k" data-rv=""><i className="ea-sq" aria-hidden="true" />The flywheel</p></div>
          <div className="l-cell"><p className="ea-statement" data-rv="">{LOOP.close}</p></div>
        </div>
      </section>

      {/* ───────────── 4 · sources: two ruled columns */}
      <section className="l-sec ea-src" id={SOURCES.id} aria-labelledby="ea-sr-t">
        <div className="l-row ea-head ea-head--one" data-row="">
          <div className="l-cell ea-head__h">
            <p className="ea-k" data-rv=""><i className="ea-sq" aria-hidden="true" />Revenue</p>
            <h2 id="ea-sr-t" className="l-h2 l-h2--m" data-split=""><Acc h={SOURCES.h} a="revenue" /></h2>
          </div>
        </div>
        <ul className="l-row ea-src__row" data-row="">
          {SOURCES.items.map((s, i) => (
            <li key={s.k} className="l-cell ea-so" style={{ ["--j" as string]: i }}>
              <i className="l-ic ea-so__ic" data-icon={SOURCE_ICON[s.k]} data-icon-size="20" aria-hidden="true" />
              <p className="ea-so__k">{idx(i)} <span aria-hidden="true">·</span> {s.name}</p>
              <h3 className="ea-so__t">{s.title}</h3>
              <p className="ea-so__b">{s.body}</p>
              <p className="ea-so__a"><a className="l-link" href={s.link.href} {...ext(s.link.href)}><span>{s.link.label}</span><Ext /><ExtSr h={s.link.href} /></a></p>
            </li>
          ))}
        </ul>
        <div className="l-row ea-tie" data-row="">
          <div className="l-cell ea-tie__c">
            <i className="ea-sq ea-tie__sq" aria-hidden="true" />
            <p className="ea-tie__t" data-rv="">{SOURCES.tie}</p>
          </div>
        </div>
      </section>

      {/* ───────────── 5 · the centre: one asset, three jobs, on the dark band */}
      <section className="l-sec ea-dark" id={CENTER.id} aria-labelledby="ea-ct-t">
        <div className="l-row ea-head" data-row="">
          <div className="l-cell ea-head__h">
            <p className="ea-k" data-rv=""><i className="ea-sq" aria-hidden="true" />One asset</p>
            <h2 id="ea-ct-t" className="l-h2 l-h2--m" data-split=""><Acc h={CENTER.h} a="together" /></h2>
          </div>
          <div className="l-cell ea-head__end"><p className="l-lede" data-rv="">{CENTER.intro}</p></div>
        </div>
        <div className="l-row ea-asset" data-row="">
          <div className="l-cell ea-asset__n"><p className="ea-asset__w" data-rv="" aria-hidden="true">NEAR</p></div>
          <div className="l-cell ea-asset__l"><p className="ea-asset__lead" data-rv="">{CENTER.lead}</p></div>
        </div>
        <ul className="l-row ea-jobs" data-row="">
          {CENTER.jobs.map((j, i) => (
            <li key={j.k} className="l-cell ea-job" style={{ ["--j" as string]: i }}>
              <p className="ea-job__k">{idx(i)} <span aria-hidden="true">/</span> {j.k}</p>
              <h3 className="ea-job__t">{j.title}</h3>
              <p className="ea-job__b">{j.body}</p>
              <p className="ea-job__m"><i aria-hidden="true" />{j.more}</p>
            </li>
          ))}
        </ul>
        <div className="l-row ea-ctr" data-row="">
          <div className="l-cell ea-ctr__b"><p data-rv="">{CENTER.body}</p></div>
          <div className="l-cell ea-ctr__f"><p className="ea-ctr__fw" data-rv="">{CENTER.forward}</p></div>
        </div>
        <div className="l-row l-spacer ea-dark__end" data-row="" aria-hidden="true"><div className="l-cell" /></div>
      </section>
    </div>
  );
}
