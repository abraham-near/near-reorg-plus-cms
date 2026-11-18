"use client";
// near.org/community, version A · "Ruled grid": the page built from the lower half of the homepage (v3/proof-deeper: ruled rows that draw in, + crosshairs,
// the proof strip under its green rule, full-bleed photos that open to the whole screen, Get into NEAR's ink rows and preview, the newsletter field), Blog J's
// ruled hero and bar, NEAR Foundation's pillars (an icon and a mono label per cell) and its Council band on the Stack's dark. From the top (the doc's order):
//   1 hero: Blog J's ruled head (the H1 and the two actions | the subhead), its bar (on this page · the next event), then the bridge as a wide panorama;
//   2 community stats: the proof strip, four figures with their icons, counting up once (SAMPLE, each marked);
//   3 events: the head, then six event cells on two ruled rows (date, kind, title, city; SAMPLE until the Luma feed), the host link in the foot row;
//   4 the Legion: a full-bleed photo (the colonnade) that opens to the whole screen; the call over its sky, the member line (SAMPLE) at its foot;
//   5 socials: the eight channels as pillar cells on the dark band;
//   6 ways to get involved: Get into NEAR's rows (ink on hover) beside the preview photo;
//   7 FAQ: the questions as an accordion (<details>), the answers marked SAMPLE;
//   8 the close: the meadow, the line and the two actions, then the newsletter on the grid.
// Copy and links: ../content.ts (the doc, verbatim; [[TBD]] there for figures, answers and some links).
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { CLOSE, EVENTS, EVENTS_HEAD, FAQ, HERO, LEGION, SOCIALS, SOCIALS_HEAD, STATS, WAYS, WAYS_HEAD } from "../content";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./community-a.css";

/** a heading from the content file with its Kepler word marked (the last occurrence of `a`) */
const Acc = ({ h, a }: { h: string; a: string }) => {
  const i = h.lastIndexOf(a);
  return i < 0 ? <>{h}</> : <>{h.slice(0, i)}<span className="accent">{a}</span>{h.slice(i + a.length)}</>;
};
const idx = (i: number) => String(i + 1).padStart(2, "0");
const isExt = (h: string) => /^https?:/.test(h);
const host = (u: string) => (isExt(u) ? new URL(u).hostname.replace(/^www\./, "") : "near.org");
const ext = (h: string) => (isExt(h) ? { target: "_blank", rel: "noopener noreferrer" } : {});
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STAT_ICON = ["people", "roadmap", "solutions", "clock"];
const WAY_IMG: Record<string, { src: string; set?: boolean }> = {
  host: { src: "/v3/deeper/bermuda.webp", set: true },
  campus: { src: "/v3/deeper/who-owns-the-rails.webp", set: true },
  code: { src: "/home/get-into/home-paths-build-v3.webp" },
  content: { src: "/v3/deeper/zodl.webp", set: true },
};
/* a Go deeper cover also comes 960 px wide: a 1x screen takes the small one */
const setOf = (src: string) => `${src.replace(".webp", "-960.webp")} 960w, ${src} 1600w`;

const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
const Ext = () => (
  <svg className="l-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>
);
const ExtSr = ({ h }: { h: string }) => (isExt(h) ? <span className="sr-only"> (opens another site)</span> : null);
const Sample = ({ children = "Sample" }: { children?: ReactNode }) => <span className="ca-tag">{children}</span>;

/** a figure that counts once (motion.ts): the ghost holds the final width, the live copy counts, the screen reader reads the value */
const Count = ({ v, delay = 0 }: { v: string; delay?: number }) => (
  <span className="ca-num" data-count={v} data-delay={delay}>
    <span className="ca-num__ghost" aria-hidden="true">{v}</span>
    <span className="ca-num__live" aria-hidden="true" data-live="">{v}</span>
    <span className="sr-only">{v}</span>
  </span>
);

/* two channels the line-icon set has no drawing for: drawn here in its hand (hairline ink, one green dot) */
const OwnIcon = ({ k }: { k: string }) => (
  <svg className="ca-own" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {k === "linkedin" ? (
      <g className="ic-ln"><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="M8 10.5V17M12 17v-6.5M12 13.5a2.8 2.8 0 0 1 5.5 0V17" /><circle className="ca-own__g" cx="8" cy="7.4" r="1.15" /></g>
    ) : (
      <g className="ic-ln"><path d="M6 20V8.5h12V20M4 5.5h16l-1.5 3h-13z" /><path d="M9.5 20v-4.2a2.5 2.5 0 0 1 5 0V20" /><circle className="ca-own__g" cx="12" cy="12" r="1.15" /></g>
    )}
  </svg>
);
const DRAWN = new Set(["x", "discord", "telegram", "github", "reddit", "youtube"]);

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const wkd = (iso: string) => day(iso).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

