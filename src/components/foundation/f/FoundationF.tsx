"use client";
// near.org/foundation, version F: the Figma page "Foundation / Page · HTML complete" (2026_10_Near_Web, node 846:554). From the top:
//   1 the hero: the terrace photo (its scrims painted in) under the headline, the lede and two buttons;
//   2 three pillars on the ruled grid, each with its icon and a mono label (Structure / Focus / Direction);
//   3 the mission on a green band: "Our goal is to make / ourselves smaller." starts the width of the screen and shrinks to the left as the
//     devolution text arrives beside it (desktop, pinned; Foundation E's effect), then the page scrolls on;
//   4 transparency: Zug in one cell, the Stiftung text in the other, three facts under them;
//   5–7 the Council, how the Foundation operates and the ecosystem: version A's (../Foundation.tsx), as the Figma page shows them;
//   8 NEAR belongs to you: the homepage's close with its newsletter (../../v3/proof-deeper/ProofDeeper.tsx). The footer is the shell's.
// Scroll effects (motion.ts): the hero's lines rise and its photo drifts and settles as you leave it; the ruled rows draw in; the pillars' icons
// arrive; Zug moves inside its cell. Reduced motion: everything still, in its final place.
// Copy: the October 2026 doc, verbatim (the labels and the facts are the Figma page's).
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { LOCKUP_LETTERS, LOCKUP_TILE, LOCKUP_VIEWBOX } from "../../v3/proof-deeper/lockup";
import "../../v3/proof-deeper/proof-deeper.css";
import "../foundation.css";
import { mountAll } from "./motion";
import "./foundation-f.css";

const PILLARS = [
  { icon: "nonprofit", k: "Structure", t: "Nonprofit", b: "A Swiss nonprofit foundation (Stiftung), legally bound to its purpose, operating with the transparency that structure demands." },
  { icon: "growth", k: "Focus", t: "Ecosystem growth", b: "We support the growth of the NEAR ecosystem, directing resources to the people and projects building on it rather than competing with them." },
  { icon: "decentral", k: "Direction", t: "Decentralization", b: "We champion a decentralized, self-sufficient ecosystem, and work to devolve our own functions to it over time." },
];
const FACTS = [
  { k: "Jurisdiction", t: "Swiss, with strict regulatory oversight" },
  { k: "Obligation", t: "Legally bound to pursue its purpose" },
  { k: "Funds", t: "Used only for the fulfillment of that purpose" },
];
const ACTS = [
  { icon: "economics", t: "Allocate resources", b: "Ensure financial resources are properly allocated and distributed throughout the ecosystem." },
  { icon: "governance", t: "Support ecosystem functions", b: "Support ecosystem-level functions that do not yet have a steward, from communication and coordination to governance infrastructure and education." },
  { icon: "people", t: "Champion decentralization", b: "Support the continuing devolution of functions and operations to the ecosystem itself." },
];
// [[TBD: links]] Join the community / Careers: the doc names the buttons, not their targets
const COMMUNITY = "https://www.near.org/community", CAREERS = "https://careers.near.foundation", ECOSYSTEM = "https://www.near.org/ecosystem";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const idx = (i: number) => String(i + 1).padStart(2, "0");

const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);

