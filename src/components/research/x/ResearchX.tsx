"use client";
// near.org/research, version X · "MVP": Research A (the library catalogue on the ruled grid) made calm, after the Nov 19, 2026 review: mostly copy, one
// header graphic, no grid near the header, no kickers or decorative numbers, the dot icons only where they help. From the top:
//   1 hero (no grid): the H1 and the subhead, two CTAs (browse the papers, read the White Paper) | the one header graphic, B's stack of papers
//     ([[TBD: graphic by Ali]], ./Stack.tsx);
//   2 the catalogue on a light ruled grid: the bar (the topic chips | how many are showing), then one ruled row per paper: the title and its summary |
//     its real metadata (topic with its icon, year and note, source and host) and "Read the paper". No row numbers, no column heads;
//   3 keep reading, on the catalogue's grid: a spacer row, the heading row, then MORE's three links in one ruled row (a cell each, with its dot icon);
//     the grid runs on into the close (CloseScene ruled);
//   4 the close: the homepage's scene (shared/CloseScene), set after this component in the route (app/(site)/research-x/page.tsx).
// The filter hides rows (`hidden`) rather than unmounting them, so the grid's motion keeps every row it measured.
// Copy and links: ../content.ts (verbatim). Local labels only: the CTAs' "Browse the papers", "Papers" (a hidden h2), the count line.
import { useEffect, useRef, useState } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { Button, TextLink } from "@/components/ui";
import { HERO, MORE, PAPERS, TOPICS, type Paper, type Topic } from "../content";
import { mount } from "./motion";
import { PaperStack } from "./Stack";
import "../../v3/proof-deeper/proof-deeper.css";
import "./research-x.css";

type Pick = "all" | Topic;

/** a heading from the content file with its Kepler word marked (the last occurrence of `a`) */
const Acc = ({ h, a }: { h: string; a: string }) => {
  const i = h.lastIndexOf(a);
  return i < 0 ? <>{h}</> : <>{h.slice(0, i)}<span className="accent">{a}</span>{h.slice(i + a.length)}</>;
};
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

const PICKS: { k: Pick; label: string }[] = [{ k: "all", label: "All" }, ...TOPICS];
const TOPIC_LABEL = Object.fromEntries(TOPICS.map((t) => [t.k, t.label])) as Record<Topic, string>;
const TOPIC_ICON: Record<Topic, string> = { protocol: "near-protocol", ai: "near-ai" };
const MORE_ICON: Record<string, string> = { "/blog": "blog", "/history": "history" };
const COUNT: Record<Pick, number> = { all: PAPERS.length, protocol: 0, ai: 0 };
PAPERS.forEach((p) => { COUNT[p.topic] += 1; });
const papers = (n: number) => `${n} ${n === 1 ? "paper" : "papers"}`;
const WHITE = PAPERS[0];

/** one paper: a ruled row (the title and summary | its metadata and the link) */
function PaperRow({ p, show }: { p: Paper; show: boolean }) {
  return (
    <li className="l-row rx-p" data-row="" hidden={!show}>
      <div className="l-cell rx-p__main">
        <h3 className="rx-p__t" data-rv="">{p.title}</h3>
        <p className="rx-p__b" data-rv="">{p.body}</p>
      </div>
      <div className="l-cell rx-p__meta">
        <dl className="rx-m" data-rv="">
          <div>
            <dt className="sr-only">Topic</dt>
            <dd className="rx-m__topic"><i className="l-ic rx-m__ic" data-icon={TOPIC_ICON[p.topic]} data-icon-size="20" aria-hidden="true" />{TOPIC_LABEL[p.topic]}</dd>
          </div>
          {(p.year || p.note) && (
            <div>
              <dt className="sr-only">Year</dt>
              <dd>{p.year && <span className="rx-m__y">{p.year}</span>}{p.year && p.note && <span aria-hidden="true"> · </span>}{p.note && <span className="rx-m__s">{p.note}</span>}</dd>
            </div>
          )}
          <div>
            <dt className="sr-only">Source</dt>
            <dd className="rx-m__s">{p.source} <span aria-hidden="true">·</span> {host(p.href)}</dd>
          </div>
        </dl>
        <p className="rx-p__go" data-rv="">
          <TextLink href={p.href} external={isExt(p.href)} icon="ext" className="rx-go">
            Read the paper<span className="sr-only">: {p.title}</span>{isExt(p.href) && <NewTab />}
          </TextLink>
        </p>
      </div>
    </li>
  );
}

