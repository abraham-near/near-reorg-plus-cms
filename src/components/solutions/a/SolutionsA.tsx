"use client";
// near.org/solutions, version A · "Ruled grid": the page built from the homepage's ruled grid (v3/proof-deeper: ruled rows that draw in, + crosshairs, the
// proof strip under its green rule), Blog J's ruled hero and bar, and NEAR Foundation's Council band on the Stack's dark. It reads as a precise index.
// From the top (the doc's order):
//   1 hero: Blog J's ruled head (the H1 | the subhead and the button), its bar (the index of the five solutions · the docs);
//   2 proof: the homepage's proof strip, five figures with their line icons, under the green rule (the doc's ⚑ figure carries data-flag, nothing visible);
//   3 solutions: the head, a mono column header, then one ruled row per solution: number | title | body | builders as mono chips | link;
//     the row crossing the middle of the view is lit (its number, a green rule along its top, the paper tone), as is a row under the pointer or focus;
//   4 spotlight: Confidential Intents on the dark band: the head | the body and link, then the four kinds of movement it keeps out of view, each a cell
//     whose lines are redacted as the row arrives;
//   5 builders: the head, then the logo wall as a ruled grid: logo files in one ink tone at one height, the other names set in type in the same cells;
//     each cell's mono foot lists the solutions that cite it;
//   6 the close: the homepage's scene (shared/CloseScene), set after this component in the route (app/(site)/solutions-a/page.tsx).
// Copy and links: ../content.ts (the doc, verbatim). Local labels only: the bar's "Index", the column header, the section kickers and the four spotlight cells
// (the body's own words).
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { BUILDERS, CLOSE, DOCS_URL, HERO, PROOF, SOLUTIONS, SPOTLIGHT } from "../content";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./solutions-a.css";

/** a heading from the content file with its Kepler word marked (the last occurrence of `a`) */
const Acc = ({ h, a }: { h: string; a: string }) => {
  const i = h.lastIndexOf(a);
  return i < 0 ? <>{h}</> : <>{h.slice(0, i)}<span className="accent">{a}</span>{h.slice(i + a.length)}</>;
};
const isExt = (h: string) => /^https?:/.test(h);
const ext = (h: string) => (isExt(h) ? { target: "_blank", rel: "noopener noreferrer" } : {});

