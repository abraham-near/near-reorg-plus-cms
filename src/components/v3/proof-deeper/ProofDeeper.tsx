"use client";
// v3's proof strip, Go deeper and Origin: b10's (near-homepage-directions /b10, js/content.js proof(), deeper() and origin()), copy and data verbatim.
// One ruled page: the five figures under a green rule, Go deeper (filters, two featured items with photos, a list of five more, View everything),
// then Built by people… (the photo edge to edge in its cell, the copy, Our story, the source note), then the voices: the three over the ridges photo, in turn,
// while the stage holds (it starts at the grid's width, opens to the whole screen as it arrives and closes again as it leaves: motion.ts, gsap),
// then our Get into NEAR (shared/get-into: the same copy, rows, ink hover and preview) rebuilt on the grid: the heading in its row, the paths in one cell, the preview
// photo edge to edge in the next; then b10's NEAR belongs to you: a scene over the meadow (the lockup large in the sky glides down to the headline's size and
// `belongs to you` opens out of it, word by word, while the stage holds, then the newsletter arrives under it; motion.ts). It opens to the whole screen like the
// voices' photo and stays: the footer then rises over it from below.
// Every filter's panel is in the markup (they share one grid cell, so the section never changes height); motion.ts switches them.
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { mount } from "./motion";
import { LOCKUP_LETTERS, LOCKUP_TILE, LOCKUP_VIEWBOX } from "./lockup";
import "./proof-deeper.css";

// proof/ProofStrip.tsx (figures as of 31 Oct 2026, the client's placeholders)
export type Figure = { value: string; unit?: string; caption: ReactNode; icon: string };
const FIGURES: Figure[] = [
  { value: "$36.8B+", caption: "settled through NEAR Intents, all time", icon: "near-intents" },
  { value: "35+", unit: "chains", caption: "reachable from one account", icon: "chain-abstraction" },
  { value: "1.2", unit: "s", caption: "finality by protocol design, with ~600 ms blocks measured", icon: "clock" },
  { value: "1M+", unit: "TPS", caption: "in a public, reproducible benchmark (70 shards, Dec 2025)", icon: "analytics" },
  { value: "5+", unit: "years", caption: "on mainnet, since 2020", icon: "history" },
];

// go-deeper/content.ts
type Type = "story" | "read" | "watch";
type Item = { id: string; type: Type; title: string; source: string; url?: string; note?: string };
const FILTERS: { key: "all" | Type; label: string }[] = [{ key: "all", label: "All" }, { key: "story", label: "Stories" }, { key: "read", label: "Read" }, { key: "watch", label: "Watch" }];
const TYPE_LABEL: Record<Type, string> = { story: "Customer story", read: "Read", watch: "Watch" };
const TILE_LABEL: Record<Type, string> = { ...TYPE_LABEL, story: "Story" };
const img = (id: string) => `/v3/deeper/${id}.webp`;
const ITEMS: Item[] = [
  { id: "agent-economy", type: "read", title: "The Agent Economy: Who Owns the Rails AI Runs On", source: "NEAR blog" },
  { id: "abound", type: "story", title: "Abound is bringing agentic payments to cross-border finance with NEAR AI", source: "Abound", url: "https://near.ai/blog/near-ai-and-the-times-of-india-groups-abound-are-bringing-agentic-payments-to-cross-border-finance", note: "NEAR Foundation is an investor in Abound." },
  { id: "nearvana", type: "watch", title: "NEARvana", source: "Illia Polosukhin, Inside NEAR" },
  { id: "ledger", type: "story", title: "Ledger Wallet integrates NEAR Intents to power seamless cross-chain swaps", source: "Ledger", url: "https://www.near.org/blog/cross-chain-swaps-near-intents-ledger-wallet" },
  { id: "private-money-rail", type: "watch", title: "Private Money Rail", source: "Alex Shevchenko, Inside NEAR" },
  { id: "venice", type: "story", title: "Venice is now verifiably private with NEAR AI", source: "Venice" },
  { id: "who-owns-the-rails", type: "watch", title: "Who Owns the Rails AI Runs On", source: "George Zeng, Inside NEAR" },
  { id: "brave", type: "story", title: "A new frontier for Brave AI privacy with NEAR AI", source: "Brave", url: "https://brave.com/blog/browser-ai-tee/" },
  { id: "quantum-readiness", type: "watch", title: "Quantum Readiness", source: "Illia Polosukhin, Inside NEAR" },
  { id: "zodl", type: "story", title: "Privacy-first Zcash wallet Zodl uses NEAR Intents to give users cross-chain access", source: "Zodl" },
  { id: "sovereign-economy", type: "watch", title: "The Sovereign Economy", source: "David Norris, Inside NEAR" },
  { id: "bermuda", type: "story", title: "Government of Bermuda and NEAR AI partner to deploy AI-powered public services", source: "Government of Bermuda", url: "https://near.ai/blog/government-of-bermuda-and-near-ai-partner-to-deploy-ai-powered-public-services" },
];
// Get into NEAR: ours (shared/get-into/GetIntoNear.tsx), copy and photos as they are
export type Path = { name: string; line: ReactNode; label: string; href: string; host: string; img: string };
const PATHS: Path[] = [
  { name: "Trade on NEAR", line: <>Trade, earn yield and go confidential, all from one near.com account.</>,
    label: "Open near.com", href: "https://near.com", host: "near.com", img: "/home/get-into/home-paths-trade-v3.webp" },
  { name: "Integrate NEAR", line: <>Add <span className="l-nb">NEAR Intents</span> for confidential <span className="l-nb">cross-chain</span> execution, or <span className="l-nb">NEAR AI</span> for private inference you can verify.</>,
    label: "Integration docs", href: "https://docs.near.org/", host: "docs.near.org", img: "/home/get-into/home-paths-integrate-v2.webp" },
  { name: "Build on NEAR", line: <>Build onchain apps and AI agents on battle-tested infrastructure with built-in confidentiality and <span className="l-nb">cross-chain</span> reach.</>,
    label: "Start building", href: "https://docs.near.org/", host: "docs.near.org", img: "/home/get-into/home-paths-build-v3.webp" },
];
const idx = (i: number) => String(i + 1).padStart(2, "0");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const Ext = () => (
  <svg className="l-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>
);

