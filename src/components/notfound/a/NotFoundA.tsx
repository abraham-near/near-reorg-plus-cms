// 404, proposal A: "Lost in the mist". Home v5's hero (the misty forest, flipped, its paper veil on the left and the fade to paper at the foot) as a
// full-screen 404: a huge "404" in the mist's grey that a slow fog drifts across, the headline in the hero's voice ("Lost in the mist." with the Kepler
// accent and the green square of "world."), one line of sub, the hero's pill back home and two ways out as v3 text links with drawn arrows.
// A slim footer line closes the screen (no big footer). Its own small shell (v3's values, v5's header, the Extra chip); styles: ./notfound-a.css.
import type { CSSProperties } from "react";
import { FixVersion } from "@/components/shared/version";
import { ExtraChip } from "@/components/ExtraChip";
import { V3Header } from "@/components/v3/header/Header";
import "@/components/v1/world/world.css";
import "@/components/v3/buttons.css";
import "./notfound-a.css";

const HOME = "/home-v5";
const COPY = {
  h1a: "Lost in",
  h1b: "the",
  key: "mist",
  sub: ["This page doesn’t exist, or it moved.", "Here’s the way back."],
  cta: "Back home",
  copy: "© 2026 NEAR. All rights reserved.",
  ext: " (another NEAR site)",
};
const WAYS = [
  { name: "Blog", href: "/blog-j" },
  { name: "near.com", href: "https://near.com" },
];
const LEGAL = [{ name: "Terms of Use", href: "/terms" }, { name: "Privacy Policy", href: "/privacy" }];
const ext = (h: string) => /^https?:/.test(h);
const i = (n: number) => ({ "--i": n }) as CSSProperties;

/** the 404 itself: the photo hero with its copy and the slim footer line */
export function NotFoundAHero() {
  return (
    <section className="hero nfa" aria-labelledby="nfa-h">
      <div className="nfa__bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- one still, already compressed (home v5's) */}
        <img src="/v5/hero-mistforest.webp" alt="" width={900} height={672} decoding="async" fetchPriority="high" />
      </div>
      {/* the fog: two soft banks that drift across the 404 (under the headline, over the number) */}
      <div className="nfa__fog" aria-hidden="true"><i /><i /></div>
      <div className="nfa__main">
        <div className="nfa__copy">
          <p className="nfa__code nfa-in" style={i(0)} aria-hidden="true">404</p>
          <h1 className="h1 nfa__h nfa-in" id="nfa-h" style={i(1)}>
            <span className="sr-only">Error 404. </span>
            <span className="ln">{COPY.h1a}</span>{" "}
            <span className="ln">{COPY.h1b} <span className="ln--key"><em>{COPY.key}</em><span className="sq" aria-hidden="true" /><span className="sr-only">.</span></span></span>
          </h1>
          <p className="nfa__sub nfa-in" style={i(2)}>{COPY.sub.map((l) => <span className="bl" key={l}>{l} </span>)}</p>
          <div className="nfa__go nfa-in" style={i(3)}>
            <a className="cta" href={HOME}>{COPY.cta} <span className="arr" aria-hidden="true" /></a>
            <ul className="nfa__ways" aria-label="Other ways out">
              {WAYS.map((w) => (
                <li key={w.href}>
                  <a className={`nfa__a${ext(w.href) ? " nfa__a--ext" : ""}`} href={w.href}>
                    {w.name}{ext(w.href) && <span className="sr-only">{COPY.ext}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <footer className="nfa__foot">
        <div className="nfa__foot-in">
          <span>{COPY.copy}</span>
          <ul className="nfa__legal">{LEGAL.map((l) => <li key={l.href}><a href={l.href}>{l.name}</a></li>)}</ul>
        </div>
      </footer>
    </section>
  );
}

/** the whole page: v3's values, home v5's header (spread at the top, never hiding, the soft tone switch), the 404, the Extra chip */
export function NotFoundA() {
  return (
    <>
      <FixVersion v="v3" />
      <V3Header home={HOME} spread stay soft />
      <main id="main"><NotFoundAHero /></main>
      <ExtraChip />{/* temporary way back to /extra: remove this line to drop it */}
    </>
  );
}
