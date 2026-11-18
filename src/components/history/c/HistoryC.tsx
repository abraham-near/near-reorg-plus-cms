"use client";
// near.org/history, version C · Editorial. The homepage v9's big type, a black-and-white photo that bleeds and one dark band, read as a calm magazine feature
// about ten years:
//   1 the hero: the H1 set big in Montreal Book with its Kepler word, the subhead and the two actions; under it the span of the story, "2017" and "2026"
//     set huge at either end of a ruled line with a tick for every year (the right-hand year rolls up from 2017 on load);
//   2 Origin, the opening essay: its heading, the whiteboard photo (bw) that opens from the grid's width to the whole screen, then the essay in two
//     columns, the year outlined beside it as a pull figure;
//   3 the milestones: a sticky column holds one huge year that rolls to each milestone's year as it passes the middle of the view, with its chapter and
//     a ruled track 2017–2026; the milestones scroll beside it as text (title, body, tags). Phones: no sticky column, each milestone carries its year;
//   4 Today: the dark band. The heading, the statement wiped from faint to paper as it is read, the four layers of the stack set large, the link;
//   5 Ahead: the heading and its body, then the three "You own…" lines in large type, one per rule, and the closing line in Kepler.
// The close is the homepage's scene (shared/CloseScene.tsx), set after this in the route (app/(site)/history).
// Copy and links: ../content.ts (verbatim). The small labels (Origin, The milestones, Today, Ahead, Chapter, Now) are this version's own.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { AHEAD, ERAS, HERO, MILESTONES, ORIGIN, TODAY } from "../content";
import { Acc, Arrow, Ext, NewTab, Roll, WipeWords } from "./parts";
import { mount } from "./motion";
import "./history-c.css";

const idx = (i: number) => String(i + 1).padStart(2, "0");
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const isExt = (href: string) => /^https?:/.test(href);
const linkProps = (href: string) => (isExt(href) ? ext : {});

const FIRST = Number(MILESTONES[0].year), LAST = Number(MILESTONES[MILESTONES.length - 1].year);
const YEARS = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i);
const MARKED = new Set(MILESTONES.map((m) => Number(m.year)));
const eraOf = (id: string) => ERAS.findIndex((e) => e.id === id);
/** a year's place on the 2017–2026 track, 0–1 */
const at = (y: number | string) => (Number(y) - FIRST) / (LAST - FIRST);
/** "You own your assets" → the lead and its last word (set in Kepler) */
const lastWord = (s: string) => { const i = s.lastIndexOf(" "); return [s.slice(0, i + 1), s.slice(i + 1)] as const; };

