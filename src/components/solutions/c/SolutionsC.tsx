"use client";
// near.org/solutions, version C · Editorial. The homepage v9's hand (its type-only hero, the black-and-white photos that bleed, the Stack's and the
// Council's dark) read as one calm feature about what is built on NEAR. From the top (the doc's order):
//   1 the hero: the H1 set big in Montreal Book with its Kepler word and the green square at its end, the subhead and the action; under it the rails
//     photo (bw), which opens from the page's gutters to the whole screen as it comes up;
//   2 the proof: the first figure set huge beside its label, the other four in one ruled row, each number counted once and its unit in Kepler under it;
//   3 the solutions: five chapters. In each, the large Kepler numeral and the title hold (CSS sticky) on the left while the photo, the text, the
//     builders the text names and the link pass on the right. Phones: no hold, each chapter reads top to bottom;
//   4 the spotlight: the dark band. The heading set large, the paragraph wiped from faint to paper as it is read, the link, and a bw photo bleeding to
//     the screen's right edge;
//   5 the builders: the heading, then a quiet ruled wall: the logo files in one tone and one height, the names without a file set in type;
//   6 the close: the homepage's scene (shared/CloseScene), set after this component in the route (app/(site)/solutions-c/page.tsx).
// Copy and links: ../content.ts (the doc, verbatim). This version's own: the section labels (EYEBROWS), the "Built with" label and the photos (PHOTOS).
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { BUILDERS, HERO, PROOF, SOLUTIONS, SPOTLIGHT } from "../content";
import { Acc, Figure, Go, Photo, WipeWords } from "./parts";
import { mount } from "./motion";
import "./solutions-c.css";

/** this page's own small labels over each section and over a chapter's builders (not in the doc) */
const EYEBROWS = { proof: "01 · In production", solutions: "02 · Solutions", spotlight: "03 · Confidential Intents", builders: "04 · Who builds on NEAR" } as const;
const BUILT_WITH = "Built with";

type Still = { src: string; alt: string; w: number; h: number };
/** the photos: the site's own bw stills (public/images), one per chapter, the rails under the hero and the server rack on the band */
const PHOTOS: { hero: Still; spotlight: Still; solutions: Record<string, Still> } = {
  hero: { src: "/images/blog/who-owns-the-rails.webp", alt: "Railway tracks running into the distance at dawn, one signal lit green", w: 1600, h: 900 },
  spotlight: { src: "/images/home/bw/paths-integrate.webp", alt: "A hand plugging a green cable into a server rack", w: 1200, h: 897 },
  solutions: {
    payments: { src: "/images/blog/private-money-rail.webp", alt: "A phone held to a card reader on a café counter", w: 1600, h: 900 },
    agentic: { src: "/images/blog/agent-economy.webp", alt: "Someone working at a desk in front of two monitors", w: 1600, h: 900 },
    defi: { src: "/images/home/bw/paths-trade.webp", alt: "A hand holding a phone with a rising price chart, by a window", w: 1200, h: 897 },
    treasury: { src: "/images/blog/sovereign-economy.webp", alt: "A shopkeeper at a laptop in a small shop", w: 1600, h: 900 },
    ai: { src: "/images/blog/venice.webp", alt: "Someone typing at a laptop in a dim room", w: 1024, h: 576 },
  },
};

const [LEAD, ...REST] = PROOF;
const TOTAL = String(SOLUTIONS.items.length).padStart(2, "0");

