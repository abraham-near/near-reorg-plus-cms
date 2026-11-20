"use client";
// Contact: the official pages' hand (home v5's spread header and footer, Blog J's type and fields). Three things only: who you're writing to, the form,
// and where else to find NEAR. Scoped under .ct (contact.css), on top of the blog's tokens and pieces (v3/blog/blog.css: .bl, .bl-btn, .bl-link, .accent)
// and Blog J's (v3/blog/j/blog-j.css: .bj-h1, .bj-field, .bj-lbl, .bj-err …).
//   - two columns on desktop: on the left the about (heading with one Kepler accent word, a short lede) and, at the column's foot, the social links;
//     on the right the form on the homepage's ruled grid (a full-width head cell, then a cell per field, + at the corners). Below 900 one column:
//     about, form, social links.
//   - the form: name, email, topic, message. Checked here only (required, an email pattern, a few words); errors inline under each field, focus to the
//     first; success in place, over the fields (no layout shift). There is no backend: nothing is sent, and the success says so. ?topic= presets the topic.
//   - the social links: real, public accounts only; small line marks drawn here (not the brands' logos), each opens another site.
// Motion: Blog J's (v3/blog/j/motion.ts): the heading rises word by word, blocks ([data-in]) fade and rise as they come in.
// Reduced motion: no data-motion on the root, every block is simply there.
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { FixVersion } from "@/components/shared/version";
import { ExtraChip } from "@/components/ExtraChip";
import { V3Header } from "@/components/v3/header/Header";
import { V3Footer } from "@/components/v3/footer/Footer";
import { Arrow, Ext } from "@/components/v3/blog/parts";
import { mount } from "@/components/v3/blog/j/motion";
import "@/components/v3/buttons.css";
import "@/components/v3/blog/blog.css";
import "@/components/v3/blog/j/blog-j.css";
import "./contact.css";

/* ── the topics (the form's select; ?topic= can preset one) ── */
const TOPICS = ["General", "Press", "Partnerships", "Builders", "Other"] as const;
type Topic = (typeof TOPICS)[number];

/* ── the social links: real, public accounts only. Marks: the footer's line drawings (public/nav/icons: x, discord, telegram, github, youtube), inline
   so they're there at once, and one for LinkedIn in the same hand (24 grid, stroke only; contact.css: .ct-soc__ic) ── */
const SOCIAL: { label: string; href: string; mark: ReactNode }[] = [
  { label: "X", href: "https://x.com/nearprotocol", mark: <><path d="M4 4h4.5L20 20h-4.5z" /><path d="M19.5 4l-6.3 7.2M10.8 12.8L4.5 20" /></> },
  { label: "Discord", href: "https://near.chat/",
    mark: <><path d="M8.3 6.2C6.6 6.5 5.1 7 3.8 7.8 1.9 11.4 1.6 14.6 2 17.6c1.5 1.1 3.1 1.8 4.7 2.2l1.1-1.9" /><path d="M15.7 6.2c1.7.3 3.2.8 4.5 1.6 1.9 3.6 2.2 6.8 1.8 9.8-1.5 1.1-3.1 1.8-4.7 2.2l-1.1-1.9" />
      <path d="M8.3 6.2l.6 1.3c2-.4 4.2-.4 6.2 0l.6-1.3" /><path d="M6.5 16.8c3.5 1.6 7.5 1.6 11 0" /><circle cx="9" cy="12.8" r="1.4" /><circle cx="15" cy="12.8" r="1.4" /></> },
  { label: "Telegram", href: "https://t.me/cryptonear", mark: <><path d="M21 4L3 11.2l6 2.1 2 6.2 3.2-3.6 4.6 3.6z" /><path d="M9 13.3L21 4" /><path d="M11 19.5l1-5" /></> },
  { label: "GitHub", href: "https://github.com/near",
    mark: <><path d="M15 21v-3.5c0-1-.3-1.7-.8-2.2 2.7-.3 5.3-1.3 5.3-5.8 0-1.3-.4-2.3-1.2-3.2.1-.3.5-1.6-.1-3.2 0 0-1-.3-3.2 1.2a11 11 0 0 0-6 0C6.8 2.8 5.8 3.1 5.8 3.1c-.6 1.6-.2 2.9-.1 3.2-.8.9-1.2 1.9-1.2 3.2 0 4.5 2.6 5.5 5.3 5.8-.5.4-.8 1.1-.8 1.9V21" /><path d="M9 18.5c-3 .9-3.5-1.3-5-1.8" /></> },
  { label: "YouTube", href: "https://www.youtube.com/@NEARProtocol", mark: <><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10 9v6l5-3z" /></> },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/near-protocol/",
    mark: <><rect x="3" y="3" width="18" height="18" rx="3.5" /><path d="M8 10.5v6M12 16.5v-6M12 13.2c0-1.6 1-2.7 2.4-2.7s2.4 1.1 2.4 2.7v3.3" /><circle cx="8" cy="7.6" r=".6" /></> },
];

