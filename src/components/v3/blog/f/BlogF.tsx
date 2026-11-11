"use client";
// Blog F · By format. On the ruled grid of /home-v3, a quiet page that sorts the blog by what each post is:
//   1. the hero: The NEAR blog (section scale) and the search, a typeahead over every post (Search.tsx; "/" or Cmd / Ctrl + K);
//   2. Browse by format: Get into NEAR's rows (ink rises into the row on hover, the preview photo beside it switches), one per format, with its count;
//   3. Customer stories: Origin's rows (the photo edge to edge in its cell, the copy in the next; alternating) for the first two, then the rest as cards;
//   4. Inside NEAR talks: a dark band, a large tile and the numbered playlist; pointing at or focusing a talk puts it in the tile (a link, nothing plays);
//   5. Read: the one read, wide (Go deeper's featured item: the photo with air around it, the title large under it);
//   6. All posts: the index, with the filters, a Grid / List switch and the query from the search ("See all N results"), as a chip that removes it;
//   7. the newsletter (the homepage's copy).
// Motion: grid.ts (rows draw, crosshairs, text rises, photos open; the photo drift is off: blog-f.css) and the h1 rising word by word. Nothing is scrubbed.
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { SplitText } from "gsap/SplitText";
import { useScrollMotion, prefersReduced, type MotionCtx } from "@/lib/motion/scroll";
import { mountGrid, type Grid } from "../grid";
import { ACTION, BLOG, FILTERS, TYPE_LABEL, byType, chunk, href, idx, img, type FilterKey, type Post, type Type } from "../data";
import { Arrow, Card, ExtSr, Tabs } from "../parts";
import { Search } from "./Search";
import { Hl, match } from "./find";
import "./blog-f.css";

const STORIES = byType("story"), TALKS = byType("watch"), READS = byType("read");
const ORIGIN = 2;   // stories told large (Origin's rows); the rest are cards
const uniq = (a: string[]) => [...new Set(a)];
const FORMATS: { key: Type; id: string; name: string; unit: [string, string]; who: string; cover: Post }[] = [
  { key: "story", id: "bl-f-stories", name: "Customer stories", unit: ["story", "stories"], who: uniq(STORIES.map((p) => p.source)).join(", "), cover: STORIES[ORIGIN] },
  { key: "watch", id: "bl-f-talks", name: "Inside NEAR talks", unit: ["talk", "talks"], who: uniq(TALKS.map((p) => p.source.split(",")[0])).join(", "), cover: TALKS[0] },
  { key: "read", id: "bl-f-read", name: "Read", unit: ["read", "reads"], who: uniq(READS.map((p) => p.source)).join(", "), cover: READS[0] },
];
const many = (n: number, [one, more]: [string, string]) => `${n} ${n === 1 ? one : more}`;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NARROW = "(max-width: 859px)";
const onNarrow = (cb: () => void) => { const m = matchMedia(NARROW); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };

function mount(root: HTMLElement, ctx: MotionCtx) {
  const grid = mountGrid(root, ctx);
  let split: SplitText | null = null;
  const h = root.querySelector<HTMLElement>(".bl-f__h1");
  if (h && !ctx.reduced) {
    ctx.gsap.registerPlugin(SplitText);
    split = SplitText.create(h, { type: "words", mask: "words", wordsClass: "bl-f__w" });
    ctx.gsap.from(split.words, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.1 });
  }
  return { grid, dispose: () => { split?.revert(); grid.dispose(); } };
}

/** a section's heading row: the h2, and on the right its count */
function Head({ id, children, meta, dark, live }: { id: string; children: ReactNode; meta?: ReactNode; dark?: boolean; live?: boolean }) {
  return (
    <div className={`bl-row bl-f-head${dark ? " bl-f-head--dark" : ""}`} data-row="">
      <div className="bl-cell bl-f-head__cell">
        <h2 id={id} className="bl-h2 bl-f-head__h" data-rv="" tabIndex={-1}>{children}</h2>
        {meta && <p className="bl-f-head__meta t-label" data-rv="" aria-live={live ? "polite" : undefined} aria-atomic={live ? true : undefined}>{meta}</p>}
      </div>
    </div>
  );
}

