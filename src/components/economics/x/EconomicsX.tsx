"use client";
// near.org/economics, version X · "MVP": A (Ruled grid) made calm, after the Nov 19 2026 review. Mostly copy; two isometric drawings (the hero's plinth, the
// loop), both placeholders; the dot icons only where they name something (the two products, the three jobs). No eyebrows, no step or index numbers, no rules
// near the header: the hero sits on bare paper, the homepage's ruled grid (proof-deeper.css, at its own weight) starts with the second section. From the top:
//   1 hero: the H1, the subhead, the two actions | the plinth (HeroIso.tsx: NEAR's economy, fees running into the network's stack), off the grid;
//   2 mature, on the grid: the head row (the heading | the lede), then the four structural facts in one ruled row (figure, what it measures, the fact);
//   3 the loop, on the grid: the head row; the loop (LoopIso.tsx: four stations on a slab, the path round them) sticking beside the four steps; the
//     flywheel line in the row under them;
//   4 sources, on the dark band, off the grid (data-nav-tone="dark"): the head; the two products side by side, a hairline over each (their dot icon and
//     name, the claim, the body, the link); the line that ties them to the loop;
//   5 the centre, on the grid: the head row (the heading | the intro), the lead, the three jobs in one ruled row (dot icon each), the body | the
//     forward line closing the grid;
//   6 the close: the homepage's scene (shared/CloseScene), after this component in the route (app/(site)/economics-x/page.tsx), off the grid.
// Copy and links: ../content.ts (the doc, verbatim). Motion: ./motion.ts.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { CENTER, HERO, LOOP, MATURE, SOURCES } from "../content";
import { mount } from "./motion";
import { HeroIso } from "./HeroIso";
import { LoopIso } from "./LoopIso";
import "../../v3/proof-deeper/proof-deeper.css";
import "./economics-x.css";

/** a heading from the content file with its Kepler word marked (the last occurrence of `a`) */
const Acc = ({ h, a }: { h: string; a: string }) => {
  const i = h.lastIndexOf(a);
  return i < 0 ? <>{h}</> : <>{h.slice(0, i)}<span className="accent">{a}</span>{h.slice(i + a.length)}</>;
};
const isExt = (h: string) => /^https?:/.test(h);
const host = (u: string) => (isExt(u) ? new URL(u).hostname.replace(/^www\./, "") : "near.org");
const ext = (h: string) => (isExt(h) ? { target: "_blank", rel: "noopener noreferrer" } : {});

