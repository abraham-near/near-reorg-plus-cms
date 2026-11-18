"use client";
// near.org/research, version B: "Drawn". NEAR Foundation's hand (paper, ink hairlines, white tops, light grey sides, one green; v3's ruled grid), the
// same as Economics B and Community B, drawing each paper as an object you could build. Laid out like the blog's index (v3/blog), as the doc asks:
//   1 hero: the headline and the four papers indexed beside a drawn stack of them (Stack.tsx), the first on top, a loose sheet lifted off it;
//   2 the papers: a ruled grid of cards, two to a row, each under its drawn cover (Covers.tsx), which builds as it arrives; a topic filter over them;
//   3 "Keep reading": three quiet ruled link cards, each with a small drawing (Glyphs.tsx);
//   4 the close: the homepage's scene (shared/CloseScene), set after this component in the route (app/(site)/research-b/page.tsx).
// Copy and links: ../content.ts, verbatim. This version's own labels: the section heading (the doc's "Technical papers"), "All", "Topic", "Year",
// "Source", and the screen-reader notes ("opens in a new tab", "not given", the filter's count).
import { useRef, useState, type ReactNode } from "react";
import { requestRefresh, useScrollMotion } from "@/lib/motion/scroll";
import { HERO, TOPICS, PAPERS, MORE, type Topic } from "../content";
import { PaperStack } from "./Stack";
import { COVERS } from "./Covers";
import { GLYPHS } from "./Glyphs";
import { Arrow, Ext } from "./parts";
import { mountAll } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./research-b.css";

const pad = (n: number) => String(n).padStart(2, "0");
const ext = (h: string) => /^https?:/.test(h);
const TOPIC: Record<Topic, string> = Object.fromEntries(TOPICS.map((t) => [t.k, t.label])) as Record<Topic, string>;
type Filter = Topic | "all";
const FILTERS: { k: Filter; label: string; n: number }[] = [
  { k: "all", label: "All", n: PAPERS.length },
  ...TOPICS.map((t) => ({ k: t.k, label: t.label, n: PAPERS.filter((p) => p.topic === t.k).length })),
];

/** a heading with one word set in Kepler (<span className="accent">) */
function Acc({ text, accent }: { text: string; accent: string }): ReactNode {
  const i = text.lastIndexOf(accent);
  if (i < 0) return text;
  return <>{text.slice(0, i)}<span className="accent">{accent}</span>{text.slice(i + accent.length)}</>;
}

export function ResearchB() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mountAll);
  const [on, setOn] = useState<Filter>("all");
  const pick = (k: Filter) => { setOn(k); requestRefresh(); };   // the rows below change height: every trigger re-measures
  const shown = PAPERS.filter((p) => on === "all" || p.topic === on);
  return (
    <div ref={ref} className="l-page rs-b">
      {/* ───────────── 1 · hero: the papers, stacked */}
      <section className="rb-hero" aria-labelledby="rb-h1">
        <div className="rb-hero__stage">
          <div className="rb-hero__copy">
            <p className="rb-kick" data-hero-up=""><i aria-hidden="true" />{HERO.eyebrow}</p>
            <h1 id="rb-h1" className="rb-h1"><Acc text={HERO.h1} accent={HERO.accent} /></h1>
            <p className="rb-hero__sub" data-hero-up="">{HERO.sub}</p>
            <ol className="rb-index" data-hero-up="">
              {PAPERS.map((p) => (
                <li key={p.k}><a href={`#paper-${p.k}`} onClick={() => pick("all")}><span className="rb-n">{p.n}</span><span>{p.short}</span><Arrow /></a></li>
              ))}
            </ol>
          </div>
          <div className="rb-hero__art" aria-hidden="true"><div className="rb-hero__cam"><PaperStack /></div></div>
        </div>
      </section>

      {/* ───────────── 2 · the papers */}
      <section className="l-sec rb-pp" id="papers" aria-labelledby="rb-pp-t">
        <div className="l-row rb-head" data-row="">
          <div className="l-cell">
            <p className="rb-eb" data-rv=""><span className="rb-n">{pad(PAPERS.length)}</span>Papers</p>
            <h2 id="rb-pp-t" className="rb-h2" data-rise="">Technical <span className="accent">papers</span></h2>
          </div>
          <div className="l-cell rb-head__end">
            <div className="rb-filter" role="group" aria-label="Filter the papers by topic" data-rv="">
              {FILTERS.map((x) => (
                <button key={x.k} type="button" className="rb-chip" aria-pressed={on === x.k} onClick={() => pick(x.k)}>
                  <span>{x.label}</span><span className="rb-chip__n" aria-hidden="true">{pad(x.n)}</span>
                </button>
              ))}
            </div>
            <p className="sr-only" aria-live="polite">{shown.length} of {PAPERS.length} papers shown</p>
          </div>
        </div>
        <ul className="l-row rb-grid" data-row="">
          {PAPERS.map((p) => {
            const vi = shown.indexOf(p), Cover = COVERS[p.k];
            const pos = vi < 0 ? "" : `${vi % 2 ? "" : " is-c0"}${vi >= 2 ? " is-r2" : ""}${vi >= 1 ? " is-n" : ""}`;
            return (
              <li key={p.k} id={`paper-${p.k}`} className={`l-cell rb-card${pos}`} hidden={vi < 0}>
                <div className="rb-cover">{Cover && <Cover />}</div>
                <p className="rb-card__k">
                  <span className="rb-n">{p.n}</span><span className="rb-card__short">{p.short}</span>
                  {p.note && <span className="rb-card__note">{p.note}</span>}
                </p>
                <h3 className="rb-h3" data-rise="">{p.title}</h3>
                <p className="rb-body">{p.body}</p>
                <dl className="rb-spec">
                  <div><dt>Topic</dt><dd>{TOPIC[p.topic]}</dd></div>
                  <div><dt>Year</dt><dd>{p.year ?? <><span aria-hidden="true">—</span><span className="sr-only">not given</span></>}</dd></div>
                  <div><dt>Source</dt><dd>{p.source}</dd></div>
                </dl>
                <p className="rb-card__cta">
                  <a className="rb-read" href={p.href} target="_blank" rel="noopener">
                    <span>Read the paper</span><Ext /><span className="sr-only">: {p.title} (opens in a new tab)</span>
                  </a>
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ───────────── 3 · keep reading */}
      <section className="l-sec rb-more" aria-labelledby="rb-more-t">
        <div className="l-row rb-head rb-head--solo" data-row="">
          <div className="l-cell">
            <p className="rb-eb" data-rv=""><span className="rb-n">{pad(MORE.links.length)}</span>Links</p>
            <h2 id="rb-more-t" className="rb-h2" data-rise=""><Acc text={MORE.h} accent="reading" /></h2>
          </div>
        </div>
        <ul className="l-row rb-more__row" data-row="">
          {MORE.links.map((l) => {
            const G = GLYPHS[l.label];
            return (
              <li key={l.label} className="l-cell rb-link">
                <a href={l.href} {...(ext(l.href) ? { target: "_blank", rel: "noopener" } : {})}>
                  <span className="rb-link__art">{G && <G />}</span>
                  <span className="rb-link__t">{l.label}{ext(l.href) ? <Ext /> : <Arrow />}</span>
                  <span className="rb-link__d">{l.desc}</span>
                  {ext(l.href) && <span className="sr-only"> (opens in a new tab)</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
