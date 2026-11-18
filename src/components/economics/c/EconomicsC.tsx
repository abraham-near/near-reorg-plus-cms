"use client";
// near.org/economics, version C · Editorial. The homepage v9's hand (its type-only hero, the Stack's and the Council's dark) read as one calm feature
// about how the economy works. From the top (the doc's order):
//   1 the hero: type only, the H1 set big in Montreal Book with its Kepler word and the green square at its end, the subhead and the two actions;
//   2 the foundation: the heading, its intro, then the four structural facts as large figures in one ruled row (each counted once), titles and text under;
//   3 the loop: the dark band. Its heading and intro, then a held stage (CSS sticky): a thin ring with four nodes and a dot that travels it as the four
//     steps advance one at a time beside it; the stage lets go and the close line follows, set large and wiped from faint to paper as it is read.
//     Reduced motion (or a short screen): no hold, the ring stands still and the four steps are listed;
//   4 the revenue: two big editorial blocks (the product's name set huge | its title in Kepler, the text and the link), then the line that ties them;
//   5 NEAR at the center: the heading and intro, the lead in Kepler, the three jobs as large rows, the paragraph, then the forward line set large;
//   6 the close: the homepage's scene (shared/CloseScene), set after this component in the route (app/(site)/economics-c/page.tsx).
// Copy and links: ../content.ts (the doc, verbatim). The jobs' "more" lines are not set: CENTER.body says each of them word for word right under the jobs.
// The section labels (EYEBROWS) are this page's own.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { CENTER, HERO, LOOP, MATURE, SOURCES } from "../content";
import { Acc, Arrow, Count, Ext, NewTab, Ring, WipeWords } from "./parts";
import { mount } from "./motion";
import "./economics-c.css";

/** this page's own small labels over each section (not in the doc) */
const EYEBROWS = { mature: "01 · Foundation", loop: "02 · The loop", sources: "03 · Revenue", center: "04 · The asset" } as const;

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const isExt = (href: string) => /^https?:/.test(href);
const idx = (i: number) => String(i + 1).padStart(2, "0");

function Go({ href, label, className }: { href: string; label: string; className: string }) {
  return isExt(href)
    ? <a className={className} href={href} {...ext}><span>{label}</span><Ext /><NewTab /></a>
    : <a className={className} href={href}><span>{label}</span><Arrow /></a>;
}

