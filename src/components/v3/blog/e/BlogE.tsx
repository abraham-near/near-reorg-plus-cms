"use client";
// Blog E · Reading rail. A blog index made for scanning, on the ruled grid of /home-v3:
//   - the head: one ruled row, the heading at section scale on the left (its accent in Kepler Light Italic) and, on the right, the proof strip's
//     grammar under a green rule: how many posts there are, by type (counted from data.ts, nothing else);
//   - the body: one ruled row of two columns. The rail (left, sticky like a docs sidebar): search (live, a clear button, "/" to focus it), the type
//     filter (a vertical radio group; the green dot slides down to the chosen type; each type shows how many posts match the search), Sort (Newest / A–Z)
//     and View (List / Grid); the newsletter (the homepage close's copy, verbatim) waits at the rail's foot. The feed (right): its head (how many are
//     showing, the active filters as chips you can remove), the latest post featured as Origin is (the photo edge to edge in its cell) while browsing,
//     then the posts as rows (a 4:3 photo, the type, the title, the source) or as cards two to a row, six to a page, numbered pages at the foot.
//   - below 1024 px the rail folds into a bar over the feed: the search full width and a Filters button that opens type, sort and view in place.
// The state rides in the URL (?q=, ?type=, ?sort=, ?view=, ?page=) so a filtered view can be shared or come back to.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { prefersReduced, useScrollMotion } from "@/lib/motion/scroll";
import type { Grid } from "../grid";
import { ACTION, BLOG, POSTS, TYPE_LABEL, byType, chunk, href, img, type FilterKey, type Post } from "../data";
import { Arrow, ExtSr } from "../parts";
import { ECard, GridIcon, Hl, ListIcon, Newsletter, Seg, Still, TypeList, fold } from "./parts";
import { mount } from "./motion";
import "./blog-e.css";

type Sort = "new" | "az";
type View = "list" | "grid";
const PER = 6;          // posts to a page (the featured one counts)
const OFFSET = 104;     // the floating header (16 px inset + 64 px bar) and some air: where the feed's head lands when we bring it into view
const TYPES: { key: FilterKey; label: string }[] = [{ key: "all", label: "All" }, { key: "story", label: "Customer stories" }, { key: "read", label: "Read" }, { key: "watch", label: "Watch" }];
const SORTS: { key: Sort; label: string }[] = [{ key: "new", label: "Newest" }, { key: "az", label: "A–Z" }];
const VIEWS: { key: View; label: string; icon: ReactNode }[] = [{ key: "list", label: "List", icon: <ListIcon /> }, { key: "grid", label: "Grid", icon: <GridIcon /> }];
// the head's figures: counts of data.ts, nothing more
const FIGS = [
  { n: POSTS.length, c: "Posts" },
  { n: byType("story").length, c: "Customer stories" },
  { n: byType("watch").length, c: "Talks" },
  { n: byType("read").length, c: "Read" },
];
const plural = (n: number) => `${n} ${n === 1 ? "post" : "posts"}`;
const matches = (p: Post, q: string) => !q || fold(`${p.title} ${p.source} ${TYPE_LABEL[p.type]}`).includes(q);

/** a post as a row of the feed: its photo (4:3) in the first cell, the type, the title (the link: it covers the whole row), the source, the arrow */
function Row({ p, j, q }: { p: Post; j: number; q: string }) {
  const u = href(p);
  return (
    <article className="bl-row bl-e__sub bl-e__item" data-row="" style={{ ["--j" as string]: j }}>
      <div className="bl-cell bl-e__item-ph">
        <span className="bl-e__phw">
          <Still src={img(p.id)} cls="bl-e__item-img" />
          {p.type === "watch" && <span className="bl-play bl-e__play" aria-hidden="true"><i data-icon="play" /></span>}
        </span>
      </div>
      <div className="bl-cell bl-e__item-body">
        <span className="bl-meta t-label" data-rv="" data-rise=""><i className="bl-glyph" data-icon={`deeper-${p.type}`} aria-hidden="true" />{TYPE_LABEL[p.type]}</span>
        <h3 className="bl-e__item-t" data-rv="" data-rise=""><a className="bl-e__stretch" href={u}><Hl text={p.title} q={q} /><ExtSr h={u} /></a></h3>
        <p className="bl-e__item-src" data-rv="" data-rise="">{p.source}</p>
        {p.note && <p className="bl-e__item-note" data-rv="" data-rise="">{p.note}</p>}
        <span className="bl-e__go" aria-hidden="true"><Arrow /></span>
      </div>
    </article>
  );
}