/* ── the form's checks ── */
type Field = "name" | "email" | "message";
type Errors = Partial<Record<Field, string>>;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = 2000;
function check(v: { name: string; email: string; message: string }): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Enter your name.";
  if (!v.email.trim()) e.email = "Enter your email address.";
  else if (!EMAIL.test(v.email.trim())) e.email = "Enter a valid email address.";
  if (!v.message.trim()) e.message = "Write a message.";
  else if (v.message.trim().length < 10) e.message = "Add a little more detail: 10 characters or more.";
  return e;
}
const ORDER: Field[] = ["name", "email", "message"];

const ErrIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5v4.5M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
const Err = ({ id, msg }: { id: string; msg?: string }) => (
  <p id={id} className="bj-err ct-err">{msg && <><ErrIcon /><span>{msg}</span></>}</p>
);

/** the page's band: about, form, social links (the shell is <Contact />) */
export function ContactBand() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, (root, ctx) => { const m = mount(root, ctx); return () => m.dispose(); });

  /* ── the form ── */
  const nameRef = useRef<HTMLInputElement>(null), emailRef = useRef<HTMLInputElement>(null), msgRef = useRef<HTMLTextAreaElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null), formRef = useRef<HTMLFormElement>(null);
  const [topic, setTopic] = useState<Topic>("General");
  const [count, setCount] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [said, setSaid] = useState("");
  const [sent, setSent] = useState<{ name: string; email: string; topic: Topic } | null>(null);
  const refs: Record<Field, { current: HTMLInputElement | HTMLTextAreaElement | null }> = { name: nameRef, email: emailRef, message: msgRef };

  // ?topic=press (a link from elsewhere can preset it): read once after hydration
  /* eslint-disable react-hooks/set-state-in-effect -- the URL is an external source only the client can read */
  useEffect(() => {
    const t = new URLSearchParams(location.search).get("topic");
    const hit = TOPICS.find((x) => x.toLowerCase() === t?.toLowerCase());
    if (hit) setTopic(hit);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => { if (sent) doneRef.current?.focus({ preventScroll: true }); }, [sent]);

  const clear = (f: Field) => { if (errors[f]) setErrors((e) => ({ ...e, [f]: undefined })); };
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = { name: nameRef.current?.value ?? "", email: emailRef.current?.value ?? "", message: msgRef.current?.value ?? "" };
    const errs = check(v), bad = ORDER.filter((f) => errs[f]);
    setErrors(errs);
    if (bad.length) {
      setSaid(`${bad.length === 1 ? "One field needs" : `${bad.length} fields need`} attention.`);
      refs[bad[0]].current?.focus();
      return;
    }
    // [[TBD: contact backend]]: send { ...v, topic } here. Nothing is sent.
    setSaid("");
    setSent({ name: v.name.trim(), email: v.email.trim(), topic });
  };
  const again = () => {
    formRef.current?.reset(); setCount(0); setErrors({}); setSent(null); setTopic("General");
    requestAnimationFrame(() => nameRef.current?.focus());
  };
  const inv = (f: Field) => (errors[f] ? " is-invalid" : "");

  return (
    <div ref={ref} className="bl bl-j ct">
      <div className="ct-grid">
        {/* ── the about ── */}
        <section className="ct-about" aria-labelledby="ct-t">
          <p className="t-label bj-lbl ct-eyebrow" data-in="" style={{ ["--d" as string]: "0.05s" }}>Contact</p>
          <h1 id="ct-t" className="bj-h1 ct-h1">Get in <span className="accent">touch</span></h1>
          <div className="ct-lede" data-in="" style={{ ["--d" as string]: "0.35s" }}>
            <p>NEAR is the open network where AI agents and people own their assets, data and intelligence.</p>
            <p>Questions, press or partnerships: write to us and the right team will reply.</p>
          </div>
        </section>

        {/* ── the form, on the ruled grid: the head cell, then a cell per field ── */}
        <section id="ct-write" className="ct-panel" aria-labelledby="ct-write-t" data-in="" style={{ ["--d" as string]: "0.25s" }}>
          <div className="ct-cell ct-panel__head">
            <h2 id="ct-write-t" className="ct-panel__t">Write to us</h2>
            <p className="ct-panel__s">Every field is required.</p>
          </div>
          <form ref={formRef} className="ct-form" method="post" noValidate onSubmit={onSubmit} aria-labelledby="ct-write-t">
            <div className={`ct-slot${sent ? " is-done" : ""}`}>
              <div className="ct-fields" inert={!!sent}>
                <div className={`ct-f${inv("name")}`}>
                  <label htmlFor="ct-name" className="t-label bj-lbl">Name</label>
                  <div className="bj-field ct-field">
                    <input ref={nameRef} id="ct-name" name="name" type="text" autoComplete="name" required maxLength={120} placeholder="Your name"
                      aria-invalid={errors.name ? true : undefined} aria-describedby="ct-name-err" onInput={() => clear("name")} />
                  </div>
                  <Err id="ct-name-err" msg={errors.name} />
                </div>
                <div className={`ct-f${inv("email")}`}>
                  <label htmlFor="ct-email" className="t-label bj-lbl">Email</label>
                  <div className="bj-field ct-field">
                    <input ref={emailRef} id="ct-email" name="email" type="email" autoComplete="email" inputMode="email" spellCheck={false} required maxLength={200} placeholder="you@example.com"
                      aria-invalid={errors.email ? true : undefined} aria-describedby="ct-email-err" onInput={() => clear("email")} />
                  </div>
                  <Err id="ct-email-err" msg={errors.email} />
                </div>
                <div className="ct-f ct-f--wide">
                  <label htmlFor="ct-topic" className="t-label bj-lbl">Topic</label>
                  <div className="bj-field ct-field ct-field--sel">
                    <select id="ct-topic" name="topic" value={topic} onChange={(e) => setTopic(e.target.value as Topic)}>
                      {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <svg className="ct-chev" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
                  </div>
                  <Err id="ct-topic-err" />
                </div>
                <div className={`ct-f ct-f--wide${inv("message")}`}>
                  <div className="ct-f__top">
                    <label htmlFor="ct-msg" className="t-label bj-lbl">Message</label>
                    <span className="ct-count" aria-hidden="true">{count} / {MAX}</span>
                  </div>
                  <div className="bj-field ct-field ct-field--msg">
                    <textarea ref={msgRef} id="ct-msg" name="message" required rows={5} maxLength={MAX} placeholder="How can we help?"
                      aria-invalid={errors.message ? true : undefined} aria-describedby="ct-msg-err ct-msg-hint"
                      onInput={(e) => { setCount(e.currentTarget.value.length); clear("message"); }} />
                  </div>
                  <p id="ct-msg-hint" className="sr-only">Up to {MAX} characters.</p>
                  <Err id="ct-msg-err" msg={errors.message} />
                </div>
                <div className="ct-send">
                  <button type="submit" className="bl-btn bl-btn--ink"><span>Send message</span><Arrow /></button>
                  <p className="bj-fine ct-fine">We use these details only to reply. See our <a href="https://www.near.org/privacy-policy">Privacy Policy</a>.</p>
                </div>
              </div>
              <div role="status" className="ct-done-wrap">
                {sent && (
                  <div className="ct-done">
                    <svg className="ct-done__ic" viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <h3 ref={doneRef} tabIndex={-1} className="ct-done__t">Thanks, {sent.name.split(/\s+/)[0]}.</h3>
                    <p className="ct-done__p">We’d reply to <b>{sent.email}</b> about <b>{sent.topic}</b>.</p>
                    <p className="bj-pre ct-pre">Preview only: nothing was sent.</p>
                    <button type="button" className="bl-link ct-again" onClick={again}><span>Write another message</span><Arrow /></button>
                  </div>
                )}
              </div>
            </div>
            <p className="sr-only" role="status" aria-live="polite">{said}</p>
          </form>
        </section>

        {/* ── the social links ── */}
        <nav className="ct-social" aria-labelledby="ct-soc-t" data-in="" style={{ ["--d" as string]: "0.5s" }}>
          <h2 id="ct-soc-t" className="t-label bj-lbl">Follow NEAR</h2>
          <ul className="ct-soc">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a className="ct-soc__a" href={s.href} target="_blank" rel="me noopener">
                  <svg className="ct-soc__ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{s.mark}</svg>
                  <span className="ct-soc__l">{s.label}</span>
                  <Ext /><span className="sr-only"> (another site)</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

/** the whole page: home v5's header, the band, the footer */
export function Contact({ home = "/" }: { home?: string }): ReactNode {
  return (
    <>
      <FixVersion v="v3" />
      <V3Header home={home} spread stay soft />
      <main id="main"><ContactBand /></main>
      <V3Footer />
      <ExtraChip />{/* temporary way back to /extra: remove this line to drop it */}
    </>
  );
}