// testimonials/Testimonials.tsx (order and wording as in their code)
export type Voice = { text: ReactNode; name: string; role?: string };
const VOICE_MAIN: Voice = { text: "Their AI work is the only AI x Crypto thing I’m looking forward to.", name: "Austin Federa", role: "Co-founder of DoubleZero" };
const VOICES: Voice[] = [
  { text: "NEAR still feels like the most underrated team in crypto…", name: "Mert Mumtaz", role: "Co-founder of Helius" },
  { text: <>…unlocking global access to encrypted wealth. Game changing at <span className="l-nb">a multi-generational</span> scale.</>, name: "Josh Swihart" },
];
const ALL_VOICES = [VOICE_MAIN, ...VOICES];

/** what changes between pages built on this section (v3 = the defaults below; v4 = components/v4/content.tsx). lead: a section of its own before the figures (v4: the revenue band). */
export type DeeperContent = {
  lead?: ReactNode;
  figures: Figure[];
  origin: { title: ReactNode; text: ReactNode };
  voices: Voice[];
  paths: Path[];
};
const Who = ({ q }: { q: Voice }) => (
  <figcaption className="l-who"><i className="l-who__dot" aria-hidden="true" /><span className="l-who__n">{q.name}</span>{q.role && <span className="l-who__r">{q.role}</span>}</figcaption>
);

const FEATURED = 2, MORE = 5;   // one screen: 2 big and 5 older
const BLOG = "https://www.near.org/blog";
const select = (f: string) => { const l = ITEMS.filter((it) => f === "all" || it.type === f); return { featured: l.slice(0, FEATURED), more: l.slice(FEATURED, FEATURED + MORE) }; };
const href = (it: Item) => it.url || BLOG;
const isExt = (h: string) => /^https?:/.test(h);
const ExtSr = ({ h }: { h: string }) => (isExt(h) ? <span className="sr-only"> (another site)</span> : null);

// the fonts have no → (drawn, as in their GoArrow.tsx)
const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
const Photo = ({ src, cls }: { src: string; cls: string }) => (
  <div className={`l-ph ${cls}`} data-ph=""><img className="l-img" src={src} alt="" loading="lazy" decoding="async" /></div>
);

function Featured({ it, i, wide }: { it: Item; i: number; wide: boolean }) {
  return (
    <article className={`l-feat${wide ? " is-wide" : ""}`} data-i={i}>
      <a className="l-feat__a" href={href(it)}>
        <Photo src={img(it.id)} cls="l-feat__ph" />
        {it.type === "watch" && <span className="l-play" aria-hidden="true"><i data-icon="play" /></span>}
        <span className="l-feat__body">
          <span className="l-meta t-label">{TYPE_LABEL[it.type]}</span>
          <span className="l-feat__t">{it.title}<ExtSr h={href(it)} /></span>
          <span className="l-feat__src">{it.source}</span>
        </span>
      </a>
      {it.note && <p className="l-feat__note">{it.note}</p>}
    </article>
  );
}

