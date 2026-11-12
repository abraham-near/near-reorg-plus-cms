"use client";
// Blog J · Reading rail, open. Blog E's structure and behaviour (the same head, rail and feed, the same controls and pages) without the ruled grid:
// no cells, no crosshairs, no dividers, no boxed cards. The structure is whitespace, an invisible column grid shared by the head and the body (the rail's
// column | the feed's), the type scale, and two kinds of line only: one hairline under the head, and hairlines between rows in the list view.
//   - the head: the heading at display scale (its accent in Kepler Light Italic); under it, in the rail's column a one-line lede, in the feed's the counts
//     (how many posts, by type: counted from data.ts, nothing else);
//   - the body: the rail (sticky): search (live, a clear button, "/" to focus it), the type filter (a vertical radio group; the green dot slides to the
//     chosen type; each type shows how many posts match the search), Sort (Newest / Oldest / A–Z) and View (Grid / List) as small text toggles; the
//     newsletter waits at the rail's foot. The feed: its head (how many are showing, the active filters as chips you can remove), the latest post as the
//     lead while browsing, then the posts as open cards (photo, type, title, source) or as rows, six to a page, numbered pages at the foot.
//   - below 1024 px the rail folds into a bar over the feed: the search full width and a Filters button that opens type, sort and view in place.
// The state rides in the URL (?q=, ?type=, ?sort=, ?view=, ?page=) so a filtered view can be shared or come back to.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { prefersReduced, useScrollMotion } from "@/lib/motion/scroll";
import { BLOG, POSTS, byType, type FilterKey, type Post } from "../data";
import { KIND } from "./parts";
import { Arrow } from "../parts";
import { Card, GridIcon, Lead, ListIcon, Newsletter, Row, Seg, TypeList, fold } from "./parts";
import { mount, type JMotion } from "./motion";
import "./blog-j.css";

type Sort = "new" | "old" | "az";
type View = "grid" | "list";
const PER = 6;          // posts to a page (the lead counts)
const OFFSET = 104;     // the floating header (16 px inset + 64 px bar) and some air: where the feed's head lands when we bring it into view
// the categories: Blog (the reads), Press (the customer stories), Watch (the talks); labels in ./parts.tsx KIND
const TYPES: { key: FilterKey; label: string }[] = [{ key: "all", label: "All" }, { key: "read", label: KIND.read }, { key: "story", label: KIND.story }, { key: "watch", label: KIND.watch }];
const SORTS: { key: Sort; label: string }[] = [{ key: "new", label: "Newest" }, { key: "old", label: "Oldest" }, { key: "az", label: "A–Z" }];
const VIEWS: { key: View; label: string; icon: ReactNode }[] = [{ key: "grid", label: "Grid", icon: <GridIcon /> }, { key: "list", label: "List", icon: <ListIcon /> }];
// the head's figures: counts of data.ts, nothing more
const FIGS = [
  { n: POSTS.length, c: "Posts" },
  { n: byType("read").length, c: KIND.read },
  { n: byType("story").length, c: KIND.story },
  { n: byType("watch").length, c: KIND.watch },
];
const plural = (n: number) => `${n} ${n === 1 ? "post" : "posts"}`;
const matches = (p: Post, q: string) => !q || fold(`${p.title} ${p.source} ${KIND[p.type]}`).includes(q);
/** the grid view's rhythm on a six-column grid: rows of three, and a row of two first when the count asks for it (5 = 2 + 3, 4 = 2 + 2) */
const widths = (n: number): (2 | 3)[] => Array.from({ length: n }, (_, i) => (n % 3 === 0 ? 3 : n % 3 === 2 ? (i < 2 ? 2 : 3) : 2));

