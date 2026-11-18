"use client";
// near.org/history (History), version A · "Ruled grid": the page read as an archival record, on the homepage's ruled grid (v3/proof-deeper: ruled rows that
// draw in, + crosshairs where the rules meet, the full-bleed photo that opens to the whole screen) with Blog J's ruled hero and its bar, and NEAR Foundation's
// Council band on the Stack's dark. Mono labels, one green, the Kepler word once per heading. From the top:
//   1 hero: Blog J's ruled head (the H1 | the subhead and the two actions), its bar (on this page · the record's range), then the index: one cell per year,
//     2017 to 2026, a square per entry filed that year (a link to it), a dash for the years with none;
//   2 origin: the opening (the Transformer, the lab) beside the whiteboard photo, the year as the record's first figure;
//   3 the record: the timeline as a ledger, its four eras as chapter rows, each entry a row (no. and year | title and note | filed under). A green marker
//     runs down the ledger's left rule as it is read, carrying the year of the entry beside it (motion.ts);
//   4 today: the four layers of the stack as four cells on the dark band, each with its place in the stack drawn;
//   5 ahead: the line and the three kinds of ownership as cells, then the ridges, edge to edge, with the closing line in their sky;
//   6 the close: the line and the two actions | the record's colophon (its range, its count, its last entry).
// Copy and links: ../content.ts (verbatim). The few labels of the record itself (column heads, "Chapter", the colophon) are this file's own.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { AHEAD, CLOSE, ERAS, HERO, MILESTONES, ORIGIN, TODAY, type Era } from "../content";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./history-a.css";

/** a heading from the content file with its Kepler word marked (the last occurrence of `a`) */
const Acc = ({ h, a }: { h: string; a: string }) => {
  const i = h.lastIndexOf(a);
  return i < 0 ? <>{h}</> : <>{h.slice(0, i)}<span className="accent">{a}</span>{h.slice(i + a.length)}</>;
};
const idx = (i: number) => String(i + 1).padStart(2, "0");
const isExt = (h: string) => /^https?:/.test(h);
const ext = (h: string) => (isExt(h) ? { target: "_blank", rel: "noopener noreferrer" } : {});

const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
const Ext = () => (
  <svg className="l-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>
);
const ExtSr = ({ h }: { h: string }) => (isExt(h) ? <span className="sr-only"> (opens another site)</span> : null);

/* the record, worked out once from the content */
const FIRST = Number(MILESTONES[0].year), LAST = Number(MILESTONES[MILESTONES.length - 1].year);
const YEARS = Array.from({ length: LAST - FIRST + 1 }, (_, i) => String(FIRST + i));
const byYear = (y: string) => MILESTONES.map((m, i) => ({ m, i })).filter((x) => x.m.year === y);
const range = (e: Era) => (e.from === e.to ? String(e.from) : `${e.from}–${e.to}`);
const CHAPTERS = ERAS.map((e) => ({ e, items: MILESTONES.map((m, i) => ({ m, i })).filter((x) => x.m.era === e.id) }));
const NOW = MILESTONES.findIndex((m) => m.now);