function Tile({ it, j }: { it: Item; j: number }) {
  return (
    <li className="l-tile" style={{ ["--j" as string]: j }}>
      <a className="l-tile__a" href={href(it)}>
        <i className="l-glyph" data-icon={`deeper-${it.type}`} aria-hidden="true" /><span className="l-tile__meta t-label">{TILE_LABEL[it.type]}</span>
        <span className="l-tile__t">{it.title}<ExtSr h={href(it)} /></span>
        <span className="l-tile__src">{it.source}</span>
        <span className="l-tile__go" aria-hidden="true"><Arrow /></span>
      </a>
    </li>
  );
}

function Panel({ f }: { f: (typeof FILTERS)[number] }) {
  const { featured: F, more: M } = select(f.key), wide = F.length === 1, on = f.key === "all";
  return (
    <div className={`l-panel${wide ? " is-one" : ""}`} role="tabpanel" id={`l-deeper-p-${f.key}`} aria-labelledby={`l-deeper-tab-${f.key}`} data-key={f.key}
      data-on={on ? "" : undefined} aria-hidden={on ? undefined : true} inert={!on}>
      <div className="l-cell l-feat-cell l-feat-cell--a">{F[0] && <Featured it={F[0]} i={0} wide={wide} />}</div>
      <div className="l-cell l-feat-cell l-feat-cell--b">{F[1] && <Featured it={F[1]} i={1} wide={false} />}</div>
      <div className="l-cell l-list-cell">
        {M.length
          ? <ol className="l-tiles" aria-label={`More in ${f.label}`}>{M.map((it, j) => <Tile key={it.id} it={it} j={j} />)}</ol>
          : <p className="l-empty">That’s everything in {f.label} for now. <a href={BLOG}>View everything</a></p>}
      </div>
    </div>
  );
}

const V3_CONTENT: DeeperContent = {
  figures: FIGURES,
  origin: {
    title: <>Built by people who helped <span className="l-nb">invent modern AI</span></>,
    text: <>
      NEAR began in{"\u00a0"}2017 as an AI lab. <span className="l-nb">Co-founder</span> <span className="l-nb">Illia Polosukhin</span>{" "}
      <span className="l-nb">co-authored</span> “Attention Is All You Need”
      <sup className="l-mark"><a href="#l-origin-src"><span className="sr-only">Source </span>1</a></sup>
      , the paper that introduced the Transformer behind today’s AI models. NEAR exists so the next era of AI is owned{"\u00a0"}by{"\u00a0"}its{"\u00a0"}users.
    </>,
  },
  voices: ALL_VOICES,
  paths: PATHS,
};

