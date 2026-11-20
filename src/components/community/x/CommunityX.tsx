"use client";
// near.org/community, version X · MVP (the design review of Nov 19, 2026): C ("Editorial") made more typographic. Mostly copy, one drawing in the hero's right half, no
// eyebrows, no decorative numerals, no ruled grid near the header (the homepage's grid frames the figures, the channels and the ways), no photos. The sections, in the doc's order:
//   1 the hero: the H1 (Montreal Book, its Kepler word, the green square) with the subhead and the two actions on the left; one isometric drawing
//     on the right, filling its half of the hero (./HeroWeb.tsx: crews joined by threads, a placeholder until Ali draws it);
//   2 the community in four figures, set large on the paper (sample values, tagged);
//   3 events: the heading and its links held on the left, the gatherings as a list of dates on the right (date, title, city, kind);
//   4 the Legion: the dark band. Its heading, its statement set large and wiped from faint to paper as it is read, the members line and the action;
//   5 socials: the channels with the site's dot icons (the homepage's hand, ../../v3/header/icons.ts), at a size that reads;
//   6 ways to get involved: four short ways, each with a dot icon (drawn as it arrives, redrawn on hover);
//   (a slot for the homepage section Lawrence is building: renders nothing yet)
//   7 the FAQ: a quiet accordion (<details>), the answers tagged as samples;
//   8 the close: the homepage's scene (shared/CloseScene), set after this component in the route (app/(site)/community-x/page.tsx).
// Copy and links: ../content.ts (the doc, verbatim; [[TBD]] there).
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { EVENTS, EVENTS_HEAD, FAQ, HERO, LEGION, SOCIALS, SOCIALS_HEAD, STATS, WAYS, WAYS_HEAD } from "../content";
import { Acc, Arrow, Count, Ext, NewTab, Sample, WipeWords } from "./parts";
import { mount } from "./motion";
import { HeroWeb } from "./HeroWeb";
import "./community-x.css";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const isExt = (href: string) => /^https?:/.test(href);

// the channels drawn with the site's dot icons (public/nav/icons); the ones the set has no icon for are listed after them as plain links
const ICON: Record<string, string> = { x: "x", discord: "discord", telegram: "telegram", github: "github", reddit: "reddit", youtube: "youtube" };
const WITH_ICON = SOCIALS.filter((s) => ICON[s.key]);
const ALSO = SOCIALS.filter((s) => !ICON[s.key]);
// the ways to get involved, each with a dot icon (public/nav/icons): drawn as it arrives and again when its cell is hovered
const WAY_ICON: Record<string, string> = { host: "calendar", campus: "campus", code: "code", content: "create" };