/** a format photo: framed, never drifting (data-still) */
const Still = ({ src, cls = "" }: { src: string; cls?: string }) => (
  <div className={`bl-ph ${cls}`} data-ph="" data-still=""><img className="bl-img" src={src} alt="" loading="lazy" decoding="async" /></div>
);

/** a story told large: Origin's row (the photo edge to edge in its cell, the copy in the other; `flip` puts the photo on the right) */
function Told({ p, i, flip }: { p: Post; i: number; flip: boolean }) {
  const u = href(p);
  const ph = (
    <div key="ph" className="bl-cell bl-f-or__ph">
      <a href={u} tabIndex={-1} aria-hidden="true" className="bl-f-or__pa"><Still src={img(p.id)} cls="bl-f-fill" /></a>
    </div>
  );
  const body = (
    <div key="body" className="bl-cell bl-f-or__body">
      <a className="bl-f-or__a" href={u}>
        <span className="bl-meta t-label" data-rv=""><i className="bl-glyph" data-icon="deeper-story" aria-hidden="true" />{TYPE_LABEL.story}<span className="bl-f-or__n" aria-hidden="true">{idx(i)} / {idx(STORIES.length - 1)}</span></span>
        <h3 className="bl-f-or__t" data-rv="">{p.title}<ExtSr h={u} /></h3>
        <span className="bl-f-or__src" data-rv="">{p.source}</span>
        <span className="bl-btn bl-f-or__go" data-rv=""><span>{ACTION.story}</span><Arrow /></span>
      </a>
      {p.note && <p className="bl-f-or__note" data-rv="">{p.note}</p>}
    </div>
  );
  return <article className={`bl-row bl-f-or${flip ? " is-flip" : ""}`} data-row="">{flip ? [body, ph] : [ph, body]}</article>;
}

