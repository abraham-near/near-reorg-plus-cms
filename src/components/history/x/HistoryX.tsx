"use client";
// near.org/history, version X · "MVP" (design review, Nov 19 2026): built from A (the homepage's ruled grid) and made to sit beside the homepage: mostly
// copy, the grid where it earns its place, no eyebrows or decorative numbers. From the top:
//   1 the hero, on bare paper like the homepage's (no grid, no crosshair near the header): the H1 with its Kepler word, the subhead, the two actions |
//     beside them (under them on phones), a small isometric drawing, decorative: a flight of steps from 2017 to 2026, the top one green (HeroIso.tsx);
//   2 Origin, plain text: the heading | the two paragraphs (no stat block, no photo);
//   3 the milestones as a short story, after the homepage's rail (simpler): the heading row, then one ruled cell the years travel through sideways while
//     the section is pinned, three at a time: the year on show at the centre with its title and text (its marker green), the others faint (their text
//     kept, at low opacity), 2017 first and 2026 last; one ink line through them all. Phones and reduced motion: no pin,
//     the rail scrolls sideways by hand (snapping to each year);
//   4 Today, on the grid: the heading | the statement and the link, in one ruled row; the grid runs on into the close;
// AHEAD is not rendered (its lines are on the homepage already). The close is the homepage's scene (shared/CloseScene.tsx), set after this in the route.
// Copy and links: ../content.ts (verbatim).
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { HERO, MILESTONES, ORIGIN, TODAY } from "../content";
import { Acc, Arrow } from "./parts";
import { HeroIso } from "./HeroIso";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./history-x.css";

const isExt = (h: string) => /^https?:/.test(h);
const ext = (h: string) => (isExt(h) ? { target: "_blank", rel: "noopener noreferrer" } : {});
const ExtSr = ({ h }: { h: string }) => (isExt(h) ? <span className="sr-only"> (opens another site)</span> : null);

export function HistoryX() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);

  return (
    <div ref={ref} className="l-page hs-x">
      {/* ───────────── 1 · hero: the type | the drawing (decorative), no grid */}
      <section className="hx-hero" aria-labelledby="hx-h1">
        <div className="hx-hero__text">
          <h1 id="hx-h1" className="hx-h1" data-h1=""><Acc h={HERO.h1} a={HERO.accent} /></h1>
          <p className="hx-hero__sub" data-in="">{HERO.sub}</p>
          <p className="hx-acts" data-in="">
            <a className="l-btn hx-btn" href={HERO.primary.href} {...ext(HERO.primary.href)}><span>{HERO.primary.label}</span><ExtSr h={HERO.primary.href} /></a>
            <a className="l-link" href={HERO.secondary.href} {...ext(HERO.secondary.href)}><span>{HERO.secondary.label}</span><Arrow /></a>
          </p>
        </div>
        <div className="hx-hero__art"><HeroIso /></div>
      </section>

      {/* ───────────── 2 · Origin: plain text */}
      <section className="hx-sec hx-origin" id="origin" aria-labelledby="hx-or-t">
        <h2 id="hx-or-t" className="l-h2 hx-h2" data-up=""><Acc h={ORIGIN.h} a="AI company" /></h2>
        <div className="hx-origin__body">
          {ORIGIN.body.map((p) => <p key={p.slice(0, 24)} data-up="">{p}</p>)}
        </div>
      </section>

      {/* ───────────── 3 · the milestones: a quiet rail, sideways (the homepage's rail, simpler): on the grid, pinned while the years go by */}
      <section className="l-sec hx-ms" id="milestones" aria-labelledby="hx-ms-t">
        <div className="hx-ms__pin">
          <div className="l-row hx-ms__head" data-row="">
            <div className="l-cell hx-ms__h">
              <h2 id="hx-ms-t" className="l-h2" data-rv="">From 2017 to now</h2>
            </div>
          </div>
          <div className="l-row hx-ms__row" data-row="">
            {/* not pinned (phones, reduced motion): the rail scrolls sideways under the finger or the keyboard */}
            <div className="l-cell hx-rail" tabIndex={0} role="region" aria-labelledby="hx-ms-t">
              <ol className="hx-rail__track">
                {MILESTONES.map((m) => (
                  <li key={m.year + m.title} className="hx-st" data-st="">
                    <p className="hx-st__y">{m.year}</p>
                    <div className="hx-st__body">
                      <i className="hx-st__dot" aria-hidden="true" />
                      <h3 className="hx-st__t">{m.title}</h3>
                      <p className="hx-st__b">{m.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 4 · Today, on the grid: the heading | the statement and the link, one ruled row */}
      <section className="l-sec hx-today" id="today" aria-labelledby="hx-td-t">
        <div className="l-row hx-td__head" data-row="">
          <div className="l-cell"><h2 id="hx-td-t" className="l-h2 hx-h2" data-rv=""><Acc h={TODAY.h} a="blockchain" /></h2></div>
          <div className="l-cell hx-td__copy">
            <p className="l-lede" data-rv="">{TODAY.body}</p>
            <p data-rv=""><a className="l-link" href={TODAY.link.href}><span>{TODAY.link.label}</span><Arrow /></a></p>
          </div>
        </div>
      </section>
    </div>
  );
}