/** the latest post while browsing (Newest, no search, page 1): Origin's row, the photo edge to edge in its cell, the copy and its button beside it */
function Lead({ p }: { p: Post }) {
  const u = href(p);
  return (
    <article className="bl-row bl-e__sub bl-e__feat" data-row="">
      <div className="bl-cell bl-e__feat-ph">
        <Still src={img(p.id)} cls="bl-e__feat-img" eager />
        {p.type === "watch" && <span className="bl-play bl-e__play" aria-hidden="true"><i data-icon="play" /></span>}
      </div>
      <div className="bl-cell bl-e__feat-body">
        <span className="bl-meta t-label" data-rv="" data-rise=""><i className="bl-glyph" data-icon={`deeper-${p.type}`} aria-hidden="true" />Latest · {TYPE_LABEL[p.type]}</span>
        <h3 className="bl-e__feat-t" data-rv="" data-rise=""><a className="bl-e__stretch" href={u}>{p.title}<ExtSr h={u} /></a></h3>
        <p className="bl-e__feat-src" data-rv="" data-rise="">{p.source}</p>
        <span className="bl-btn bl-e__feat-go" aria-hidden="true" data-rv="" data-rise=""><span>{ACTION[p.type]}</span><Arrow /></span>
        {p.note && <p className="bl-e__feat-note" data-rv="" data-rise="">{p.note}</p>}
      </div>
    </article>
  );
}