export function SolutionsC() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);

  return (
    <div ref={ref} className="sl-c">
      {/* ───────────── 1 · hero: the type, then the rails photo opens to the screen */}
      <header className="sl-c-hero" aria-labelledby="sl-c-h1">
        <p className="sl-c-eye" data-rv=""><i aria-hidden="true" />{HERO.eyebrow}</p>
        <h1 id="sl-c-h1" className="sl-c-h1" data-rise="now"><Acc t={HERO.h1} a={HERO.accent} sq /></h1>
        <div className="sl-c-hero__foot">
          <p className="sl-c-hero__sub" data-rv="" style={{ ["--rv" as string]: 2 }}>{HERO.sub}</p>
          <p className="sl-c-actions" data-rv="" style={{ ["--rv" as string]: 3 }}>
            <Go className="sl-c-btn sl-c-btn--ink" href={HERO.primary.href} label={HERO.primary.label} />
          </p>
        </div>
      </header>
      <Photo {...PHOTOS.hero} className="sl-c-hero__ph" open />

      {/* ───────────── 2 · the proof: the lead figure huge, the other four in one ruled row */}
      <section className="sl-c-sec sl-c-proof" aria-label="NEAR in production">
        <p className="sl-c-eye" data-rv=""><i aria-hidden="true" />{EYEBROWS.proof}</p>
        <div className="sl-c-lead" data-rv="">
          <Figure v={LEAD.value} className="sl-c-lead__v" />
          <p className="sl-c-lead__l">{LEAD.label}</p>
        </div>
        <ul className="sl-c-facts">
          {REST.map((p, i) => (
            <li key={p.value} className="sl-c-fact" data-rv="" style={{ ["--rv" as string]: i }}>
              <Figure v={p.value} className="sl-c-fact__v" />
              <p className="sl-c-fact__l">
                {p.label}
                {"flag" in p && p.flag && <span className="sl-c-flag" title="Figure to confirm (flagged in the doc)"> ⚑<span className="sr-only"> figure to confirm</span></span>}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── 3 · the solutions: five chapters, the numeral and the title hold while the rest passes */}
      <section className="sl-c-sec sl-c-sols" id="solutions" aria-labelledby="sl-c-sols-t">
        <div className="sl-c-sols__head">
          <p className="sl-c-eye" data-rv=""><i aria-hidden="true" />{EYEBROWS.solutions}</p>
          <h2 id="sl-c-sols-t" className="sl-c-h2" data-rise=""><Acc t={SOLUTIONS.h} a="building" /></h2>
        </div>
        <div className="sl-c-sols__list">
          {SOLUTIONS.items.map((s) => (
            <article key={s.k} className="sl-c-sol" id={s.k} aria-labelledby={`sl-c-sol-${s.k}`}>
              <div className="sl-c-sol__aside">
                <div className="sl-c-sol__stick">
                  <p className="sl-c-sol__n" aria-hidden="true"><span className="sl-c-sol__num">{s.n}</span><span className="sl-c-sol__of">/ {TOTAL}</span></p>
                  <h3 id={`sl-c-sol-${s.k}`} className="sl-c-sol__t" data-rise="">{s.title}</h3>
                </div>
              </div>
              <div className="sl-c-sol__main">
                <Photo {...PHOTOS.solutions[s.k]} className="sl-c-sol__ph" />
                <p className="sl-c-sol__b" data-rv="">{s.body}</p>
                {s.builders.length > 0 && (
                  <div className="sl-c-sol__by" data-rv="" style={{ ["--rv" as string]: 1 }}>
                    <p className="sl-c-sol__byl">{BUILT_WITH}</p>
                    <ul className="sl-c-sol__names">{s.builders.map((b) => <li key={b}>{b}</li>)}</ul>
                  </div>
                )}
                <p className="sl-c-sol__go" data-rv="" style={{ ["--rv" as string]: 2 }}><Go className="sl-c-link" href={s.link.href} label={s.link.label} /></p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ───────────── 4 · the spotlight: the dark band, the paragraph wiped as it is read, a photo to the screen's edge */}
      <section className="sl-c-spot" id="confidential-intents" aria-labelledby="sl-c-spot-t" data-nav-tone="dark">
        <div className="sl-c-spot__head">
          <p className="sl-c-eye sl-c-eye--on" data-rv=""><i aria-hidden="true" />{EYEBROWS.spotlight}</p>
          <h2 id="sl-c-spot-t" className="sl-c-spot__h" data-rise=""><Acc t={SPOTLIGHT.h} a="confidentiality" /></h2>
        </div>
        <div className="sl-c-spot__grid">
          <div className="sl-c-spot__txt">
            <p className="sl-c-statement sl-c-statement--on" data-wipe=""><WipeWords text={SPOTLIGHT.body} /></p>
            <p className="sl-c-spot__go" data-rv=""><Go className="sl-c-btn sl-c-btn--paper" href={SPOTLIGHT.link.href} label={SPOTLIGHT.link.label} /></p>
          </div>
          <Photo {...PHOTOS.spotlight} className="sl-c-spot__ph" />
        </div>
      </section>

      {/* ───────────── 5 · the builders: a quiet wall, the files in one tone and height, the other names in type */}
      <section className="sl-c-sec sl-c-wall" id="builders" aria-labelledby="sl-c-wall-t">
        <p className="sl-c-eye" data-rv=""><i aria-hidden="true" />{EYEBROWS.builders}</p>
        <h2 id="sl-c-wall-t" className="sl-c-h2 sl-c-wall__h" data-rise=""><Acc t={BUILDERS.h} a="infrastructure" /></h2>
        <ul className="sl-c-logos">
          {BUILDERS.logos.map((l, i) => (
            <li key={l.name} className="sl-c-logo" data-rv="" style={{ ["--rv" as string]: i % 5 }}>
              {l.src
                // eslint-disable-next-line @next/next/no-img-element -- small partner marks (public/brand/partners), set in one tone by CSS
                ? <img className={`sl-c-logo__img sl-c-logo__img--${l.name.toLowerCase().replace(/\W+/g, "")}`} src={l.src} alt={l.name} loading="lazy" decoding="async" />
                : <span className="sl-c-logo__name">{l.name}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
