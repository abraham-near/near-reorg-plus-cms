"use client";
// Contact: the official pages' hand (home v5's spread header and footer, Blog J's head, rail and open feed). Scoped under .ct (contact.css), on top of
// the blog's tokens and pieces (v3/blog/blog.css: .bl, .bl-btn, .bl-link, .accent) and Blog J's (v3/blog/j/blog-j.css: .bj-head, .bj-rail, .bj-field …).
//   - the head: the heading at display scale with one Kepler accent word; under it, in the rail's column a one-line lede, in the feed's the two ways in
//     (Write to us, the docs); one hairline under the head.
//   - the body: the rail (sticky): "On this page", the routes and the form as a quiet list; the green dot slides to the part in view. The newsletter waits
//     at the rail's foot, as on the blog. The feed: the routes as rows with a hairline between them (label, line, the links), then the form.
//   - the form: name, email, topic, message. Checked here only (required, an email pattern, a few words); errors inline under each field, focus to the
//     first; success in place, over the fields (no layout shift). There is no backend: nothing is sent, and the success says so.
//   - below 1024 the rail's list becomes a row of text links over the feed; below 600 everything is one column.
// Motion: Blog J's (v3/blog/j/motion.ts): the heading rises word by word, blocks ([data-in]) fade and rise as they come in, the line icons draw.
// Reduced motion: no data-motion on the root, every block is simply there.
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { prefersReduced, useScrollMotion } from "@/lib/motion/scroll";
import { FixVersion } from "@/components/shared/version";
import { ExtraChip } from "@/components/ExtraChip";
import { V3Header } from "@/components/v3/header/Header";
import { V3Footer } from "@/components/v3/footer/Footer";
import { Arrow, Ext } from "@/components/v3/blog/parts";
import { Newsletter } from "@/components/v3/blog/j/parts";
import { mount } from "@/components/v3/blog/j/motion";
import "@/components/v3/buttons.css";
import "@/components/v3/blog/blog.css";
import "@/components/v3/blog/j/blog-j.css";
import "./contact.css";

/* ── the topics (the form's select; a route can preset one) ── */
const TOPICS = ["General", "Press", "Partnerships", "Builders", "Other"] as const;
type Topic = (typeof TOPICS)[number];

/* ── the routes: real, public links only (the footer's own, near.org's family) ── */
type Go = { label: string; href: string } | { label: string; topic: Topic };
type Route = { id: string; kind: string; icon: string; title: string; text: string; go: Go[] };
const ROUTES: Route[] = [
  { id: "ct-builders", kind: "Builders", icon: "docs", title: "Build on NEAR",
    text: "Guides, references and tools are in the docs. Code questions get answered fastest in the open, where other builders can help.",
    go: [{ label: "Developer docs", href: "https://docs.near.org" }, { label: "NEAR on GitHub", href: "https://github.com/near" }, { label: "Ask on Discord", href: "https://near.chat/" }] },
  { id: "ct-press", kind: "Press", icon: "news", title: "Press and media",
    text: "Interviews, comment or background for a story. Choose Press in the form below.",
    go: [{ label: "Write to the press team", topic: "Press" }, { label: "Latest news", href: "/blog" }] },
  { id: "ct-partners", kind: "Partnerships", icon: "foundation", title: "Partnerships and ecosystem",
    text: "Partnerships, funding and ecosystem programs start with the NEAR Foundation.",
    go: [{ label: "NEAR Foundation", href: "https://near.foundation" }, { label: "Write about a partnership", topic: "Partnerships" }] },
  { id: "ct-careers", kind: "Careers", icon: "briefcase", title: "Work with us",
    text: "Open roles at the NEAR Foundation are listed on its jobs board.",
    go: [{ label: "Open roles", href: "https://job-boards.eu.greenhouse.io/nearfoundation" }] },
  { id: "ct-community", kind: "Community", icon: "people", title: "Join the community",
    text: "Follow the news, meet other builders and users, and join the conversation.",
    go: [{ label: "X", href: "https://x.com/nearprotocol" }, { label: "Discord", href: "https://near.chat/" }, { label: "Telegram", href: "https://t.me/cryptonear" }] },
];
const NAV = [...ROUTES.map((r) => ({ id: r.id, label: r.kind })), { id: "ct-write", label: "Write to us" }];
const ext = (h: string) => /^https?:/.test(h);

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

/** the rail's list: in-page links; the green dot slides to the part in view */
function OnThisPage({ current }: { current: string }) {
  const ref = useRef<HTMLOListElement>(null), dot = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const place = () => {
      const t = ref.current?.querySelector<HTMLElement>('[aria-current="location"]');
      if (t && dot.current && t.offsetHeight) dot.current.style.translate = `0 ${(t.offsetTop + t.offsetHeight / 2 - 3).toFixed(1)}px`;
    };
    place();
    addEventListener("resize", place); document.fonts?.ready.then(place);
    return () => removeEventListener("resize", place);
  }, [current]);
  return (
    <div className="bj-types ct-nav">
      <ol ref={ref} className="ct-nav__list">
        {NAV.map((n, i) => (
          <li key={n.id}>
            <a className="bj-type ct-nav__a" href={`#${n.id}`} aria-current={current === n.id ? "location" : undefined}>
              <span>{n.label}</span><span className="bj-type__n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            </a>
          </li>
        ))}
      </ol>
      <i ref={dot} className="bj-types__dot ct-nav__dot" aria-hidden="true" />
    </div>
  );
}