export function BlogE() {
  const ref = useRef<HTMLDivElement>(null), grid = useRef<Grid | null>(null);
  const input = useRef<HTMLInputElement>(null), head = useRef<HTMLHeadingElement>(null);
  const [f, setF] = useState<FilterKey>("all");
  const [raw, setRaw] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const [view, setView] = useState<View>("list");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);     // below 1024: the Filters disclosure
  const [shown, setShown] = useState(false);   // something has changed: content that mounts from now on opens and rises (blog.css .is-shown)
  const [said, setSaid] = useState("");        // the live region's text (debounced: one message once typing pauses)
  const toFocus = useRef(false), ready = useRef(false);
  useScrollMotion(ref, (root, ctx) => { const m = mount(root, ctx); grid.current = m.grid; return () => { m.dispose(); grid.current = null; }; });

  /* ── the list ── */
  const q = fold(raw.trim());
  const counts = useMemo(() => Object.fromEntries(TYPES.map((t) => [t.key, POSTS.filter((p) => (t.key === "all" || p.type === t.key) && matches(p, q)).length])) as Record<FilterKey, number>, [q]);
  const list = useMemo(() => {
    const l = POSTS.filter((p) => (f === "all" || p.type === f) && matches(p, q));
    return sort === "az" ? l.sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" })) : l;   // Newest: data.ts's order
  }, [f, q, sort]);
  const pages = Math.max(1, Math.ceil(list.length / PER)), pg = Math.min(page, pages);
  const slice = list.slice((pg - 1) * PER, pg * PER);
  const lead = sort === "new" && !q && pg === 1 && slice.length ? slice[0] : null;
  const rest = lead ? slice.slice(1) : slice;
  const from = list.length ? (pg - 1) * PER + 1 : 0, to = (pg - 1) * PER + slice.length;
  const label = TYPES.find((t) => t.key === f)!.label;
  const term = raw.trim();

  /* ── the URL: read once after hydration (the server renders the default view), then written on every change (replaceState: no history entries) ── */
  /* eslint-disable react-hooks/set-state-in-effect -- the URL is an external source only the client can read */
  useEffect(() => {
    const s = new URLSearchParams(location.search);
    const t = s.get("type"), so = s.get("sort"), v = s.get("view"), p = parseInt(s.get("page") || "", 10), qq = s.get("q");
    if (t && TYPES.some((x) => x.key === t)) setF(t as FilterKey);
    if (so === "az") setSort("az");
    if (v === "grid") setView("grid");
    if (qq) setRaw(qq);
    if (p > 1) setPage(p);
    ready.current = true;
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!ready.current) return;
    const s = new URLSearchParams();
    if (term) s.set("q", term);
    if (f !== "all") s.set("type", f);
    if (sort !== "new") s.set("sort", sort);
    if (view !== "list") s.set("view", view);
    if (pg > 1) s.set("page", String(pg));
    const u = `${location.pathname}${s.size ? `?${s}` : ""}${location.hash}`;
    if (u !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(history.state, "", u);
  }, [term, f, sort, view, pg]);

  /* ── the grid picks up rows React has added (in view: simply there, their content opens and rises) ── */
  useLayoutEffect(() => { grid.current?.sync(true); }, [f, q, sort, view, pg]);

  /* ── the live region: one message once the list settles ── */
  useEffect(() => {
    const t = window.setTimeout(() => {
      const parts = [list.length ? (pages > 1 ? `Showing ${from} to ${to} of ${plural(list.length)}` : `Showing ${plural(list.length)}`) : "No posts match"];
      if (f !== "all") parts.push(label);
      if (term) parts.push(`matching “${term}”`);
      if (pages > 1) parts.push(`page ${pg} of ${pages}`);
      setSaid(parts.join(", "));
    }, 450);
    return () => clearTimeout(t);
  }, [list.length, from, to, pages, pg, f, label, term]);

  /* ── "/" focuses the search (not while typing elsewhere) ── */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      const el = input.current; if (!el) return;
      if (el.getBoundingClientRect().top < 0 || el.getBoundingClientRect().bottom > innerHeight) el.scrollIntoView({ block: "center", behavior: prefersReduced() ? "auto" : "smooth" });
      el.focus({ preventScroll: true }); el.select();
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, []);

  /* ── bringing the feed's head into view: after a page change (and focus moves to it), or when a change leaves it above the view ── */
  const toFeed = (focus: boolean) => {
    const h = head.current; if (!h) return;
    const top = h.getBoundingClientRect().top;
    if (focus || top < OFFSET - 8) scrollTo({ top: Math.max(0, top + scrollY - OFFSET), behavior: prefersReduced() ? "auto" : "smooth" });
    if (focus) h.focus({ preventScroll: true });
  };
  useLayoutEffect(() => { if (toFocus.current) { toFocus.current = false; toFeed(true); } }, [pg]);
  const afterChange = () => { setShown(true); requestAnimationFrame(() => toFeed(false)); };

  const chooseType = (k: FilterKey) => { if (k === f) return; setF(k); setPage(1); afterChange(); };
  const chooseSort = (k: Sort) => { if (k === sort) return; setSort(k); setPage(1); afterChange(); };
  const chooseView = (k: View) => { if (k === view) return; setView(k); afterChange(); };
  const type = (v: string) => { setRaw(v); setPage(1); setShown(true); requestAnimationFrame(() => toFeed(false)); };
  const go = (p: number) => { if (p < 1 || p > pages || p === pg) return; toFocus.current = true; setShown(true); setPage(p); };
  const focusHead = () => requestAnimationFrame(() => head.current?.focus({ preventScroll: true }));   // the control that was pressed is gone
  const clearAll = () => { setRaw(""); setF("all"); setPage(1); setShown(true); input.current?.focus(); };
  const badge = (f !== "all" ? 1 : 0) + (sort !== "new" ? 1 : 0);

  return (
    <div ref={ref} className="bl bl-e">
      {/* ── the head: the heading and the counts ── */}
      <section className="bl-row bl-e__head" data-row="" data-start="" aria-labelledby="bl-e-t">
        <div className="bl-cell bl-e__title">
          <h1 id="bl-e-t" className="bl-h2 bl-e__h1">The NEAR <span className="accent">blog</span></h1>
        </div>
        <div className="bl-cell bl-e__figs-cell">
          <ul className="bl-e__figs" aria-label="On the blog">
            {FIGS.map((x, i) => (
              <li key={x.c} className="bl-e__fig" style={{ ["--i" as string]: i }}>
                <p className="bl-e__fig-n">{x.n}</p>
                <p className="bl-e__fig-c">{x.c}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── the body: the rail and the feed ── */}
      <div className="bl-row bl-row--end bl-e__body" data-row="">
        <aside className="bl-cell bl-e__rail" aria-label="Search and filters">
          <div className="bl-e__rail-in">
            <form role="search" className="bl-e__search" aria-label="Posts" onSubmit={(e) => { e.preventDefault(); toFeed(false); }}>
              <label htmlFor="bl-e-q" className="t-label bl-e__lbl">Search</label>
              <div className="bl-e__field bl-e__field--q">
                <svg className="bl-e__mag" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="8.5" cy="8.5" r="5.75" /><path d="m13 13 4.5 4.5" /></svg>
                <input ref={input} id="bl-e-q" type="search" value={raw} placeholder="Titles and sources" autoComplete="off" spellCheck={false}
                  aria-controls="bl-e-feed" aria-keyshortcuts="/" aria-describedby="bl-e-q-hint"
                  onChange={(e) => type(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") { if (raw) { e.preventDefault(); type(""); } else input.current?.blur(); } }} />
                {raw
                  ? <button type="button" className="bl-e__clear" onClick={() => { type(""); input.current?.focus(); }}><span className="sr-only">Clear search</span><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5" /></svg></button>
                  : <kbd className="bl-e__kbd" aria-hidden="true">/</kbd>}
              </div>
              <p id="bl-e-q-hint" className="sr-only">Results update as you type. Press slash to come back to the search.</p>
            </form>

            <button type="button" className="bl-e__more" aria-expanded={open} aria-controls="bl-e-opts" onClick={() => setOpen((o) => !o)}>
              <svg className="bl-e__more-ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 4.5h12M4.5 8h7M6.5 11.5h3" /></svg>
              <span>Filters</span>
              {badge > 0 && <span className="bl-e__badge"><span className="sr-only">(</span>{badge}<span className="sr-only"> active)</span></span>}
              <svg className="bl-e__chev" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
            </button>

            <div id="bl-e-opts" className={`bl-e__opts${open ? " is-open" : ""}`}>
              <div className="bl-e__grp bl-e__grp--types">
                <p id="bl-e-types-l" className="t-label bl-e__lbl">Type</p>
                <TypeList items={TYPES} value={f} onChange={chooseType} counts={counts} labelId="bl-e-types-l" tick={open} />
              </div>
              <div className="bl-e__grp">
                <p id="bl-e-sort-l" className="t-label bl-e__lbl">Sort</p>
                <Seg items={SORTS} value={sort} onChange={chooseSort} labelId="bl-e-sort-l" />
              </div>
              <div className="bl-e__grp">
                <p id="bl-e-view-l" className="t-label bl-e__lbl">View</p>
                <Seg items={VIEWS} value={view} onChange={chooseView} labelId="bl-e-view-l" />
              </div>
              <button type="button" className="bl-btn bl-btn--ink bl-e__done" onClick={() => { setOpen(false); requestAnimationFrame(() => toFeed(true)); }}>
                <span>{list.length ? `Show ${plural(list.length)}` : "Close"}</span>
              </button>
            </div>
          </div>
        </aside>

        <section id="bl-e-feed" className={`bl-cell bl-e__feed${shown ? " is-shown" : ""}`} aria-labelledby="bl-e-feed-t">
          <div className="bl-row bl-e__sub bl-e__fhead" data-row="" data-no-x="">
            <div className="bl-cell bl-e__fhead-cell" data-rv="">
              <h2 id="bl-e-feed-t" ref={head} tabIndex={-1} className="bl-e__fh">Posts</h2>
              <p className="bl-e__showing" aria-hidden="true">
                {list.length ? <>Showing <b>{pages > 1 ? `${from}–${to}` : list.length}</b>{pages > 1 && <> of {list.length}</>}</> : <>Nothing to show</>}
              </p>
              {(f !== "all" || term) && (
                <ul className="bl-e__chips" aria-label="Active filters">
                  {f !== "all" && (
                    <li><button type="button" className="bl-e__chip" onClick={() => { chooseType("all"); focusHead(); }}>
                      <span>{label}</span><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 3l6 6M9 3l-6 6" /></svg><span className="sr-only">: remove filter</span>
                    </button></li>
                  )}
                  {term && (
                    <li><button type="button" className="bl-e__chip" onClick={() => { type(""); input.current?.focus(); }}>
                      <span>“{term}”</span><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 3l6 6M9 3l-6 6" /></svg><span className="sr-only">: clear search</span>
                    </button></li>
                  )}
                  {f !== "all" && term && <li><button type="button" className="bl-e__clr" onClick={clearAll}>Clear all</button></li>}
                </ul>
              )}
              <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{said}</p>
            </div>
          </div>

          {list.length === 0 && (
            <div className="bl-row bl-e__sub bl-e__empty" data-row="">
              <div className="bl-cell bl-e__empty-cell">
                <p className="bl-e__empty-t" data-rv="" data-rise="">No posts match{term ? <> “{term}”</> : null}{f !== "all" ? <> in {label}</> : null}.</p>
                <div className="bl-e__empty-acts" data-rv="" data-rise="">
                  <button type="button" className="bl-btn" onClick={clearAll}><span>Clear filters</span></button>
                  {f !== "all" && counts.all > 0 && (
                    <button type="button" className="bl-link bl-e__try" onClick={() => { chooseType("all"); focusHead(); }}><span>Search all types ({counts.all})</span><Arrow /></button>
                  )}
                </div>
              </div>
            </div>
          )}

          {lead && <Lead key={`lead-${lead.id}`} p={lead} />}

          {view === "list"
            ? rest.map((p, j) => <Row key={`row-${p.id}`} p={p} j={j} q={q} />)
            : chunk(rest, 2).map((row, r) => (
              <div key={`g-${row.map((p) => p.id).join("-")}`} className="bl-row bl-e__sub bl-e__cards" data-row="">
                {row.map((p, j) => <div key={p.id} className="bl-cell bl-e__card-cell"><ECard p={p} j={r * 2 + j} q={q} /></div>)}
                {row.length < 2 && <div className="bl-cell bl-e__card-cell bl-e__card-cell--empty" aria-hidden="true" />}
              </div>
            ))}

          {list.length > 0 && (
            <div className="bl-row bl-e__sub bl-e__foot" data-row="">
              <div className="bl-cell bl-e__foot-cell">
                {pages > 1 ? (
                  <nav className="bl-e__pager" aria-label="Pages">
                    <button type="button" className="bl-e__pg bl-e__pg--step bl-e__pg--prev" onClick={() => go(pg - 1)} disabled={pg === 1}>
                      <Arrow /><span>Previous</span>
                    </button>
                    <ol className="bl-e__pgs">
                      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                        <li key={n}><button type="button" className="bl-e__pg" aria-current={n === pg ? "page" : undefined} onClick={() => go(n)}>
                          <span className="sr-only">Page </span>{n}
                        </button></li>
                      ))}
                    </ol>
                    <button type="button" className="bl-e__pg bl-e__pg--step" onClick={() => go(pg + 1)} disabled={pg === pages}>
                      <span>Next</span><Arrow />
                    </button>
                  </nav>
                ) : (
                  <p className="bl-e__foot-n">That’s everything{f !== "all" ? <> in {label}</> : null}{term ? <> for “{term}”</> : null}.</p>
                )}
                <a className="bl-link" href={BLOG}><span>View everything on near.org</span><Arrow /><span className="sr-only"> (another site)</span></a>
              </div>
            </div>
          )}
        </section>

        <section className="bl-cell bl-e__nl-cell" aria-labelledby="bl-e-nl-t">
          {/* the + where the newsletter's rule meets the frame and the rail's line (desktop) */}
          <b className="bl-x bl-e__nl-x" aria-hidden="true" style={{ left: 0 }} /><b className="bl-x bl-e__nl-x" aria-hidden="true" style={{ left: "100%" }} />
          <h2 id="bl-e-nl-t" className="t-label bl-e__lbl">Newsletter</h2>
          <Newsletter />
        </section>
      </div>
    </div>
  );
}
