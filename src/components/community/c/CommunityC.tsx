"use client";
// near.org/community, version C · Editorial. The homepage's editorial moments and the blog post's Cover, read as one calm feature about people:
//   1 the hero: the H1 set big in Montreal Book with its Kepler word and the green square after it ("Own your world"'s hand), the subhead and the two
//     actions; under it a panorama (the misty ridges) that opens from the grid's width to the whole screen as it comes up;
//   2 the community in four figures, set large on the paper and counted once (sample values, tagged);
//   3 events: the heading and its links held on the left, the gatherings as an editorial list on the right (date, title, city, kind);
//   4 the Legion: the dark band. Its heading, then its statement set large and wiped from faint to paper as it is read, the members line and the action;
//   5 socials: the dek in Kepler, then the channels as a refined two-column index (number, name, line, handle);
//   6 ways to get involved: a tall photo (the fern unfurling) beside four numbered ways, the numerals outlined as the Cover's sections;
//   7 the FAQ: a quiet accordion (<details>), the answers tagged as samples;
//   8 the close: the homepage's scene (shared/CloseScene), set after this component in the route (app/(site)/community-c/page.tsx).
// Copy and links: ../content.ts (the doc, verbatim; [[TBD]] there). No photo here shows a person, so no text ever sits on a face.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { EVENTS, EVENTS_HEAD, FAQ, HERO, LEGION, SOCIALS, SOCIALS_HEAD, STATS, WAYS, WAYS_HEAD } from "../content";
import { Acc, Arrow, Count, Ext, NewTab, Sample, WipeWords } from "./parts";
import { mount } from "./motion";
import "./community-c.css";

const idx = (i: number) => String(i + 1).padStart(2, "0");
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const isExt = (href: string) => /^https?:/.test(href);