export function HistoryA() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);

  return (
    <div ref={ref} className="l-page hs-a">
      {/* ───────────── 1 · hero: Blog J's ruled head, its bar, the index of years */}
      <section className="l-sec ha-hero" aria-labelledby="ha-h1">
        <div className="l-row ha-hero__row" data-row="" data-start="">
          <div className="l-cell ha-hero__title">
            <p className="ha-k" data-in=""><i className="ha-sq" aria-hidden="true" />NEAR <span aria-hidden="true">/</span> {HERO.eyebrow}</p>
            <h1 id="ha-h1" className="ha-h1" data-h1=""><Acc h={HERO.h1} a={HERO.accent} /></h1>
          </div>
          <div className="l-cell ha-hero__intro">
            <p className="l-lede" data-in="">{HERO.sub}</p>
            <p className="ha-acts" data-in="">
              <a className="l-btn ha-btn" href={HERO.primary.href} {...ext(HERO.primary.href)}><span>{HERO.primary.label}</span><ExtSr h={HERO.primary.href} /></a>
              <a className="l-link" href={HERO.secondary.href}><span>{HERO.secondary.label}</span><Arrow /></a>
            </p>
          </div>
        </div>
        <div className="l-row ha-bar" data-row="">
          <div className="l-cell ha-bar__cell">
            <nav className="ha-nav" aria-label="On this page">
              <a href="#origin">Origin</a><a href="#record">The record</a><a href="#today">Today</a><a href="#ahead">Ahead</a>
            </nav>
            <p className="ha-range"><span>{FIRST}</span><i aria-hidden="true" /><span>{LAST}</span><span className="ha-range__n">{idx(MILESTONES.length - 1)} entries</span></p>
          </div>
        </div>
        <ol className="l-row ha-index" data-row="" aria-label={`The record by year, ${FIRST} to ${LAST}`}>
          {YEARS.map((y, j) => {
            const hits = byYear(y);
            const body = (
              <>
                <span className="ha-yr__y">{y}</span>
                <span className="ha-yr__marks" aria-hidden="true">
                  {hits.length ? hits.map((x) => <i key={x.i} className={x.m.now ? "is-now" : undefined} />) : <b />}
                </span>
                <span className="sr-only">{hits.length ? `: ${hits.map((x) => x.m.title).join("; ")}` : ": no entry"}</span>
              </>
            );
            return (
              <li key={y} className={`l-cell ha-yr${hits.length ? "" : " is-empty"}`} style={{ ["--j" as string]: j }}>
                {hits.length ? <a className="ha-yr__a" href={`#entry-${idx(hits[0].i)}`}>{body}</a> : <span className="ha-yr__a">{body}</span>}
              </li>
            );
          })}
        </ol>
      </section>

      {/* ───────────── 2 · origin */}
      <section className="l-sec ha-origin" id="origin" aria-labelledby="ha-or-t">
        <div className="l-row ha-or" data-row="">
          <div className="l-cell ha-or__copy">
            <p className="ha-k" data-rv=""><i className="ha-sq" aria-hidden="true" />Origin</p>
            <h2 id="ha-or-t" className="l-h2 l-h2--m" data-rv=""><Acc h={ORIGIN.h} a="AI company" /></h2>
            <div className="ha-or__body">
              {ORIGIN.body.map((p) => <p key={p.slice(0, 24)} data-rv="">{p}</p>)}
            </div>
            <p className="ha-or__stat" data-rv="">
              <span className="ha-or__v">{ORIGIN.stat.value}</span>
              <span className="ha-or__l">{ORIGIN.stat.label}</span>
            </p>
          </div>
          <div className="l-cell ha-or__ph">
            <div className="l-ph l-ph--fill" data-ph="">
              <img className="l-img" src="/images/home/bw/origin-transformer.webp" alt="A whiteboard with the Transformer's diagram drawn on it, beside a desk of computers" width={1600} height={1200} loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 3 · the record: the ledger */}
      <section className="l-sec ha-record" id="record" aria-labelledby="ha-rc-t">
        <div className="l-row ha-head" data-row="">
          <div className="l-cell ha-head__h">
            <p className="ha-k" data-rv=""><i className="ha-sq" aria-hidden="true" />The record</p>
            <h2 id="ha-rc-t" className="l-h2" data-rv="">From 2017 to <span className="accent">now</span></h2>
          </div>
          <div className="l-cell ha-head__end">
            <p className="ha-head__n" data-rv="" aria-hidden="true"><span>{ERAS.length}</span> chapters <span>{MILESTONES.length}</span> entries</p>
          </div>
        </div>

        <div className="ha-ledger" data-ledger="">
          <div className="ha-prog" aria-hidden="true">
            <i className="ha-prog__fill" />
            <span className="ha-prog__head"><b className="ha-prog__yr" data-yr="">{FIRST}</b></span>
          </div>
          <div className="l-row ha-cols" data-row="" aria-hidden="true">
            <div className="l-cell"><span className="ha-long">No. / </span>Year</div>
            <div className="l-cell">Entry</div>
            <div className="l-cell">Filed under</div>
          </div>
          {CHAPTERS.map(({ e, items }, c) => (
            <div key={e.id} className="ha-ch" role="group" aria-labelledby={`ha-ch-${e.id}`}>
              <div className="l-row ha-era" data-row="">
                <div className="l-cell ha-era__n"><span><span className="ha-long">Chapter </span><span className="ha-short">Ch. </span>{idx(c)}</span></div>
                <div className="l-cell ha-era__t"><h3 id={`ha-ch-${e.id}`} data-rv="">{e.label}</h3></div>
                <div className="l-cell ha-era__r"><span>{range(e)}</span><span className="ha-era__c">{items.length} {items.length === 1 ? "entry" : "entries"}</span></div>
              </div>
              {items.map(({ m, i }) => (
                <article key={i} className={`l-row ha-m${m.now ? " is-now" : ""}`} id={`entry-${idx(i)}`} data-row="" data-m="" data-year={m.year} aria-labelledby={`ha-m-${i}`}>
                  <div className="l-cell ha-m__when">
                    <span className="ha-m__no"><i className="ha-m__dot" aria-hidden="true" />No. {idx(i)}</span>
                    <span className="ha-m__y" data-rv="">{m.year}</span>
                    {m.now && <span className="ha-now" data-rv=""><i className="ha-pulse" aria-hidden="true" />Now</span>}
                  </div>
                  <div className="l-cell ha-m__what">
                    <h4 id={`ha-m-${i}`} className="ha-m__t" data-rv="">{m.title}</h4>
                    <p className="ha-m__b" data-rv="">{m.body}</p>
                  </div>
                  <div className="l-cell ha-m__tags">
                    <ul aria-label="Filed under" data-rv="">
                      {m.tags.map((t) => <li key={t} className="ha-tag">{t}</li>)}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          ))}
          <div className="l-row ha-cols ha-cols--end" data-row="" aria-hidden="true">
            <div className="l-cell">{LAST}</div>
            <div className="l-cell">End of the record, so far</div>
            <div className="l-cell" />
          </div>
        </div>
      </section>

      {/* ───────────── 4 · today: the four layers on the dark band */}
      <section className="l-sec ha-dark" id="today" aria-labelledby="ha-td-t">
        <div className="l-row ha-head" data-row="">
          <div className="l-cell ha-head__h">
            <p className="ha-k" data-rv=""><i className="ha-sq" aria-hidden="true" />Today</p>
            <h2 id="ha-td-t" className="l-h2" data-rv=""><Acc h={TODAY.h} a="blockchain" /></h2>
          </div>
          <div className="l-cell ha-head__end">
            <p className="l-lede" data-rv="">{TODAY.body}</p>
            <p data-rv=""><a className="l-link" href={TODAY.link.href}><span>{TODAY.link.label}</span><Arrow /></a></p>
          </div>
        </div>
        <ol className="l-row ha-layers" data-row="" aria-label="The stack, from the base up">
          {TODAY.layers.map((l, j) => (
            <li key={l} className="l-cell ha-layer" style={{ ["--j" as string]: j }}>
              <span className="ha-layer__n">Layer {idx(j)}</span>
              <span className="ha-layer__stack" aria-hidden="true">
                {TODAY.layers.map((_, k) => <i key={k} className={TODAY.layers.length - 1 - k === j ? "is-on" : undefined} />)}
              </span>
              <span className="ha-layer__t">{l}</span>
            </li>
          ))}
        </ol>
        <div className="l-row l-spacer ha-dark__end" data-row="" aria-hidden="true"><div className="l-cell" /></div>
      </section>

      {/* ───────────── 5 · ahead: the line, the three ownerships, then the ridges */}
      <section className="l-sec ha-ahead" id="ahead" aria-labelledby="ha-ah-t">
        <div className="l-row ha-head ha-ah" data-row="">
          <div className="l-cell ha-head__h">
            <p className="ha-k" data-rv=""><i className="ha-sq" aria-hidden="true" />Ahead</p>
            <h2 id="ha-ah-t" className="l-h2 ha-ah__h" data-rv=""><Acc h={AHEAD.h} a="back end." /></h2>
          </div>
          <div className="l-cell ha-head__end"><p className="l-lede" data-rv="">{AHEAD.body}</p></div>
        </div>
        <ol className="l-row ha-owns" data-row="">
          {AHEAD.owns.map((o, j) => (
            <li key={o} className="l-cell ha-own" style={{ ["--j" as string]: j }}>
              <span className="ha-own__n" aria-hidden="true">{idx(j)}</span>
              <span className="ha-own__t">{o}</span>
            </li>
          ))}
        </ol>
        <div className="l-bleed-wrap">
          <div className="l-bleed ha-bl" data-bleed="">
            <div className="l-ph l-bleed__ph" data-ph="">
              <div className="l-plate"><img className="l-img" src="/images/home/bw/voices-ridges.webp" alt="" width={2400} height={1350} loading="lazy" decoding="async" /></div>
            </div>
            <div className="l-bleed__in ha-bl__in">
              <p className="ha-bl__line" data-rv="">{AHEAD.line}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 6 · the close: the line and the actions | the record's colophon */}
      <section className="l-sec ha-close" aria-labelledby="ha-cl-t">
        <div className="l-row ha-cl" data-row="" data-after-bleed="">
          <div className="l-cell ha-cl__h">
            <h2 id="ha-cl-t" className="ha-cl__t" data-rv=""><Acc h={CLOSE.h} a="you" /></h2>
            <p className="l-lede" data-rv="">{CLOSE.sub}</p>
            <p className="ha-acts" data-rv="">
              <a className="l-btn ha-btn" href={CLOSE.primary.href} {...ext(CLOSE.primary.href)}><span>{CLOSE.primary.label}</span><ExtSr h={CLOSE.primary.href} /></a>
              <a className="l-link" href={CLOSE.secondary.href} {...ext(CLOSE.secondary.href)}><span>{CLOSE.secondary.label}</span><Ext /><ExtSr h={CLOSE.secondary.href} /></a>
            </p>
          </div>
          <div className="l-cell ha-colo">
            <dl data-rv="">
              <div><dt>Record</dt><dd>{FIRST}–{LAST}</dd></div>
              <div><dt>Chapters</dt><dd>{idx(ERAS.length - 1)}</dd></div>
              <div><dt>Entries</dt><dd>{idx(MILESTONES.length - 1)}</dd></div>
              <div><dt>Latest</dt><dd><a href={`#entry-${idx(NOW < 0 ? MILESTONES.length - 1 : NOW)}`}>No. {idx(NOW < 0 ? MILESTONES.length - 1 : NOW)}</a></dd></div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}