export function BlogF() {
  const ref = useRef<HTMLDivElement>(null), grid = useRef<Grid | null>(null);
  useScrollMotion(ref, (root, ctx) => { const m = mount(root, ctx); grid.current = m.grid; return () => { m.dispose(); grid.current = null; }; });

  const [fmt, setFmt] = useState(0);    // Browse by format: the format in the preview
  const [tv, setTv] = useState(0);      // talks: the talk in the large tile

  // the index
  const [f, setF] = useState<FilterKey>("all");
  const [q, setQ] = useState("");       // the query carried down from the search ("See all N results")
  const [picked, setView] = useState<"grid" | "list" | null>(null);
  const [shown, setShown] = useState(false);
  // until one is chosen, phones and small tablets show the list (twelve full-width cards would be a long walk), wider screens the grid
  const narrow = useSyncExternalStore(onNarrow, () => matchMedia(NARROW).matches, () => false);
  const view = picked ?? (narrow ? "list" : "grid");
  const jump = useRef(false);
  const base = match(q), list = base.filter((p) => f === "all" || p.type === f);
  const counts = Object.fromEntries(FILTERS.map((x) => [x.key, base.filter((p) => x.key === "all" || p.type === x.key).length])) as Record<FilterKey, number>;
  const label = FILTERS.find((x) => x.key === f)!.label;

  const toIndex = () => {
    const h = document.getElementById("bl-f-all-t");
    document.getElementById("bl-f-all")?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    h?.focus({ preventScroll: true });
  };
  const seeAll = (v: string) => { if (v === q && f === "all") { toIndex(); return; } setQ(v); setF("all"); setShown(true); jump.current = true; };
  const choose = (k: FilterKey) => { if (k === f) return; setF(k); setShown(true); };
  const clearQ = (focusHead = true) => { setQ(""); setShown(true); if (focusHead) document.getElementById("bl-f-all-t")?.focus(); };
  useEffect(() => {
    grid.current?.sync(true);
    if (jump.current) { jump.current = false; toIndex(); }
  }, [f, q, view]);

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
  const panelKey = `${f}|${q}|${view}`;

  return (
    <div ref={ref} className="bl bl-f">
      {/* 1 · the hero */}
      <section className="bl-f-hero" aria-labelledby="bl-f-t">
        <div className="bl-row bl-f-hero__row" data-row="" data-start="">
          <div className="bl-cell bl-f-hero__title">
            <h1 id="bl-f-t" className="bl-h2 bl-f__h1">The NEAR <span className="accent">blog</span></h1>
          </div>
          <div className="bl-cell bl-f-hero__search" data-rv="">
            <Search onSeeAll={seeAll} />
          </div>
        </div>
      </section>

      {/* 2 · Browse by format */}
      <nav className="bl-f-fmt" aria-labelledby="bl-f-fmt-t">
        <div className="bl-row bl-f-fmt__bar" data-row="">
          <div className="bl-cell"><h2 id="bl-f-fmt-t" className="t-label" data-rv="">Browse by format</h2></div>
        </div>
        <div className="bl-row bl-f-fmt__row" data-row="" data-act={fmt}>
          <div className="bl-cell bl-f-fmt__list">
            <ul role="list">
              {FORMATS.map((x, i) => {
                const n = byType(x.key).length;
                return (
                  <li key={x.key} className="bl-f-fmt__item" data-i={i} onPointerEnter={() => setFmt(i)} onFocus={() => setFmt(i)}>
                    <span className="bl-f-fmt__idx" aria-hidden="true">{idx(i)}</span>
                    <span className="bl-f-fmt__th" aria-hidden="true"><img src={img(x.cover.id)} alt="" loading="lazy" decoding="async" /></span>
                    <span className="bl-f-fmt__txt" data-rv="">
                      <a className="bl-f-fmt__a" href={`#${x.id}`}><span className="bl-f-fmt__name">{x.name}</span><span className="sr-only">, {many(n, x.unit)}</span></a>
                      <span className="bl-f-fmt__who">{x.who}</span>
                    </span>
                    <span className="bl-f-fmt__n" data-rv="" aria-hidden="true"><span className="bl-f-fmt__num">{n}</span><span className="bl-f-fmt__go"><Arrow /></span></span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="bl-cell bl-f-fmt__pv" aria-hidden="true">
            <div className="bl-ph bl-f-fmt__frame">
              {FORMATS.map((x, i) => <div key={x.key} className="bl-f-fmt__img" data-i={i}><img src={img(x.cover.id)} alt="" loading="lazy" decoding="async" /></div>)}
            </div>
            <p className="bl-f-fmt__cap">{FORMATS.map((x, i) => <span key={x.key} data-i={i}>{idx(i)} · {x.name} · {many(byType(x.key).length, x.unit)}</span>)}</p>
          </div>
        </div>
      </nav>

      {/* 3 · Customer stories */}
      <section id="bl-f-stories" className="bl-f-sec" aria-labelledby="bl-f-stories-t">
        <Head id="bl-f-stories-t" meta={many(STORIES.length, FORMATS[0].unit)}>Customer <span className="accent">stories</span></Head>
        {STORIES.slice(0, ORIGIN).map((p, i) => <Told key={p.id} p={p} i={i} flip={i % 2 === 1} />)}
        <div className="bl-row bl-f-compact" data-row="">
          {STORIES.slice(ORIGIN).map((p, j) => <div key={p.id} className="bl-cell bl-f-compact__cell"><Card p={p} j={j} /></div>)}
        </div>
      </section>

      {/* 4 · Inside NEAR talks: the dark band */}
      <section id="bl-f-talks" className="bl-f-sec bl-f-dark" aria-labelledby="bl-f-talks-t">
        <Head id="bl-f-talks-t" meta={many(TALKS.length, FORMATS[1].unit)} dark>Inside NEAR <span className="accent">talks</span></Head>
        <div className="bl-row bl-f-tv" data-row="">
          <div className="bl-cell bl-f-tv__stage">
            {/* the large tile: the talk last pointed at or focused in the list (every talk is a link in the list too, so the tile is pointer-only) */}
            <a className="bl-f-tv__a" href={href(talk)} tabIndex={-1} aria-hidden="true">
              <span className="bl-ph bl-f-tv__frame">
                {TALKS.map((p, i) => <img key={p.id} className={`bl-f-tv__img${i === tv ? " is-on" : ""}`} src={img(p.id)} alt="" loading="lazy" decoding="async" />)}
                <span className="bl-play bl-f-tv__play"><i data-icon="play" /></span>
              </span>
              <span key={tv} className="bl-f-tv__body">
                <span className="bl-f-tv__k t-label">{TYPE_LABEL.watch} · {idx(tv)} / {idx(TALKS.length - 1)}</span>
                <span className="bl-f-tv__t">{talk.title}</span>
                <span className="bl-f-tv__src">{talk.source}</span>
              </span>
            </a>
          </div>
          <div className="bl-cell bl-f-tv__side">
            <ol className="bl-f-tv__list" aria-label="Talks">
              {TALKS.map((p, i) => (
                <li key={p.id} className={`bl-f-tv__item${i === tv ? " is-on" : ""}`} onPointerEnter={() => setTv(i)} onFocus={() => setTv(i)}>
                  <a className="bl-f-tv__la" href={href(p)}>
                    <span className="bl-f-tv__idx" aria-hidden="true">{idx(i)}</span>
                    <span className="bl-f-tv__lt"><span className="bl-f-tv__lname">{p.title}<ExtSr h={href(p)} /></span><span className="bl-f-tv__lsrc">{p.source}</span></span>
                    <span className="bl-f-tv__go" aria-hidden="true"><Arrow /></span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 5 · Read */}
      <section id="bl-f-read" className="bl-f-sec" aria-labelledby="bl-f-read-t">
        <Head id="bl-f-read-t" meta={many(READS.length, FORMATS[2].unit)}><span className="accent">Read</span></Head>
        {read && (
          <article className="bl-row bl-f-rd" data-row="">
            <div className="bl-cell bl-f-rd__cell">
              <a className="bl-f-rd__a" href={href(read)}>
                <Still src={img(read.id)} cls="bl-f-rd__ph" />
                <span className="bl-f-rd__body">
                  <span className="bl-f-rd__main">
                    <span className="bl-meta t-label" data-rv=""><i className="bl-glyph" data-icon="deeper-read" aria-hidden="true" />{TYPE_LABEL.read}</span>
                    <h3 className="bl-h2 bl-f-rd__t" data-rv="">{read.title}<ExtSr h={href(read)} /></h3>
                  </span>
                  <span className="bl-f-rd__side" data-rv="">
                    <span className="bl-f-rd__src">{read.source}</span>
                    <span className="bl-btn bl-f-rd__go"><span>{ACTION.read}</span><Arrow /></span>
                  </span>
                </span>
              </a>
            </div>
          </article>
        )}
      </section>

      {/* 6 · All posts */}
      <section id="bl-f-all" className="bl-f-sec bl-f-all" aria-labelledby="bl-f-all-t">
        <Head id="bl-f-all-t" live meta={<>{list.length} {list.length === 1 ? "post" : "posts"}{f !== "all" && <> in {label}</>}{q && <> matching “{q}”</>}</>}>All <span className="accent">posts</span></Head>
        <div className="bl-row bl-f-bar" data-row="">
          <div className="bl-cell bl-f-bar__cell">
            <Tabs value={f} onChange={choose} id="bl-f-tab" controls="bl-f-panel" counts={counts} />
            <div className="bl-f-bar__end">
              {q && (
                <button type="button" className="bl-f-chip" onClick={() => clearQ()} aria-label={`Remove search: ${q}`}>
                  <span className="bl-f-chip__k">Search</span><span className="bl-f-chip__q">“{q}”</span>
                  <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 3l6 6M9 3 3 9" /></svg>
                </button>
              )}
              <div className="bl-f-view" role="group" aria-label="Layout">
                <button type="button" className="bl-f-view__b" aria-pressed={view === "grid"} onClick={() => setView("grid")}>
                  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="2" y="2" width="5" height="5" /><rect x="9" y="2" width="5" height="5" /><rect x="2" y="9" width="5" height="5" /><rect x="9" y="9" width="5" height="5" /></svg>
                  <span>Grid</span>
                </button>
                <button type="button" className="bl-f-view__b" aria-pressed={view === "list"} onClick={() => setView("list")}>
                  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 4h12M2 8h12M2 12h12" /></svg>
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div key={panelKey} id="bl-f-panel" role="tabpanel" aria-labelledby={`bl-f-tab-${f}`} className={`bl-f-panel${shown ? " is-shown" : ""}`}>
          {!list.length ? (
            <div className="bl-row bl-f-empty" data-row="">
              <div className="bl-cell bl-f-empty__cell">
                <p className="bl-f-empty__t">No posts match “{q}”{f !== "all" && <> in {label}</>}.</p>
                <p className="bl-f-empty__s">Try another word, or clear the search to see every post.</p>
                <button type="button" className="bl-btn" onClick={() => { setF("all"); clearQ(); }}><span>Clear search</span></button>
              </div>
            </div>
          ) : view === "grid" ? (
            chunk(list, 3).map((row, r) => (
              <div key={r} className="bl-row bl-f-cards" data-row="">
                {row.map((p, j) => <div key={p.id} className="bl-cell bl-f-cards__cell"><Card p={p} j={j} /></div>)}
                {Array.from({ length: 3 - row.length }, (_, k) => <div key={`e${k}`} className="bl-cell bl-f-cards__cell bl-f-cards__cell--empty" aria-hidden="true" />)}
              </div>
            ))
          ) : (
            <div className="bl-row bl-f-lst" data-row="">
              <div className="bl-cell bl-f-lst__cell">
                <ol className="bl-f-lst__ol">
                  {list.map((p, j) => (
                    <li key={p.id} className="bl-f-li" style={{ ["--j" as string]: j }}>
                      <a className="bl-f-li__a" href={href(p)}>
                        <span className="bl-f-li__th" aria-hidden="true"><img src={img(p.id)} alt="" loading="lazy" decoding="async" /></span>
                        <span className="bl-f-li__txt" data-rise="">
                          <span className="bl-meta t-label"><i className="bl-glyph" data-icon={`deeper-${p.type}`} aria-hidden="true" />{TYPE_LABEL[p.type]}</span>
                          <span className="bl-f-li__t"><Hl text={p.title} q={q} /><ExtSr h={href(p)} /></span>
                          <span className="bl-f-li__src">{p.source}</span>
                        </span>
                        <span className="bl-f-li__go" aria-hidden="true"><Arrow /></span>
                      </a>
                      {p.note && <p className="bl-f-li__note">{p.note}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>

        <div className="bl-row bl-f-foot" data-row="">
          <div className="bl-cell bl-f-foot__cell">
            <a className="bl-link" href={BLOG}><span>View everything on near.org</span><Arrow /><span className="sr-only"> (another site)</span></a>
          </div>
        </div>
      </section>

      {/* 7 · the newsletter (the homepage's copy) */}
      <section className="bl-f-sec bl-f-nl" aria-labelledby="bl-f-nl-t">
        <div className="bl-row bl-row--end bl-f-nl__row" data-row="">
          <div className="bl-cell bl-f-nl__copy">
            <h2 id="bl-f-nl-t" className="t-label" data-rv="">Newsletter</h2>
            <p className="bl-lede bl-f-nl__lede" data-rv="">Get the latest product launches, protocol milestones, and ecosystem updates straight to your{" "}inbox.</p>
          </div>
          <div className="bl-cell bl-f-nl__formcell">
            <form className={`bl-f-form${err ? " is-invalid" : ""}`} method="post" noValidate onSubmit={subscribe} data-rv="">
              <label htmlFor="bl-f-email" className="bl-f-form__label t-label">Email address</label>
              <div className={`bl-f-form__slot${done ? " is-done" : ""}`}>
                <div className="bl-f-field" inert={done}>
                  <input ref={email} id="bl-f-email" name="email" type="email" required autoComplete="email" inputMode="email" spellCheck={false} placeholder="you@example.com"
                    aria-invalid={err ? true : undefined} aria-describedby="bl-f-email-err bl-f-email-note" onInput={() => { if (err) setErr(null); }} />
                  <button type="submit" className="bl-f-field__btn"><span>Subscribe</span><Arrow /></button>
                  <i className="bl-f-field__line" aria-hidden="true" />
                </div>
                <div role="status" className="bl-f-form__status">
                  {done && (
                    <p ref={ok} className="bl-f-form__ok" tabIndex={-1}>
                      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <span>Thanks for subscribing.</span><span className="bl-f-form__pre">Preview only: nothing was sent.</span>
                    </p>
                  )}
                </div>
              </div>
              <p id="bl-f-email-err" className="bl-f-form__err">{err && <span>{err}</span>}</p>
              <p id="bl-f-email-note" className="bl-f-form__note">By subscribing, you agree to our <a href="https://www.near.org/privacy-policy">Privacy Policy</a>.</p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
