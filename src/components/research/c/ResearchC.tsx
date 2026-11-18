"use client";
// near.org/research, version C · Editorial. The homepage v9's big type, a black-and-white photo that bleeds and one dark band, read as a calm journal and
// its table of contents. From the top:
//   1 the hero: the H1 set big in Montreal Book with its Kepler word and the green square, then the subhead | the contents (every paper, its numeral
//     and short name, a link down to it);
//   2 the cover: the White Paper as a spread. The lab photo (bw) opens from the grid's width to the whole screen with the paper's numeral and title set
//     large over it; under it the note in Kepler | the summary, the paper's facts (topic, year, source) and "Read the paper";
//   3 the contents, one topic at a time (TOPICS): Blockchain scalability on the paper, then User-owned AI on the dark band, under the homepage's
//     attention still (bw) that bleeds into it. Each paper is one ruled row: the numeral set huge | the title in large type with its Kepler word, the
//     note | the summary, the facts and the link. A year the source doesn't give is an em dash;
//   4 Keep reading: MORE as quiet ruled links;
//   5 the close: the homepage's scene (shared/CloseScene), set after this component in the route (app/(site)/research-c/page.tsx).
// Copy and links: ../content.ts (verbatim). This version's own small labels: LABELS, the titles' Kepler words (ACCENT) and the facts' terms.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { HERO, MORE, PAPERS, TOPICS, type Paper, type Topic } from "../content";
import { Acc, Arrow, Ext, Missing, NewTab } from "./parts";
import { mount } from "./motion";
import "./research-c.css";

/** this page's own small labels (not in the doc) */
const LABELS = { contents: "Contents", cover: "Cover", read: "Read the paper", topic: "Topic", year: "Year", source: "Source" } as const;
/** the word of each title set in Kepler */
const ACCENT: Record<string, string> = { whitepaper: "White Paper", nightshade: "Nightshade", por: "Response", dcml: "Confidential" };

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const isExt = (href: string) => /^https?:/.test(href);
const topicLabel = (k: Topic) => TOPICS.find((t) => t.k === k)?.label ?? "";
const pad = (n: number) => String(n).padStart(2, "0");
const ROMAN = ["I", "II", "III", "IV"];

const [COVER, ...REST] = PAPERS;
const GROUPS = TOPICS.map((t) => ({ ...t, papers: REST.filter((p) => p.topic === t.k) })).filter((g) => g.papers.length > 0);

/** the paper's link: always external, a new tab, its title said to screen readers */
function Read({ p, className }: { p: Paper; className: string }) {
  return (
    <a className={className} href={p.href} {...(isExt(p.href) ? ext : {})}>
      <span>{LABELS.read}<span className="sr-only">: {p.title}</span></span>
      <Ext />{isExt(p.href) && <NewTab />}
    </a>
  );
}

/** the paper's facts: its topic, its year (or an em dash) and its source */
function Facts({ p }: { p: Paper }) {
  return (
    <dl className="rs-c-facts">
      <div><dt>{LABELS.topic}</dt><dd>{topicLabel(p.topic)}</dd></div>
      <div><dt>{LABELS.year}</dt><dd>{p.year ?? <Missing />}</dd></div>
      <div><dt>{LABELS.source}</dt><dd>{p.source}</dd></div>
    </dl>
  );
}

