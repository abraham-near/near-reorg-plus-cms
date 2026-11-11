"use client";
// Blog D · Newsroom: a search-led front page on the ruled grid of /home-v3.
// The hero is one modest row (the kicker and the heading at section scale | the search, large and ruled like the homepage's newsletter field), then the
// filter bar (Go deeper's tablist, its counts following the search). With no query and All chosen, the front page: Latest (the lead post large, two
// beside it), Customer stories (a shelf that scrolls sideways, snap, prev / next), Inside NEAR (the talks on a black band, the footer's black: the first large, four beside it), All posts
// (Get into NEAR's rows: the ink rises into the row, the photo in the next cell follows the row pointed at or focused). A query or a filter swaps the
// front page for one Results view (cards, the matched words marked, a live count; an empty state with Clear search). The newsletter row closes the page.
// Keys: "/" focuses the search, Esc clears it (then the filter). Motion: grid.ts (rows draw, crosshairs; photos held still), the heading rises word by word.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { SplitText } from "gsap/SplitText";
import { useScrollMotion } from "@/lib/motion/scroll";
import { mountGrid, type Grid } from "../grid";
import { ACTION, BLOG, FILTERS, POSTS, TYPE_LABEL, chunk, href, idx, img, type FilterKey, type Post, type Type } from "../data";
import { Arrow, Ext, ExtSr } from "../parts";
import { Tabs } from "./Tabs";
import { Hl, counts, results, terms } from "./search";
import "./blog-d.css";

const STORIES = POSTS.filter((p) => p.type === "story");
const TALKS = POSTS.filter((p) => p.type === "watch");
const NOUN: Record<Type, [string, string]> = { story: ["customer story", "customer stories"], read: ["read", "reads"], watch: ["talk", "talks"] };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "4 results for “privacy”", "2 customer stories for “privacy”", "6 customer stories", "No results for “xyz”" */
function sentence(n: number, q: string, f: FilterKey) {
  const [one, many] = f === "all" ? ["result", "results"] : NOUN[f];
  const what = n === 0 ? `No ${many}` : `${n} ${n === 1 ? one : many}`;
  return q ? `${what} for “${q}”` : what;
}

/** a photo held still in its frame (data-still: grid.ts leaves it; it still opens as its row arrives) */
const Still = ({ src, cls = "", eager }: { src: string; cls?: string; eager?: boolean }) => (
  <div className={`bl-ph ${cls}`} data-ph="" data-still=""><img className="bl-img" src={src} alt="" loading={eager ? "eager" : "lazy"} decoding="async" /></div>
);

/** a post card (blog.css's .bl-card); `brand`: the source set large on top, as a name without its logo (the stories shelf) */
function Card({ p, j = 0, ts = [], cls = "", brand, eager }: { p: Post; j?: number; ts?: string[]; cls?: string; brand?: boolean; eager?: boolean }) {
  const u = href(p);
  return (
    <article className={`bl-card bl-d__card ${cls}`} style={{ ["--j" as string]: j }}>
      <a className="bl-card__a" href={u}>
        <Still src={img(p.id)} cls="bl-card__ph" eager={eager} />
        {p.type === "watch" && <span className="bl-play" aria-hidden="true"><i data-icon="play" /></span>}
        <div className="bl-card__body" data-rv="">
          {brand
            ? <span className="bl-d__brand">{p.source}</span>
            : <span className="bl-meta t-label"><i className="bl-glyph" data-icon={`deeper-${p.type}`} aria-hidden="true" />{TYPE_LABEL[p.type]}</span>}
          <h3 className="bl-card__t"><Hl text={p.title} ts={ts} /><ExtSr h={u} /></h3>
          <span className="bl-card__foot">
            <span className="bl-card__src">{brand ? ACTION[p.type] : <Hl text={p.source} ts={ts} />}</span>
            <span className="bl-card__go" aria-hidden="true"><Arrow /></span>
          </span>
        </div>
      </a>
      {p.note && <p className="bl-card__note">{p.note}</p>}
    </article>
  );
}

/** a section's heading row: the title, a count, its actions on the right */
function Head({ id, title, n, children, rowRef }: { id: string; title: string; n?: string; children?: ReactNode; rowRef?: Ref<HTMLDivElement> }) {
  return (
    <div ref={rowRef} className="bl-row bl-d__sh" data-row="">
      <div className="bl-cell bl-d__sh-cell">
        <h2 id={id} className="bl-d__h2" data-rv="" tabIndex={-1}>{title}</h2>
        {n && <span className="bl-d__sh-n t-label" data-rv="">{n}</span>}
        {children && <div className="bl-d__sh-act" data-rv="">{children}</div>}
      </div>
    </div>
  );
}

