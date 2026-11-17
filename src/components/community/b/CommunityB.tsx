"use client";
// near.org/community, version B: "Drawn". The Foundation page's hand (paper, ink hairlines, white tops, light grey sides, one green; the ruled grid of
// v3/proof-deeper) telling the community's story in new isometric drawings. From the top (the doc's order):
//   1 hero: the map of crews: local crews and the stage they meet at, joined by arcs with signals running (HeroCrews.tsx; alive, leans to the pointer);
//      the four community figures in one ruled row under it, each with its small drawing (Sample: the doc leaves the figures open);
//   2 events (#events): a box on the grid: the stage drawing (the rows fill, the lights sweep) | the upcoming events as a ruled list (Sample);
//   3 the Legion: the dark band, wide: the text | a formation that falls into ranks as it scrolls in (LegionFormation.tsx);
//   4 socials: the eight channels, each mark laid on an iso tile that lifts on hover;
//   5 ways to get involved (#get-involved): one plot that becomes each way as the four pass by (WaysScene.tsx), the steps on a dotted axis;
//   6 FAQ: a ruled accordion (<details>), the answers marked as sample until the community team writes them;
//   7 the close: the homepage's meadow, the line and its two buttons, the newsletter under it.
// Copy and links: ../content.ts, verbatim ([[TBD]]: figures, events feed, FAQ answers, some links).
import { useRef, useState, type FormEvent } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { HERO, STATS, EVENTS_HEAD, EVENTS, LEGION, SOCIALS_HEAD, SOCIALS, WAYS, FAQ, CLOSE } from "../content";
import { HeroCrews } from "./HeroCrews";
import { EventStage } from "./EventStage";
import { LegionFormation } from "./LegionFormation";
import { WaysScene } from "./WaysScene";
import { STAT_GLYPHS, ChannelTile } from "./Glyphs";
import { Arrow, Count, Ext, Sample, Words } from "./parts";
import { mountAll } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./community-b.css";

const idx = (i: number) => String(i + 1).padStart(2, "0");
const ext = (h: string) => /^https?:/.test(h);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Newsletter() {
  const [state, setState] = useState<"idle" | "bad" | "done">("idle");
  const [email, setEmail] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setState(EMAIL.test(email.trim()) ? "done" : "bad");
  };
  return (
    <form className="cb-nl" onSubmit={submit} noValidate data-rv="">
      <p className="cb-nl__h">{CLOSE.newsletter.h}</p>
      <p className="cb-nl__sub">{CLOSE.newsletter.sub}</p>
      {state === "done" ? (
        <p className="cb-nl__ok" role="status">Thanks: {email.trim()} is noted. <span>Preview only: the sign-up is not connected yet.</span></p>
      ) : (
        <>
          <label className="sr-only" htmlFor="cb-nl-email">Email address</label>
          <div className="cb-nl__field">
            <input id="cb-nl-email" type="email" autoComplete="email" placeholder="you@example.com" value={email}
              onChange={(e) => { setEmail(e.target.value); if (state === "bad") setState("idle"); }} aria-invalid={state === "bad"} aria-describedby="cb-nl-err" />
            <button type="submit" className="cb-btn cb-btn--fill"><span>{CLOSE.newsletter.cta}</span></button>
          </div>
          <p className="cb-nl__err" id="cb-nl-err" aria-live="polite">{state === "bad" ? "Enter a valid email address." : ""}</p>
        </>
      )}
    </form>
  );
}

