"use client";
// near.org/solutions, version X · "MVP": version A (the ruled index), cleaned after the Nov 19 2026 review. Mostly copy, two placeholder drawings, and
// everything below the hero on ONE continuous ruled grid (the homepage's: rules at its weight, + crosshairs, rows that draw in): the frame's side lines run
// unbroken from the proof strip to the close (the dark band is the one break). Sections are spaced by empty ruled rows inside the grid (the homepage's .l-spacer), not by bare paper.
// Only the hero sits on bare paper. No kickers, no section labels, no numbering. One dark band (the spotlight) breaks the paper midway.
// From the top (the doc's order):
//   1 hero: the H1, the subhead and the two buttons on the paper (no rules, no crosshairs near the header), beside one drawing (Solutions B's hub);
//   2 proof: the homepage's proof strip, five figures under the green rule: the grid's first row;
//   3 solutions: a spacer row, the heading as a ruled head row (the homepage's .l-head), then one ruled row per solution: its dot icon and title | its
//     body, the names it cites and its link;
//   4 spotlight: Confidential Intents, the dark band (ink ground edge to edge, paper type, data-nav-tone="dark" for the header), off the grid: no rules,
//     no +, just the copy | the second drawing (Solutions B's private shard, redrawn for dark). Its edges end and restart the grid (data-after-bleed on
//     the builders' head: no rule doubling the band's edge);
//   5 builders: the heading as a ruled head row, then the logo wall (logo files in one ink tone at one height, the other names set in type);
//   6 the close: the homepage's scene (shared/CloseScene, `ruled`), set after this component in the route (app/(site)/solutions-x/page.tsx): its ruled
//     spacer row carries the grid down to the photo, so the grid touches the CTA.
// Copy and links: ../content.ts (the doc, verbatim). No local labels.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { Button, TextLink } from "@/components/ui";
import { BUILDERS, CLOSE, HERO, PROOF, SOLUTIONS, SPOTLIGHT } from "../content";
import { HeroHub } from "../b/Hero";
import { Shard } from "../b/Shard";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./solutions-x.css";

/** a heading from the content file with its Kepler word marked (the last occurrence of `a`) */
const Acc = ({ h, a }: { h: string; a: string }) => {
  const i = h.lastIndexOf(a);
  return i < 0 ? <>{h}</> : <>{h.slice(0, i)}<span className="accent">{a}</span>{h.slice(i + a.length)}</>;
};
const isExt = (h: string) => /^https?:/.test(h);
/** a word for screen readers on a link to another site (the site's Button / TextLink draw its ↗ and open it in a new tab) */
const ExtSr = ({ href }: { href: string }) => (isExt(href) ? <span className="sr-only"> (opens another site)</span> : null);

/** a figure split at its first space when it starts with a number ("30+ chains" → "30+" + "chains"), as the homepage's value + unit */
const fig = (v: string) => {
  const i = v.indexOf(" ");
  return /^\$?\d/.test(v) && i > 0 ? { n: v.slice(0, i), u: v.slice(i + 1) } : { n: v, u: "" };
};
/** the site's dot icons (v3/header/icons.ts), one per solution */
const SOL_ICON: Record<string, string> = { payments: "near-com", agentic: "near-ai", defi: "chain-abstraction", treasury: "economics", ai: "quantum-security" };