export function ProofDeeper({ content: c = V3_CONTENT }: { content?: DeeperContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const [act, setAct] = useState(0);   // Get into NEAR: the path in the preview (the last one pointed or focused)
  // the newsletter (their NewsletterForm): required, a simple pattern, an inline error, success in place. No provider is wired: nothing is sent.
  const inputRef = useRef<HTMLInputElement>(null), okRef = useRef<HTMLParagraphElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => { if (done) okRef.current?.focus({ preventScroll: true }); }, [done]);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = (inputRef.current?.value ?? "").trim();
    const problem = !v ? "Enter your email address." : !EMAIL.test(v) ? "Enter an email address like name@example.com." : null;
    setError(problem);
    if (problem) { inputRef.current?.focus(); return; }
    // [[TBD: newsletter provider]]: send `v` here. Nothing is sent.
    setDone(true);
  };
  useScrollMotion(ref, mount);
  return (
    <div ref={ref} className="l-page">
      {c.lead}
      <section className="l-sec l-proof" id="proof" aria-labelledby="l-proof-t">
        <h2 id="l-proof-t" className="sr-only">NEAR in numbers</h2>
        <ul className="l-row l-proof__row" data-row="">
          <li className="l-green" aria-hidden="true" role="presentation" />
          {c.figures.map((f, i) => (
            <li key={f.value} className="l-cell l-fig" style={{ ["--i" as string]: i }}>
              <i className="l-ic" data-icon={f.icon} data-icon-size="20" aria-hidden="true" />
              <p className="l-fig__v"><span className="l-fig__n">{f.value}</span>{f.unit && <span className="l-fig__u">{f.unit}</span>}</p>
              <p className="l-fig__c">{f.caption}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="l-sec l-deeper" id="deeper" aria-labelledby="l-deeper-t">
        <div className="l-row l-head l-deeper__head" data-row="">
          <div className="l-cell l-head__cell">
            <h2 id="l-deeper-t" className="l-h2" data-rv="">Go <span className="accent">deeper</span></h2>
            <div className="l-tabs" role="tablist" aria-label="Filter by type" data-rv="">
              {FILTERS.map((f, i) => (
                <button key={f.key} className="l-tab" type="button" role="tab" id={`l-deeper-tab-${f.key}`} aria-controls={`l-deeper-p-${f.key}`}
                  aria-selected={i === 0} tabIndex={i === 0 ? 0 : -1} data-key={f.key}>{f.label}</button>
              ))}
              <i className="l-tabs__dot" aria-hidden="true" />
            </div>
          </div>
        </div>
        <div className="l-row l-deeper__body" data-row="">
          {FILTERS.map((f) => <Panel key={f.key} f={f} />)}
        </div>
        <div className="l-row l-deeper__foot" data-row="">
          <div className="l-cell"><a className="l-link" href={BLOG}><span>View everything</span><Arrow /></a></div>
        </div>
      </section>
      <section className="l-sec l-origin" id="origin" aria-labelledby="l-origin-t">
        <div className="l-row l-origin__row" data-row="">
          <div className="l-cell l-origin__ph"><Photo src="/v3/origin-attention.webp" cls="l-ph--fill" /></div>
          <div className="l-cell l-origin__body">
            <h2 id="l-origin-t" className="l-h2 l-h2--m" data-rv="">{c.origin.title}</h2>
            <div className="l-origin__text" data-rv="">
              <p className="l-lede">{c.origin.text}</p>
              <p className="l-cta"><a className="l-btn" href="https://www.near.org/about"><span>Our story</span></a></p>
            </div>
            <p id="l-origin-src" className="l-src" data-rv=""><span className="l-src__n">1</span><span>Source: <a href="https://arxiv.org/abs/1706.03762">arXiv:1706.03762</a></span></p>
          </div>
        </div>
      </section>
      <section className="l-sec l-voices" id="voices" aria-labelledby="l-voices-t">
        {/* an empty cell of the grid between Origin's photo and the bleed: the frame lines run on, so the bleed sits inside the grid */}
        <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>
        {/* the grid's top rule runs over the bleed's top edge (outside its clip: it stays at the grid's width while the photo opens); no + on it */}
        <div className="l-bleed-wrap">
          {/* the scene (desktop, motion on: motion.ts, gsap): the stage holds while the three voices take turns over the ridges, the photo drifting under them */}
          <div className="l-bleed l-voices__bleed" data-bleed="" data-voices="">
            <div className="l-voices__stage">
              <div className="l-ph l-bleed__ph" data-ph=""><div className="l-plate"><img className="l-img" src="/v3/bleed-ridges.webp" alt="" loading="lazy" decoding="async" /></div></div>
              <div className="l-bleed__in l-voices__in">
                <div className="l-voices__top" data-rv="">
                  <h2 id="l-voices-t" className="l-kicker">What the world is saying about NEAR</h2>
                  <p className="l-voices__count" aria-hidden="true">
                    <span className="l-voices__n"><span className="l-voices__nn">{c.voices.map((q, i) => <span key={q.name}>{idx(i)}</span>)}</span></span><span className="l-voices__of">/ {idx(c.voices.length - 1)}</span>
                    <span className="l-voices__bars">{c.voices.map((q) => <i key={q.name}><b /></i>)}</span>
                  </p>
                </div>
                <div className="l-voices__qs">
                  {c.voices.map((q, i) => (
                    <figure key={q.name} className="l-q l-q--main l-vq" data-rv="" data-i={i}>
                      <blockquote><p className="hang">“{q.text}”</p></blockquote>
                      <Who q={q} />
                    </figure>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="l-sec l-paths" id="paths" aria-labelledby="l-paths-t">
        <div className="l-row l-head" data-row="">
          <div className="l-cell l-head__cell"><h2 id="l-paths-t" className="l-h2" data-rv="">Get into <span className="accent">NEAR</span></h2></div>
        </div>
        <div className="l-row l-gi__row" data-row="" data-act={act}>
          <div className="l-cell l-gi__list">
            <ul role="list">
              {c.paths.map((p, i) => (
                <li key={p.name} className="l-gi__item" data-i={i} onPointerEnter={() => setAct(i)} onFocus={() => setAct(i)}>
                  <span className="l-gi__idx" aria-hidden="true">{idx(i)}</span>
                  <div className="l-gi__th"><img src={p.img} alt="" width={800} height={598} loading="lazy" decoding="async" /></div>
                  <div className="l-gi__txt" data-rv="">
                    <h3 className="l-gi__name">{p.name}</h3>
                    <p className="l-gi__line">{p.line}</p>
                  </div>
                  <p className="l-gi__act" data-rv="">
                    <a className="l-gi__a" href={p.href}>
                      <span className="l-gi__go"><span className="l-gi__label">{p.label}</span><Ext /></span>
                      <span className="sr-only"> (another NEAR site)</span>
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="l-cell l-gi__pv" aria-hidden="true">
            <div className="l-ph l-gi__frame">
              {c.paths.map((p, i) => <div key={p.name} className="l-gi__img" data-i={i}><img src={p.img} alt="" width={800} height={598} loading="lazy" decoding="async" /></div>)}
            </div>
            <p className="l-gi__cap">{c.paths.map((p, i) => <span key={p.name} data-i={i}>{idx(i)} · {p.host}</span>)}</p>
          </div>
        </div>
      </section>
      <section className="l-sec l-close" id="close" aria-labelledby="l-close-t">
        <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>
        <div className="l-bleed-wrap">
          <div className="l-bleed l-close__bleed" data-bleed="" data-close="">
            <div className="l-close__stage">
              <div className="l-ph l-bleed__ph l-close__ph" data-ph=""><div className="l-plate"><img className="l-img" src="/v3/bleed-meadow.webp" alt="" loading="lazy" decoding="async" /></div></div>
              <div className="l-bleed__in l-close__in">
                <h2 id="l-close-t" className="l-display l-close__h">
                  <span className="l-close__logo">
                    <span className="sr-only">NEAR</span>
                    <svg className="l-close__svg" viewBox={LOCKUP_VIEWBOX} aria-hidden="true" focusable="false">
                      <defs><clipPath id="l-close-clip"><rect x="520" y="100" width="1100" height="312" /></clipPath></defs>
                      <path className="l-close__m" d={LOCKUP_TILE} />
                      <g clipPath="url(#l-close-clip)">{LOCKUP_LETTERS.map((d, c) => <path key={c} className="l-close__c" style={{ ["--c" as string]: c }} d={d} />)}</g>
                    </svg>
                  </span>
                  <span className="l-close__rest"> <span className="l-close__w" style={{ ["--w" as string]: 0 }}>belongs</span> <span className="l-close__w" style={{ ["--w" as string]: 1 }}>to</span> <span className="l-close__w accent" style={{ ["--w" as string]: 2 }}>you</span></span>
                </h2>
                {/* the newsletter, in the scene: it arrives under the line once the words have opened (motion.ts) */}
                <div className="l-close__nl">
                  <p className="l-lede">Get the latest product launches, protocol milestones, and ecosystem updates straight to your{"\u00a0"}inbox.</p>
                  <form className={`l-form${error ? " is-invalid" : ""}`} method="post" noValidate onSubmit={onSubmit}>
                    <label htmlFor="l-email" className="l-form__label t-label"><i className="l-ic l-ic--s" data-icon="mail" data-icon-size="16" aria-hidden="true" />Email address</label>
                    <div className={`l-form__slot${done ? " is-done" : ""}`}>
                      <div className="l-field" inert={done}>
                        <input ref={inputRef} id="l-email" name="email" type="email" required autoComplete="email" inputMode="email" spellCheck={false} placeholder="you@example.com"
                          aria-invalid={error ? true : undefined} aria-describedby="l-email-err l-email-note" onInput={() => { if (error) setError(null); }} />
                        <button type="submit" className="l-field__btn"><span>Subscribe</span><Arrow /></button>
                        <i className="l-field__line" aria-hidden="true" />
                      </div>
                      <div role="status" className="l-form__status">
                        {done && (
                          <p ref={okRef} className="l-form__ok" tabIndex={-1}>
                            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <span>Thanks for subscribing.</span><span className="l-form__pre">Preview only: nothing was sent.</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <p id="l-email-err" className="l-form__err">
                      {error && (<><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5v4.5M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg><span>{error}</span></>)}
                    </p>
                    <p id="l-email-note" className="l-form__note">By subscribing, you agree to our <a href="https://www.near.org/privacy-policy">Privacy Policy</a>.</p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