export function CommunityX() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);

  return (
    <div ref={ref} className="cmx">
      {/* ───────────── 1 · hero: the line, the subhead and the actions; one drawing beside them */}
      <header className="cmx-hero" aria-labelledby="cmx-h1">
        <div className="cmx-hero__text">
          <h1 id="cmx-h1" className="cmx-h1" data-rise="now"><Acc t={HERO.h1} a="web" sq /></h1>
          <p className="cmx-hero__sub" data-rv="" style={{ ["--rv" as string]: 2 }}>{HERO.sub}</p>
          <p className="cmx-actions" data-rv="" style={{ ["--rv" as string]: 3 }}>
            <a className="cmx-btn cmx-btn--ink" href={HERO.primary.href}><span>{HERO.primary.label}</span><Arrow /></a>
            <a className="cmx-link" href={HERO.secondary.href}><span>{HERO.secondary.label}</span><Arrow /></a>
          </p>
        </div>
        {/* [[TBD: graphic by Ali]] */}
        <figure className="cmx-hero__art" data-rv="" style={{ ["--rv" as string]: 4 }} aria-hidden="true"><HeroWeb /></figure>
      </header>

      {/* ───────────── 2 · the community in four figures */}
      <section className="cmx-sec cmx-stats" aria-labelledby="cmx-stats-t">
        <h2 id="cmx-stats-t" className="sr-only">The community in numbers</h2>
        <ul className="cmx-grid cmx-stats__row">
          {STATS.map((s, i) => (
            <li key={s.label} className="cmx-cell">
              <div className="cmx-stat" data-rv="" style={{ ["--rv" as string]: i }}>
                <p className="cmx-stat__v"><Count v={s.value} /></p>
                <p className="cmx-stat__l">{s.label}</p>
              </div>
            </li>
          ))}
        </ul>
        {STATS.some((s) => s.sample) && (
          <p className="cmx-note" data-rv=""><Sample>Sample figures</Sample><span>Illustrative until the community team confirms the numbers.</span></p>
        )}
      </section>

      {/* ───────────── 3 · events: the head held on the left, the dates on the right */}
      <section className="cmx-sec cmx-events" id="events" aria-labelledby="cmx-events-t">
        <div className="cmx-events__head">
          <div className="cmx-sticky">
            <h2 id="cmx-events-t" className="cmx-h2" data-rise=""><Acc t={EVENTS_HEAD.h} a="meets" /></h2>
            <p className="cmx-lede" data-rv="">{EVENTS_HEAD.sub}</p>
            <p className="cmx-actions cmx-actions--col" data-rv="">
              <a className="cmx-btn" href={EVENTS_HEAD.cta.href} {...ext}><span>{EVENTS_HEAD.cta.label}</span><Ext /><NewTab /></a>
              <a className="cmx-link" href={EVENTS_HEAD.host.href} {...ext}><span>{EVENTS_HEAD.host.label}</span><Ext /><NewTab /></a>
            </p>
          </div>
        </div>
        <div className="cmx-events__list">
          <ol className="cmx-ev">
            {EVENTS.map((e, i) => {
              const [mon, day] = e.date.split(" ");
              return (
                <li key={e.title + e.city} className="cmx-ev__i" data-rv="" style={{ ["--rv" as string]: i % 3 }}>
                  <a className="cmx-ev__a" href={e.href} {...ext}>
                    <time className="cmx-ev__d" dateTime={e.dateIso}><span className="cmx-ev__mon">{mon}</span> <span className="cmx-ev__day">{day}</span></time>
                    <span className="cmx-ev__main">
                      <span className="cmx-ev__t">{e.title}</span>
                      <span className="cmx-ev__m">{e.city} · {e.kind}</span>
                    </span>
                    <Ext className="cmx-ext cmx-ev__go" /><NewTab />
                  </a>
                </li>
              );
            })}
          </ol>
          {EVENTS.some((e) => e.sample) && <p className="cmx-note" data-rv=""><Sample>Sample listings</Sample><span>Until the Luma calendar feeds this list.</span></p>}
        </div>
      </section>

      {/* ───────────── 4 · the Legion: the dark band, its statement wiped from faint to paper */}
      <section className="cmx-legion" id="legion" aria-labelledby="cmx-legion-t" data-nav-tone="dark">
        <div className="cmx-legion__in">
          <h2 id="cmx-legion-t" className="cmx-legion__h" data-rise=""><Acc t={LEGION.h} a="Legion" sq /></h2>
          <p className="cmx-legion__body" data-wipe=""><WipeWords text={LEGION.body} /></p>
          <div className="cmx-legion__foot" data-rv="">
            <p className="cmx-legion__stat">{LEGION.stat.line}{LEGION.stat.sample && <Sample />}</p>
            <a className="cmx-btn cmx-btn--green" href={LEGION.cta.href}><span>{LEGION.cta.label}</span><Arrow /></a>
          </div>
        </div>
      </section>

      {/* ───────────── 5 · socials: the channels, each with its dot icon */}
      <section className="cmx-sec cmx-socials" id="socials" aria-labelledby="cmx-socials-t">
        <div className="cmx-socials__head">
          <h2 id="cmx-socials-t" className="cmx-h2" data-rise=""><Acc t={SOCIALS_HEAD.h} a="conversation" /></h2>
          <p className="cmx-lede" data-rv="">{SOCIALS_HEAD.sub}</p>
        </div>
        <ul className="cmx-grid cmx-ch">
          {WITH_ICON.map((s, i) => (
            <li key={s.key} className="cmx-cell">
              <a className="cmx-ch__a" href={s.href} {...ext} data-rv="" style={{ ["--rv" as string]: i % 3 }}>
                <i className="cmx-ch__ic" data-icon={ICON[s.key]} aria-hidden="true" />
                <span className="cmx-ch__name">{s.name}</span>
                <span className="cmx-ch__line">{s.line}</span>
                <span className="cmx-ch__cta"><span>{s.cta}</span><Ext /></span>
                <NewTab />
              </a>
            </li>
          ))}
        </ul>
        {ALSO.length > 0 && (
          <p className="cmx-also" data-rv="">
            <span>Also on</span>
            {ALSO.map((s) => (
              <a key={s.key} className="cmx-link" href={s.href} {...ext}><span>{s.name}</span><Ext /><NewTab /></a>
            ))}
          </p>
        )}
      </section>

      {/* ───────────── 6 · ways to get involved: four short ways, each with its dot icon */}
      <section className="cmx-sec cmx-ways" id="get-involved" aria-labelledby="cmx-ways-t">
        <h2 id="cmx-ways-t" className="cmx-h2 cmx-ways__h" data-rise=""><Acc t={WAYS_HEAD.h} a="life" /></h2>
        <ul className="cmx-grid cmx-ways__list">
          {WAYS.map((w, i) => (
            <li key={w.key} className="cmx-cell">
              <div className="cmx-way" data-rv="" style={{ ["--rv" as string]: i }}>
                {WAY_ICON[w.key] && <i className="cmx-way__ic" data-icon={WAY_ICON[w.key]} aria-hidden="true" />}
                <h3 className="cmx-way__t">{w.t}</h3>
                <p className="cmx-way__b">{w.b}</p>
                <p className="cmx-way__cta">
                  <a className="cmx-link" href={w.href} {...(isExt(w.href) ? ext : {})}>
                    <span>{w.cta}</span>{isExt(w.href) ? <><Ext /><NewTab /></> : <Arrow />}
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* [[TBD: section from the homepage (Lawrence)]] */}

      {/* ───────────── 7 · the FAQ: a quiet accordion */}
      <section className="cmx-sec cmx-faq" id="faq" aria-labelledby="cmx-faq-t">
        <div className="cmx-faq__head">
          <h2 id="cmx-faq-t" className="cmx-h2" data-rise=""><Acc t="Frequently asked questions" a="questions" /></h2>
          {FAQ.some((f) => f.sample) && <p className="cmx-faq__note" data-rv=""><Sample>Sample answers</Sample><span>The questions are final; the answers are placeholders until the community team writes them.</span></p>}
        </div>
        <div className="cmx-faq__list">
          {FAQ.map((f, i) => (
            <details key={f.q} className="cmx-qa" data-rv="" style={{ ["--rv" as string]: i % 3 }}>
              <summary className="cmx-qa__q">
                <span className="cmx-qa__t">{f.q}</span>
                <i className="cmx-qa__x" aria-hidden="true" />
              </summary>
              <div className="cmx-qa__a">
                <p>{f.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
