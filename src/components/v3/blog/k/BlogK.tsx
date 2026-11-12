"use client";
// Blog K · By format, open. Blog F's structure with the ruled grid taken away: no cells, no dividers, no crosshairs. Everything sits on an invisible
// twelve-column grid and is held apart by space and type; a hairline appears only where a part of the page ends.
//   1. the hero: The NEAR blog and the search, a typeahead over every post (Search.tsx; "/" or Cmd / Ctrl + K);
//   2. Browse by format: three quiet links, one per format (its photo, its name and count, who is in it);
//   3. Customer stories: two told large (the photo beside the copy, alternating sides), then four smaller, two to a row;
//   4. Inside NEAR talks: the page's one dark band, the player (poster, play mark, title, speaker) and its playlist; pointing at or focusing a talk
//      puts it in the player (a link, nothing plays);
//   5. Read: the one read, editorial (the photo wide, the headline large under it);
//   6. All posts: the filters and a Grid / List switch;
//   7. the newsletter.
// Searching (Enter, or "See all N results") swaps 2–6 for the results (the same filters and switch, the words marked, a no-results state); clearing the
// field, Escape or "Clear search" brings the sections back. The swap cross-fades. Arrivals: blocks rise once as they come in. Reduced motion: all still.
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { useScrollMotion, prefersReduced } from "@/lib/motion/scroll";
import { ACTION, BLOG, FILTERS, TYPE_LABEL, byType, href, idx, img, type FilterKey, type Post, type Type } from "../data";
import { Arrow, ExtSr, Tabs } from "../parts";
import { Search } from "./Search";
import { Hl, match } from "./find";
import "./blog-k.css";

const STORIES = byType("story"), TALKS = byType("watch"), READS = byType("read");
const LARGE = 2;   // stories told large; the rest sit smaller, two to a row
const uniq = (a: string[]) => [...new Set(a)];
const FORMATS: { key: Type; id: string; name: string; unit: [string, string]; who: string; cover: Post }[] = [
  { key: "story", id: "bk-stories", name: "Customer stories", unit: ["story", "stories"], who: uniq(STORIES.map((p) => p.source)).join(", "), cover: STORIES[LARGE] },
  { key: "watch", id: "bk-talks", name: "Inside NEAR talks", unit: ["talk", "talks"], who: uniq(TALKS.map((p) => p.source.split(",")[0])).join(", "), cover: TALKS[0] },
  { key: "read", id: "bk-read", name: "Read", unit: ["read", "reads"], who: uniq(READS.map((p) => p.source)).join(", "), cover: READS[0] },
];
const many = (n: number, [one, more]: [string, string]) => `${n} ${n === 1 ? one : more}`;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NARROW = "(max-width: 859px)";
const onNarrow = (cb: () => void) => { const m = matchMedia(NARROW); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };
const FADE = 200;   // ms: the old view fades this long before the new one rises

/** [data-in] blocks rise once as they come in (one already above the view is simply there); scan() picks up blocks React has added since */
function arrivals(root: HTMLElement, reduced: boolean) {
  if (reduced) {
    const all = () => root.querySelectorAll("[data-in]").forEach((el) => el.classList.add("is-in"));
    all(); return { scan: all, dispose: () => {} };
  }
  root.setAttribute("data-motion", "");
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); e.target.classList.add("is-in"); } }), { rootMargin: "0px 0px -6% 0px" });
  const scan = () => root.querySelectorAll<HTMLElement>("[data-in]:not(.is-in)").forEach((el) => {
    if (el.getBoundingClientRect().bottom < 0) el.classList.add("is-in"); else io.observe(el);
  });
  scan();
  return { scan, dispose: () => { io.disconnect(); root.removeAttribute("data-motion"); } };
}

/** a section's head: the h2 (Kepler accent inside), and on the right its count after a green dot */
function Head({ id, children, meta, live, dark }: { id: string; children: ReactNode; meta?: ReactNode; live?: boolean; dark?: boolean }) {
  return (
    <div className={`bk-wrap bk-head${dark ? " bk-head--dark" : ""}`} data-in="">
      <h2 id={id} className="bl-h2 bk-head__h" tabIndex={-1}>{children}</h2>
      {meta && <p className="bk-head__meta t-label" aria-live={live ? "polite" : undefined} aria-atomic={live ? true : undefined}><i className="bk-dot" aria-hidden="true" />{meta}</p>}
    </div>
  );
}