/** the page's band: head, rail, routes, form (the shell is <Contact />) */
export function ContactBand() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, (root, ctx) => { const m = mount(root, ctx); return () => m.dispose(); });

  /* ── the part in view (the rail's dot) ── */
  const [current, setCurrent] = useState(NAV[0].id);
  useEffect(() => {
    let raf = 0;
    const spy = () => {
      raf = 0;
      const line = innerHeight * 0.4;
      let at = NAV[0].id;
      for (const n of NAV) { const el = document.getElementById(n.id); if (el && el.getBoundingClientRect().top <= line) at = n.id; }
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) at = NAV[NAV.length - 1].id;
      setCurrent(at);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(spy); };
    spy();
    addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, []);

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

  const toForm = (t?: Topic) => {
    if (t) setTopic(t);
    const el = document.getElementById("ct-write");
    if (el) scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + scrollY - 104), behavior: prefersReduced() ? "auto" : "smooth" });
    nameRef.current?.focus({ preventScroll: true });
  };
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
      {/* ── the head ── */}
      <section className="bj-head ct-head" aria-labelledby="ct-t">
        <h1 id="ct-t" className="bj-h1">Get in <span className="accent">touch</span></h1>
        <p className="bj-lede" data-in="" style={{ ["--d" as string]: "0.35s" }}>Questions, press or partnerships. Pick a route below, or write to us.</p>
        <div className="ct-acts" data-in="" style={{ ["--d" as string]: "0.45s" }}>
          <a className="bl-btn bl-btn--ink" href="#ct-write" onClick={(e) => { e.preventDefault(); toForm(); }}><span>Write to us</span><Arrow /></a>
          <a className="bl-link" href="https://docs.near.org"><span>Developer docs</span><Ext /><span className="sr-only"> (another site)</span></a>
        </div>
        <i className="bj-rule" aria-hidden="true" />
      </section>

      <div className="bj-body ct-body">
        {/* ── the rail ── */}
        <div className="bj-rail ct-rail">
          <nav className="bj-rail__in" aria-labelledby="ct-nav-l" data-in="" style={{ ["--d" as string]: "0.3s" }}>
            <p id="ct-nav-l" className="t-label bj-lbl">On this page</p>
            <OnThisPage current={current} />
          </nav>
        </div>

        <div className="bj-feed ct-feed">
          {/* ── the routes ── */}
          <section className="ct-sec" aria-labelledby="ct-routes-t">
            <div className="bj-fhead">
              <h2 id="ct-routes-t" className="bj-fh">Ways to reach NEAR</h2>
              <p className="bj-showing">Pick the one closest to your question.</p>
            </div>
            <ul className="ct-routes">
              {ROUTES.map((r) => (
                <li key={r.id} id={r.id} className="ct-route" data-in="" data-ic="">
                  <div className="ct-route__body">
                    <p className="bj-kind t-label ct-kind"><i className="bl-glyph" data-icon={r.icon} aria-hidden="true" />{r.kind}</p>
                    <h3 className="ct-route__t">{r.title}</h3>
                    <p className="ct-route__p">{r.text}</p>
                  </div>
                  <ul className="ct-go" aria-label={`${r.kind}: links`}>
                    {r.go.map((g) => (
                      <li key={g.label}>
                        {"href" in g
                          ? <a className="bl-link" href={g.href}><span>{g.label}</span>{ext(g.href) ? <><Ext /><span className="sr-only"> (another site)</span></> : <Arrow />}</a>
                          : <a className="bl-link" href="#ct-write" onClick={(e) => { e.preventDefault(); toForm(g.topic); }}><span>{g.label}</span><Arrow /></a>}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          {/* ── the form ── */}
          <section id="ct-write" className="ct-sec ct-write" aria-labelledby="ct-write-t" data-in="">
            <div className="bj-fhead">
              <h2 id="ct-write-t" className="bj-fh">Write to us</h2>
              <p className="bj-showing">Every field is required.</p>
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
                  <div className="ct-f ct-f--topic">
                    <label htmlFor="ct-topic" className="t-label bj-lbl">Topic</label>
                    <div className="bj-field ct-field ct-field--sel">
                      <select id="ct-topic" name="topic" value={topic} onChange={(e) => setTopic(e.target.value as Topic)}>
                        {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <svg className="ct-chev" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
                    </div>
                    <Err id="ct-topic-err" />
                  </div>
                  <div className={`ct-f ct-f--msg${inv("message")}`}>
                    <div className="ct-f__top">
                      <label htmlFor="ct-msg" className="t-label bj-lbl">Message</label>
                      <span className="ct-count" aria-hidden="true">{count} / {MAX}</span>
                    </div>
                    <div className="bj-field ct-field ct-field--msg">
                      <textarea ref={msgRef} id="ct-msg" name="message" required rows={6} maxLength={MAX} placeholder="How can we help?"
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
        </div>

        {/* ── the newsletter, at the rail's foot (as on the blog) ── */}
        <section className="bj-nl ct-nl" aria-labelledby="ct-nl-t" data-in="">
          <h2 id="ct-nl-t" className="t-label bj-lbl">Newsletter</h2>
          <Newsletter />
        </section>
      </div>
    </div>
  );
}

/** the whole page: home v5's header, the band, the footer */
export function Contact({ home = "/home-v5" }: { home?: string }): ReactNode {
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