export function ResearchC() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);

  return (
    <div ref={ref} className="rs-c">
      {/* ───────────── 1 · hero: the big line, then the subhead | the contents */}
      <header className="rs-c-hero" aria-labelledby="rs-c-h1">
        <p className="rs-c-eye" data-rv=""><i aria-hidden="true" />{HERO.eyebrow}</p>
        <h1 id="rs-c-h1" className="rs-c-h1" data-rise="now"><Acc t={HERO.h1} a={HERO.accent} sq /></h1>
        <div className="rs-c-hero__foot">
          <p className="rs-c-hero__sub" data-rv="" style={{ ["--rv" as string]: 2 }}>{HERO.sub}</p>
          <nav className="rs-c-toc" aria-label={LABELS.contents} data-rv="" style={{ ["--rv" as string]: 3 }}>
            <p className="rs-c-toc__h"><span>{LABELS.contents}</span><span>{pad(PAPERS.length)}</span></p>
            <ol>
              {PAPERS.map((p) => (
                <li key={p.k}>
                  <a className="rs-c-toc__a" href={`#${p.k}`}>
                    <span className="rs-c-toc__n" aria-hidden="true">{p.n}</span>
                    <span className="rs-c-toc__t">{p.short}</span>
                    <span className="rs-c-toc__k">{topicLabel(p.topic)}</span>
                    <Arrow className="rs-c-arr rs-c-arr--down" />
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </header>

      {/* ───────────── 2 · the cover: the White Paper as a spread, the lab photo bleeds */}
      <section className="rs-c-cover" id={COVER.k} aria-labelledby="rs-c-cover-t">
        <figure className="rs-c-bleed rs-c-cover__ph" data-open="">
          <div className="rs-c-plate" data-par="">
            {/* eslint-disable-next-line @next/next/no-img-element -- one 1600 × 1200 bw still (71 KB WebP), the homepage's lab photo: papers on the desk */}
            <img src="/images/home/bw/origin-lab.webp" alt="A lab at dusk: a whiteboard of diagrams, printed papers and a laptop on the desk" width={1600} height={1200} loading="lazy" decoding="async" />
          </div>
          <figcaption className="rs-c-cover__cap">
            <p className="rs-c-eye rs-c-eye--on"><i aria-hidden="true" />{LABELS.cover} · {topicLabel(COVER.topic)}</p>
            <div className="rs-c-cover__title">
              <span className="rs-c-cover__n" aria-hidden="true">{COVER.n}</span>
              <h2 id="rs-c-cover-t" className="rs-c-cover__h" data-rise=""><Acc t={COVER.title} a={ACCENT[COVER.k] ?? ""} /></h2>
            </div>
          </figcaption>
        </figure>
        <div className="rs-c-cover__txt">
          {COVER.note && <p className="rs-c-dek" data-rv="">{COVER.note}</p>}
          <div data-rv="" style={{ ["--rv" as string]: 1 }}>
            <p className="rs-c-cover__b">{COVER.body}</p>
            <Facts p={COVER} />
            <p className="rs-c-cover__go"><Read p={COVER} className="rs-c-btn rs-c-btn--ink" /></p>
          </div>
        </div>
      </section>

      {/* ───────────── 3 · the contents, one topic at a time: the paper's own, then the dark band for user-owned AI */}
      {GROUPS.map((g, gi) => {
        const dark = g.k === "ai";
        const word = g.label.split(" ").pop() ?? "";
        return (
          <section key={g.k} className={`rs-c-topic${dark ? " rs-c-topic--dark" : ""}`} id={`topic-${g.k}`} aria-labelledby={`rs-c-topic-${g.k}`}
            data-nav-tone={dark ? "dark" : undefined}>
            {dark && (
              <div className="rs-c-bleed rs-c-topic__ph" data-open="" aria-hidden="true">
                <div className="rs-c-plate" data-par="">
                  {/* eslint-disable-next-line @next/next/no-img-element -- one 1400 × 1046 still (47 KB WebP), the homepage's attention image, decorative here */}
                  <img src="/images/home/home-origin-attention-v1.webp" alt="" width={1400} height={1046} loading="lazy" decoding="async" />
                </div>
              </div>
            )}
            <div className="rs-c-topic__head">
              <div>
                <p className={`rs-c-eye${dark ? " rs-c-eye--on" : ""}`} data-rv=""><i aria-hidden="true" />{LABELS.contents} · {ROMAN[gi]}</p>
                <h2 id={`rs-c-topic-${g.k}`} className="rs-c-h2" data-rise=""><Acc t={g.label} a={word} /></h2>
              </div>
              <p className="rs-c-topic__count" data-rv="">{pad(g.papers.length)} {g.papers.length === 1 ? "paper" : "papers"}</p>
            </div>
            <ol className="rs-c-list">
              {g.papers.map((p) => (
                <li key={p.k} className="rs-c-row" id={p.k}>
                  <span className="rs-c-row__n" aria-hidden="true" data-drift="">{p.n}</span>
                  <div className="rs-c-row__head">
                    <h3 id={`rs-c-p-${p.k}`} className="rs-c-row__t" data-rise=""><Acc t={p.title} a={ACCENT[p.k] ?? ""} /></h3>
                    {p.note && <p className="rs-c-dek rs-c-row__note" data-rv="">{p.note}</p>}
                  </div>
                  <div className="rs-c-row__txt" data-rv="" style={{ ["--rv" as string]: 1 }}>
                    <p className="rs-c-row__b">{p.body}</p>
                    <Facts p={p} />
                    <p className="rs-c-row__go"><Read p={p} className="rs-c-link" /></p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      {/* ───────────── 4 · Keep reading: quiet links */}
      <section className="rs-c-more" aria-labelledby="rs-c-more-t">
        <h2 id="rs-c-more-t" className="rs-c-more__h" data-rv="">{MORE.h}</h2>
        <ul className="rs-c-more__list">
          {MORE.links.map((l, i) => (
            <li key={l.href} data-rv="" style={{ ["--rv" as string]: i }}>
              <a className="rs-c-more__a" href={l.href} {...(isExt(l.href) ? ext : {})}>
                <span className="rs-c-more__l">{l.label}</span>
                <span className="rs-c-more__d">{l.desc}</span>
                {isExt(l.href) ? <><Ext /><NewTab /></> : <Arrow />}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
