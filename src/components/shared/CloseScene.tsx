"use client";
// The homepage's close ("NEAR belongs to you" over the meadow: the lockup large in the sky glides down to the headline's size, `belongs to you` opens
// out of it word by word while the stage holds, then the page's own line, buttons and, optionally, a newsletter arrive under it; the footer rises over
// it). Markup and motion are the homepage's (v3/proof-deeper: ProofDeeper.tsx's close, motion.ts's scene), like NEAR Foundation's close, with each
// page's own CTA inside. Its own `.l-page` root and motion, so it sits after a page's component, whatever that page is built on.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { mount } from "../v3/proof-deeper/motion";
import { LOCKUP_LETTERS, LOCKUP_TILE, LOCKUP_VIEWBOX } from "../v3/proof-deeper/lockup";
import "../v3/proof-deeper/proof-deeper.css";
import "./close-scene.css";

export type CloseLink = { label: string; href: string };
export type CloseNewsletter = { h: string; sub: string; cta: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isExt = (h: string) => /^https?:\/\//.test(h);
const ext = (h: string) => (isExt(h) ? { target: "_blank", rel: "noopener noreferrer" } : {});
const Arrow = () => <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>;

export function CloseScene({ sub, primary, secondary, newsletter, photo = "/v3/bleed-meadow.webp", ruled = false }: {
  sub: string; primary: CloseLink; secondary?: CloseLink; newsletter?: CloseNewsletter;
  /** the sky behind the scene (the homepage's meadow by default) */
  photo?: string;
  /** the empty ruled row above it, for pages on the ruled grid (as on the homepage) */
  ruled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
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
  const btn = (l: CloseLink, fill: boolean) => (
    <a className={`l-btn${fill ? " cs-btn--fill" : ""}`} href={l.href} {...ext(l.href)}>
      <span>{l.label}</span>{isExt(l.href) && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
  return (
    <div ref={ref} className={`l-page cs-page${ruled ? " cs-page--ruled" : ""}${newsletter ? " cs-page--nl" : ""}`}>
      <section className="l-sec l-close" id="close" aria-labelledby="cs-close-t">
        {ruled && <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>}
        <div className="l-bleed-wrap">
          <div className="l-bleed l-close__bleed" data-bleed="" data-close="">
            <div className="l-close__stage">
              <div className="l-ph l-bleed__ph l-close__ph" data-ph=""><div className="l-plate"><img className="l-img" src={photo} alt="" loading="lazy" decoding="async" /></div></div>
              <div className="l-bleed__in l-close__in">
                <h2 id="cs-close-t" className="l-display l-close__h">
                  <span className="l-close__logo">
                    <span className="sr-only">NEAR</span>
                    <svg className="l-close__svg" viewBox={LOCKUP_VIEWBOX} aria-hidden="true" focusable="false">
                      <defs><clipPath id="cs-close-clip"><rect x="520" y="100" width="1100" height="312" /></clipPath></defs>
                      <path className="l-close__m" d={LOCKUP_TILE} />
                      <g clipPath="url(#cs-close-clip)">{LOCKUP_LETTERS.map((d, c) => <path key={c} className="l-close__c" style={{ ["--c" as string]: c }} d={d} />)}</g>
                    </svg>
                  </span>
                  <span className="l-close__rest"> <span className="l-close__w" style={{ ["--w" as string]: 0 }}>belongs</span> <span className="l-close__w" style={{ ["--w" as string]: 1 }}>to</span> <span className="l-close__w accent" style={{ ["--w" as string]: 2 }}>you</span></span>
                </h2>
                {/* the page's own CTA, in the scene: it arrives under the line once the words have opened (motion.ts) */}
                <div className="l-close__nl cs-nl">
                  <p className="l-lede">{sub}</p>
                  <p className="cs-btns">{btn(primary, true)}{secondary && btn(secondary, false)}</p>
                  {newsletter && (
                    <form className={`l-form cs-form${error ? " is-invalid" : ""}`} method="post" noValidate onSubmit={onSubmit} aria-labelledby="cs-nl-t">
                      <p id="cs-nl-t" className="cs-form__h">{newsletter.h}<span className="cs-form__sub"> · {newsletter.sub}</span></p>
                      <label htmlFor="cs-email" className="sr-only">Email address</label>
                      <div className={`l-form__slot${done ? " is-done" : ""}`}>
                        <div className="l-field" inert={done}>
                          <input ref={inputRef} id="cs-email" name="email" type="email" required autoComplete="email" inputMode="email" spellCheck={false} placeholder="you@example.com"
                            aria-invalid={error ? true : undefined} aria-describedby="cs-email-err cs-email-note" onInput={() => { if (error) setError(null); }} />
                          <button type="submit" className="l-field__btn"><span>{newsletter.cta}</span><Arrow /></button>
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
                      <p id="cs-email-err" className="l-form__err">
                        {error && (<><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5v4.5M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg><span>{error}</span></>)}
                      </p>
                      <p id="cs-email-note" className="l-form__note">By subscribing, you agree to our <a href="https://www.near.org/privacy-policy">Privacy Policy</a>.</p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