/** the newsletter (the homepage's field): required, a simple pattern, an inline error, success in place. No provider is wired: nothing is sent. */
function Newsletter() {
  const input = useRef<HTMLInputElement>(null), ok = useRef<HTMLParagraphElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => { if (done) ok.current?.focus({ preventScroll: true }); }, [done]);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = (input.current?.value ?? "").trim();
    const problem = !v ? "Enter your email address." : !EMAIL.test(v) ? "Enter an email address like name@example.com." : null;
    setError(problem);
    if (problem) { input.current?.focus(); return; }
    // [[TBD: newsletter provider]]: send `v` here. Nothing is sent.
    setDone(true);
  };
  return (
    <form className={`l-form ca-form${error ? " is-invalid" : ""}`} method="post" noValidate onSubmit={submit}>
      <label htmlFor="ca-email" className="l-form__label ca-form__label"><i className="l-ic l-ic--s" data-icon="mail" data-icon-size="16" aria-hidden="true" />Email address</label>
      <div className={`l-form__slot${done ? " is-done" : ""}`}>
        <div className="l-field" inert={done}>
          <input ref={input} id="ca-email" name="email" type="email" required autoComplete="email" inputMode="email" spellCheck={false} placeholder="you@example.com"
            aria-invalid={error ? true : undefined} aria-describedby="ca-email-err ca-email-note" onInput={() => { if (error) setError(null); }} />
          <button type="submit" className="l-field__btn"><span>{CLOSE.newsletter.cta}</span><Arrow /></button>
          <i className="l-field__line" aria-hidden="true" />
        </div>
        <div role="status" className="l-form__status">
          {done && (
            <p ref={ok} className="l-form__ok" tabIndex={-1}>
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span>Thanks for subscribing.</span><span className="l-form__pre">Preview only: nothing was sent.</span>
            </p>
          )}
        </div>
      </div>
      <p id="ca-email-err" className="l-form__err">
        {error && (<><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5v4.5M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg><span>{error}</span></>)}
      </p>
      <p id="ca-email-note" className="l-form__note">By subscribing, you agree to our <a href="https://www.near.org/privacy-policy">Privacy Policy</a>.</p>
    </form>
  );
}