/** a photo in its frame (the frame clips, the image zooms a little on hover) */
const Pic = ({ src, cls = "", eager }: { src: string; cls?: string; eager?: boolean }) => (
  <span className={`bk-pic ${cls}`}><img src={src} alt="" loading={eager ? "eager" : "lazy"} decoding="async" /></span>
);
const Play = ({ cls = "" }: { cls?: string }) => (
  <span className={`bk-play ${cls}`} aria-hidden="true"><svg viewBox="0 0 16 16" focusable="false"><path d="M5 3.2v9.6L12.6 8z" /></svg></span>
);

/** a story told large: the photo beside the copy, with air; `flip` puts the photo on the right */
function Told({ p, i, flip }: { p: Post; i: number; flip: boolean }) {
  const u = href(p);
  return (
    <article className={`bk-wrap bk-told${flip ? " is-flip" : ""}`} data-in="">
      <a className="bk-told__ph" href={u} tabIndex={-1} aria-hidden="true"><Pic src={img(p.id)} /></a>
      <div className="bk-told__body">
        <a className="bk-told__a" href={u}>
          <span className="bk-kind t-label">{TYPE_LABEL.story}<span className="bk-told__n" aria-hidden="true">{idx(i)} / {idx(STORIES.length - 1)}</span></span>
          <h3 className="bk-told__t">{p.title}<ExtSr h={u} /></h3>
          <span className="bk-told__src">{p.source}</span>
          <span className="bk-go"><span>{ACTION.story}</span><Arrow /></span>
        </a>
        {p.note && <p className="bk-note">{p.note}</p>}
      </div>
    </article>
  );
}

/** a smaller story: the thumbnail beside the title */
function Small({ p }: { p: Post }) {
  const u = href(p);
  return (
    <article className="bk-small" data-in="">
      <a className="bk-small__a" href={u}>
        <Pic src={img(p.id)} cls="bk-small__ph" />
        <span className="bk-small__txt">
          <span className="bk-kind t-label">{TYPE_LABEL.story}</span>
          <h3 className="bk-small__t">{p.title}<ExtSr h={u} /></h3>
          <span className="bk-small__src">{p.source}<span className="bk-arr-in" aria-hidden="true"><Arrow /></span></span>
        </span>
      </a>
      {p.note && <p className="bk-note bk-small__note">{p.note}</p>}
    </article>
  );
}

/** a post in the index, as a card (grid) or a row (list); q's words are marked */
function Item({ p, j, q, list }: { p: Post; j: number; q: string; list: boolean }) {
  const u = href(p);
  return (
    <li className={list ? "bk-li" : "bk-card"} style={{ ["--j" as string]: Math.min(j, 8) }}>
      <a className={list ? "bk-li__a" : "bk-card__a"} href={u}>
        <span className={list ? "bk-li__ph" : "bk-card__ph"}>
          <Pic src={img(p.id)} />
          {p.type === "watch" && <Play cls={list ? "bk-play--s" : ""} />}
        </span>
        <span className={list ? "bk-li__txt" : "bk-card__txt"}>
          <span className="bk-kind t-label">{TYPE_LABEL[p.type]}</span>
          <h3 className={list ? "bk-li__t" : "bk-card__t"}><Hl text={p.title} q={q} /><ExtSr h={u} /></h3>
          <span className={list ? "bk-li__src" : "bk-card__src"}><Hl text={p.source} q={q} /><span className="bk-arr-in" aria-hidden="true"><Arrow /></span></span>
        </span>
      </a>
      {p.note && <p className={`bk-note ${list ? "bk-li__note" : "bk-card__note"}`}>{p.note}</p>}
    </li>
  );
}