export function ResearchX() {
  const ref = useRef<HTMLDivElement>(null);
  const [pick, setPick] = useState<Pick>("all");
  const [touched, setTouched] = useState(false);   // the first choice: from then on, rows that come back rise in again (research-x.css)
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
    <div ref={ref} className="l-page rs-x">
      {/* ───────────── 1 · hero: copy | the one header graphic (no grid) */}
      <section className="rx-hero" aria-labelledby="rx-h1">
        <div className="rx-hero__copy">
          <h1 id="rx-h1" className="rx-h1" data-h1=""><Acc h={HERO.h1} a={HERO.accent} /></h1>
          <p className="rx-hero__sub" data-in="">{HERO.sub}</p>
          <p className="rx-ctas" data-in="">
            <Button href="#rx-papers">Browse the papers</Button>
            <Button href={WHITE.href} external={isExt(WHITE.href)} variant="secondary">Read the {WHITE.short}{isExt(WHITE.href) && <NewTab />}</Button>
          </p>
        </div>
        {/* [[TBD: graphic by Ali]] placeholder: Research B's stack of papers */}
        <div className="rx-hero__art" aria-hidden="true"><PaperStack /></div>
      </section>

      {/* ───────────── 2 · the catalogue on a light ruled grid: the bar, then a row per paper */}
      <section className="l-sec rx-cat" aria-labelledby="rx-cat-t">
        <h2 id="rx-cat-t" className="sr-only">Papers</h2>
        <div className="l-row rx-bar" data-row="">
          <div className="l-cell rx-bar__cell">
            <div className="rx-chips" role="group" aria-label="Filter papers by topic">
              {PICKS.map((c) => (
                <button key={c.k} type="button" className="rx-chip" aria-pressed={pick === c.k} aria-controls="rx-papers" onClick={() => choose(c.k)}>
                  <span>{c.label}</span>
                  <span className="rx-chip__n"><span className="sr-only">, </span>{COUNT[c.k]}<span className="sr-only"> {COUNT[c.k] === 1 ? "paper" : "papers"}</span></span>
                </button>
              ))}
            </div>
            <p className="rx-count" role="status" aria-live="polite" aria-atomic="true">
              Showing {shown} of {papers(PAPERS.length)}
              {pick !== "all" && <span className="sr-only"> in {TOPIC_LABEL[pick]}</span>}
            </p>
          </div>
        </div>
        <ul id="rx-papers" className={`rx-list${touched ? " is-filtered" : ""}`}>
          {PAPERS.map((p) => <PaperRow key={p.k} p={p} show={pick === "all" || p.topic === pick} />)}
        </ul>
      </section>

      {/* ───────────── 3 · keep reading, on the same grid as the catalogue: a spacer row, the heading row, then one ruled row with the three links */}
      <section className="l-sec rx-more" aria-labelledby="rx-mo-t">
        <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>
        <div className="l-row rx-more__head" data-row="">
          <div className="l-cell"><h2 id="rx-mo-t" className="rx-h2" data-split=""><Acc h={MORE.h} a="reading" /></h2></div>
        </div>
        <ul className="l-row rx-links" data-row="">
          {MORE.links.map((l) => (
            <li key={l.href} className="l-cell rx-links__cell">
              <a className="rx-ln" href={l.href} {...ext(l.href)}>
                <i className="l-ic rx-ln__ic" data-icon={MORE_ICON[l.href] ?? "docs"} data-icon-size="24" aria-hidden="true" />
                <span className="rx-ln__t">{l.label}</span>
                <span className="rx-ln__d">{l.desc}</span>
                <span className="rx-ln__go" aria-hidden="true">{isExt(l.href) ? <Ext /> : <Arrow />}</span>
                {isExt(l.href) && <NewTab />}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