export function CommunityA() {
  const ref = useRef<HTMLDivElement>(null);
  const [act, setAct] = useState(0);   // ways: the one in the preview (the last pointed or focused)
  useScrollMotion(ref, mount);
  const next = EVENTS[0];
  const eventRows = [EVENTS.slice(0, 3), EVENTS.slice(3, 6)];
  const socialRows = [SOCIALS.slice(0, 4), SOCIALS.slice(4)];

  return (
    <div ref={ref} className="l-page cm-a">
      {/* ───────────── 1 · hero: Blog J's ruled head, its bar, the panorama */}
      <section className="l-sec ca-hero" aria-labelledby="ca-h1">
        <div className="l-row ca-hero__row" data-row="" data-start="">
          <div className="l-cell ca-hero__title">
            <p className="ca-k" data-in=""><i className="ca-sq" aria-hidden="true" />NEAR <span aria-hidden="true">/</span> Community</p>
            <h1 id="ca-h1" className="ca-h1" data-h1=""><Acc h={HERO.h1} a="open web" /></h1>
          </div>
          <div className="l-cell ca-hero__intro">
            <p className="l-lede" data-in="">{HERO.sub}</p>
            <p className="ca-acts" data-in="">
              <a className="l-btn ca-btn" href={HERO.primary.href}><span>{HERO.primary.label}</span></a>
              <a className="l-link" href={HERO.secondary.href}><span>{HERO.secondary.label}</span><Arrow /></a>
            </p>
          </div>
        </div>
        <div className="l-row ca-bar" data-row="">
          <div className="l-cell ca-bar__cell">
            <nav className="ca-nav" aria-label="On this page">
              <a href="#events">Events</a><a href="#legion">The Legion</a><a href="#channels">Channels</a><a href="#get-involved">Get involved</a><a href="#faq">FAQ</a>
            </nav>
            {/* [[TBD: live]] the next event from the Luma feed */}
            <a className="ca-next" href="#events">
              <span className="ca-next__k">Next</span>
              <span className="ca-next__t">{next.date} · {next.city} · {next.title}</span>
              <Sample />
            </a>
          </div>
        </div>
        <div className="l-row ca-pano" data-row="">
          <div className="l-cell ca-pano__c">
            <div className="l-ph ca-pano__ph" data-ph="">
              <img className="l-img" src="/v3/deeper/abound.webp" srcSet={setOf("/v3/deeper/abound.webp")} sizes="100vw" width={1600} height={900} alt="" decoding="async" fetchPriority="high" />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 2 · community stats: the proof strip */}
      <section className="l-sec ca-stats" aria-labelledby="ca-stats-t">
        <h2 id="ca-stats-t" className="sr-only">The community in numbers</h2>
        <ul className="l-row l-proof__row ca-stats__row" data-row="">
          <li className="l-green" aria-hidden="true" role="presentation" />
          {STATS.map((s, i) => (
            <li key={s.label} className="l-cell ca-fig" style={{ ["--i" as string]: i }}>
              <i className="l-ic" data-icon={STAT_ICON[i] ?? "people"} data-icon-size="20" aria-hidden="true" />
              <p className="ca-fig__v"><Count v={s.value} delay={i * 90} /></p>
              <p className="ca-fig__l">{s.label}</p>
              {s.sample && <p className="ca-fig__s"><Sample /></p>}
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── 3 · events */}
      <section className="l-sec ca-events" id="events" aria-labelledby="ca-ev-t">
        <div className="l-row ca-head" data-row="">
          <div className="l-cell ca-head__h">
            <p className="ca-k" data-rv=""><i className="ca-sq" aria-hidden="true" />Events</p>
            <h2 id="ca-ev-t" className="l-h2 l-h2--m" data-rv=""><Acc h={EVENTS_HEAD.h} a="meets" /></h2>
          </div>
          <div className="l-cell ca-head__end">
            <p className="l-lede" data-rv="">{EVENTS_HEAD.sub}</p>
            <p data-rv=""><a className="l-link" href={EVENTS_HEAD.cta.href} {...ext(EVENTS_HEAD.cta.href)}><span>{EVENTS_HEAD.cta.label}</span><Ext /><ExtSr h={EVENTS_HEAD.cta.href} /></a></p>
          </div>
        </div>
        {eventRows.map((row, r) => (
          <ul key={r} className="l-row ca-evs" data-row="" aria-label={r ? undefined : "Upcoming events (sample)"}>
            {row.map((e, j) => (
              <li key={e.title} className="l-cell ca-ev" style={{ ["--j" as string]: j }}>
                {/* [[TBD: live]] from the Luma calendar */}
                <a className="ca-ev__a" href={e.href} {...ext(e.href)}>
                  <span className="ca-ev__top">
                    <span className="ca-ev__kind" data-kind={e.kind}>{e.kind}</span>
                    {e.sample && <Sample />}
                  </span>
                  <span className="ca-ev__date">
                    <time dateTime={e.dateIso}><span className="ca-ev__d">{e.date.split(" ")[1]}</span><span className="ca-ev__m">{e.date.split(" ")[0]} · {wkd(e.dateIso)}</span></time>
                  </span>
                  <span className="ca-ev__t">{e.title}<ExtSr h={e.href} /></span>
                  <span className="ca-ev__city"><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M6 11s3.6-3.4 3.6-6.1A3.6 3.6 0 0 0 2.4 4.9C2.4 7.6 6 11 6 11Z" /><circle cx="6" cy="4.9" r="1.2" /></svg>{e.city}</span>
                  <span className="ca-ev__go" aria-hidden="true"><Ext /></span>
                </a>
              </li>
            ))}
          </ul>
        ))}
        <div className="l-row ca-foot" data-row="">
          <div className="l-cell ca-foot__c">
            <a className="l-link" href={EVENTS_HEAD.host.href} {...ext(EVENTS_HEAD.host.href)}><span>{EVENTS_HEAD.host.label}</span><Arrow /><ExtSr h={EVENTS_HEAD.host.href} /></a>
            <p className="ca-foot__n"><Sample />Sample events until the Luma calendar is connected.</p>
          </div>
        </div>
      </section>

      {/* ───────────── 4 · the Legion: a full-bleed photo, the widest place on the page */}
      <section className="l-sec ca-legion" id="legion" aria-labelledby="ca-lg-t">
        <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>
        <div className="l-bleed-wrap">
          <div className="l-bleed ca-lg" data-bleed="">
            <div className="l-ph l-bleed__ph" data-ph="">
              <div className="l-plate"><img className="l-img" src="/v3/deeper/sovereign-economy.webp" alt="" loading="lazy" decoding="async" width={1600} height={900} /></div>
            </div>
            <div className="l-bleed__in ca-lg__in">
              <div className="ca-lg__copy">
                <p className="ca-k ca-lg__k" data-rv=""><i className="ca-sq" aria-hidden="true" />The Legion</p>
                <h2 id="ca-lg-t" className="ca-lg__h" data-rv=""><Acc h={LEGION.h} a="Legion." /></h2>
                <p className="ca-lg__b" data-rv="">{LEGION.body}</p>
                <p className="ca-lg__cta" data-rv=""><a className="l-btn ca-btn" href={LEGION.cta.href} {...ext(LEGION.cta.href)}><span>{LEGION.cta.label}</span><ExtSr h={LEGION.cta.href} /></a></p>
              </div>
              {/* [[TBD]] the member count */}
              <p className="ca-lg__stat" data-rv=""><i className="ca-lg__ic" data-icon="people" data-icon-size="20" aria-hidden="true" /><span>{LEGION.stat.line}</span>{LEGION.stat.sample && <Sample />}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 5 · socials: pillar cells on the dark band */}
      <section className="l-sec ca-dark" id="channels" aria-labelledby="ca-so-t">
        <div className="l-row ca-head" data-row="" data-after-bleed="">
          <div className="l-cell ca-head__h">
            <p className="ca-k" data-rv=""><i className="ca-sq" aria-hidden="true" />Channels</p>
            <h2 id="ca-so-t" className="l-h2" data-rv=""><Acc h={SOCIALS_HEAD.h} a="conversation" /></h2>
          </div>
          <div className="l-cell ca-head__end"><p className="l-lede" data-rv="">{SOCIALS_HEAD.sub}</p></div>
        </div>
        {socialRows.map((row, r) => (
          <ul key={r} className="l-row ca-socs" data-row="">
            {row.map((s, j) => (
              <li key={s.key} className="l-cell ca-soc" style={{ ["--j" as string]: j }}>
                <a className="ca-soc__a" href={s.href} target="_blank" rel="noopener noreferrer">
                  {DRAWN.has(s.key) ? <i className="ca-soc__ic" data-icon={s.key} aria-hidden="true" /> : <span className="ca-soc__ic"><OwnIcon k={s.key} /></span>}
                  <span className="ca-soc__n">{s.name}</span>
                  <span className="ca-soc__l">{s.line}</span>
                  <span className="ca-soc__cta"><span>{s.cta}</span><Ext /></span>
                  <span className="sr-only"> (opens {host(s.href)})</span>
                </a>
              </li>
            ))}
          </ul>
        ))}
        <div className="l-row l-spacer ca-dark__end" data-row="" aria-hidden="true"><div className="l-cell" /></div>
      </section>

      {/* ───────────── 6 · ways to get involved: Get into NEAR's rows and preview */}
      <section className="l-sec ca-ways" id="get-involved" aria-labelledby="ca-wy-t">
        <div className="l-row ca-head" data-row="">
          <div className="l-cell ca-head__h">
            <p className="ca-k" data-rv=""><i className="ca-sq" aria-hidden="true" />Get involved</p>
            <h2 id="ca-wy-t" className="l-h2" data-rv=""><Acc h={WAYS_HEAD.h} a="life" /></h2>
          </div>
          <div className="l-cell ca-head__end"><p className="ca-head__n" data-rv="" aria-hidden="true"><span>{idx(WAYS.length - 1)}</span> ways in</p></div>
        </div>
        <div className="l-row l-gi__row ca-gi" data-row="" data-act={act}>
          <div className="l-cell l-gi__list">
            <ul role="list">
              {WAYS.map((w, i) => {
                const im = WAY_IMG[w.key];
                return (
                  <li key={w.key} className="l-gi__item" data-i={i} onPointerEnter={() => setAct(i)} onFocus={() => setAct(i)}>
                    <span className="l-gi__idx" aria-hidden="true">{idx(i)}</span>
                    <div className="l-gi__th"><img src={im.set ? im.src.replace(".webp", "-960.webp") : im.src} alt="" width={800} height={598} loading="lazy" decoding="async" /></div>
                    <div className="l-gi__txt" data-rv="">
                      <h3 className="l-gi__name">{w.t}</h3>
                      <p className="l-gi__line">{w.b}</p>
                    </div>
                    <p className="l-gi__act" data-rv="">
                      <a className="l-gi__a" href={w.href} {...ext(w.href)}>
                        <span className="l-gi__go"><span className="l-gi__label">{w.cta}</span>{isExt(w.href) ? <Ext /> : <Arrow />}</span>
                        <span className="sr-only">: {w.t}{isExt(w.href) ? ` (opens ${host(w.href)})` : ""}</span>
                      </a>
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="l-cell l-gi__pv" aria-hidden="true">
            <div className="l-ph l-gi__frame">
              {WAYS.map((w, i) => {
                const im = WAY_IMG[w.key];
                return <div key={w.key} className="l-gi__img" data-i={i}><img src={im.src} srcSet={im.set ? setOf(im.src) : undefined} sizes={im.set ? "40vw" : undefined} alt="" width={800} height={598} loading="lazy" decoding="async" /></div>;
              })}
            </div>
            <p className="l-gi__cap">{WAYS.map((w, i) => <span key={w.key} data-i={i}>{idx(i)} · {host(w.href)}</span>)}</p>
          </div>
        </div>
      </section>

      {/* ───────────── 7 · FAQ: an accordion */}
      <section className="l-sec ca-faq" id="faq" aria-labelledby="ca-fq-t">
        <div className="l-row ca-faq__row" data-row="">
          <div className="l-cell ca-faq__h">
            <p className="ca-k" data-rv=""><i className="ca-sq" aria-hidden="true" />FAQ</p>
            <h2 id="ca-fq-t" className="l-h2 l-h2--m" data-rv="">Questions, <span className="accent">answered</span></h2>
            <p className="ca-faq__note" data-rv=""><Sample>Sample answers</Sample>The community team is writing the final ones.</p>
            <p className="ca-faq__more" data-rv=""><a className="l-link" href="/contact"><span>Contact the community team</span><Arrow /></a></p>
          </div>
          <div className="l-cell ca-faq__list">
            {FAQ.map((f, i) => (
              <details key={f.q} className="ca-q" style={{ ["--j" as string]: i }}>
                <summary className="ca-q__s">
                  <span className="ca-q__i" aria-hidden="true">{idx(i)}</span>
                  <span className="ca-q__t">{f.q}</span>
                  <i className="ca-q__x" aria-hidden="true" />
                </summary>
                <div className="ca-q__a">
                  <p>{f.a}</p>
                  {f.sample && <Sample />}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── 8 · the close: the meadow, then the newsletter on the grid */}
      <section className="l-sec ca-close" aria-labelledby="ca-cl-t">
        <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>
        <div className="l-bleed-wrap">
          <div className="l-bleed ca-cl" data-bleed="">
            <div className="l-ph l-bleed__ph" data-ph="">
              <div className="l-plate"><img className="l-img" src="/v3/bleed-meadow.webp" alt="" loading="lazy" decoding="async" /></div>
            </div>
            <div className="l-bleed__in ca-cl__in">
              <h2 id="ca-cl-t" className="ca-cl__h" data-rv=""><Acc h={CLOSE.h} a="open web." /></h2>
              <p className="ca-cl__sub" data-rv="">{CLOSE.sub}</p>
              <p className="ca-acts ca-cl__acts" data-rv="">
                <a className="l-btn ca-btn" href={CLOSE.primary.href}><span>{CLOSE.primary.label}</span></a>
                <a className="l-btn" href={CLOSE.secondary.href} {...ext(CLOSE.secondary.href)}><span>{CLOSE.secondary.label}</span><ExtSr h={CLOSE.secondary.href} /></a>
              </p>
            </div>
          </div>
        </div>
        <div className="l-row ca-nl" data-row="" data-after-bleed="">
          <div className="l-cell ca-nl__h">
            <h3 className="ca-nl__t" data-rv=""><Acc h={CLOSE.newsletter.h} a="inbox" /></h3>
            <p className="ca-nl__sub" data-rv="">{CLOSE.newsletter.sub}</p>
          </div>
          <div className="l-cell ca-nl__f" data-rv=""><Newsletter /></div>
        </div>
      </section>
    </div>
  );
}