type View = "grid" | "list";
/** the index: the filters, the Grid / List switch and the posts (All posts, or the results of a search) */
function Index({ q, view, setView, f, setF, onClear }: { q: string; view: View; setView: (v: View) => void; f: FilterKey; setF: (k: FilterKey) => void; onClear?: () => void }) {
  const base = match(q), list = base.filter((p) => f === "all" || p.type === f);
  const counts = Object.fromEntries(FILTERS.map((x) => [x.key, base.filter((p) => x.key === "all" || p.type === x.key).length])) as Record<FilterKey, number>;
  const label = FILTERS.find((x) => x.key === f)!.label;
  const [shown, setShown] = useState(false);
  const pre = q ? "bk-res" : "bk-all";
  const choose = (k: FilterKey) => { if (k === f) return; setF(k); setShown(true); };
  const pick = (v: View) => { if (v === view) return; setView(v); setShown(true); };
  const meta = <>{list.length} {list.length === 1 ? "post" : "posts"}{f !== "all" && <> in {label}</>}{q && <> matching “{q}”</>}</>;

  return (
    <section id={pre} className={`bk-sec bk-index${q ? " bk-index--q" : ""}`} aria-labelledby={`${pre}-t`}>
      {q
        ? <Head id={`${pre}-t`} live meta={meta}><span className="accent">Results</span> for “{q}”</Head>
        : <Head id={`${pre}-t`} live meta={meta}>All <span className="accent">posts</span></Head>}
      <div className="bk-wrap bk-bar" data-in="">
        <Tabs value={f} onChange={choose} id={`${pre}-tab`} controls={`${pre}-panel`} counts={counts} />
        <div className="bk-bar__end">
          {q && onClear && (
            <button type="button" className="bk-chip" onClick={onClear} aria-label={`Clear search: ${q}`}>
              <span>Clear search</span>
              <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 3l6 6M9 3 3 9" /></svg>
            </button>
          )}
          <div className="bk-view" role="group" aria-label="Layout">
            <button type="button" className="bk-view__b" aria-pressed={view === "grid"} onClick={() => pick("grid")}>
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="2" y="2" width="5" height="5" /><rect x="9" y="2" width="5" height="5" /><rect x="2" y="9" width="5" height="5" /><rect x="9" y="9" width="5" height="5" /></svg>
              <span>Grid</span>
            </button>
            <button type="button" className="bk-view__b" aria-pressed={view === "list"} onClick={() => pick("list")}>
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 4h12M2 8h12M2 12h12" /></svg>
              <span>List</span>
            </button>
          </div>
        </div>
      </div>
      <div key={`${f}|${view}`} id={`${pre}-panel`} role="tabpanel" aria-labelledby={`${pre}-tab-${f}`} className={`bk-panel${shown ? " is-shown" : ""}`}>
        {!list.length ? (
          <div className="bk-wrap bk-empty">
            <div className="bk-empty__in">
              <p className="bk-empty__t">No posts match “{q}”{f !== "all" && <> in {label}</>}.</p>
              <p className="bk-empty__s">Try another word (a team, a speaker, “stories”, “talks”), or clear the search to see every post.</p>
              <div className="bk-empty__go">
                {f !== "all" && <button type="button" className="bl-btn" onClick={() => choose("all")}><span>Search every format</span></button>}
                {onClear && <button type="button" className="bl-btn bl-btn--ink" onClick={onClear}><span>Clear search</span><Arrow /></button>}
              </div>
            </div>
          </div>
        ) : (
          <ol className={`bk-wrap ${view === "list" ? "bk-list" : "bk-cards"}`}>
            {list.map((p, j) => <Item key={p.id} p={p} j={j} q={q} list={view === "list"} />)}
          </ol>
        )}
      </div>
      <div className="bk-wrap bk-index__foot">
        <a className="bl-link" href={BLOG}><span>View everything on near.org</span><Arrow /><span className="sr-only"> (another site)</span></a>
      </div>
    </section>
  );
}

