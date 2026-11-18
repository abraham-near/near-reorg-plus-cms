"use client";
// near.org/research, version A · "Ruled grid": the papers as a library catalogue on the homepage's ruled grid (v3/proof-deeper: ruled rows that draw in,
// + crosshairs, mono labels, one green) with Blog J's ruled hero and bar, as on Economics A and Community A. The doc asks for "a similar layout to the
// blog page": the blog's head (heading | lede), its bar (the filter and how many are showing), then the list. From the top:
//   1 hero: the ruled head (the H1 | the subhead and the catalogue's stamp: how many papers, how many topics), then the bar: the topics as chips
//     (buttons, aria-pressed; All and the two TOPICS, each with its count) | how many are showing (a polite live region);
//   2 the catalogue: a row of column heads (No. / Paper / Topic / Year / Source), then one ruled row per paper: its number, set large | the title
//     and its summary | the topic (its icon) | the year, or an em dash when the live page gives none, and its note | the source and its host |
//     "Read the paper" (a new tab). Below 1280 px the meta folds into a column beside the title; below 860 under it, the number's column running down;
//   3 keep reading: the head, then MORE's three links as one ruled row of cells (each cell is the link);
//   4 the close: the homepage's scene (shared/CloseScene, on its ruled row), set after this component in the route (app/(site)/research-a/page.tsx).
// The filter hides rows (`hidden`) rather than unmounting them, so the grid's motion keeps every row it measured.
// Copy and links: ../content.ts (verbatim). Local labels only: the column heads, the stamp's and the cells' keys, "Papers" (a hidden h2), the count line.
import { useEffect, useRef, useState } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { HERO, MORE, PAPERS, TOPICS, type Paper, type Topic } from "../content";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./research-a.css";

type Pick = "all" | Topic;

/** a heading from the content file with its Kepler word marked (the last occurrence of `a`) */
const Acc = ({ h, a }: { h: string; a: string }) => {
  const i = h.lastIndexOf(a);
  return i < 0 ? <>{h}</> : <>{h.slice(0, i)}<span className="accent">{a}</span>{h.slice(i + a.length)}</>;
};
const idx = (i: number) => String(i + 1).padStart(2, "0");
const isExt = (h: string) => /^https?:/.test(h);
const host = (u: string) => (isExt(u) ? new URL(u).hostname.replace(/^www\./, "") : "near.org");
const ext = (h: string) => (isExt(h) ? { target: "_blank", rel: "noopener noreferrer" } : {});

const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
const Ext = () => (
  <svg className="l-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>
);
const NewTab = () => <span className="sr-only"> (opens in a new tab)</span>;

/** the chips: All, then the doc's topics */
const PICKS: { k: Pick; label: string }[] = [{ k: "all", label: "All" }, ...TOPICS];
const TOPIC_LABEL = Object.fromEntries(TOPICS.map((t) => [t.k, t.label])) as Record<Topic, string>;
const TOPIC_ICON: Record<Topic, string> = { protocol: "near-protocol", ai: "near-ai" };
const MORE_ICON: Record<string, string> = { "/blog": "blog", "/history": "history" };
const COUNT: Record<Pick, number> = { all: PAPERS.length, protocol: 0, ai: 0 };
PAPERS.forEach((p) => { COUNT[p.topic] += 1; });
const papers = (n: number) => `${n} ${n === 1 ? "paper" : "papers"}`;

/** one paper: a ruled row of cells (the keys are read out; on the widest screens the column heads show them instead) */
function PaperRow({ p, show }: { p: Paper; show: boolean }) {
  return (
    <li className="l-row ra-p" data-row="" hidden={!show}>
      <div className="l-cell ra-p__n"><span className="ra-p__num" data-rv="" aria-hidden="true">{p.n}</span></div>
      <div className="l-cell ra-p__main">
        <h3 className="ra-p__t" data-rv=""><span className="sr-only">{p.n}. </span>{p.title}</h3>
        <p className="ra-p__b" data-rv="">{p.body}</p>
      </div>
      <div className="l-cell ra-m ra-m--topic">
        <p className="ra-m__k">Topic</p>
        <p className="ra-m__v" data-rv=""><i className="l-ic ra-m__ic" data-icon={TOPIC_ICON[p.topic]} data-icon-size="18" aria-hidden="true" />{TOPIC_LABEL[p.topic]}</p>
      </div>
      <div className="l-cell ra-m ra-m--year">
        <p className="ra-m__k">Year</p>
        <div data-rv="">
          <p className="ra-m__v ra-m__y">{p.year ?? <><span aria-hidden="true">—</span><span className="sr-only">Not given</span></>}</p>
          {p.note && <p className="ra-m__s">{p.note}</p>}
        </div>
      </div>
      <div className="l-cell ra-m ra-m--src">
        <p className="ra-m__k">Source</p>
        <div data-rv="">
          <p className="ra-m__v">{p.source}</p>
          <p className="ra-m__h">{host(p.href)}</p>
        </div>
      </div>
      <div className="l-cell ra-m ra-m--go">
        <p data-rv="">
          <a className="l-link ra-go" href={p.href} {...ext(p.href)}>
            <span>Read the paper</span><Ext /><span className="sr-only">: {p.title}</span>{isExt(p.href) && <NewTab />}
          </a>
        </p>
      </div>
    </li>
  );
}