export function CommunityC() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);

  return (
    <div ref={ref} className="cm-c">
      {/* ───────────── 1 · hero: the big line, then the panorama opens */}
      <header className="cm-c-hero" aria-labelledby="cm-c-h1">
        <div className="cm-c-hero__in">
          <p className="cm-c-eye" data-rv=""><i aria-hidden="true" />NEAR Community</p>
          <h1 id="cm-c-h1" className="cm-c-h1" data-rise="now"><Acc t={HERO.h1} a="web" sq /></h1>
          <div className="cm-c-hero__foot">
            <p className="cm-c-hero__sub" data-rv="" style={{ ["--rv" as string]: 2 }}>{HERO.sub}</p>
            <p className="cm-c-actions" data-rv="" style={{ ["--rv" as string]: 3 }}>
              <a className="cm-c-btn cm-c-btn--ink" href={HERO.primary.href}><span>{HERO.primary.label}</span><Arrow /></a>
              <a className="cm-c-link" href={HERO.secondary.href}><span>{HERO.secondary.label}</span><Arrow /></a>
            </p>
          </div>
        </div>
        <figure className="cm-c-bleed cm-c-hero__ph" data-open="">
          <div className="cm-c-plate" data-par="">
            {/* eslint-disable-next-line @next/next/no-img-element -- one wide still (3840 × 1648, 43 KB WebP): cheaper than any resize */}
            <img src="/images/home/rail/home-rail-ridges-wide-v1.webp" alt="" width={3840} height={1648} decoding="async" fetchPriority="low" />
          </div>
        </figure>
      </header>

      {/* ───────────── 2 · the community in four figures */}
      <section className="cm-c-sec cm-c-stats" aria-labelledby="cm-c-stats-t">
        <h2 id="cm-c-stats-t" className="sr-only">The community in numbers</h2>
        <ul className="cm-c-stats__row">
          {STATS.map((s, i) => (
            <li key={s.label} className="cm-c-stat" data-rv="" style={{ ["--rv" as string]: i }}>
              <p className="cm-c-stat__v"><Count v={s.value} /></p>
              <p className="cm-c-stat__l">{s.label}</p>
            </li>
          ))}
        </ul>
        {STATS.some((s) => s.sample) && (
          <p className="cm-c-note" data-rv=""><Sample>Sample figures</Sample><span>Illustrative until the community team confirms the numbers.</span></p>
        )}
      </section>

      {/* ───────────── 3 · events: the head held on the left, the list on the right */}
      <section className="cm-c-sec cm-c-events" id="events" aria-labelledby="cm-c-events-t">
        <div className="cm-c-events__head">
          <div className="cm-c-sticky">
            <p className="cm-c-eye" data-rv=""><i aria-hidden="true" />Events</p>
            <h2 id="cm-c-events-t" className="cm-c-h2" data-rise=""><Acc t={EVENTS_HEAD.h} a="meets" /></h2>
            <p className="cm-c-dek cm-c-dek--l" data-rv="">{EVENTS_HEAD.sub}</p>
            <p className="cm-c-actions cm-c-actions--col" data-rv="">
              <a className="cm-c-btn" href={EVENTS_HEAD.cta.href} {...ext}><span>{EVENTS_HEAD.cta.label}</span><Ext /><NewTab /></a>
              <a className="cm-c-link" href={EVENTS_HEAD.host.href} {...ext}><span>{EVENTS_HEAD.host.label}</span><Ext /><NewTab /></a>
            </p>
          </div>
        </div>
        <div className="cm-c-events__list">
          <p className="cm-c-list__top" data-rv=""><span>Upcoming</span>{EVENTS.some((e) => e.sample) && <Sample>Sample listings</Sample>}</p>
          <ol className="cm-c-ev">
            {EVENTS.map((e, i) => {
              const [mon, day] = e.date.split(" ");
              return (
                <li key={e.title + e.city} className="cm-c-ev__i" data-rv="" style={{ ["--rv" as string]: i % 3 }}>
                  <a className="cm-c-ev__a" href={e.href} {...ext}>
                    <time className="cm-c-ev__d" dateTime={e.dateIso}><span className="cm-c-ev__day">{day}</span><span className="cm-c-ev__mon">{mon}</span></time>
                    <span className="cm-c-ev__main">
                      <span className="cm-c-ev__t">{e.title}</span>
                      <span className="cm-c-ev__m"><span>{e.city}</span><i aria-hidden="true" /><span>{e.kind}</span></span>
                    </span>
                    <Ext className="cm-c-ext cm-c-ev__go" /><NewTab />
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ───────────── 4 · the Legion: the dark band, its statement wiped from faint to paper */}
      <section className="cm-c-legion" id="legion" aria-labelledby="cm-c-legion-t" data-nav-tone="dark">
        <div className="cm-c-legion__in">
          <p className="cm-c-eye cm-c-eye--on" data-rv=""><i aria-hidden="true" />The Legion</p>
          <h2 id="cm-c-legion-t" className="cm-c-legion__h" data-rise=""><Acc t={LEGION.h} a="Legion" sq /></h2>
          <p className="cm-c-legion__body" data-wipe=""><WipeWords text={LEGION.body} /></p>
          <div className="cm-c-legion__foot" data-rv="">
            <p className="cm-c-legion__stat">{LEGION.stat.line}{LEGION.stat.sample && <Sample />}</p>
            <a className="cm-c-btn cm-c-btn--green" href={LEGION.cta.href}><span>{LEGION.cta.label}</span><Arrow /></a>
          </div>
        </div>
      </section>

      {/* ───────────── 5 · socials: the dek, then the index */}
      <section className="cm-c-sec cm-c-socials" id="socials" aria-labelledby="cm-c-socials-t">
        <div className="cm-c-center">
          <h2 id="cm-c-socials-t" className="cm-c-h2" data-rise=""><Acc t={SOCIALS_HEAD.h} a="conversation" /></h2>
          <p className="cm-c-dek" data-rv="">{SOCIALS_HEAD.sub}</p>
        </div>
        <ul className="cm-c-idx">
          {SOCIALS.map((s, i) => (
            <li key={s.key} className="cm-c-idx__i" data-rv="" style={{ ["--rv" as string]: i % 2 }}>
              <a className="cm-c-idx__a" href={s.href} {...ext}>
                <span className="cm-c-idx__n" aria-hidden="true">{idx(i)}</span>
                <span className="cm-c-idx__main">
                  <span className="cm-c-idx__name">{s.name}</span>
                  <span className="cm-c-idx__line">{s.line}</span>
                </span>
                <span className="cm-c-idx__cta"><span>{s.cta}</span><Ext /></span>
                <NewTab />
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── 6 · ways to get involved: the fern unfurling beside four numbered ways */}
      <section className="cm-c-sec cm-c-ways" id="get-involved" aria-labelledby="cm-c-ways-t">
        <h2 id="cm-c-ways-t" className="cm-c-h2 cm-c-ways__h" data-rise=""><Acc t={WAYS_HEAD.h} a="life" /></h2>
        <div className="cm-c-ways__grid">
          <figure className="cm-c-frame cm-c-ways__ph" data-rv="">
            <div className="cm-c-plate" data-par="">
              {/* eslint-disable-next-line @next/next/no-img-element -- a 1920 × 1080 still, 37 KB */}
              <img src="/images/home/home-hero-unfurl-v1.webp" alt="" width={1920} height={1080} loading="lazy" decoding="async" />
            </div>
          </figure>
          <ol className="cm-c-ways__list">
            {WAYS.map((w, i) => (
              <li key={w.key} className="cm-c-way" data-rv="" style={{ ["--rv" as string]: i % 2 }}>
                <span className="cm-c-way__n" aria-hidden="true">{idx(i)}</span>
                <h3 className="cm-c-way__t">{w.t}</h3>
                <p className="cm-c-way__b">{w.b}</p>
                <p className="cm-c-way__cta">
                  <a className="cm-c-link" href={w.href} {...(isExt(w.href) ? ext : {})}>
                    <span>{w.cta}</span>{isExt(w.href) ? <><Ext /><NewTab /></> : <Arrow />}
                  </a>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── 7 · the FAQ: a quiet accordion */}
      <section className="cm-c-sec cm-c-faq" id="faq" aria-labelledby="cm-c-faq-t">
        <div className="cm-c-faq__head">
          <h2 id="cm-c-faq-t" className="cm-c-h2" data-rise=""><Acc t="Frequently asked questions" a="questions" /></h2>
          {FAQ.some((f) => f.sample) && <p className="cm-c-faq__note" data-rv=""><Sample>Sample answers</Sample><span>The questions are final; the answers are placeholders until the community team writes them.</span></p>}
        </div>
        <div className="cm-c-faq__list">
          {FAQ.map((f, i) => (
            <details key={f.q} className="cm-c-qa" data-rv="" style={{ ["--rv" as string]: i % 3 }}>
              <summary className="cm-c-qa__q">
                <span className="cm-c-qa__n" aria-hidden="true">{idx(i)}</span>
                <span className="cm-c-qa__t">{f.q}</span>
                <i className="cm-c-qa__x" aria-hidden="true" />
              </summary>
              <div className="cm-c-qa__a">
                <p>{f.a}</p>
                {f.sample && <Sample>Sample answer</Sample>}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
