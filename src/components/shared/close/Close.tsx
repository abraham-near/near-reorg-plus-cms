"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { mount } from "./motion";
import s from "./Close.module.css";

// Close (r17 v1): the N tile, "NEAR belongs to you", the line and the newsletter form. No provider is wired: a valid submit shows the success state
// and sends nothing. With JS the browser's own validation is off and the form answers inline; without JS it is a plain form (required, type="email").
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Close() {
  const ref = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const okRef = useRef<HTMLParagraphElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  useScrollMotion(ref, mount);

  useEffect(() => { if (formRef.current) formRef.current.noValidate = true; }, []);
  useEffect(() => { if (done) okRef.current?.focus({ preventScroll: true }); }, [done]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = (inputRef.current?.value ?? "").trim();
    const problem = !value ? "Enter your email address." : !EMAIL.test(value) ? "Enter an email address like name@example.com." : null;
    setError(problem);
    if (problem) { inputRef.current?.focus(); return; }
    // [[TBD: newsletter provider]]: send `value` to the provider here. Nothing is sent.
    setDone(true);
  };

  return (
    <section ref={ref} className={s.cl} id="close" aria-labelledby="close-title">
      <div className={s["cl-inner"]} data-k="inner">
        <div className={s["cl-head"]} data-k="head">
          <span className={s["cl-markBox"]} data-k="mark"><img className={s["cl-mark"]} src="/home/close/icon_tile.svg" alt="" width={56} height={56} decoding="async" /></span>
          <h2 id="close-title" className={s["cl-h"]} data-k="h">NEAR belongs to <span className={`acc ${s.acc}`}>you</span></h2>
          <p className={s["cl-lede"]} data-k="lede">Get the latest product launches, protocol milestones, and ecosystem updates straight to your{" "}inbox.</p>
        </div>
        <form ref={formRef} className={s["cl-form"]} data-k="form" method="post" onSubmit={onSubmit}>
          <label htmlFor="cl-email" className="sr-only">Email address</label>
          <div className={s["cl-slot"]}>
            <div className={s["cl-row"]} data-btn="field" data-done={done ? "" : undefined} inert={done}>
              <input
                ref={inputRef} id="cl-email" className={s["cl-input"]} name="email" type="email" required autoComplete="email" inputMode="email" spellCheck={false}
                placeholder="Email address" aria-invalid={error ? true : undefined} aria-describedby={error ? "cl-error" : undefined}
                onInput={() => { if (error) setError(null); }}
              />
              <button type="submit" className={s["cl-submit"]} data-btn="submit">Subscribe</button>
            </div>
            <div role="status" className={s["cl-status"]}>
              {done && (
                <p ref={okRef} className={s["cl-ok"]} tabIndex={-1}>
                  <span className={s["cl-okMark"]}>
                    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  Thanks for subscribing.
                </p>
              )}
            </div>
          </div>
          <p id="cl-error" className={s["cl-error"]}>
            {error && (
              <>
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5v4.5M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                {error}
              </>
            )}
          </p>
          <p className={s["cl-note"]}>By subscribing, you agree to our <a href="/privacy">Privacy Policy</a>.</p>
        </form>
      </div>
    </section>
  );
}