const SearchGlyph = () => (
  <svg className="bl-d__sg" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="7" cy="7" r="4.75" /><path d="m10.5 10.5 3.5 3.5" /></svg>
);

export function BlogD() {
  const ref = useRef<HTMLDivElement>(null), grid = useRef<Grid | null>(null), reduced = useRef(false);
  const input = useRef<HTMLInputElement>(null), bar = useRef<HTMLDivElement>(null), resH = useRef<HTMLHeadingElement>(null);
  const shelf = useRef<HTMLUListElement>(null), thumb = useRef<HTMLElement>(null);
  const [raw, setRaw] = useState("");
  const [f, setF] = useState<FilterKey>("all");
  const [touched, setTouched] = useState(false);   // the view has swapped once: views fade in as they mount from now on
  const [said, setSaid] = useState("");            // the live region (debounced)
  const [act, setAct] = useState(POSTS[0].id);     // All posts: the post in the preview
  const [ends, setEnds] = useState({ start: true, end: false });   // the shelf at its ends
  const goResults = useRef(false);                 // See all: once the results are in, bring them into view and focus their heading

  useScrollMotion(ref, (root, ctx) => {
    reduced.current = ctx.reduced;
    const g = mountGrid(root, ctx); grid.current = g;
    let split: SplitText | null = null;
    const h = root.querySelector<HTMLElement>(".bl-d__h1");
    if (h && !ctx.reduced) {
      ctx.gsap.registerPlugin(SplitText);
      split = SplitText.create(h, { type: "words", mask: "words", wordsClass: "bl-d__w" });
      ctx.gsap.from(split.words, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.06, delay: 0.1 });
    }
    return () => { split?.revert(); g.dispose(); grid.current = null; };
  });

  const ts = useMemo(() => terms(raw), [raw]);
  const q = raw.trim();
  const mode = ts.length || f !== "all" ? "results" : "front";
  const list = useMemo(() => results(f, ts), [f, ts]);
  const n = useMemo(() => counts(ts), [ts]);
  const said0 = mode === "front" ? `${POSTS.length} posts` : sentence(list.length, q, f);

  // rows React added or removed: crosshairs, arrivals (rows already in view are simply there)
  useLayoutEffect(() => { grid.current?.sync(true); }, [mode, list]);
  // announce the count once the typing settles
  useEffect(() => { if (!touched) return; const t = setTimeout(() => setSaid(said0), 450); return () => clearTimeout(t); }, [said0, touched]);
  // See all → the results' heading
  useEffect(() => {
    if (!goResults.current || mode !== "results") return;
    goResults.current = false;
    bar.current?.scrollIntoView({ block: "start", behavior: reduced.current ? "auto" : "smooth" });
    resH.current?.focus({ preventScroll: true });
  }, [mode, f]);
  // "/" focuses the search from anywhere but a field
  useEffect(() => {
    const k = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault(); input.current?.focus();
      input.current?.scrollIntoView({ block: "center", behavior: reduced.current ? "auto" : "smooth" });
    };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);
  // the shelf: its ends (the buttons) and the thumb under it
  useEffect(() => {
    const el = shelf.current; if (!el) return;
    const upd = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEnds((o) => { const s = el.scrollLeft <= 2, e = el.scrollLeft >= max - 2; return o.start === s && o.end === e ? o : { start: s, end: e }; });
      if (thumb.current) {
        thumb.current.style.width = `${((el.clientWidth / el.scrollWidth) * 100).toFixed(2)}%`;
        thumb.current.style.left = `${((el.scrollLeft / el.scrollWidth) * 100).toFixed(2)}%`;
      }
    };
    upd();
    el.addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd);
    return () => { el.removeEventListener("scroll", upd); removeEventListener("resize", upd); };
  }, [mode]);
  const step = (d: number) => {
    const el = shelf.current, c = el?.querySelector("li"); if (!el || !c) return;
    el.scrollBy({ left: d * c.getBoundingClientRect().width, behavior: reduced.current ? "auto" : "smooth" });
  };

  const type = (v: string) => { setRaw(v); setTouched(true); };
  const choose = (k: FilterKey) => { setF(k); setTouched(true); };
  const seeAll = (k: FilterKey) => { goResults.current = true; choose(k); };
  const clearAll = () => { setRaw(""); setF("all"); setTouched(true); input.current?.focus(); };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    if (raw) type(""); else if (f !== "all") choose("all"); else input.current?.blur();
  };
  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (matchMedia("(hover: none)").matches) input.current?.blur();   // touch: put the keyboard away
    const b = bar.current?.getBoundingClientRect();
    if (b && (b.top < 0 || b.bottom > innerHeight * 0.5)) bar.current?.scrollIntoView({ block: "start", behavior: reduced.current ? "auto" : "smooth" });
  };

  // the newsletter (the homepage's close, as there: required, a simple pattern, an inline error, success in place; nothing is sent)
  const mail = useRef<HTMLInputElement>(null), ok = useRef<HTMLParagraphElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => { if (done) ok.current?.focus({ preventScroll: true }); }, [done]);
  const onSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = (mail.current?.value ?? "").trim();
    const problem = !v ? "Enter your email address." : !EMAIL.test(v) ? "Enter an email address like name@example.com." : null;
    setError(problem);
    if (problem) { mail.current?.focus(); return; }
    // [[TBD: newsletter provider]]: send `v` here. Nothing is sent.
    setDone(true);
  };

  const label = FILTERS.find((x) => x.key === f)!.label;
  const cur = POSTS.find((p) => p.id === act)!;

  return (
    <div ref={ref} className="bl bl-d">
      {/* ── the hero: the heading | the search; the filter bar ── */}
      <section className="bl-d__hero" aria-labelledby="bl-d-t">
        <div className="bl-row bl-d__head" data-row="" data-start="">
          <div className="bl-cell bl-d__title">
            <p className="t-label bl-d__kick" data-rv="">Customer stories · Reads · Talks</p>
            <h1 id="bl-d-t" className="bl-h2 bl-d__h1">The NEAR <span className="accent">blog</span></h1>
          </div>
          <div className="bl-cell bl-d__find">
            <form role="search" aria-label="Blog" className="bl-d__search" onSubmit={onSearch} data-rv="">
              <label htmlFor="bl-d-q" className="bl-d__search-l t-label"><SearchGlyph />Search the blog</label>
              <div className="bl-d__field">
                <input ref={input} id="bl-d-q" name="q" type="search" value={raw} onChange={(e) => type(e.target.value)} onKeyDown={onKey}
                  placeholder="Title, source or type" autoComplete="off" spellCheck={false} enterKeyHint="search" aria-describedby="bl-d-q-hint" aria-controls="bl-d-content" />
                {raw && (
                  <button type="button" className="bl-d__clear" onClick={() => { type(""); input.current?.focus(); }}>
                    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4.5 4.5 7 7M11.5 4.5l-7 7" /></svg><span className="sr-only">Clear search</span>
                  </button>
                )}
                <button type="submit" className="bl-d__go"><span>Search</span><Arrow /></button>
                <i className="bl-d__line" aria-hidden="true" />
              </div>
              <p id="bl-d-q-hint" className="bl-d__hint">Press <kbd>/</kbd> to search, <kbd>Esc</kbd> to clear. Searches titles, sources and types.</p>
            </form>
          </div>
        </div>
        <div ref={bar} className="bl-row bl-d__bar" data-row="">
          <div className="bl-cell bl-d__bar-cell">
            <Tabs value={f} onChange={choose} id="bl-d-tab" controls="bl-d-content" counts={n} />
            <p className="bl-d__bar-n t-label" aria-hidden="true">{mode === "front" ? `${POSTS.length} posts` : `${list.length} of ${POSTS.length}`}</p>
            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{said}</p>
          </div>
        </div>
      </section>

      <div id="bl-d-content" role="tabpanel" aria-labelledby={`bl-d-tab-${f}`}>
        {mode === "front" ? (
          <div key="front" className={`bl-d__view${touched ? " is-swap" : ""}`}>
            {/* ── Latest: the lead | two beside it ── */}
            <section aria-labelledby="bl-d-latest">
              <Head id="bl-d-latest" title="Latest" />
              <div className="bl-row bl-d__front" data-row="">
                <div className="bl-cell bl-d__lead-cell"><Card p={POSTS[0]} cls="bl-d__lead bl-d__fill" eager /></div>
                <div className="bl-cell bl-d__side-cell">
                  <ul className="bl-d__side">{POSTS.slice(1, 3).map((p, j) => <li key={p.id}><Card p={p} j={j + 1} cls="bl-d__card--compact" eager /></li>)}</ul>
                </div>
              </div>
            </section>

            {/* ── Customer stories: a shelf ── */}
            <section aria-labelledby="bl-d-stories">
              <Head id="bl-d-stories" title="Customer stories" n={`${STORIES.length} stories`}>
                <button type="button" className="bl-link bl-d__all" onClick={() => seeAll("story")}><span>See all</span><Arrow /></button>
                <span className="bl-d__navs">
                  <button type="button" className="bl-d__nav bl-d__nav--prev" aria-controls="bl-d-shelf" disabled={ends.start} onClick={() => step(-1)}><Arrow /><span className="sr-only">Previous stories</span></button>
                  <button type="button" className="bl-d__nav" aria-controls="bl-d-shelf" disabled={ends.end} onClick={() => step(1)}><Arrow /><span className="sr-only">Next stories</span></button>
                </span>
              </Head>
              <div className="bl-row bl-d__shelf-row" data-row="">
                <div className="bl-cell bl-d__shelf-cell">
                  <ul ref={shelf} id="bl-d-shelf" className="bl-d__shelf" aria-label="Customer stories">
                    {STORIES.map((p, j) => <li key={p.id} className="bl-d__st"><Card p={p} j={j} brand cls="bl-d__story" /></li>)}
                  </ul>
                  <span className="bl-d__track" aria-hidden="true"><i ref={thumb} /></span>
                </div>
              </div>
            </section>

            {/* ── Inside NEAR: the talks on the black band ── */}
            <section className="bl-d__band" aria-labelledby="bl-d-talks">
              <Head id="bl-d-talks" title="Inside NEAR" n={`${TALKS.length} talks`}>
                <button type="button" className="bl-link bl-d__all" onClick={() => seeAll("watch")}><span>See all</span><Arrow /></button>
              </Head>
              <div className="bl-row bl-d__talks" data-row="">
                <div className="bl-cell bl-d__talk-lead"><Card p={TALKS[0]} cls="bl-d__fill" /></div>
                <div className="bl-cell bl-d__talk-more">
                  <ul className="bl-d__talk-grid">{TALKS.slice(1).map((p, j) => <li key={p.id}><Card p={p} j={j + 1} cls="bl-d__card--compact" /></li>)}</ul>
                </div>
              </div>
              <div className="bl-row bl-d__band-foot" aria-hidden="true"><div className="bl-cell" /></div>
            </section>

            {/* ── All posts: Get into NEAR's rows, the preview in the next cell ── */}
            <section aria-labelledby="bl-d-all">
              <Head id="bl-d-all" title="All posts" n={`${POSTS.length} posts`}>
                <a className="bl-link bl-d__all" href={BLOG}><span>near.org/blog</span><Ext /><span className="sr-only"> (another site)</span></a>
              </Head>
              <div className="bl-row bl-d__ix" data-row="">
                <div className="bl-cell bl-d__ix-list">
                  <ol>
                    {POSTS.map((p, i) => (
                      <li key={p.id} className={`bl-d__ix-item${act === p.id ? " is-act" : ""}`} onPointerEnter={() => setAct(p.id)} onFocus={() => setAct(p.id)}>
                        <a className="bl-d__ix-a" href={href(p)}>
                          <span className="bl-d__ix-n" aria-hidden="true">{idx(i)}</span>
                          <span className="bl-d__ix-type t-label">{TYPE_LABEL[p.type]}</span>
                          <span className="bl-d__ix-main">
                            <h3 className="bl-d__ix-t">{p.title}<ExtSr h={href(p)} /></h3>
                            {p.note && <span className="bl-d__ix-note">{p.note}</span>}
                          </span>
                          <span className="bl-d__ix-src">{p.source}</span>
                          <span className="bl-d__ix-go" aria-hidden="true"><Arrow /></span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="bl-cell bl-d__ix-pv" aria-hidden="true">
                  <div className="bl-d__ix-sticky">
                    <div className="bl-d__ix-frame">
                      {POSTS.map((p) => <div key={p.id} className={`bl-d__ix-img${act === p.id ? " is-on" : ""}`}><img src={img(p.id)} alt="" loading="lazy" decoding="async" /></div>)}
                      {cur.type === "watch" && <span className="bl-play"><i data-icon="play" /></span>}
                    </div>
                    <p className="bl-d__ix-cap"><span key={cur.id}>{idx(POSTS.indexOf(cur))} · {cur.source}</span></p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div key="results" className={`bl-d__view${touched ? " is-swap" : ""}`}>
            {/* ── Results: one view for a query or a filter ── */}
            <section aria-labelledby="bl-d-res-t">
              <div className="bl-row bl-d__sh bl-d__res-head" data-row="">
                <div className="bl-cell bl-d__sh-cell">
                  <h2 id="bl-d-res-t" ref={resH} className="bl-d__h2" tabIndex={-1}>{sentence(list.length, q, f)}</h2>
                  {f !== "all" && q && <span className="bl-d__sh-n t-label">in {label}</span>}
                  <div className="bl-d__sh-act">
                    <button type="button" className="bl-link bl-d__all" onClick={clearAll}><span>{q ? "Clear search" : "Show everything"}</span></button>
                  </div>
                </div>
              </div>
              {list.length ? (
                chunk(list, 3).map((row, r) => (
                  <div key={r} className="bl-row bl-d__res" data-row="">
                    {row.map((p, j) => <div key={p.id} className="bl-cell bl-d__res-cell"><Card p={p} j={r * 3 + j} ts={ts} cls="bl-d__card--compact" eager={r === 0} /></div>)}
                    {Array.from({ length: 3 - row.length }, (_, k) => <div key={`e${k}`} className="bl-cell bl-d__res-cell bl-d__res-cell--empty" aria-hidden="true" />)}
                  </div>
                ))
              ) : (
                <div className="bl-row bl-d__empty" data-row="">
                  <div className="bl-cell bl-d__empty-cell">
                    <p className="bl-d__empty-t">Nothing in the titles, sources or types matches{q ? <> “{q}”</> : null}{f !== "all" ? <> in {label}</> : null}.</p>
                    <p className="bl-d__empty-act">
                      <button type="button" className="bl-btn bl-btn--ink" onClick={clearAll}><span>Clear search</span></button>
                      {f !== "all" && n.all > 0 && <button type="button" className="bl-btn" onClick={() => choose("all")}><span>Search all types ({n.all})</span></button>}
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* ── the newsletter: the homepage's close copy, small, on the grid ── */}
      <section aria-labelledby="bl-d-nl">
        <div className="bl-row bl-row--end bl-d__nl" data-row="">
          <div className="bl-cell bl-d__nl-copy">
            <h2 id="bl-d-nl" className="bl-d__h2" data-rv="">Newsletter</h2>
            <p className="bl-d__nl-lede" data-rv="">Get the latest product launches, protocol milestones, and ecosystem updates straight to your{" "}inbox.</p>
          </div>
          <div className="bl-cell bl-d__nl-form">
            <form className={`bl-d__form${error ? " is-invalid" : ""}`} method="post" noValidate onSubmit={onSubscribe} data-rv="">
              <label htmlFor="bl-d-email" className="bl-d__search-l t-label"><i className="bl-d__mail" data-icon="mail" data-icon-size="16" aria-hidden="true" />Email address</label>
              <div className={`bl-d__slot${done ? " is-done" : ""}`}>
                <div className="bl-d__field bl-d__field--s" inert={done}>
                  <input ref={mail} id="bl-d-email" name="email" type="email" required autoComplete="email" inputMode="email" spellCheck={false} placeholder="you@example.com"
                    aria-invalid={error ? true : undefined} aria-describedby="bl-d-email-err bl-d-email-note" onInput={() => { if (error) setError(null); }} />
                  <button type="submit" className="bl-d__go"><span>Subscribe</span><Arrow /></button>
                  <i className="bl-d__line" aria-hidden="true" />
                </div>
                <div role="status" className="bl-d__status">
                  {done && (
                    <p ref={ok} className="bl-d__ok" tabIndex={-1}>
                      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <span>Thanks for subscribing.</span><span className="bl-d__pre">Preview only: nothing was sent.</span>
                    </p>
                  )}
                </div>
              </div>
              <p id="bl-d-email-err" className="bl-d__err">
                {error && (<><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5v4.5M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg><span>{error}</span></>)}
              </p>
              <p id="bl-d-email-note" className="bl-d__note">By subscribing, you agree to our <a href="https://www.near.org/privacy-policy">Privacy Policy</a>.</p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