export function FoundationF() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mountAll);
  // the newsletter (the homepage's): required, a simple pattern, an inline error, success in place. No provider is wired: nothing is sent.
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
  return (
    <div ref={ref} className="l-page f-page ff-page">
      {/* 1 · hero: the photo, the headline, two buttons */}
      <section className="ff-hero" aria-labelledby="ff-h1">
        <img className="ff-hero__img" src="/foundation-f/hero.webp" alt="" fetchPriority="high" decoding="async" />
        <div className="ff-hero__in">
          <p className="ff-eyebrow"><i aria-hidden="true" />NEAR Foundation</p>
          <h1 id="ff-h1" className="ff-h1"><span className="ff-l">Enabling community-driven</span> <span className="ff-l">innovation <span className="accent">to benefit people</span></span> <span className="ff-l"><span className="accent">around the world</span><span className="ff-sq" aria-hidden="true" /></span></h1>
          <p className="ff-lede">NEAR Foundation is a Swiss nonprofit supporting the open infrastructure for the agent economy, where you own your assets, your intelligence, and your world. Our mandate is to place that infrastructure in the hands of the community it serves.</p>
          <p className="ff-ctas">
            <a className="ff-btn ff-btn--green" href={COMMUNITY}><span>Join the community</span><span aria-hidden="true">→</span></a>
            <a className="ff-btn" href={CAREERS}><span>Careers</span></a>
          </p>
        </div>
      </section>

      {/* 2 · three pillars on the ruled grid */}
      <section className="l-sec ff-pillars" id="f-pillars" aria-labelledby="ff-pillars-t">
        <h2 id="ff-pillars-t" className="sr-only">What the Foundation is</h2>
        <ul className="l-row ff-pillars__row" data-row="">
          {PILLARS.map((p) => (
            <li key={p.t} className="l-cell ff-pillar">
              <img className="ff-pillar__ic" src={`/foundation-f/icon-${p.icon}.svg`} alt="" width={32} height={32} />
              <p className="ff-k" data-rv="">{p.k}</p>
              <h3 className="ff-h3" data-rv="">{p.t}</h3>
              <p className="ff-body" data-rv="">{p.b}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 3 · the mission, on the green band */}
      <section className="ff-mission" id="f-mission" aria-labelledby="ff-mission-t">
        <div className="ff-mission__stage">
          <div className="ff-mission__l">
            <p className="ff-k ff-mission__k">Mission</p>
            <h2 id="ff-mission-t" className="ff-mission__h"><span className="ff-ml">Our goal is to make</span> <span className="ff-ml">ourselves <span className="accent ff-mission__acc">smaller</span><span className="ff-sq ff-sq--w" aria-hidden="true" /></span></h2>
          </div>
          <div className="ff-mission__r">
            <p className="ff-mission__lead"><span className="ff-sn">Most organizations exist to grow.</span> <span className="ff-sn">The NEAR Foundation exists to devolve.</span> <span className="ff-sn">Our purpose is to support the ecosystem until it operates without us, moving functions and resources into the hands of the community and the decentralized infrastructure that carries them.</span></p>
            <p className="ff-body"><span className="ff-sn">This is what ownership means at the level of the network itself: NEAR is built to belong to the people who use it.</span> <span className="ff-sn">We support the network. We do not control it, and by design we could not.</span></p>
          </div>
        </div>
      </section>

      {/* 4 · transparency: Zug and the Stiftung, three facts under them */}
      <section className="l-sec ff-tr" id="f-transparency" aria-labelledby="ff-tr-t">
        <div className="l-row ff-tr__row" data-row="" data-start="">
          <div className="l-cell ff-tr__ph"><div className="l-ph l-ph--fill" data-ph=""><img className="l-img" src="/foundation-f/zug.webp" alt="A lakeside building in Zug, the Swiss Alps across the water" loading="lazy" decoding="async" /></div></div>
          <div className="l-cell ff-tr__body">
            <p className="ff-k" data-rv="">Stiftung</p>
            <h2 id="ff-tr-t" className="ff-tr__h" data-rv="">Transparency is at the heart of who we are</h2>
            <p className="ff-body" data-rv="">The NEAR Foundation is a Swiss Stiftung. It is neither simple nor flexible to operate, by design: Swiss jurisdiction imposes strict regulatory oversight, and a Stiftung is legally bound to pursue its purpose. Funds given to it cannot be removed for any reason except the fulfillment of that purpose.</p>
            <p className="ff-body" data-rv="">Transparency is not a value we chose. It is a condition of how we are built.</p>
          </div>
        </div>
        <ul className="l-row ff-facts" data-row="">
          {FACTS.map((f) => (
            <li key={f.k} className="l-cell ff-fact"><p className="ff-k" data-rv="">{f.k}</p><p className="ff-fact__t" data-rv="">{f.t}</p></li>
          ))}
        </ul>
      </section>

      {/* 5 · the Council, on the Stack's dark */}
      <section className="l-sec f-council" id="f-council" aria-labelledby="f-council-t">
        <div className="l-row f-council__row" data-row="">
          <div className="l-cell f-council__h">
            <i className="l-ic" data-icon="governance" data-icon-size="20" aria-hidden="true" />
            <h2 id="f-council-t" className="l-h2 l-h2--m" data-rv="">The NEAR Foundation <span className="accent">Council</span></h2>
          </div>
          <div className="l-cell f-council__b">
            <p className="l-lede" data-rv="">The NEAR Foundation Council is the governing body of the Foundation, responsible for its ultimate oversight and its most significant decisions. The Council is separate from the executive team, which the Council empowers to manage day-to-day operations and which reports back to it.</p>
            <ol className="f-chain" data-rv="" aria-label="Who reports to whom">
              <li><span className="f-chain__n">Council</span><span className="f-chain__r">Oversight and the most significant decisions</span></li>
              <li><span className="f-chain__n">Executive team</span><span className="f-chain__r">Day-to-day operations, reporting back to the Council</span></li>
            </ol>
          </div>
        </div>
      </section>

      {/* 6 · how the Foundation operates */}
      <section className="l-sec f-operates" id="f-operates" aria-labelledby="f-op-t">
        <div className="l-row f-split f-split--head" data-row="">
          <div className="l-cell"><h2 id="f-op-t" className="l-h2 l-h2--m" data-rv="">How the Foundation <span className="accent">operates</span></h2></div>
          <div className="l-cell f-split__end"><p className="l-lede" data-rv="">As one of the larger nodes supporting a decentralized ecosystem, the Foundation limits itself to indirect support. Its primary lever is the financial resources in its treasury, and its operations are deliberately lightweight, directed at three activities.</p></div>
        </div>
        <ol className="l-row f-cards f-acts" data-row="">
          {ACTS.map((a, i) => (
            <li key={a.t} className="l-cell f-card">
              <i className="l-ic" data-icon={a.icon} data-icon-size="20" aria-hidden="true" />
              <span className="f-card__n" data-rv="">{idx(i)}</span>
              <h3 className="f-h3" data-rv="">{a.t}</h3>
              <p className="f-card__b" data-rv="">{a.b}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 7 · the ecosystem: the dApps grid as near.foundation shows it */}
      <section className="l-sec f-eco" id="f-ecosystem" aria-labelledby="f-eco-t">
        <div className="l-row f-split f-split--head" data-row="">
          <div className="l-cell"><h2 id="f-eco-t" className="l-h2 l-h2--m" data-rv="">Built by an <span className="accent">ecosystem</span>, not a company</h2></div>
          <div className="l-cell f-split__end">
            <p className="l-lede" data-rv="">Hundreds of applications, wallets, and protocols build on NEAR. The Foundation supports the ecosystem that builds them. The builders own what they make.</p>
            <p className="f-link" data-rv=""><a className="l-link" href={ECOSYSTEM}><span>Explore the ecosystem</span><Arrow /></a></p>
          </div>
        </div>
        <div className="l-row f-logos" data-row="">
          {/* [[TBD: the grid as our own files]] near.foundation's image, as the doc asks ("retain dApps logo grid from current site") */}
          <div className="l-cell f-logos__cell"><img src="https://near.foundation/dapps-icons.svg" alt="Apps supported by NEAR Foundation" loading="lazy" decoding="async" data-rv="" /></div>
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
                      <defs><clipPath id="ff-close-clip"><rect x="520" y="100" width="1100" height="312" /></clipPath></defs>
                      <path className="l-close__m" d={LOCKUP_TILE} />
                      <g clipPath="url(#ff-close-clip)">{LOCKUP_LETTERS.map((d, c) => <path key={c} className="l-close__c" style={{ ["--c" as string]: c }} d={d} />)}</g>
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