export function SolutionsX() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);

  return (
    <div ref={ref} className="l-page so-x">
      {/* ───────────── 1 · hero: copy on the paper, one drawing */}
      <section className="sx-hero" aria-labelledby="sx-h1">
        <div className="sx-hero__copy">
          <h1 id="sx-h1" className="sx-h1" data-h1=""><Acc h={HERO.h1} a={HERO.accent} /></h1>
          <p className="sx-hero__sub" data-in="">{HERO.sub}</p>
          <p className="sx-acts" data-in="">
            <Button href={HERO.primary.href} external={isExt(HERO.primary.href)}>{HERO.primary.label}<ExtSr href={HERO.primary.href} /></Button>
            <Button href={CLOSE.primary.href} external={isExt(CLOSE.primary.href)} variant="secondary">{CLOSE.primary.label}<ExtSr href={CLOSE.primary.href} /></Button>
          </p>
        </div>
        {/* [[TBD: graphic by Ali]] placeholder: Solutions B's hub (NEAR and the five solutions round it), still, its labels hidden */}
        <figure className="sx-hero__art sx-art" data-in="" aria-hidden="true"><HeroHub /></figure>
      </section>

      {/* ───────────── 2 · proof: the homepage's strip, five figures */}
      <section className="l-sec sx-proof" aria-label="NEAR in numbers">
        <ul className="l-row l-proof__row sx-proof__row" data-row="">
          <li className="l-green" aria-hidden="true" role="presentation" />
          {PROOF.map((p, i) => {
            const f = fig(p.value);
            return (
              <li key={p.value} className="l-cell l-fig sx-fig" style={{ ["--i" as string]: i }} data-flag={"flag" in p && p.flag ? "confirm" : undefined}>
                <p className="l-fig__v"><span className="l-fig__n">{f.n}</span>{f.u && <span className="l-fig__u">{f.u}</span>}</p>
                <p className="l-fig__c">{p.label}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ───────────── 3 · solutions: a spacer row, a ruled head row, one ruled row per solution, then a spacer row before the band */}
      <section className="l-sec sx-sols" aria-labelledby="sx-so-t">
        <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>
        <div className="l-row l-head sx-head" data-row="">
          <div className="l-cell l-head__cell"><h2 id="sx-so-t" className="l-h2 sx-h2" data-split=""><Acc h={SOLUTIONS.h} a="building" /></h2></div>
        </div>
        <ul className="sx-list">
          {SOLUTIONS.items.map((s) => (
            <li key={s.k} id={`sx-${s.k}`} className="l-row sx-sol" data-row="">
              <div className="l-cell sx-sol__t">
                <i className="sx-ic" data-icon={SOL_ICON[s.k]} aria-hidden="true" />
                <h3 data-rv="">{s.title}</h3>
              </div>
              <div className="l-cell sx-sol__b">
                <p data-rv="">{s.body}</p>
                {s.builders.length > 0 && <p className="sx-who" data-rv="">{s.builders.join(" · ")}</p>}
                <p className="sx-sol__a" data-rv=""><TextLink href={s.link.href} external={isExt(s.link.href)} inline className="sx-go">{s.link.label}<ExtSr href={s.link.href} /></TextLink></p>
              </div>
            </li>
          ))}
        </ul>
        {/* a spacer row between the last solution and the dark band: room before the break */}
        <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>
      </section>

      {/* ───────────── 4 · spotlight: Confidential Intents, the dark band, off the grid (no rules, no +): the copy | the drawing */}
      <section className="l-sec sx-sp" aria-labelledby="sx-sp-t" data-nav-tone="dark" data-ui-tone="dark">
        <div className="l-row sx-sp__row" data-row="">
          <div className="l-cell sx-sp__txt">
            <h2 id="sx-sp-t" className="l-h2 sx-h2" data-split=""><Acc h={SPOTLIGHT.h} a="confidentiality" /></h2>
            <p className="l-lede" data-rv="">{SPOTLIGHT.body}</p>
            <p data-rv=""><Button href={SPOTLIGHT.link.href} external={isExt(SPOTLIGHT.link.href)} className="sx-sp__cta">{SPOTLIGHT.link.label}<ExtSr href={SPOTLIGHT.link.href} /></Button></p>
          </div>
          {/* [[TBD: graphic by Ali]] placeholder: Solutions B's private shard (entries under their bars, one disclosed), its tones turned for the ink ground */}
          <div className="l-cell sx-sp__art"><figure className="sx-art" aria-hidden="true"><Shard /></figure></div>
        </div>
      </section>

      {/* ───────────── 5 · builders: a spacer row under the band (no rule on the band's edge), a ruled head row, then the logo wall: the grid's last row */}
      <section className="l-sec sx-who-sec" aria-labelledby="sx-wh-t">
        <div className="l-row l-spacer" data-row="" data-after-bleed="" aria-hidden="true"><div className="l-cell" /></div>
        <div className="l-row l-head sx-head" data-row="">
          <div className="l-cell l-head__cell"><h2 id="sx-wh-t" className="l-h2 sx-h2 sx-h2--w" data-split=""><Acc h={BUILDERS.h} a="global" /></h2></div>
        </div>
        <ul className="l-row sx-wall" data-row="">
          {BUILDERS.logos.map((l, i) => (
            <li key={l.name} className="l-cell sx-lg" style={{ ["--j" as string]: i }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a small local logo, toned by CSS */}
              {l.src ? <img className="sx-lg__img" src={l.src} alt={l.name} loading="lazy" decoding="async" /> : <span className="sx-lg__name">{l.name}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
