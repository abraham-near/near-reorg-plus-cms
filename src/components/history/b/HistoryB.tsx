"use client";
// near.org/about (History), version B: "Drawn". The Foundation page's hand (paper, ink hairlines, white tops, light grey sides, one green; v3's ruled
// grid) telling NEAR's story from 2017 to now in isometric line drawings that build as you scroll. From the top:
//   1 hero: the headline rises word by word; under it the road from 2017 to 2026, ten stones climbing to the green one, now (HeroRoad.tsx);
//   2 origin: the text | the Transformer paper with a sentence attending to itself, and the year (Scenes.tsx PaperScene);
//   3 the timeline: the four chapters, each milestone a ruled row (the year | its drawing | the text); a green line runs down the grid's left rule as you
//     read and marks each year it reaches; the last milestone, now, is lit;
//   4 today, on the dark: the text | the integrated stack, four layers that settle as it scrolls in (TodayStack.tsx);
//   5 ahead: calm: the line, the three things you own (a small drawing each), the closing sentence.
// The close is the homepage's scene (shared/CloseScene.tsx), set after this in the route (app/(site)/about-b).
// Copy: ../content.ts, verbatim. Local: the timeline's heading ("From 2017 to now", the header's own words for this page) and the section labels.
import { useRef, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { HERO, ORIGIN, ERAS, MILESTONES, TODAY, AHEAD } from "../content";
import { Arrow, Ext } from "../../community/b/parts";
import { HeroRoad } from "./HeroRoad";
import { PaperScene, SCENES, OWNS } from "./Scenes";
import { TodayStack } from "./TodayStack";
import { mountAll } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./history-b.css";

const idx = (i: number) => String(i + 1).padStart(2, "0");
const ext = (h: string) => /^https?:/.test(h);
const span = (from: number, to: number) => (from === to ? String(from) : `${from}–${to}`);

/** a heading's text with one phrase set in Kepler (`<span className="accent">`) */
function Accent({ text, accent }: { text: string; accent: string }) {
  const k = text.lastIndexOf(accent);
  if (k < 0) return <>{text}</>;
  return <>{text.slice(0, k)}<span className="accent">{accent}</span>{text.slice(k + accent.length)}</>;
}

function Btn({ href, label, fill }: { href: string; label: string; fill?: boolean }) {
  return <a className={`hb-btn${fill ? " hb-btn--fill" : ""}`} href={href}><span>{label}</span>{ext(href) && <Ext className="hb-ext" />}</a>;
}

function Eyebrow({ n, children, night }: { n: string; children: ReactNode; night?: boolean }) {
  return <p className={`hb-eb${night ? " hb-eb--n" : ""}`} data-rv=""><span className="hb-n">{n}</span>{children}</p>;
}

export function HistoryB() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mountAll);
  return (
    <div ref={ref} className="l-page hi-b">
      {/* ───────────── 1 · hero: the headline, the road from 2017 to now */}
      <section className="hb-hero" aria-labelledby="hb-h1">
        <div className="hb-hero__copy">
          <p className="hb-kick" data-hero-up=""><i aria-hidden="true" />{HERO.eyebrow}</p>
          <div className="hb-hero__grid">
            <h1 id="hb-h1" className="hb-h1"><Accent text={HERO.h1} accent={HERO.accent} /></h1>
            <div className="hb-hero__side">
              <p className="hb-hero__sub" data-hero-up="">{HERO.sub}</p>
              <p className="hb-hero__btns" data-hero-up="">
                <Btn href={HERO.primary.href} label={HERO.primary.label} fill />
                <Btn href={HERO.secondary.href} label={HERO.secondary.label} />
              </p>
            </div>
          </div>
        </div>
        <HeroRoad />
      </section>

      {/* ───────────── 2 · origin: the text | the paper */}
      <section className="l-sec hb-or" id="origin" aria-labelledby="hb-or-t">
        <div className="l-row hb-or__row" data-row="">
          <div className="l-cell hb-or__txt">
            <Eyebrow n="01">Origin</Eyebrow>
            <h2 id="hb-or-t" className="hb-h2"><Accent text={ORIGIN.h} accent="AI company" /></h2>
            {ORIGIN.body.map((p) => <p key={p.slice(0, 24)} className="hb-body" data-rv="">{p}</p>)}
          </div>
          <div className="l-cell hb-or__art">
            <figure className="hb-fig"><PaperScene /></figure>
            <p className="hb-or__stat" data-rv=""><span className="hb-or__v">{ORIGIN.stat.value}</span><span className="hb-or__l">{ORIGIN.stat.label}</span></p>
          </div>
        </div>
      </section>

      {/* ───────────── 3 · the timeline: chapters and milestones on the grid; the road runs down its left rule */}
      <section className="l-sec hb-tl" id="timeline" aria-labelledby="hb-tl-t">
        <div className="l-row hb-head" data-row="">
          <div className="l-cell hb-head__h">
            <Eyebrow n="02">Timeline</Eyebrow>
            <h2 id="hb-tl-t" className="hb-h2">From 2017 to <span className="accent">now</span></h2>
          </div>
          <div className="l-cell hb-head__end">
            <ol className="hb-chap" data-rv="">
              {ERAS.map((e, i) => <li key={e.id}><span className="hb-chap__i">{idx(i)}</span><span className="hb-chap__t">{e.label}</span><span className="hb-chap__y">{span(e.from, e.to)}</span></li>)}
            </ol>
          </div>
        </div>
        <div className="hb-tl__list">
          <span className="hb-tl__road" aria-hidden="true"><span className="hb-tl__fill" /></span>
          {ERAS.map((e, ei) => (
            <div key={e.id} className="hb-era">
              <div className="l-row hb-era__row" data-row="">
                <div className="l-cell hb-era__c">
                  <p className="hb-era__l" data-rv=""><span className="hb-n">Chapter {idx(ei)}</span><span className="hb-era__t">{e.label}</span><span className="hb-era__y">{span(e.from, e.to)}</span></p>
                </div>
              </div>
              <ol className="hb-ms__list">
                {MILESTONES.filter((x) => x.era === e.id).map((x) => {
                  const S = SCENES[MILESTONES.indexOf(x)];   // SCENES is in the milestones' order
                  return (
                    <li key={x.title} className={`l-row hb-ms${x.now ? " hb-ms--now" : ""}`} data-row="">
                      <div className="l-cell hb-ms__when">
                        <p className="hb-ms__yr" data-rv="">{x.year}</p>
                        {x.now && <p className="hb-ms__now" data-rv=""><i aria-hidden="true" />Now</p>}
                      </div>
                      <div className="l-cell hb-ms__art">{S && <figure className="hb-fig"><S /></figure>}</div>
                      <div className="l-cell hb-ms__txt">
                        <h3 className="hb-h3" data-rv="">{x.title}</h3>
                        <p className="hb-body" data-rv="">{x.body}</p>
                        <ul className="hb-tags" data-rv="">{x.tags.map((t) => <li key={t}>{t}</li>)}</ul>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── 4 · today, on the dark: the text | the stack */}
      <section className="l-sec hb-td" id="today" aria-labelledby="hb-td-t" data-nav-tone="dark">
        <div className="l-row hb-td__row" data-row="">
          <div className="l-cell hb-td__txt">
            <Eyebrow n="03" night>Today</Eyebrow>
            <h2 id="hb-td-t" className="hb-h2 hb-td__h"><Accent text={TODAY.h} accent="blockchain" /></h2>
            <p className="hb-td__b" data-rv="">{TODAY.body}</p>
            <p className="hb-td__cta" data-rv=""><a className="l-link hb-link--n" href={TODAY.link.href}><span>{TODAY.link.label}</span><Arrow /></a></p>
          </div>
          <div className="l-cell hb-td__art"><TodayStack layers={TODAY.layers} /></div>
        </div>
      </section>

      {/* ───────────── 5 · ahead: calm */}
      <section className="l-sec hb-ah" id="ahead" aria-labelledby="hb-ah-t">
        <div className="l-row hb-head" data-row="">
          <div className="l-cell hb-head__h">
            <Eyebrow n="04">Ahead</Eyebrow>
            <h2 id="hb-ah-t" className="hb-h2 hb-ah__h"><Accent text={AHEAD.h} accent="back end." /></h2>
          </div>
          <div className="l-cell hb-head__end"><p className="l-lede" data-rv="">{AHEAD.body}</p></div>
        </div>
        <ul className="l-row hb-own" data-row="">
          {AHEAD.owns.map((o, i) => {
            const G = OWNS[i];
            return (
              <li key={o} className="l-cell hb-own__c">
                <div className="hb-own__art">{G && <G />}</div>
                <p className="hb-own__t" data-rv=""><span className="hb-n">{idx(i)}</span>{o}</p>
              </li>
            );
          })}
        </ul>
        <div className="l-row hb-ah__end" data-row="">
          <div className="l-cell"><p className="hb-ah__line" data-rv="">{AHEAD.line}</p></div>
        </div>
      </section>
    </div>
  );
}
