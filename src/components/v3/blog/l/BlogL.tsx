"use client";
// Blog L · Front page + archive. E and F in one page, opened up: no ruled cells, no crosshairs, no dividers, no boxed cards. Whitespace, one invisible
// twelve-column grid, the type scale and two hairlines (one before the archive, one before the newsletter) do the work.
//   1. the masthead (F): The NEAR blog at display scale; under it the typeahead search (Search.tsx: suggestions, arrows / Enter / Escape, "/" or
//      Cmd / Ctrl + K) and the counts inline (E's figures: how many posts, by type; each one opens the archive on that type);
//   2. the lead (E's featured post, F's wide read): the newest post, its picture large, its copy beside it;
//   3. Inside NEAR talks (F): one soft ink band, the page's only dark element: the player (a link, nothing plays) and a short playlist (a vertical
//      tablist: pointing at, choosing or arrowing to a talk puts it in the player);
//   4. the archive (E): a slim sticky rail (Type as a vertical list with the sliding green dot and counts, Sort, View) beside every post, six to a
//      page, as open rows or open cards, numbered pages at the foot. "See all results" in the search fills the archive's query and brings it into view;
//      below 1024 px the rail turns into a filter bar over the list;
//   5. the newsletter (the homepage close's copy).
// The archive's state rides in the URL (?q=, ?type=, ?sort=, ?view=, ?page=), as E's does. Motion: ./motion.ts (arrivals rise, line icons draw).
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { prefersReduced, useScrollMotion } from "@/lib/motion/scroll";
import { ACTION, BLOG, POSTS, TYPE_LABEL, byType, href, idx, img, type FilterKey, type Post } from "../data";
import { Arrow, ExtSr } from "../parts";
import { Search } from "./Search";
import { match } from "./find";
import { Choice, Entry, GridIcon, Kind, ListIcon, Newsletter, Pic, TypeList } from "./parts";
import { mount, type Motion } from "./motion";
import "./blog-l.css";

type Sort = "new" | "az";
type View = "list" | "grid";
const PER = 6;          // posts to a page of the archive
const OFFSET = 104;     // the floating header (16 px inset + 64 px bar) and some air: where the archive's heading lands when we bring it into view
const LEAD = POSTS[0];
const TALKS = byType("watch");
const TYPES: { key: FilterKey; label: string }[] = [{ key: "all", label: "All" }, { key: "story", label: "Customer stories" }, { key: "read", label: "Read" }, { key: "watch", label: "Watch" }];
const SORTS: { key: Sort; label: string }[] = [{ key: "new", label: "Newest" }, { key: "az", label: "A–Z" }];
const VIEWS: { key: View; label: string; icon: ReactNode }[] = [{ key: "list", label: "List", icon: <ListIcon /> }, { key: "grid", label: "Grid", icon: <GridIcon /> }];
// the masthead's counts: counts of data.ts, nothing more; each opens the archive on its type
const FIGS: { k: FilterKey; n: number; c: string }[] = [
  { k: "all", n: POSTS.length, c: "Posts" },
  { k: "story", n: byType("story").length, c: "Customer stories" },
  { k: "watch", n: TALKS.length, c: "Talks" },
  { k: "read", n: byType("read").length, c: "Read" },
];
const plural = (n: number) => `${n} ${n === 1 ? "post" : "posts"}`;