const Arrow = ({ down }: { down?: boolean }) => (
  <svg className={`l-arr${down ? " ex-down" : ""}`} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
const Ext = () => (
  <svg className="l-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>
);
const ExtSr = ({ h }: { h: string }) => (isExt(h) ? <span className="sr-only"> (opens another site)</span> : null);

/** the site's dot icons (v3/header/icons.ts, mounted by the grid's motion): the products by their own icons, the jobs by theirs */
const SOURCE_ICON: Record<string, string> = { intents: "near-intents", ai: "near-ai" };
const JOB_ICON: Record<string, string> = { settlement: "chain-abstraction", unit: "economics", coordination: "governance" };

export function EconomicsX() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);

  return (
    <div ref={ref} className="l-page ec-x">
      {/* ───────────── 1 · hero: the type | the plinth, off the grid (bare paper) */}
      <section className="l-sec ex-hero" aria-labelledby="ex-h1">
        <div className="l-row ex-plain ex-hero__row" data-row="">
          <div className="l-cell ex-hero__c">
            <h1 id="ex-h1" className="ex-h1" data-h1=""><Acc h={HERO.h1} a={HERO.accent} /></h1>
            <p className="ex-sub" data-in="">{HERO.sub}</p>
            <p className="ex-acts" data-in="">
              <a className="l-btn ex-btn" href={HERO.primary.href} {...ext(HERO.primary.href)}><span>{HERO.primary.label}</span><Ext /><ExtSr h={HERO.primary.href} /></a>
              <a className="l-link" href={HERO.secondary.href}><span>{HERO.secondary.label}</span><Arrow down /></a>
            </p>
          </div>
          {/* [[TBD: graphic by Ali]] the hero's drawing: NEAR's economy on a plinth (a placeholder in the site's isometric hand) */}
          <div className="l-cell ex-hero__art"><HeroIso /></div>
        </div>
      </section>

      {/* ───────────── 2 · mature: the head row, the four facts in one ruled row */}
      <section className="l-sec ex-sec ex-mature" id={MATURE.id} aria-labelledby="ex-mt-t">
        <div className="l-row ex-head" data-row="">
          <div className="l-cell"><h2 id="ex-mt-t" className="l-h2 l-h2--m" data-split=""><Acc h={MATURE.h} a="foundation" /></h2></div>
          <div className="l-cell ex-head__end"><p className="l-lede" data-rv="">{MATURE.intro}</p></div>
        </div>
        <ul className="l-row ex-ruled ex-facts" data-row="">
          {MATURE.facts.map((f, i) => (
            <li key={f.k} className="l-cell ex-fact" style={{ ["--i" as string]: i }}>
              <p className="ex-fact__v">{f.figure}</p>
              <p className="ex-fact__l">{f.figureLabel}</p>
              <h3 className="ex-fact__t">{f.title}</h3>
              <p className="ex-fact__b">{f.body}</p>
              {"href" in f && f.href && (
                <p className="ex-fact__a"><a className="l-link" href={f.href} {...ext(f.href)}><span>{host(f.href)}</span><Ext /><ExtSr h={f.href} /></a></p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── 3 · the loop: the head row, the drawing | the steps, the flywheel line */}
      <section className="l-sec ex-sec ex-loop" id={LOOP.id} aria-labelledby="ex-lp-t">
        <div className="l-row ex-head" data-row="">
          <div className="l-cell"><h2 id="ex-lp-t" className="l-h2 l-h2--m" data-split=""><Acc h={LOOP.h} a="loop" /></h2></div>
          <div className="l-cell ex-head__end"><p className="l-lede" data-rv="">{LOOP.intro}</p></div>
        </div>
        <div className="l-row ex-loop__row" data-row="" data-loop="" data-step="1">
          {/* [[TBD: graphic by Ali]] the loop: four stations on a slab, the path round them (a placeholder in the site's isometric hand) */}
          <div className="l-cell ex-lp__c"><LoopIso /></div>
          <ol className="l-cell ex-steps">
            {LOOP.steps.map((s, i) => (
              <li key={s.n} className="ex-st" data-step-i={i}>
                <h3 className="ex-st__t">{s.title}</h3>
                <p className="ex-st__b">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="l-row ex-loop__end" data-row="">
          <div className="l-cell" aria-hidden="true" />
          <div className="l-cell"><p className="ex-statement" data-rv="">{LOOP.close}</p></div>
        </div>
        {/* a spacer row on the grid between the flywheel line and the dark band: the grid runs down to the band, with room before it */}
        <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>
      </section>

      {/* ───────────── 4 · sources, on the dark band (off the grid): the head, the two products side by side, the tie */}
      <section className="l-sec ex-sec ex-dark ex-src" id={SOURCES.id} aria-labelledby="ex-sr-t" data-nav-tone="dark">
        <div className="l-row ex-plain ex-head ex-head--one" data-row="">
          <div className="l-cell"><h2 id="ex-sr-t" className="l-h2" data-split=""><Acc h={SOURCES.h} a="revenue" /></h2></div>
        </div>
        <ul className="l-row ex-plain ex-src__row" data-row="">
          {SOURCES.items.map((s, i) => (
            <li key={s.k} className="l-cell ex-so" style={{ ["--j" as string]: i }}>
              <p className="ex-so__k"><i className="ex-ic" data-icon={SOURCE_ICON[s.k]} aria-hidden="true" />{s.name}</p>
              <h3 className="ex-so__t">{s.title}</h3>
              <p className="ex-so__b">{s.body}</p>
              <p className="ex-so__a"><a className="l-link" href={s.link.href} {...ext(s.link.href)}><span>{s.link.label}</span><Ext /><ExtSr h={s.link.href} /></a></p>
            </li>
          ))}
        </ul>
        <div className="l-row ex-plain ex-tie" data-row="">
          <div className="l-cell"><p className="ex-tie__t" data-rv="">{SOURCES.tie}</p></div>
        </div>
      </section>

      {/* ───────────── 5 · the centre, on the grid: the head row, the lead, the three jobs in one ruled row, the body | the forward line */}
      <section className="l-sec ex-sec ex-center" id={CENTER.id} aria-labelledby="ex-ct-t">
        {/* a spacer row under the band (no rule on the band's edge): the grid picks up straight after it, with room before the head */}
        <div className="l-row l-spacer" data-row="" data-after-bleed="" aria-hidden="true"><div className="l-cell" /></div>
        <div className="l-row ex-head" data-row="">
          <div className="l-cell"><h2 id="ex-ct-t" className="l-h2 l-h2--m" data-split=""><Acc h={CENTER.h} a="together" /></h2></div>
          <div className="l-cell ex-head__end"><p className="l-lede" data-rv="">{CENTER.intro}</p></div>
        </div>
        <div className="l-row ex-lead" data-row="">
          <div className="l-cell"><p className="ex-lead__t" data-rv="">{CENTER.lead}</p></div>
        </div>
        <ul className="l-row ex-jobs" data-row="">
          {CENTER.jobs.map((j, i) => (
            <li key={j.k} className="l-cell ex-job" style={{ ["--j" as string]: i }}>
              <i className="ex-ic ex-job__ic" data-icon={JOB_ICON[j.k]} aria-hidden="true" />
              <h3 className="ex-job__t">{j.title}</h3>
              <p className="ex-job__b">{j.body}</p>
              <p className="ex-job__m">{j.more}</p>
            </li>
          ))}
        </ul>
        <div className="l-row ex-ruled ex-ctr" data-row="">
          <div className="l-cell ex-ctr__b"><p data-rv="">{CENTER.body}</p></div>
          <div className="l-cell ex-ctr__f"><p className="ex-ctr__fw" data-rv="">{CENTER.forward}</p></div>
        </div>
      </section>
    </div>
  );
}