export function BlogK() {
  const ref = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null);
  const scan = useRef<() => void>(() => {});
  useScrollMotion(ref, (root, ctx) => { const a = arrivals(root, ctx.reduced); scan.current = a.scan; return () => { a.dispose(); scan.current = () => {}; }; });

  const [text, setText] = useState("");    // the field
  const [q, setQ] = useState("");          // the search shown (committed: Enter / See all)
  const [tv, setTv] = useState(0);         // the talk in the player
  const [fAll, setFAll] = useState<FilterKey>("all"), [fRes, setFRes] = useState<FilterKey>("all");
  const [picked, setView] = useState<View | null>(null);
  // until one is chosen, phones show the list (twelve full-width cards would be a long walk), wider screens the grid
  const narrow = useSyncExternalStore(onNarrow, () => matchMedia(NARROW).matches, () => false);
  const view = picked ?? (narrow ? "list" : "grid");

  // the swap: the old view fades, the new one rises in its place (reduced motion: at once)
  const [out, setOut] = useState(false);
  const timer = useRef(0);
  const swap = (next: string, after?: () => void) => {
    window.clearTimeout(timer.current);
    const go = () => { setQ(next); setFRes("all"); setOut(false); after?.(); };
    if (prefersReduced()) { go(); return; }
    setOut(true);
    timer.current = window.setTimeout(go, FADE);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // once the results (or the sections) are in: new blocks arrive; a search that lands below the fold brings its head into view
  const toTop = useRef(false);
  useEffect(() => {
    scan.current();
    if (!toTop.current) return;
    toTop.current = false;
    const el = stage.current; if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top > innerHeight * 0.55 || top < 0) scrollTo({ top: scrollY + top - 120, behavior: prefersReduced() ? "auto" : "smooth" });
  }, [q, fAll, fRes, view]);

  const seeAll = (v: string) => { if (v === q) return; toTop.current = true; swap(v); };
  const clearQ = (focusField = false) => {
    if (!q) return;
    swap("", () => { if (focusField) document.querySelector<HTMLInputElement>(".bk-s__field input")?.focus({ preventScroll: true }); });
  };
  const clearAll = () => { setText(""); toTop.current = true; clearQ(true); };

  // the newsletter (the homepage's NewsletterForm: required, a simple pattern, an inline error, success in place; nothing is sent)
  const email = useRef<HTMLInputElement>(null), ok = useRef<HTMLParagraphElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => { if (done) ok.current?.focus({ preventScroll: true }); }, [done]);
  const subscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = (email.current?.value ?? "").trim();
    const problem = !v ? "Enter your email address." : !EMAIL.test(v) ? "Enter an email address like name@example.com." : null;
    setErr(problem);
    if (problem) { email.current?.focus(); return; }
    setDone(true);   // [[TBD: newsletter provider]]: nothing is sent
  };

  const talk = TALKS[tv], read = READS[0];

  return (
    <div ref={ref} className="bl bk">
      {/* 1 · the hero */}
      <section className="bk-hero" aria-labelledby="bk-t">
        <div className="bk-wrap bk-hero__in">
          <div className="bk-hero__title" data-in="">
            <h1 id="bk-t" className="bl-h2 bk-h1">The NEAR <span className="accent">blog</span></h1>
            <p className="bl-lede bk-hero__lede">Customer stories, reads and talks from across the NEAR ecosystem.</p>
          </div>
          <div className="bk-hero__search" data-in="">
            <Search value={text} onChange={setText} onSeeAll={seeAll} onClear={() => clearQ()} />
          </div>
        </div>
      </section>

      <div ref={stage} className={`bk-stage${out ? " is-out" : ""}`}>
        {q ? (
          <div key="res" className="bk-swap">
            <Index q={q} view={view} setView={setView} f={fRes} setF={setFRes} onClear={clearAll} />
          </div>
        ) : (
          <div key="browse" className="bk-swap">
            {/* 2 · Browse by format */}
            <nav className="bk-wrap bk-fmt" aria-labelledby="bk-fmt-t">
              <h2 id="bk-fmt-t" className="bk-fmt__h t-label" data-in="">Browse by format</h2>
              <ul className="bk-fmt__list" role="list">
                {FORMATS.map((x, i) => {
                  const n = byType(x.key).length;
                  return (
                    <li key={x.key} className="bk-fmt__item" data-in="" style={{ ["--j" as string]: i }}>
                      <a className="bk-fmt__a" href={`#${x.id}`}>
                        <Pic src={img(x.cover.id)} cls="bk-fmt__ph" eager />
                        <span className="bk-fmt__top" aria-hidden="true"><span className="bk-fmt__idx">{idx(i)}</span><span className="bk-fmt__go"><Arrow /></span></span>
                        <span className="bk-fmt__name">{x.name}<span className="bk-fmt__n" aria-hidden="true">{n}</span><span className="sr-only">, {many(n, x.unit)}</span></span>
                        <span className="bk-fmt__who">{x.who}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* 3 · Customer stories */}
            <section id="bk-stories" className="bk-sec" aria-labelledby="bk-stories-t">
              <Head id="bk-stories-t" meta={many(STORIES.length, FORMATS[0].unit)}>Customer <span className="accent">stories</span></Head>
              <div className="bk-told-list">
                {STORIES.slice(0, LARGE).map((p, i) => <Told key={p.id} p={p} i={i} flip={i % 2 === 1} />)}
              </div>
              <div className="bk-wrap bk-more">
                {STORIES.slice(LARGE).map((p) => <Small key={p.id} p={p} />)}
              </div>
            </section>

            {/* 4 · Inside NEAR talks: the one dark band */}
            <section id="bk-talks" className="bk-sec bk-dark" aria-labelledby="bk-talks-t">
              <Head id="bk-talks-t" meta={many(TALKS.length, FORMATS[1].unit)} dark>Inside NEAR <span className="accent">talks</span></Head>
              <div className="bk-wrap bk-tv" data-in="">
                <div className="bk-tv__stage">
                  {/* the player: the talk last pointed at or focused in the playlist (every talk is a link there too, so the player is pointer-only) */}
                  <a className="bk-tv__a" href={href(talk)} tabIndex={-1} aria-hidden="true">
                    <span className="bk-tv__frame">
                      {TALKS.map((p, i) => <img key={p.id} className={`bk-tv__img${i === tv ? " is-on" : ""}`} src={img(p.id)} alt="" loading="lazy" decoding="async" />)}
                      <Play cls="bk-play--l" />
                    </span>
                    <span key={tv} className="bk-tv__body">
                      <span className="bk-tv__k t-label">{TYPE_LABEL.watch} · {idx(tv)} / {idx(TALKS.length - 1)}</span>
                      <span className="bk-tv__t">{talk.title}</span>
                      <span className="bk-tv__src">{talk.source}</span>
                    </span>
                  </a>
                </div>
                <div className="bk-tv__side">
                  <p className="bk-tv__lh t-label" aria-hidden="true">Playlist</p>
                  <ol className="bk-tv__list" aria-label="Talks">
                    {TALKS.map((p, i) => (
                      <li key={p.id} className={`bk-tv__item${i === tv ? " is-on" : ""}`} onPointerEnter={() => setTv(i)} onFocus={() => setTv(i)}>
                        <a className="bk-tv__la" href={href(p)}>
                          <span className="bk-tv__idx" aria-hidden="true">{idx(i)}</span>
                          <span className="bk-tv__lt"><span className="bk-tv__lname">{p.title}<ExtSr h={href(p)} /></span><span className="bk-tv__lsrc">{p.source.replace(/, Inside NEAR$/, "")}</span></span>
                          <span className="bk-tv__go" aria-hidden="true"><Arrow /></span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>

            {/* 5 · Read: editorial */}
            <section id="bk-read" className="bk-sec" aria-labelledby="bk-read-t">
              <Head id="bk-read-t" meta={many(READS.length, FORMATS[2].unit)}><span className="accent">Read</span></Head>
              {read && (
                <article className="bk-wrap bk-rd" data-in="">
                  <a className="bk-rd__a" href={href(read)}>
                    <Pic src={img(read.id)} cls="bk-rd__ph" />
                    <span className="bk-rd__main">
                      <span className="bk-kind t-label">{TYPE_LABEL.read}</span>
                      <h3 className="bk-rd__t">{read.title}<ExtSr h={href(read)} /></h3>
                    </span>
                    <span className="bk-rd__side">
                      <span className="bk-rd__src">{read.source}</span>
                      <span className="bk-go"><span>{ACTION.read}</span><Arrow /></span>
                    </span>
                  </a>
                </article>
              )}
            </section>

            {/* 6 · All posts */}
            <Index q="" view={view} setView={setView} f={fAll} setF={setFAll} />
          </div>
        )}
      </div>

      {/* 7 · the newsletter */}
      <section className="bk-sec bk-nl" aria-labelledby="bk-nl-t">
        <div className="bk-wrap bk-nl__in" data-in="">
          <div className="bk-nl__copy">
            <h2 id="bk-nl-t" className="t-label"><i className="bk-dot" aria-hidden="true" />Newsletter</h2>
            <p className="bk-nl__lede">Get the latest product launches, protocol milestones, and ecosystem updates straight to your{" "}inbox.</p>
          </div>
          <form className={`bk-form${err ? " is-invalid" : ""}`} method="post" noValidate onSubmit={subscribe}>
            <label htmlFor="bk-email" className="bk-form__label t-label">Email address</label>
            <div className={`bk-form__slot${done ? " is-done" : ""}`}>
              <div className="bk-field" inert={done}>
                <input ref={email} id="bk-email" name="email" type="email" required autoComplete="email" inputMode="email" spellCheck={false} placeholder="you@example.com"
                  aria-invalid={err ? true : undefined} aria-describedby="bk-email-err bk-email-note" onInput={() => { if (err) setErr(null); }} />
                <button type="submit" className="bk-field__btn"><span>Subscribe</span><Arrow /></button>
                <i className="bk-field__line" aria-hidden="true" />
              </div>
              <div role="status" className="bk-form__status">
                {done && (
                  <p ref={ok} className="bk-form__ok" tabIndex={-1}>
                    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span>Thanks for subscribing.</span><span className="bk-form__pre">Preview only: nothing was sent.</span>
                  </p>
                )}
              </div>
            </div>
            <p id="bk-email-err" className="bk-form__err">{err && <span>{err}</span>}</p>
            <p id="bk-email-note" className="bk-form__note">By subscribing, you agree to our <a href="https://www.near.org/privacy-policy">Privacy Policy</a>.</p>
          </form>
        </div>
      </section>
    </div>
  );
}