export function BlogL() {
  const ref = useRef<HTMLDivElement>(null), motion = useRef<Motion | null>(null);
  const head = useRef<HTMLHeadingElement>(null);
  useScrollMotion(ref, (root, ctx) => { const m = mount(root, ctx); motion.current = m; return () => { m.dispose(); motion.current = null; }; });

  /* ── state: the search field, the archive (query, type, sort, view, page), the talk in the player ── */
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const [f, setF] = useState<FilterKey>("all");
  const [sort, setSort] = useState<Sort>("new");
  const [view, setView] = useState<View>("list");
  const [page, setPage] = useState(1);
  const [tv, setTv] = useState(0);
  const [said, setSaid] = useState("");
  const toFocus = useRef(false), jump = useRef(false), ready = useRef(false);

  /* ── the archive's list ── */
  const base = useMemo(() => match(q), [q]);
  const counts = useMemo(() => Object.fromEntries(TYPES.map((t) => [t.key, base.filter((p) => t.key === "all" || p.type === t.key).length])) as Record<FilterKey, number>, [base]);
  const list = useMemo(() => {
    const l = base.filter((p) => f === "all" || p.type === f);
    return sort === "az" ? [...l].sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" })) : l;   // Newest: data.ts's order
  }, [base, f, sort]);
  const pages = Math.max(1, Math.ceil(list.length / PER)), pg = Math.min(page, pages);
  const slice = list.slice((pg - 1) * PER, pg * PER);
  const from = list.length ? (pg - 1) * PER + 1 : 0, to = (pg - 1) * PER + slice.length;
  const label = TYPES.find((t) => t.key === f)!.label;
  const listKey = `${f}|${q}|${sort}|${view}|${pg}`;

  /* ── the URL: read once after hydration (the server renders the default view), then written on every change (replaceState: no history entries) ── */
  /* eslint-disable react-hooks/set-state-in-effect -- the URL is an external source only the client can read */
  useEffect(() => {
    const s = new URLSearchParams(location.search);
    const t = s.get("type"), so = s.get("sort"), v = s.get("view"), p = parseInt(s.get("page") || "", 10), qq = s.get("q");
    if (t && TYPES.some((x) => x.key === t)) setF(t as FilterKey);
    if (so === "az") setSort("az");
    if (v === "grid") setView("grid");
    if (qq) { setQ(qq); setTyped(qq); }
    if (p > 1) setPage(p);
    ready.current = true;
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!ready.current) return;
    const s = new URLSearchParams();
    if (q) s.set("q", q);
    if (f !== "all") s.set("type", f);
    if (sort !== "new") s.set("sort", sort);
    if (view !== "list") s.set("view", view);
    if (pg > 1) s.set("page", String(pg));
    const u = `${location.pathname}${s.size ? `?${s}` : ""}${location.hash}`;
    if (u !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(history.state, "", u);
  }, [q, f, sort, view, pg]);

  /* ── the live region: one message once the archive settles ── */
  useEffect(() => {
    const t = window.setTimeout(() => {
      const parts = [list.length ? (pages > 1 ? `Showing ${from} to ${to} of ${plural(list.length)}` : `Showing ${plural(list.length)}`) : "No posts match"];
      if (f !== "all") parts.push(label);
      if (q) parts.push(`matching “${q}”`);
      if (pages > 1) parts.push(`page ${pg} of ${pages}`);
      setSaid(parts.join(", "));
    }, 450);
    return () => clearTimeout(t);
  }, [list.length, from, to, pages, pg, f, label, q]);

  /* ── bringing the archive's heading into view (and focus to it, when the control that was used is gone or far away) ── */
  const toArchive = (focus: boolean, force = focus) => {
    const h = head.current; if (!h) return;
    const top = h.getBoundingClientRect().top;
    if (force || top < OFFSET - 8) scrollTo({ top: Math.max(0, top + scrollY - OFFSET), behavior: prefersReduced() ? "auto" : "smooth" });
    if (focus) h.focus({ preventScroll: true });
  };
  // after each change of the archive: its new blocks rise (motion.sync), and a jump asked for (a page, See all, a count) happens once React is done
  useLayoutEffect(() => {
    motion.current?.sync();
    if (jump.current) { jump.current = false; toArchive(true); }
    else if (toFocus.current) { toFocus.current = false; toArchive(true); }
  }, [listKey]);

  const changed = () => requestAnimationFrame(() => toArchive(false));   // a rail control: the heading comes back only if it is above the view
  const chooseType = (k: FilterKey) => { if (k === f) return; setF(k); setPage(1); changed(); };
  const chooseSort = (k: Sort) => { if (k === sort) return; setSort(k); setPage(1); changed(); };
  const chooseView = (k: View) => { if (k === view) return; setView(k); changed(); };
  const go = (p: number) => { if (p < 1 || p > pages || p === pg) return; toFocus.current = true; setPage(p); };
  const seeAll = (v: string) => { if (v === q && f === "all" && pg === 1) { toArchive(true); return; } jump.current = true; setQ(v); setF("all"); setPage(1); };
  const openType = (k: FilterKey) => { if (k === f && !q && pg === 1) { toArchive(true); return; } jump.current = true; setF(k); setQ(""); setTyped(""); setPage(1); };
  const clearQ = () => { setQ(""); setTyped(""); setPage(1); requestAnimationFrame(() => head.current?.focus({ preventScroll: true })); };
  const clearAll = () => { setQ(""); setTyped(""); setF("all"); setPage(1); requestAnimationFrame(() => head.current?.focus({ preventScroll: true })); };

  /* ── the playlist: a vertical tablist; selection follows focus ── */
  const tabs = useRef<HTMLOListElement>(null);
  const tvKeys = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = TALKS.length, to = ({ ArrowDown: (i + 1) % n, ArrowRight: (i + 1) % n, ArrowUp: (i - 1 + n) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 } as Record<string, number>)[e.key];
    if (to === undefined) return;
    e.preventDefault(); setTv(to);
    tabs.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[to]?.focus();
  };
  const talk = TALKS[tv];

  return (
    <div ref={ref} className="bl bl-l">
      {/* ── 1 · the masthead ── */}
      <header className="bl-l-mast bl-l-wrap" aria-labelledby="bl-l-t">
        <h1 id="bl-l-t" className="bl-l-h1" data-in="">The NEAR <span className="accent">blog</span></h1>
        <div className="bl-l-mast__row">
          <div className="bl-l-mast__search" data-in="" style={{ ["--j" as string]: 1 }}>
            <Search value={typed} onChange={setTyped} onSeeAll={seeAll} />
          </div>
          <ul className="bl-l-figs" aria-label="On the blog" data-in="" style={{ ["--j" as string]: 2 }}>
            {FIGS.map((x) => (
              <li key={x.k}>
                <button type="button" className="bl-l-fig" onClick={() => openType(x.k)}>
                  <span className="bl-l-fig__n">{x.n}</span>
                  <span className="bl-l-fig__c">{x.c}</span>
                  <span className="sr-only">: show in the archive</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* ── 2 · the lead: the newest post ── */}
      <section className="bl-l-lead-sec bl-l-wrap" aria-label="Latest">
        <Lead p={LEAD} />
      </section>

      {/* ── 3 · Inside NEAR talks: the one soft ink band ── */}
      <section className="bl-l-talks" aria-labelledby="bl-l-talks-t">
        <div className="bl-l-talks__in">
          <div className="bl-l-talks__head" data-in="">
            <h2 id="bl-l-talks-t" className="bl-l-talks__h">Inside NEAR <span className="accent">talks</span></h2>
            <button type="button" className="bl-l-talks__all" onClick={() => openType("watch")}>
              <span>All {TALKS.length} talks in the archive</span><Arrow />
            </button>
          </div>
          <div className="bl-l-talks__body">
            <div id="bl-l-player" className="bl-l-player" role="tabpanel" aria-labelledby={`bl-l-tab-${talk.id}`} data-in="" data-ic="" style={{ ["--j" as string]: 1 }}>
              <a className="bl-l-player__a" href={href(talk)}>
                <span className="bl-l-player__frame">
                  {TALKS.map((p, i) => <img key={p.id} className={i === tv ? "is-on" : undefined} src={img(p.id)} alt="" loading="lazy" decoding="async" />)}
                  <span className="bl-l-play bl-l-play--lg" aria-hidden="true"><i data-icon="play" /></span>
                </span>
                <span key={tv} className="bl-l-player__body">
                  <span className="bl-l-player__k t-label">{TYPE_LABEL.watch} · {idx(tv)} / {idx(TALKS.length - 1)}</span>
                  <span className="bl-l-player__t">{talk.title}<ExtSr h={href(talk)} /></span>
                  <span className="bl-l-player__src">{talk.source}<span className="bl-l-player__go" aria-hidden="true">{ACTION.watch}<Arrow /></span></span>
                </span>
              </a>
            </div>
            <ol ref={tabs} className="bl-l-pl" role="tablist" aria-orientation="vertical" aria-label="Talks" data-in="" style={{ ["--j" as string]: 2 }}>
              {TALKS.map((p, i) => (
                <li key={p.id} role="presentation">
                  <button type="button" role="tab" id={`bl-l-tab-${p.id}`} aria-selected={i === tv} aria-controls="bl-l-player" tabIndex={i === tv ? 0 : -1}
                    className="bl-l-pl__b" onClick={() => setTv(i)} onPointerEnter={(e) => { if (e.pointerType === "mouse") setTv(i); }} onKeyDown={(e) => tvKeys(e, i)}>
                    <span className="bl-l-pl__i" aria-hidden="true">{idx(i)}</span>
                    <span className="bl-l-pl__txt"><span className="bl-l-pl__t">{p.title}</span><span className="bl-l-pl__src">{p.source}</span></span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── 4 · the archive ── */}
      <section id="bl-l-archive" className="bl-l-arc bl-l-wrap" aria-labelledby="bl-l-arc-t">
        <hr className="bl-l-rule" />
        <div className="bl-l-arc__head" data-in="">
          <h2 id="bl-l-arc-t" ref={head} tabIndex={-1} className="bl-l-arc__h">All <span className="accent">posts</span></h2>
          <p className="bl-l-arc__lede">Every story, read and talk, six to a page.</p>
        </div>

        <div className="bl-l-arc__body">
          <aside className="bl-l-rail" aria-label="Filter posts">
            <div className="bl-l-rail__in" data-in="">
              <div className="bl-l-grp bl-l-grp--types">
                <p id="bl-l-types-l" className="t-label bl-l-lbl">Type</p>
                <TypeList items={TYPES} value={f} onChange={chooseType} counts={counts} labelId="bl-l-types-l" />
              </div>
              <div className="bl-l-grp">
                <p id="bl-l-sort-l" className="t-label bl-l-lbl">Sort</p>
                <Choice items={SORTS} value={sort} onChange={chooseSort} labelId="bl-l-sort-l" />
              </div>
              <div className="bl-l-grp">
                <p id="bl-l-view-l" className="t-label bl-l-lbl">View</p>
                <Choice items={VIEWS} value={view} onChange={chooseView} labelId="bl-l-view-l" />
              </div>
            </div>
          </aside>

          <div id="bl-l-feed" className="bl-l-feed">
            <div className="bl-l-feed__bar">
              <p className="bl-l-showing" aria-hidden="true">
                {list.length ? <>Showing <b>{pages > 1 ? `${from}–${to}` : list.length}</b>{pages > 1 && <> of {list.length}</>}</> : <>Nothing to show</>}
              </p>
              {(f !== "all" || q) && (
                <ul className="bl-l-chips" aria-label="Active filters">
                  {f !== "all" && (
                    <li><button type="button" className="bl-l-chip" onClick={() => { chooseType("all"); requestAnimationFrame(() => head.current?.focus({ preventScroll: true })); }}>
                      <span>{label}</span><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 3l6 6M9 3l-6 6" /></svg><span className="sr-only">: remove filter</span>
                    </button></li>
                  )}
                  {q && (
                    <li><button type="button" className="bl-l-chip" onClick={clearQ}>
                      <span>“{q}”</span><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 3l6 6M9 3l-6 6" /></svg><span className="sr-only">: clear search</span>
                    </button></li>
                  )}
                  {f !== "all" && q && <li><button type="button" className="bl-l-clr" onClick={clearAll}>Clear all</button></li>}
                </ul>
              )}
              <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{said}</p>
            </div>

            <div key={listKey} className="bl-l-list-wrap">
              {list.length === 0 ? (
                <div className="bl-l-empty" data-in="">
                  <p className="bl-l-empty__t">No posts match{q ? <> “{q}”</> : null}{f !== "all" ? <> in {label}</> : null}.</p>
                  <div className="bl-l-empty__acts">
                    <button type="button" className="bl-btn" onClick={clearAll}><span>Clear filters</span></button>
                    {f !== "all" && counts.all > 0 && (
                      <button type="button" className="bl-link bl-l-try" onClick={() => chooseType("all")}><span>Search all types ({counts.all})</span><Arrow /></button>
                    )}
                  </div>
                </div>
              ) : (
                <ul className={`bl-l-list bl-l-list--${view}`}>
                  {slice.map((p, j) => <Entry key={p.id} p={p} j={j} q={q} view={view} />)}
                </ul>
              )}
            </div>

            {list.length > 0 && (
              <div className="bl-l-foot">
                {pages > 1 ? (
                  <nav className="bl-l-pager" aria-label="Pages">
                    <button type="button" className="bl-l-pg bl-l-pg--step bl-l-pg--prev" onClick={() => go(pg - 1)} disabled={pg === 1}>
                      <Arrow /><span>Previous</span>
                    </button>
                    <ol className="bl-l-pgs">
                      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                        <li key={n}><button type="button" className="bl-l-pg" aria-current={n === pg ? "page" : undefined} onClick={() => go(n)}>
                          <span className="sr-only">Page </span>{n}
                        </button></li>
                      ))}
                    </ol>
                    <button type="button" className="bl-l-pg bl-l-pg--step" onClick={() => go(pg + 1)} disabled={pg === pages}>
                      <span>Next</span><Arrow />
                    </button>
                  </nav>
                ) : (
                  <p className="bl-l-foot__n">That’s everything{f !== "all" ? <> in {label}</> : null}{q ? <> for “{q}”</> : null}.</p>
                )}
                <a className="bl-link" href={BLOG}><span>View everything on near.org</span><Arrow /><span className="sr-only"> (another site)</span></a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 5 · the newsletter ── */}
      <section className="bl-l-nl bl-l-wrap" aria-labelledby="bl-l-nl-t">
        <hr className="bl-l-rule" />
        <div className="bl-l-nl__in">
          <div className="bl-l-nl__copy" data-in="">
            <h2 id="bl-l-nl-t" className="t-label bl-l-lbl">Newsletter</h2>
            <p className="bl-l-nl__lede">Get the latest product launches, protocol milestones, and ecosystem updates straight to your{" "}inbox.</p>
          </div>
          <div className="bl-l-nl__form" data-in="" style={{ ["--j" as string]: 1 }}>
            <Newsletter />
          </div>
        </div>
      </section>
    </div>
  );
}

/** the newest post, large: the picture on the left (eight columns), the copy beside it; one link covers both */
function Lead({ p }: { p: Post }) {
  const u = href(p);
  return (
    <article className="bl-l-lead" data-in="" data-ic="">
      <Pic id={p.id} cls="bl-l-lead__pic" eager play={p.type === "watch"} />
      <div className="bl-l-lead__body">
        <Kind t={p.type}>Latest · {TYPE_LABEL[p.type]}</Kind>
        <h2 className="bl-l-lead__t"><a className="bl-l-stretch" href={u}>{p.title}<ExtSr h={u} /></a></h2>
        <p className="bl-l-lead__src">{p.source}</p>
        <span className="bl-l-lead__go" aria-hidden="true"><span>{ACTION[p.type]}</span><Arrow /></span>
        {p.note && <p className="bl-l-lead__note">{p.note}</p>}
      </div>
    </article>
  );
}