export function BlogJ() {
  const ref = useRef<HTMLDivElement>(null), motion = useRef<JMotion | null>(null);
  const input = useRef<HTMLInputElement>(null), head = useRef<HTMLHeadingElement>(null);
  const [f, setF] = useState<FilterKey>("all");
  const [raw, setRaw] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const [view, setView] = useState<View>("grid");
  const [page, setPage] = useState(1);
  const [ver, setVer] = useState(0);            // bumps on a type, sort, view or page change: the posts are made anew, so they rise again
  const [open, setOpen] = useState(false);      // below 1024: the Filters disclosure
  const [said, setSaid] = useState("");         // the live region's text (debounced: one message once typing pauses)
  const toFocus = useRef(false), ready = useRef(false);
  useScrollMotion(ref, (root, ctx) => { const m = mount(root, ctx); motion.current = m; return () => { m.dispose(); motion.current = null; }; });

  /* ── the list ── */
  const q = fold(raw.trim());
  const counts = useMemo(() => Object.fromEntries(TYPES.map((t) => [t.key, POSTS.filter((p) => (t.key === "all" || p.type === t.key) && matches(p, q)).length])) as Record<FilterKey, number>, [q]);
  const list = useMemo(() => {
    const l = POSTS.filter((p) => (f === "all" || p.type === f) && matches(p, q));
    if (sort === "az") return l.sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" }));
    return sort === "old" ? l.reverse() : l;   // Newest: data.ts's order
  }, [f, q, sort]);
  const pages = Math.max(1, Math.ceil(list.length / PER)), pg = Math.min(page, pages);
  const slice = list.slice((pg - 1) * PER, pg * PER);
  const lead = sort === "new" && !q && pg === 1 && slice.length ? slice[0] : null;
  const rest = lead ? slice.slice(1) : slice;
  const w = widths(rest.length);
  const cols = w.map((x, j) => (w.slice(0, j).reduce((a, y) => a + (y === 2 ? 3 : 2), 0) % 6) / (x === 2 ? 3 : 2));   // each card's column in its row: arrivals in turn
  const from = list.length ? (pg - 1) * PER + 1 : 0, to = (pg - 1) * PER + slice.length;
  const label = TYPES.find((t) => t.key === f)!.label;
  const term = raw.trim();

  /* ── the URL: read once after hydration (the server renders the default view), then written on every change (replaceState: no history entries) ── */
  /* eslint-disable react-hooks/set-state-in-effect -- the URL is an external source only the client can read */
  useEffect(() => {
    const s = new URLSearchParams(location.search);
    const t = s.get("type"), so = s.get("sort"), v = s.get("view"), p = parseInt(s.get("page") || "", 10), qq = s.get("q");
    if (t && TYPES.some((x) => x.key === t)) setF(t as FilterKey);
    if (so === "az" || so === "old") setSort(so);
    if (v === "list") setView("list");
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
    if (view !== "grid") s.set("view", view);
    if (pg > 1) s.set("page", String(pg));
    const u = `${location.pathname}${s.size ? `?${s}` : ""}${location.hash}`;
    if (u !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(history.state, "", u);
  }, [term, f, sort, view, pg]);

  /* ── the motion picks up what React has just made ── */
  useLayoutEffect(() => { motion.current?.sync(); }, [f, q, sort, view, pg, ver]);

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
  const afterChange = () => { setVer((v) => v + 1); requestAnimationFrame(() => toFeed(false)); };

  const chooseType = (k: FilterKey) => { if (k === f) return; setF(k); setPage(1); afterChange(); };
  const chooseSort = (k: Sort) => { if (k === sort) return; setSort(k); setPage(1); afterChange(); };
  const chooseView = (k: View) => { if (k === view) return; setView(k); afterChange(); };
  const type = (v: string) => { setRaw(v); setPage(1); requestAnimationFrame(() => toFeed(false)); };
  const go = (p: number) => { if (p < 1 || p > pages || p === pg) return; toFocus.current = true; setVer((v) => v + 1); setPage(p); };
  const focusHead = () => requestAnimationFrame(() => head.current?.focus({ preventScroll: true }));   // the control that was pressed is gone
  const clearAll = () => { setRaw(""); setF("all"); setPage(1); setVer((v) => v + 1); input.current?.focus(); };
  const badge = (f !== "all" ? 1 : 0) + (sort !== "new" ? 1 : 0) + (view !== "grid" ? 1 : 0);

  return (
    <div ref={ref} className="bl bl-j">
      {/* ── the head: the heading, the lede and the counts ── */}
      <section className="bj-head" aria-labelledby="bl-j-t">
        <h1 id="bl-j-t" className="bj-h1">The NEAR <span className="accent">blog</span></h1>
        <p className="bj-lede" data-in="" style={{ ["--d" as string]: "0.35s" }}>Blog posts, press and talks from across the NEAR ecosystem.</p>
        <ul className="bj-figs" aria-label="On the blog">
          {FIGS.map((x, i) => (
            <li key={x.c} className="bj-fig" data-in="" style={{ ["--d" as string]: `${(0.4 + i * 0.07).toFixed(2)}s` }}>
              <p className="bj-fig__n">{x.n}</p>
              <p className="bj-fig__c">{x.c}</p>
            </li>
          ))}
        </ul>
        <i className="bj-rule" aria-hidden="true" />
      </section>

      {/* ── the body: the rail and the feed ── */}
      <div className="bj-body">
        <aside className="bj-rail" aria-label="Search and filters">
          <div className="bj-rail__in" data-in="" style={{ ["--d" as string]: "0.3s" }}>
            <form role="search" className="bj-search" aria-label="Posts" onSubmit={(e) => { e.preventDefault(); toFeed(false); }}>
              <label htmlFor="bl-j-q" className="t-label bj-lbl">Search</label>
              <div className="bj-field bj-field--q">
                <svg className="bj-mag" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="8.5" cy="8.5" r="5.75" /><path d="m13 13 4.5 4.5" /></svg>
                <input ref={input} id="bl-j-q" type="search" value={raw} placeholder="Titles and sources" autoComplete="off" spellCheck={false}
                  aria-controls="bl-j-feed" aria-keyshortcuts="/" aria-describedby="bl-j-q-hint"
                  onChange={(e) => type(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") { if (raw) { e.preventDefault(); type(""); } else input.current?.blur(); } }} />
                {raw
                  ? <button type="button" className="bj-clear" onClick={() => { type(""); input.current?.focus(); }}><span className="sr-only">Clear search</span><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5" /></svg></button>
                  : <kbd className="bj-kbd" aria-hidden="true">/</kbd>}
              </div>
              <p id="bl-j-q-hint" className="sr-only">Results update as you type. Press slash to come back to the search.</p>
            </form>

            <button type="button" className="bj-more" aria-expanded={open} aria-controls="bl-j-opts" onClick={() => setOpen((o) => !o)}>
              <svg className="bj-more__ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 4.5h12M4.5 8h7M6.5 11.5h3" /></svg>
              <span>Filters</span>
              {badge > 0 && <span className="bj-badge"><span className="sr-only">(</span>{badge}<span className="sr-only"> active)</span></span>}
              <svg className="bj-chev" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
            </button>

            <div id="bl-j-opts" className={`bj-opts${open ? " is-open" : ""}`}>
              <div className="bj-grp bj-grp--types">
                <p id="bl-j-types-l" className="t-label bj-lbl">Type</p>
                <TypeList items={TYPES} value={f} onChange={chooseType} counts={counts} labelId="bl-j-types-l" tick={open} />
              </div>
              <div className="bj-grp">
                <p id="bl-j-sort-l" className="t-label bj-lbl">Sort</p>
                <Seg items={SORTS} value={sort} onChange={chooseSort} labelId="bl-j-sort-l" />
              </div>
              <div className="bj-grp">
                <p id="bl-j-view-l" className="t-label bj-lbl">View</p>
                <Seg items={VIEWS} value={view} onChange={chooseView} labelId="bl-j-view-l" />
              </div>
              <button type="button" className="bl-btn bl-btn--ink bj-done" onClick={() => { setOpen(false); requestAnimationFrame(() => toFeed(true)); }}>
                <span>{list.length ? `Show ${plural(list.length)}` : "Close"}</span>
              </button>
            </div>
          </div>
        </aside>

        <section id="bl-j-feed" className="bj-feed" aria-labelledby="bl-j-feed-t">
          <div className="bj-fhead">
            <h2 id="bl-j-feed-t" ref={head} tabIndex={-1} className="bj-fh">Posts</h2>
            <p className="bj-showing" aria-hidden="true">
              {list.length ? <>Showing <b>{pages > 1 ? `${from}–${to}` : list.length}</b>{pages > 1 && <> of {list.length}</>}</> : <>Nothing to show</>}
            </p>
            {(f !== "all" || term) && (
              <ul className="bj-chips" aria-label="Active filters">
                {f !== "all" && (
                  <li><button type="button" className="bj-chip" onClick={() => { chooseType("all"); focusHead(); }}>
                    <span>{label}</span><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 3l6 6M9 3l-6 6" /></svg><span className="sr-only">: remove filter</span>
                  </button></li>
                )}
                {term && (
                  <li><button type="button" className="bj-chip" onClick={() => { type(""); input.current?.focus(); }}>
                    <span>“{term}”</span><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 3l6 6M9 3l-6 6" /></svg><span className="sr-only">: clear search</span>
                  </button></li>
                )}
                {f !== "all" && term && <li><button type="button" className="bj-clr" onClick={clearAll}>Clear all</button></li>}
              </ul>
            )}
            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{said}</p>
          </div>

          {list.length === 0 && (
            <div className="bj-empty" data-in="">
              <p className="bj-empty__t">No posts match{term ? <> “{term}”</> : null}{f !== "all" ? <> in {label}</> : null}.</p>
              <div className="bj-empty__acts">
                <button type="button" className="bl-btn" onClick={clearAll}><span>Clear filters</span></button>
                {f !== "all" && counts.all > 0 && (
                  <button type="button" className="bl-link bj-try" onClick={() => { chooseType("all"); focusHead(); }}><span>Search all types ({counts.all})</span><Arrow /></button>
                )}
              </div>
            </div>
          )}

          {lead && <Lead key={`lead-${lead.id}-${ver}`} p={lead} />}

          {rest.length > 0 && (view === "grid"
            ? <div className="bj-cards">{rest.map((p, j) => <Card key={`c-${p.id}-${ver}`} p={p} q={q} w={w[j]} d={cols[j] * 0.08} />)}</div>
            : <div className="bj-list">{rest.map((p) => <Row key={`r-${p.id}-${ver}`} p={p} q={q} d={0} />)}</div>)}

          {list.length > 0 && (
            <div className="bj-foot">
              {pages > 1 ? (
                <nav className="bj-pager" aria-label="Pages">
                  <button type="button" className="bj-step bj-step--prev" onClick={() => go(pg - 1)} disabled={pg === 1}>
                    <Arrow /><span>Previous</span>
                  </button>
                  <ol className="bj-pgs">
                    {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                      <li key={n}><button type="button" className="bj-pg" aria-current={n === pg ? "page" : undefined} onClick={() => go(n)}>
                        <span className="sr-only">Page </span>{n}
                      </button></li>
                    ))}
                  </ol>
                  <button type="button" className="bj-step" onClick={() => go(pg + 1)} disabled={pg === pages}>
                    <span>Next</span><Arrow />
                  </button>
                </nav>
              ) : (
                <p className="bj-foot__n">That’s everything{f !== "all" ? <> in {label}</> : null}{term ? <> for “{term}”</> : null}.</p>
              )}
              <a className="bl-link" href={BLOG}><span>View everything on near.org</span><Arrow /><span className="sr-only"> (another site)</span></a>
            </div>
          )}
        </section>

        <section className="bj-nl" aria-labelledby="bl-j-nl-t" data-in="">
          <h2 id="bl-j-nl-t" className="t-label bj-lbl">Newsletter</h2>
          <Newsletter />
        </section>
      </div>
    </div>
  );
}
