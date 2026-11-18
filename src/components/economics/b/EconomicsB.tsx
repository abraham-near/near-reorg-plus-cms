"use client";
// near.org/economics, version B: "Drawn". NEAR Foundation's hand (paper, ink hairlines, white tops, light grey sides, one green; v3's ruled grid), the
// same as Community B and Analytics D, drawing the economy as a machine you could build. From the top (the doc's order):
//   1 hero: the headline beside the flywheel, finished and running (Flywheel.tsx: coins run the track, drop into the vault, the press works);
//   2 "Built on a foundation that's already set" (#mature): the four facts in one ruled row, each on its small drawn plinth (Plinths.tsx);
//   3 "The loop at the center of it all" (#how-it-works): the flywheel again, empty, built station by station by the reading line as the four steps pass
//      beside it; the closing line closes the loop and the coins run (desktop: it sticks; phones: one drawing per step);
//   4 "Real products. Real revenue." (#revenue): the two engines feeding the loop (Engines.tsx), then the two products in a ruled row and the tie line;
//   5 "One asset, holding it all together" (#near): the token at the centre with its three jobs drawn round it (Roles.tsx) | the jobs as a list;
//   6 the close: the homepage's scene (shared/CloseScene), set after this component in the route (app/(site)/economics-b/page.tsx).
// Copy and links: ../content.ts, verbatim. The section labels (Foundation, The loop, Revenue, The asset) and the accent words are this version's.
import { useRef, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { HERO, MATURE, LOOP, SOURCES, CENTER } from "../content";
import { Flywheel } from "./Flywheel";
import { PLINTHS } from "./Plinths";
import { Engines } from "./Engines";
import { Roles } from "./Roles";
import { Arrow, Count, Ext } from "./parts";
import { mountAll } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./economics-b.css";

const idx = (i: number) => String(i + 1).padStart(2, "0");
const ext = (h: string) => /^https?:/.test(h);
/** a heading with one word set in Kepler (<span className="accent">) */
function Acc({ text, accent }: { text: string; accent: string }): ReactNode {
  const i = text.lastIndexOf(accent);
  if (i < 0) return text;
  return <>{text.slice(0, i)}<span className="accent">{accent}</span>{text.slice(i + accent.length)}</>;
}
function Btn({ href, label, fill }: { href: string; label: string; fill?: boolean }) {
  return <a className={`eb-btn${fill ? " eb-btn--fill" : ""}`} href={href} {...(ext(href) ? { target: "_blank", rel: "noopener" } : {})}><span>{label}</span>{ext(href) && <Ext className="eb-ext eb-btn__ext" />}</a>;
}
function Head({ n, label, id, h, accent, lede }: { n: number; label: string; id: string; h: string; accent: string; lede?: string }) {
  return (
    <div className={`l-row eb-head${lede ? "" : " eb-head--solo"}`} data-row="">
      <div className="l-cell eb-head__h">
        <p className="eb-eb" data-rv=""><span className="eb-n">{idx(n)}</span>{label}</p>
        <h2 id={id} className="eb-h2" data-rise=""><Acc text={h} accent={accent} /></h2>
      </div>
      {lede && <div className="l-cell eb-head__end"><p className="l-lede" data-rv="">{lede}</p></div>}
    </div>
  );
}

export function EconomicsB() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mountAll);
  const steps = LOOP.steps.length;
  return (
    <div ref={ref} className="l-page ec-b">
      {/* ───────────── 1 · hero: the flywheel, running */}
      <section className="eb-hero" aria-labelledby="eb-h1">
        <div className="eb-hero__stage">
          <div className="eb-hero__art" aria-hidden="true"><div className="eb-hero__cam"><Flywheel hero cls="fw--hero" /></div></div>
          <div className="eb-hero__copy">
            <p className="eb-kick" data-hero-up=""><i aria-hidden="true" />{HERO.eyebrow}</p>
            <h1 id="eb-h1" className="eb-h1"><Acc text={HERO.h1} accent={HERO.accent} /></h1>
            <p className="eb-hero__sub" data-hero-up="">{HERO.sub}</p>
            <p className="eb-hero__btns" data-hero-up="">
              <Btn href={HERO.primary.href} label={HERO.primary.label} fill />
              <Btn href={HERO.secondary.href} label={HERO.secondary.label} />
            </p>
          </div>
        </div>
      </section>

      {/* ───────────── 2 · the four facts, each on its plinth */}
      <section className="l-sec eb-mt" id={MATURE.id} aria-labelledby="eb-mt-t">
        <Head n={0} label="Foundation" id="eb-mt-t" h={MATURE.h} accent="set" lede={MATURE.intro} />
        <ul className="l-row eb-mt__row" data-row="">
          {MATURE.facts.map((x, i) => {
            const G = PLINTHS[x.k];
            return (
              <li key={x.k} className="l-cell eb-fact">
                <div className="eb-fact__art"><G /></div>
                <p className="eb-fact__v"><Count v={x.figure} delay={i * 90} /></p>
                <p className="eb-fact__l">
                  {"href" in x ? <a className="eb-fact__a" href={x.href} target="_blank" rel="noopener">{x.figureLabel}<Ext /></a> : x.figureLabel}
                </p>
                <h3 className="eb-h3" data-rv="">{x.title}</h3>
                <p className="eb-body" data-rv="">{x.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ───────────── 3 · the loop: the flywheel built step by step */}
      <section className="l-sec eb-lp" id={LOOP.id} aria-labelledby="eb-lp-t">
        <Head n={1} label="The loop" id="eb-lp-t" h={LOOP.h} accent="loop" lede={LOOP.intro} />
        <div className="eb-lp__story">
          <div className="eb-lp__fig">
            <div className="eb-lp__sticky">
              <Flywheel stage={4} cls="fw--main" />
              <p className="eb-lp__count" aria-hidden="true"><span className="eb-lp__ci">{LOOP.steps.map((_, i) => <span key={i}>{idx(i)}</span>)}<span>{idx(steps - 1)}</span></span><span>/ {idx(steps - 1)}</span></p>
            </div>
          </div>
          <div className="eb-lp__list">
            <span className="eb-lp__axis" aria-hidden="true"><span className="eb-lp__fill" /></span>
            <ol className="eb-lp__steps">
              {LOOP.steps.map((s, i) => (
                <li key={s.n} className="eb-lp__step" data-step={i}>
                  <div className="eb-lp__mfig"><Flywheel stage={i} draw /></div>
                  <p className="eb-lp__num"><span className="eb-lp__tick" aria-hidden="true"><i /></span><span className="eb-n">{idx(i)}</span><span className="eb-lp__short">{s.short}</span></p>
                  <h3 className="eb-h3">{s.title}</h3>
                  <p className="eb-body">{s.body}</p>
                </li>
              ))}
              <li className="eb-lp__step eb-lp__step--close" data-step={steps}>
                <div className="eb-lp__mfig"><Flywheel stage={4} draw /></div>
                <p className="eb-lp__num"><span className="eb-lp__tick" aria-hidden="true"><i /></span><span className="eb-lp__loop" aria-hidden="true"><Arrow /></span><span className="eb-lp__short">The flywheel</span></p>
                <p className="eb-lp__close">{LOOP.close}</p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* ───────────── 4 · the two engines feeding the loop */}
      <section className="l-sec eb-src" id={SOURCES.id} aria-labelledby="eb-src-t">
        <Head n={2} label="Revenue" id="eb-src-t" h={SOURCES.h} accent="revenue." />
        <div className="l-row eb-src__art" data-row=""><div className="l-cell"><figure className="eb-fig"><Engines /></figure></div></div>
        <ul className="l-row eb-src__row" data-row="">
          {SOURCES.items.map((s) => (
            <li key={s.k} className="l-cell eb-eng">
              <p className="eb-eng__k" data-rv=""><span className="eb-n">{s.n.padStart(2, "0")}</span>{s.name}</p>
              <h3 className="eb-h3" data-rv="">{s.title}</h3>
              <p className="eb-body" data-rv="">{s.body}</p>
              <p className="eb-eng__cta" data-rv=""><a className="l-link" href={s.link.href} target="_blank" rel="noopener"><span>{s.link.label}</span><Ext /></a></p>
            </li>
          ))}
        </ul>
        <div className="l-row eb-src__tie" data-row=""><div className="l-cell"><p className="eb-tie" data-rv="">{SOURCES.tie}</p></div></div>
      </section>

      {/* ───────────── 5 · one asset at the centre, three jobs round it */}
      <section className="l-sec eb-ct" id={CENTER.id} aria-labelledby="eb-ct-t">
        <Head n={3} label="The asset" id="eb-ct-t" h={CENTER.h} accent="together" lede={CENTER.intro} />
        <div className="l-row eb-ct__row" data-row="">
          <div className="l-cell eb-ct__art"><figure className="eb-fig eb-ct__fig"><Roles /></figure></div>
          <div className="l-cell eb-ct__list">
            <p className="eb-ct__lead" data-rv="">{CENTER.lead}</p>
            <ol className="eb-jobs">
              {CENTER.jobs.map((j, i) => (
                <li key={j.k} className="eb-job" data-job={i} tabIndex={0} data-rv="">
                  <span className="eb-n">{idx(i)}</span>
                  <h3 className="eb-job__t">{j.title}</h3>
                  <p className="eb-job__b">{j.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="l-row eb-ct__end" data-row="">
          <div className="l-cell"><p className="eb-body eb-ct__body" data-rv="">{CENTER.body}</p></div>
          <div className="l-cell"><p className="eb-ct__fwd" data-rv=""><i aria-hidden="true" />{CENTER.forward}</p></div>
        </div>
      </section>
    </div>
  );
}