export function HistoryC() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  const first = MILESTONES[0];

  return (
    <div ref={ref} className="hs-c">
      {/* ───────────── 1 · hero: the big line, then the span of the story */}
      <header className="hs-c-hero" aria-labelledby="hs-c-h1">
        <p className="hs-c-eye" data-rv=""><i aria-hidden="true" />{HERO.eyebrow}</p>
        <h1 id="hs-c-h1" className="hs-c-h1" data-rise="now"><Acc t={HERO.h1} a={HERO.accent} /></h1>
        <div className="hs-c-hero__foot">
          <p className="hs-c-hero__sub" data-rv="" style={{ ["--rv" as string]: 2 }}>{HERO.sub}</p>
          <p className="hs-c-actions" data-rv="" style={{ ["--rv" as string]: 3 }}>
            <a className="hs-c-btn hs-c-btn--ink" href={HERO.primary.href} {...linkProps(HERO.primary.href)}>
              <span>{HERO.primary.label}</span>{isExt(HERO.primary.href) ? <><Ext /><NewTab /></> : <Arrow />}
            </a>
            <a className="hs-c-link" href={HERO.secondary.href} {...linkProps(HERO.secondary.href)}><span>{HERO.secondary.label}</span><Arrow /></a>
          </p>
        </div>
        <div className="hs-c-span" data-span="">
          <p className="sr-only">From {FIRST} to {LAST}</p>
          <span className="hs-c-span__y" aria-hidden="true">{FIRST}</span>
          <span className="hs-c-span__track" aria-hidden="true">
            <span className="hs-c-span__line" />
            {YEARS.map((y) => (
              <span key={y} className="hs-c-span__t" data-m={MARKED.has(y) ? "" : undefined} style={{ ["--x" as string]: at(y) }}>
                <span className="hs-c-span__tl">{String(y).slice(2)}</span>
              </span>
            ))}
          </span>
          <Roll year={String(LAST)} className="hs-c-span__y hs-c-span__y--to" />
        </div>
      </header>

      {/* ───────────── 2 · Origin: the opening essay, the whiteboard photo bleeds */}
      <section className="hs-c-origin" id="origin" aria-labelledby="hs-c-origin-t">
        <div className="hs-c-origin__head">
          <p className="hs-c-eye" data-rv=""><i aria-hidden="true" />Origin</p>
          <h2 id="hs-c-origin-t" className="hs-c-h2" data-rise=""><Acc t={ORIGIN.h} a="AI" /></h2>
        </div>
        <figure className="hs-c-bleed hs-c-origin__ph" data-open="">
          <div className="hs-c-plate" data-par="">
            {/* eslint-disable-next-line @next/next/no-img-element -- one 1600 × 1200 bw still (173 KB WebP), the homepage's Origin photo */}
            <img src="/images/home/bw/origin-transformer.webp" alt="A whiteboard in a lab with the Transformer's architecture drawn on it" width={1600} height={1200} loading="lazy" decoding="async" />
          </div>
        </figure>
        <div className="hs-c-origin__essay">
          <p className="hs-c-pull" data-rv="">
            <span className="hs-c-pull__v">{ORIGIN.stat.value}</span>
            <span className="hs-c-pull__l">{ORIGIN.stat.label}</span>
          </p>
          <div className="hs-c-origin__body">
            {ORIGIN.body.map((p, i) => (
              <p key={i} className={i === 0 ? "hs-c-drop" : undefined} data-rv="" style={{ ["--rv" as string]: i }}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── 3 · the milestones: the sticky year rolls as each one passes */}
      <section className="hs-c-ms" id="milestones" aria-labelledby="hs-c-ms-t">
        <div className="hs-c-ms__head">
          <p className="hs-c-eye" data-rv=""><i aria-hidden="true" />The milestones</p>
          <h2 id="hs-c-ms-t" className="hs-c-h2" data-rise=""><Acc t="From 2017 to now" a="now" /></h2>
        </div>
        <div className="hs-c-ms__grid">
          <div className="hs-c-ms__aside" aria-hidden="true">
            <div className="hs-c-ms__stick">
              <p className="hs-c-ms__ch">
                <span className="hs-c-ms__chn">Chapter <span data-ch="">{idx(eraOf(first.era))}</span></span>
                <span className="hs-c-ms__chl">
                  {ERAS.map((e, i) => <span key={e.id} data-era={e.id} data-on={i === eraOf(first.era) ? "" : undefined}>{e.label}</span>)}
                </span>
              </p>
              <Roll year={first.year} className="hs-c-ms__y" />
              <div className="hs-c-ms__track" style={{ ["--p" as string]: at(first.year) }}>
                <span className="hs-c-ms__fill" />
                {YEARS.map((y) => <span key={y} className="hs-c-ms__tk" data-m={MARKED.has(y) ? "" : undefined} style={{ ["--x" as string]: at(y) }} />)}
                <span className="hs-c-ms__dot" />
              </div>
              <p className="hs-c-ms__n"><span data-n="">{idx(0)}</span> / {String(MILESTONES.length).padStart(2, "0")}</p>
            </div>
          </div>
          <ol className="hs-c-ms__list">
            {MILESTONES.map((m, i) => (
              <li key={m.year + m.title} className={`hs-c-mi${i === 0 ? " is-on" : ""}`} data-year={m.year} data-era={m.era} data-i={i}>
                <p className="hs-c-mi__k">
                  <span className="hs-c-mi__y">{m.year}</span>
                  <span className="hs-c-mi__era">{ERAS[eraOf(m.era)]?.label}</span>
                  {m.now && <span className="hs-c-now"><i aria-hidden="true" />Now</span>}
                </p>
                <h3 className="hs-c-mi__t">{m.title}</h3>
                <p className="hs-c-mi__b">{m.body}</p>
                <ul className="hs-c-tags" aria-label="Keywords">
                  {m.tags.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── 4 · Today: the dark band, the statement wiped, the four layers */}
      <section className="hs-c-today" id="today" aria-labelledby="hs-c-today-t" data-nav-tone="dark">
        <div className="hs-c-today__in">
          <p className="hs-c-eye hs-c-eye--on" data-rv=""><i aria-hidden="true" />Today</p>
          <h2 id="hs-c-today-t" className="hs-c-today__h" data-rise=""><Acc t={TODAY.h} a="blockchain" /></h2>
          <p className="hs-c-today__body" data-wipe=""><WipeWords text={TODAY.body} /></p>
          <ol className="hs-c-layers" aria-label="The stack">
            {TODAY.layers.map((l, i) => (
              <li key={l} className="hs-c-layer" data-rv="" style={{ ["--rv" as string]: i, ["--l" as string]: i }}>
                <span className="hs-c-layer__n" aria-hidden="true">{idx(i)}</span>
                <span className="hs-c-layer__t">{l}</span>
              </li>
            ))}
          </ol>
          <p className="hs-c-today__foot" data-rv="">
            <a className="hs-c-btn hs-c-btn--green" href={TODAY.link.href}><span>{TODAY.link.label}</span><Arrow /></a>
          </p>
        </div>
      </section>

      {/* ───────────── 5 · Ahead: the heading and body, then the three "You own…" lines set large */}
      <section className="hs-c-ahead" id="ahead" aria-labelledby="hs-c-ahead-t">
        <div className="hs-c-ahead__head">
          <div>
            <p className="hs-c-eye" data-rv=""><i aria-hidden="true" />Ahead</p>
            <h2 id="hs-c-ahead-t" className="hs-c-h2 hs-c-ahead__h" data-rise=""><Acc t={AHEAD.h} a="back end" /></h2>
          </div>
          <p className="hs-c-ahead__body" data-rv="">{AHEAD.body}</p>
        </div>
        <ul className="hs-c-owns">
          {AHEAD.owns.map((o, i) => {
            const [lead, word] = lastWord(o);
            return (
              <li key={o} className="hs-c-own">
                <span className="hs-c-own__n" aria-hidden="true">{idx(i)}</span>
                <span className="hs-c-own__t" data-rise="">{lead}<span className="accent">{word}</span></span>
              </li>
            );
          })}
        </ul>
        <p className="hs-c-ahead__line" data-rv="">{AHEAD.line}</p>
      </section>
    </div>
  );
}