export function ResearchA() {
  const ref = useRef<HTMLDivElement>(null);
  const [pick, setPick] = useState<Pick>("all");
  const [touched, setTouched] = useState(false);   // the first choice: from then on, rows that come back rise in again (research-a.css)
  useScrollMotion(ref, mount);
  const shown = PAPERS.filter((p) => pick === "all" || p.topic === pick).length;

  // a choice changes the list's height: the grid places its crosshairs again and ScrollTrigger measures again (the close below pins), both on resize
  useEffect(() => {
    if (!touched) return;
    const t = window.setTimeout(() => dispatchEvent(new Event("resize")), 40);
    return () => clearTimeout(t);
  }, [pick, touched]);
  const choose = (k: Pick) => { if (k === pick) return; setPick(k); setTouched(true); };

  return (
    <div ref={ref} className="l-page rs-a">
      {/* ───────────── 1 · hero: the ruled head and its bar (the chips) */}
      <section className="l-sec ra-hero" aria-labelledby="ra-h1">
        <div className="l-row ra-hero__row" data-row="">
          <div className="l-cell ra-hero__title">
            <p className="ra-k" data-in=""><i className="ra-sq" aria-hidden="true" />NEAR <span aria-hidden="true">/</span> {HERO.eyebrow}</p>
            <h1 id="ra-h1" className="ra-h1" data-h1=""><Acc h={HERO.h1} a={HERO.accent} /></h1>
          </div>
          <div className="l-cell ra-hero__intro">
            <p className="l-lede" data-in="">{HERO.sub}</p>
            <dl className="ra-stamp" data-in="">
              <div><dt>Papers</dt><dd>{String(PAPERS.length).padStart(2, "0")}</dd></div>
              <div><dt>Topics</dt><dd>{String(TOPICS.length).padStart(2, "0")}</dd></div>
              <i className="l-ic ra-stamp__ic" data-icon="research" data-icon-size="22" aria-hidden="true" />
            </dl>
          </div>
        </div>
        <div className="l-row ra-bar" data-row="">
          <div className="l-cell ra-bar__cell">
            <div className="ra-chips" role="group" aria-label="Filter papers by topic">
              {PICKS.map((c) => (
                <button key={c.k} type="button" className="ra-chip" aria-pressed={pick === c.k} aria-controls="ra-papers" onClick={() => choose(c.k)}>
                  <span>{c.label}</span>
                  <span className="ra-chip__n"><span className="sr-only">, </span>{COUNT[c.k]}<span className="sr-only"> {COUNT[c.k] === 1 ? "paper" : "papers"}</span></span>
                </button>
              ))}
            </div>
            <p className="ra-count" role="status" aria-live="polite" aria-atomic="true">
              Showing <b>{shown}</b> of {papers(PAPERS.length)}
              {pick !== "all" && <span className="sr-only"> in {TOPIC_LABEL[pick]}</span>}
            </p>
          </div>
        </div>
      </section>

      {/* ───────────── 2 · the catalogue: the column heads, then a ruled row per paper */}
      <section className="l-sec ra-cat" aria-labelledby="ra-cat-t">
        <h2 id="ra-cat-t" className="sr-only">Papers</h2>
        <div className="l-row ra-cols" data-row="" aria-hidden="true">
          <div className="l-cell">No.</div>
          <div className="l-cell">Paper</div>
          <div className="l-cell">Topic</div>
          <div className="l-cell">Year</div>
          <div className="l-cell">Source</div>
          <div className="l-cell" />
        </div>
        <ol id="ra-papers" className={`ra-list${touched ? " is-filtered" : ""}`}>
          {PAPERS.map((p) => <PaperRow key={p.k} p={p} show={pick === "all" || p.topic === pick} />)}
        </ol>
      </section>

      {/* ───────────── 3 · keep reading: three link cells */}
      <section className="l-sec ra-more" aria-labelledby="ra-mo-t">
        <div className="l-row ra-head" data-row="">
          <div className="l-cell ra-head__h">
            <p className="ra-k" data-rv=""><i className="ra-sq" aria-hidden="true" />More from NEAR</p>
            <h2 id="ra-mo-t" className="l-h2 ra-h2" data-split=""><Acc h={MORE.h} a="reading" /></h2>
          </div>
        </div>
        <ul className="l-row ra-links" data-row="">
          {MORE.links.map((l, i) => (
            <li key={l.href} className="l-cell ra-ln" style={{ ["--j" as string]: i }}>
              <a className="ra-ln__a" href={l.href} {...ext(l.href)}>
                <i className="l-ic ra-ln__ic" data-icon={MORE_ICON[l.href] ?? "docs"} data-icon-size="20" aria-hidden="true" />
                <span className="ra-ln__k" aria-hidden="true">{idx(i)} <span>·</span> {host(l.href)}</span>
                <span className="ra-ln__t">{l.label}</span>
                <span className="ra-ln__d">{l.desc}</span>
                <span className="ra-ln__go" aria-hidden="true">{isExt(l.href) ? <Ext /> : <Arrow />}</span>
                {isExt(l.href) && <NewTab />}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