const Arrow = ({ down }: { down?: boolean }) => (
  <svg className={`l-arr${down ? " sa-down" : ""}`} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
const Ext = () => (
  <svg className="l-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>
);
const ExtSr = ({ h }: { h: string }) => (isExt(h) ? <span className="sr-only"> (opens another site)</span> : null);
/** an arrow for a page of the site, the outward mark for another site */
const Go = ({ href }: { href: string }) => (isExt(href) ? <><Ext /><ExtSr h={href} /></> : <Arrow />);

/** a figure split at its first space when it starts with a number ("30+ chains" → "30+" + "chains"), as the homepage's value + unit */
const fig = (v: string) => {
  const i = v.indexOf(" ");
  return /^\$?\d/.test(v) && i > 0 ? { n: v.slice(0, i), u: v.slice(i + 1) } : { n: v, u: "" };
};
const PROOF_ICON = ["near-intents", "chain-abstraction", "economics", "clock", "history"];
const SOL_ICON: Record<string, string> = { payments: "near-com", agentic: "near-ai", defi: "chain-abstraction", treasury: "economics", ai: "quantum-security" };

/** the four movements the spotlight's body names, as its cells (local labels, the body's words) */
const KEPT = ["Transfers", "Deposits", "Withdrawals", "Swaps"];
/** the redacted lines in each spotlight cell: widths in % (drawn bars, no data) */
const BARS = [[72, 46, 88], [54, 80, 38], [86, 42, 64], [48, 70, 56]];

/** the solutions that cite a builder ("Brave" is cited as "Brave Wallet" too) */
const citedIn = (name: string) => SOLUTIONS.items.filter((s) => s.builders.some((b) => b === name || b.startsWith(`${name} `))).map((s) => s.n);

export function SolutionsA() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);

  return (
    <div ref={ref} className="l-page so-a">
      {/* ───────────── 1 · hero: Blog J's ruled head and its bar */}
      <section className="l-sec sa-hero" aria-labelledby="sa-h1">
        <div className="l-row sa-hero__row" data-row="" data-start="">
          <div className="l-cell sa-hero__title">
            <p className="sa-k" data-in=""><i className="sa-sq" aria-hidden="true" /><span>NEAR <span aria-hidden="true">/</span> {HERO.eyebrow}</span></p>
            <h1 id="sa-h1" className="sa-h1" data-h1=""><Acc h={HERO.h1} a={HERO.accent} /></h1>
          </div>
          <div className="l-cell sa-hero__intro">
            <p className="l-lede" data-in="">{HERO.sub}</p>
            <p className="sa-acts" data-in="">
              <a className="l-btn sa-btn" href={HERO.primary.href} {...ext(HERO.primary.href)}><span>{HERO.primary.label}</span><Go href={HERO.primary.href} /></a>
            </p>
          </div>
        </div>
        <div className="l-row sa-bar" data-row="">
          <div className="l-cell sa-bar__cell">
            <nav className="sa-nav" aria-label="Solutions on this page">
              <span className="sa-nav__k" aria-hidden="true">Index</span>
              {SOLUTIONS.items.map((s) => (
                <a key={s.k} href={`#sa-${s.k}`} data-nav={s.k}><span className="sa-nav__n" aria-hidden="true">{s.n}</span>{s.title}</a>
              ))}
            </nav>
            <a className="sa-docs" href={DOCS_URL} {...ext(DOCS_URL)}><span>{CLOSE.primary.label}</span><Go href={DOCS_URL} /></a>
          </div>
        </div>
      </section>

      {/* ───────────── 2 · proof: the homepage's strip, five figures */}
      <section className="l-sec sa-proof" aria-label="NEAR in numbers">
        <ul className="l-row l-proof__row sa-proof__row" data-row="">
          <li className="l-green" aria-hidden="true" role="presentation" />
          {PROOF.map((p, i) => {
            const f = fig(p.value);
            return (
              <li key={p.value} className="l-cell l-fig sa-fig" style={{ ["--i" as string]: i }} data-flag={"flag" in p && p.flag ? "confirm" : undefined}>
                <i className="l-ic" data-icon={PROOF_ICON[i]} data-icon-size="20" aria-hidden="true" />
                <p className="l-fig__v"><span className="l-fig__n">{f.n}</span>{f.u && <span className="l-fig__u">{f.u}</span>}</p>
                <p className="l-fig__c">{p.label}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ───────────── 3 · solutions: the ruled index */}
      <section className="l-sec sa-sols" aria-labelledby="sa-so-t">
        <div className="l-row sa-head sa-head--one" data-row="">
          <div className="l-cell sa-head__h">
            <p className="sa-k" data-rv=""><i className="sa-sq" aria-hidden="true" /><span>{HERO.eyebrow} <span aria-hidden="true">/</span> {String(SOLUTIONS.items.length).padStart(2, "0")}</span></p>
            <h2 id="sa-so-t" className="l-h2 l-h2--m sa-h2" data-split=""><Acc h={SOLUTIONS.h} a="building" /></h2>
          </div>
        </div>
        <div className="l-row sa-cols" data-row="" aria-hidden="true">
          <div className="l-cell">No.</div>
          <div className="l-cell">Solution</div>
          <div className="l-cell">Overview</div>
          <div className="l-cell">Builders</div>
          <div className="l-cell">Link</div>
        </div>
        <ol className="sa-list">
          {SOLUTIONS.items.map((s) => (
            <li key={s.k} id={`sa-${s.k}`} className="l-row sa-sol" data-row="" data-sol={s.k}>
              <i className="sa-sol__g" aria-hidden="true" />
              <div className="l-cell sa-sol__n">
                <span className="sa-n"><i aria-hidden="true" />{s.n}</span>
                <i className="l-ic l-ic--s sa-sol__ic" data-icon={SOL_ICON[s.k]} data-icon-size="16" aria-hidden="true" />
              </div>
              <div className="l-cell sa-sol__t"><h3 data-rv="">{s.title}</h3></div>
              <div className="l-cell sa-sol__b"><p data-rv="">{s.body}</p></div>
              <div className="l-cell sa-sol__w">
                {s.builders.length ? (
                  <ul className="sa-chips" data-rv="">
                    {s.builders.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                ) : <span className="sa-none" data-rv="" aria-hidden="true">—</span>}
              </div>
              <div className="l-cell sa-sol__a">
                <a className="l-link sa-go" href={s.link.href} {...ext(s.link.href)} data-rv=""><span>{s.link.label}</span><Go href={s.link.href} /></a>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────────── 4 · spotlight: Confidential Intents on the dark band */}
      <section className="l-sec sa-dark" aria-labelledby="sa-sp-t">
        <div className="l-row sa-head" data-row="">
          <div className="l-cell sa-head__h">
            <p className="sa-k" data-rv=""><i className="sa-sq" aria-hidden="true" /><span>Spotlight <span aria-hidden="true">/</span> Confidential Intents</span></p>
            <h2 id="sa-sp-t" className="l-h2 l-h2--m sa-h2" data-split=""><Acc h={SPOTLIGHT.h} a="confidentiality" /></h2>
          </div>
          <div className="l-cell sa-head__end">
            <p className="l-lede" data-rv="">{SPOTLIGHT.body}</p>
            <p data-rv=""><a className="l-btn sa-btn sa-btn--inv" href={SPOTLIGHT.link.href} {...ext(SPOTLIGHT.link.href)}><span>{SPOTLIGHT.link.label}</span><Go href={SPOTLIGHT.link.href} /></a></p>
          </div>
        </div>
        <ul className="l-row sa-red" data-row="" aria-hidden="true">
          {KEPT.map((k, i) => (
            <li key={k} className="l-cell sa-red__c" style={{ ["--j" as string]: i }}>
              <p className="sa-red__k">{k}</p>
              <span className="sa-red__bars">
                {BARS[i].map((w, j) => <b key={j} style={{ width: `${w}%`, ["--b" as string]: j }} />)}
              </span>
            </li>
          ))}
        </ul>
        <div className="l-row l-spacer sa-dark__end" data-row="" aria-hidden="true"><div className="l-cell" /></div>
      </section>

      {/* ───────────── 5 · builders: the ruled logo wall */}
      <section className="l-sec sa-who" aria-labelledby="sa-wh-t">
        <div className="l-row sa-head sa-head--one" data-row="">
          <div className="l-cell sa-head__h">
            <p className="sa-k" data-rv=""><i className="sa-sq" aria-hidden="true" /><span>Builders <span aria-hidden="true">/</span> {String(BUILDERS.logos.length).padStart(2, "0")}</span></p>
            <h2 id="sa-wh-t" className="l-h2 l-h2--m sa-h2 sa-h2--w" data-split=""><Acc h={BUILDERS.h} a="global" /></h2>
          </div>
        </div>
        <ul className="l-row sa-wall" data-row="">
          {BUILDERS.logos.map((l, i) => (
            <li key={l.name} className="l-cell sa-lg" style={{ ["--j" as string]: i }}>
              <b className="sa-x sa-x--l" aria-hidden="true" /><b className="sa-x sa-x--r" aria-hidden="true" />
              <span className="sa-lg__i" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <span className="sa-lg__m">
                {/* eslint-disable-next-line @next/next/no-img-element -- a small local logo, toned by CSS */}
                {l.src ? <img className="sa-lg__img" src={l.src} alt={l.name} loading="lazy" decoding="async" /> : <span className="sa-lg__name">{l.name}</span>}
              </span>
              <span className="sa-lg__f" aria-hidden="true">{citedIn(l.name).join(" · ")}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