export function CommunityB() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mountAll);
  return (
    <div ref={ref} className="l-page cm-b">
      {/* ───────────── 1 · hero: the map of crews */}
      <section className="cb-hero" aria-labelledby="cb-h1">
        <div className="cb-hero__stage">
          <HeroCrews />
          <div className="cb-hero__copy">
            <p className="cb-kick" data-hero-up=""><i aria-hidden="true" />NEAR Community</p>
            <h1 id="cb-h1" className="cb-h1"><Words text={HERO.h1} accent={["open", "web"]} /></h1>
            <p className="cb-hero__sub" data-hero-up="">{HERO.sub}</p>
            <p className="cb-hero__btns" data-hero-up="">
              <a className="cb-btn cb-btn--fill" href={HERO.primary.href}><span>{HERO.primary.label}</span></a>
              <a className="cb-btn" href={HERO.secondary.href}><span>{HERO.secondary.label}</span></a>
            </p>
          </div>
        </div>
      </section>

      {/* the community in four figures: one ruled row, a small drawing in each cell */}
      <section className="l-sec cb-stats" aria-labelledby="cb-stats-t">
        <h2 id="cb-stats-t" className="sr-only">The community in numbers</h2>
        <ul className="l-row cb-stats__row" data-row="">
          {STATS.map((s, i) => {
            const G = STAT_GLYPHS[i];
            return (
              <li key={s.label} className="l-cell cb-stat">
                <div className="cb-stat__art"><G /></div>
                <p className="cb-stat__v"><Count v={s.value} delay={i * 90} /></p>
                <p className="cb-stat__l">{s.label}{s.sample && <Sample />}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ───────────── 2 · events: the stage | the list */}
      <section className="l-sec cb-ev" id="events" aria-labelledby="cb-ev-t">
        <div className="l-row cb-head" data-row="">
          <div className="l-cell cb-head__h">
            <p className="cb-eb" data-rv=""><span className="cb-n">01</span>Events</p>
            <h2 id="cb-ev-t" className="cb-h2" data-rv="">Where the community <span className="accent">meets</span></h2>
          </div>
          <div className="l-cell cb-head__end">
            <p className="l-lede" data-rv="">{EVENTS_HEAD.sub}</p>
          </div>
        </div>
        <div className="l-row cb-ev__row" data-row="">
          <div className="l-cell cb-ev__art"><figure className="cb-fig"><EventStage /></figure></div>
          <div className="l-cell cb-ev__list">
            <p className="cb-ev__note"><Sample>Sample</Sample>Placeholder events until the calendar feed is connected.</p>
            <ol className="cb-evs">
              {EVENTS.map((e, i) => (
                <li key={e.title} style={{ ["--r" as string]: i }}>
                  <a className="cb-evt" href={e.href}>
                    <time className="cb-evt__d" dateTime={e.dateIso}><span>{e.date.split(" ")[0]}</span><b>{e.date.split(" ")[1]}</b></time>
                    <span className="cb-evt__t"><span className="cb-evt__n">{e.title}</span><span className="cb-evt__m">{e.city}</span></span>
                    <span className={`cb-evt__k cb-evt__k--${e.kind.split(" ")[0].toLowerCase()}`}><i aria-hidden="true" />{e.kind}</span>
                    <Ext className="cb-ext cb-evt__go" />
                  </a>
                </li>
              ))}
            </ol>
            <p className="cb-ev__ctas">
              <a className="cb-btn cb-btn--fill" href={EVENTS_HEAD.cta.href}><span>{EVENTS_HEAD.cta.label}</span></a>
              <a className="l-link" href={EVENTS_HEAD.host.href}><span>{EVENTS_HEAD.host.label}</span><Arrow /></a>
            </p>
          </div>
        </div>
      </section>

      {/* ───────────── 3 · the Legion, on the dark */}
      <section className="l-sec cb-lg" id="legion" aria-labelledby="cb-lg-t" data-nav-tone="dark">
        <div className="l-row cb-lg__row" data-row="">
          <div className="l-cell cb-lg__txt">
            <p className="cb-eb cb-eb--n" data-rv=""><span className="cb-n">02</span>The Legion</p>
            <h2 id="cb-lg-t" className="cb-h2 cb-lg__h" data-rv="">Join the <span className="accent">Legion.</span></h2>
            <p className="cb-lg__b" data-rv="">{LEGION.body}</p>
            <p className="cb-lg__cta" data-rv=""><a className="cb-btn cb-btn--paper" href={LEGION.cta.href}><span>{LEGION.cta.label}</span></a></p>
            <p className="cb-lg__stat" data-rv=""><i aria-hidden="true" />{LEGION.stat.line}{LEGION.stat.sample && <Sample />}</p>
          </div>
          <div className="l-cell cb-lg__art"><figure className="cb-fig"><LegionFormation /></figure></div>
        </div>
      </section>

      {/* ───────────── 4 · socials: the channels on their tiles */}
      <section className="l-sec cb-so" aria-labelledby="cb-so-t">
        <div className="l-row cb-head" data-row="">
          <div className="l-cell cb-head__h">
            <p className="cb-eb" data-rv=""><span className="cb-n">03</span>Channels</p>
            <h2 id="cb-so-t" className="cb-h2" data-rv="">Join the <span className="accent">conversation</span></h2>
          </div>
          <div className="l-cell cb-head__end"><p className="l-lede" data-rv="">{SOCIALS_HEAD.sub}</p></div>
        </div>
        {[SOCIALS.slice(0, 4), SOCIALS.slice(4)].map((row, r) => (
          <ul key={r} className="l-row cb-so__row" data-row="">
            {row.map((s) => (
              <li key={s.key} className="l-cell cb-so__cell">
                <a className="cb-chan-a" href={s.href}>
                  <ChannelTile k={s.key} />
                  <span className="cb-chan-a__n">{s.name}</span>
                  <span className="cb-chan-a__l">{s.line}</span>
                  <span className="cb-chan-a__c">{s.cta}<Ext /></span>
                </a>
              </li>
            ))}
          </ul>
        ))}
      </section>

      {/* ───────────── 5 · ways to get involved: one plot that becomes each way */}
      <section className="l-sec cb-wy" id="get-involved" aria-labelledby="cb-wy-t">
        <div className="l-row cb-head" data-row="">
          <div className="l-cell cb-head__h">
            <p className="cb-eb" data-rv=""><span className="cb-n">04</span>Get involved</p>
            <h2 id="cb-wy-t" className="cb-h2" data-rv="">Bring your ideas to <span className="accent">life</span></h2>{/* WAYS_HEAD.h */}
          </div>
        </div>
        <div className="cb-wy__story">
          <div className="cb-wy__fig">
            <div className="cb-wy__sticky">
              <WaysScene stage={0} className="wy--main" />
              <p className="cb-wy__count" aria-hidden="true"><span className="cb-wy__ci">{WAYS.map((_, i) => <span key={i}>{idx(i)}</span>)}</span><span>/ {idx(WAYS.length - 1)}</span></p>
            </div>
          </div>
          <div className="cb-wy__list">
            <span className="cb-wy__axis" aria-hidden="true"><span className="cb-wy__fill" /></span>
            <ol className="cb-wy__steps">
              {WAYS.map((w, i) => (
                <li key={w.key} className="cb-wy__step" data-step={i}>
                  <div className="cb-wy__mfig"><WaysScene stage={i} draw /></div>
                  <p className="cb-wy__num"><span className="cb-wy__tick" aria-hidden="true"><i /></span><span className="cb-n">{idx(i)}</span></p>
                  <h3 className="cb-h3">{w.t}</h3>
                  <p className="cb-body">{w.b}</p>
                  <p className="cb-wy__cta"><a className="l-link" href={w.href}><span>{w.cta}</span>{ext(w.href) ? <Ext /> : <Arrow />}</a></p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ───────────── 6 · FAQ: a ruled accordion */}
      <section className="l-sec cb-faq" aria-labelledby="cb-faq-t">
        <div className="l-row cb-faq__row" data-row="">
          <div className="l-cell cb-faq__h">
            <p className="cb-eb" data-rv=""><span className="cb-n">05</span>FAQ</p>
            <h2 id="cb-faq-t" className="cb-h2" data-rv="">Frequently asked <span className="accent">questions</span></h2>
            <p className="cb-faq__note" data-rv=""><Sample>Sample answers</Sample>The community team will write the final answers.</p>
          </div>
          <div className="l-cell cb-faq__list">
            {FAQ.map((q, i) => (
              <details key={q.q} className="cb-q" data-rv="">
                <summary className="cb-q__s">
                  <span className="cb-q__i" aria-hidden="true">{idx(i)}</span>
                  <span className="cb-q__t">{q.q}</span>
                  <span className="cb-q__pm" aria-hidden="true"><i /><i /></span>
                </summary>
                <div className="cb-q__a"><p>{q.a}</p></div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── 7 · the close: the meadow, the line, the newsletter */}
      <section className="l-sec cb-close" aria-labelledby="cb-close-t">
        <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>
        <div className="l-bleed-wrap">
          <div className="l-bleed cb-close__bleed" data-bleed="">
            <div className="l-ph l-bleed__ph" data-ph=""><div className="l-plate"><img className="l-img" src="/v3/bleed-meadow.webp" alt="" loading="lazy" decoding="async" /></div></div>
            <div className="l-bleed__in cb-close__in">
              <h2 id="cb-close-t" className="cb-close__h" data-rv="">Start building the <span className="accent">open web.</span></h2>
              <p className="cb-close__sub" data-rv="">{CLOSE.sub}</p>
              <p className="cb-close__btns" data-rv="">
                <a className="cb-btn cb-btn--fill" href={CLOSE.primary.href}><span>{CLOSE.primary.label}</span></a>
                <a className="cb-btn cb-btn--glass" href={CLOSE.secondary.href}><span>{CLOSE.secondary.label}</span></a>
              </p>
              <Newsletter />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