export function EconomicsC() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);

  return (
    <div ref={ref} className="ec-c">
      {/* ───────────── 1 · hero: type only */}
      <header className="ec-c-hero" aria-labelledby="ec-c-h1">
        <p className="ec-c-eye" data-rv=""><i aria-hidden="true" />{HERO.eyebrow}</p>
        <h1 id="ec-c-h1" className="ec-c-h1" data-rise="now"><Acc t={HERO.h1} a={HERO.accent} sq /></h1>
        <div className="ec-c-hero__foot">
          <p className="ec-c-hero__sub" data-rv="" style={{ ["--rv" as string]: 2 }}>{HERO.sub}</p>
          <p className="ec-c-actions" data-rv="" style={{ ["--rv" as string]: 3 }}>
            <Go className="ec-c-btn ec-c-btn--ink" href={HERO.primary.href} label={HERO.primary.label} />
            <Go className="ec-c-link" href={HERO.secondary.href} label={HERO.secondary.label} />
          </p>
        </div>
      </header>

      {/* ───────────── 2 · the foundation: four facts as large figures in one row */}
      <section className="ec-c-sec ec-c-mature" id={MATURE.id} aria-labelledby="ec-c-mature-t">
        <div className="ec-c-split">
          <div>
            <p className="ec-c-eye" data-rv=""><i aria-hidden="true" />{EYEBROWS.mature}</p>
            <h2 id="ec-c-mature-t" className="ec-c-h2" data-rise=""><Acc t={MATURE.h} a="foundation" /></h2>
          </div>
          <p className="ec-c-lede" data-rv="">{MATURE.intro}</p>
        </div>
        <ul className="ec-c-facts">
          {MATURE.facts.map((f, i) => (
            <li key={f.k} className="ec-c-fact" data-rv="" style={{ ["--rv" as string]: i }}>
              <p className={`ec-c-fact__v${/\d/.test(f.figure) ? "" : " ec-c-fact__v--word"}`}>{/\d/.test(f.figure) ? <Count v={f.figure} /> : f.figure}</p>
              <p className="ec-c-fact__l">
                {"href" in f && f.href
                  ? <a className="ec-c-fact__a" href={f.href} {...ext}><span>{f.figureLabel}</span><Ext /><NewTab /></a>
                  : f.figureLabel}
              </p>
              <h3 className="ec-c-fact__t"><span className="ec-c-fact__n" aria-hidden="true">{f.n}</span>{f.title}</h3>
              <p className="ec-c-fact__b">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── 3 · the loop: the dark band, a held stage where the steps advance and the dot travels the ring */}
      <section className="ec-c-loop" id={LOOP.id} aria-labelledby="ec-c-loop-t" data-nav-tone="dark">
        <div className="ec-c-loop__head">
          <div>
            <p className="ec-c-eye ec-c-eye--on" data-rv=""><i aria-hidden="true" />{EYEBROWS.loop}</p>
            <h2 id="ec-c-loop-t" className="ec-c-loop__h" data-rise=""><Acc t={LOOP.h} a="loop" /></h2>
          </div>
          <p className="ec-c-lede ec-c-lede--on" data-rv="">{LOOP.intro}</p>
        </div>
        <div className="ec-c-track" data-track="">
          <div className="ec-c-stage">
            <div className="ec-c-stage__ring"><Ring steps={LOOP.steps} /></div>
            <ol className="ec-c-steps">
              {LOOP.steps.map((s, k) => (
                <li key={s.n} className="ec-c-step" data-step={k}>
                  <p className="ec-c-step__n" aria-hidden="true"><span>{s.n.padStart(2, "0")}</span><i /><span>{String(LOOP.steps.length).padStart(2, "0")}</span></p>
                  <h3 className="ec-c-step__t">{s.title}</h3>
                  <p className="ec-c-step__b">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="ec-c-loop__close">
          <p className="ec-c-statement ec-c-statement--on" data-wipe=""><WipeWords text={LOOP.close} /></p>
        </div>
      </section>

      {/* ───────────── 4 · the revenue: two big editorial blocks, then the line that ties them */}
      <section className="ec-c-sec ec-c-src" id={SOURCES.id} aria-labelledby="ec-c-src-t">
        <p className="ec-c-eye" data-rv=""><i aria-hidden="true" />{EYEBROWS.sources}</p>
        <h2 id="ec-c-src-t" className="ec-c-h2 ec-c-src__h" data-rise=""><Acc t={SOURCES.h} a="revenue" /></h2>
        <div className="ec-c-src__list">
          {SOURCES.items.map((s) => (
            <article key={s.k} className="ec-c-block" aria-labelledby={`ec-c-src-${s.k}`}>
              <div className="ec-c-block__name" data-rv="">
                <span className="ec-c-block__n" aria-hidden="true">{s.n.padStart(2, "0")}</span>
                <h3 id={`ec-c-src-${s.k}`} className="ec-c-block__h"><Acc t={s.name} a={s.name.replace(/^NEAR /, "")} /></h3>
              </div>
              <div className="ec-c-block__txt" data-rv="" style={{ ["--rv" as string]: 1 }}>
                <p className="ec-c-dek">{s.title}</p>
                <p className="ec-c-block__b">{s.body}</p>
                <p><Go className="ec-c-link" href={s.link.href} label={s.link.label} /></p>
              </div>
            </article>
          ))}
        </div>
        <p className="ec-c-tie" data-rv="">{SOURCES.tie}</p>
      </section>

      {/* ───────────── 5 · NEAR at the center: three jobs set large, the paragraph, the forward line */}
      <section className="ec-c-sec ec-c-center" id={CENTER.id} aria-labelledby="ec-c-center-t">
        <div className="ec-c-split">
          <div>
            <p className="ec-c-eye" data-rv=""><i aria-hidden="true" />{EYEBROWS.center}</p>
            <h2 id="ec-c-center-t" className="ec-c-h2" data-rise=""><Acc t={CENTER.h} a="together" /></h2>
          </div>
          <p className="ec-c-lede" data-rv="">{CENTER.intro}</p>
        </div>
        <p className="ec-c-dek ec-c-center__lead" data-rv="">{CENTER.lead}</p>
        <ol className="ec-c-jobs">
          {CENTER.jobs.map((j, i) => (
            <li key={j.k} className="ec-c-job" data-rv="">
              <span className="ec-c-job__n" aria-hidden="true">{idx(i)}</span>
              <h3 className="ec-c-job__t">{j.title}</h3>
              <p className="ec-c-job__b">{j.body}</p>
            </li>
          ))}
        </ol>
        <p className="ec-c-center__body" data-rv="">{CENTER.body}</p>
        <p className="ec-c-statement ec-c-center__fw" data-wipe=""><WipeWords text={CENTER.forward} /></p>
      </section>
    </div>
  );
}
