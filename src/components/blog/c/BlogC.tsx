"use client";
// Blog index C · "Figma on the homepage grid": the Figma frame's index (version B's content and order) set on the homepage's ruled grid, kept light.
// The structure is the grid, not boxes: ruled rows with hairline frame lines and cell dividers, a small + wherever a row's top rule meets a vertical, mono
// labels in the cells, cards open inside their cells (no white boxes), generous air. The rows, crosshairs and arrivals are v3/blog's (blog.css + grid.ts,
// the same port of proof-deeper the other ruled pages use); this file only lightens their tone (blog-c.css).
// From the top:
//   - the head row: the eyebrow and "News and deep dives" | the search (live, by title and source); then the bar: the type chips and how many posts;
//   - while browsing (no search), page 1: one row, the featured post (large photo, number · TYPE · source, the big title) | the next three as numbered
//     rows with thumbnails; then the rest as cards, three to a row, each row ruled; numbered pages at the foot, counted from the list;
//   - with a search: the matches as cards only, the same rows and pages.
// Copy comes from the posts (live CMS posts first, then v3/blog/data.ts): an excerpt when the post has one, else its source line.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { prefersReduced, useScrollMotion } from "@/lib/motion/scroll";
import { mountGrid, type Grid } from "@/components/v3/blog/grid";
import { POSTS, chunk, type FilterKey } from "@/components/v3/blog/data";
import type { BlogItem } from "@/components/blog/live";
import { Card, Featured, KIND, Pager, Side, fold } from "./parts";
import "./blog-c.css";

const LEAD = 4;        // page 1 while browsing: the featured post and the three rows beside it
const FIRST = 9;       // page 1's cards under them (three rows of three)
const PER = 12;        // the cards on every other page, and on every page of a search (four rows of three)
const OFFSET = 104;    // the floating header and some air: where the results land when we bring them into view
const NONE: BlogItem[] = [];
const ORDER: FilterKey[] = ["all", "story", "read", "watch"];
const plural = (n: number) => `${n} ${n === 1 ? "post" : "posts"}`;

export function BlogC({ live = NONE }: { live?: BlogItem[] }) {
  const all: BlogItem[] = [...live, ...POSTS];
  const ref = useRef<HTMLDivElement>(null), grid = useRef<Grid | null>(null);
  const input = useRef<HTMLInputElement>(null), head = useRef<HTMLHeadingElement>(null);
  const [f, setF] = useState<FilterKey>("all");
  const [raw, setRaw] = useState("");
  const [page, setPage] = useState(1);
  const [ver, setVer] = useState(0);       // bumps on a type or page change: the rows are made anew, their content opens again
  const [said, setSaid] = useState("");
  const toFocus = useRef(false);
  useScrollMotion(ref, (root, ctx) => { const g = mountGrid(root, ctx); grid.current = g; return () => { g.dispose(); grid.current = null; }; });

  /* ── the list ── */
  const q = fold(raw.trim()), term = raw.trim();
  const types = ORDER.filter((k) => k === "all" || all.some((p) => p.type === k));   // only the types that have posts
  const list = all.filter((p) => (f === "all" || p.type === f) && (!q || fold(`${p.title} ${p.source}`).includes(q)));
  const browsing = !q;
  const head1 = browsing ? Math.min(list.length, LEAD + FIRST) : PER;    // how many page 1 holds
  const pages = Math.max(1, 1 + Math.ceil(Math.max(0, list.length - head1) / PER));
  const pg = Math.min(page, pages);
  const from = pg === 1 ? 0 : head1 + (pg - 2) * PER;
  const slice = list.slice(from, pg === 1 ? head1 : from + PER);
  const lead = browsing && pg === 1 ? slice.slice(0, LEAD) : [];
  const cards = slice.slice(lead.length);
  const rows = chunk(cards, 3);
  const at = (k: number) => from + lead.length + k;   // a card's position in the list (its number)
  const label = f === "all" ? "" : KIND[f];

  /* ── the grid picks up the rows React has just made (crosshairs, arrivals; new rows in view are simply there) ── */
  useLayoutEffect(() => { grid.current?.sync(true); }, [f, q, pg, ver]);

  /* ── the live region: one message once the list settles ── */
  useEffect(() => {
    const t = window.setTimeout(() => {
      const parts = [list.length ? `${plural(list.length)}` : "No posts match"];
      if (label) parts.push(label);
      if (term) parts.push(`matching “${term}”`);
      if (pages > 1) parts.push(`page ${pg} of ${pages}`);
      setSaid(parts.join(", "));
    }, 450);
    return () => clearTimeout(t);
  }, [list.length, label, term, pages, pg]);

  /* ── bringing the results into view: after a page change (focus moves to them), or when a change leaves them above the view ── */
  const toList = (focus: boolean) => {
    const h = head.current; if (!h) return;
    const top = h.getBoundingClientRect().top;
    if (focus || top < OFFSET - 8) scrollTo({ top: Math.max(0, top + scrollY - OFFSET), behavior: prefersReduced() ? "auto" : "smooth" });
    if (focus) h.focus({ preventScroll: true });
  };
  useLayoutEffect(() => { if (toFocus.current) { toFocus.current = false; toList(true); } }, [pg]);

  const choose = (k: FilterKey) => { if (k === f) return; setF(k); setPage(1); setVer((v) => v + 1); requestAnimationFrame(() => toList(false)); };
  const search = (v: string) => { setRaw(v); setPage(1); };
  const go = (n: number) => { if (n < 1 || n > pages || n === pg) return; toFocus.current = true; setVer((v) => v + 1); setPage(n); };
  const clear = () => { setRaw(""); setF("all"); setPage(1); setVer((v) => v + 1); input.current?.focus(); };

  return (
    <div ref={ref} className="bl bc">
      {/* ── the head: the heading | the search, then the bar ── */}
      <section className="bc-head" aria-labelledby="bc-t">
        <div className="bl-row bc-top" data-row="" data-start="">
          <div className="bl-cell bc-top__h">
            <p className="bc-eye" data-rv=""><span className="bc-sq" aria-hidden="true" />NEAR blog</p>
            <h1 id="bc-t" className="bc-h1" data-rv="">News and deep <span className="accent">dives</span></h1>
          </div>
          <div className="bc-top__s">{/* not a cell: no divider beside the heading, the head stays open */}
            <form role="search" className="bc-form" aria-label="Posts" onSubmit={(e) => { e.preventDefault(); toList(false); }} data-rv="">
              <label htmlFor="bc-q" className="sr-only">Search posts by title or source</label>
              <div className="bc-search">
                <input ref={input} id="bc-q" type="search" value={raw} placeholder="Search" autoComplete="off" spellCheck={false} aria-controls="bc-res"
                  onChange={(e) => search(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape" && raw) { e.preventDefault(); search(""); } }} />
                {raw
                  ? <button type="button" className="bc-x" onClick={() => { search(""); input.current?.focus(); }}><span className="sr-only">Clear search</span>
                      <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" /></svg></button>
                  : <svg className="bc-mag" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><circle cx="6" cy="6" r="4.25" /><path d="m9.2 9.2 3.3 3.3" /></svg>}
              </div>
            </form>
          </div>
        </div>
        <div className={`bl-row bc-bar${lead.length ? "" : " bl-row--end"}`} data-row="">
          <div className="bl-cell bc-bar__cell">
            <div className="bc-chips" role="group" aria-label="Filter by type">
              {types.map((k) => (
                <button key={k} type="button" className="bc-chip" aria-pressed={k === f} aria-controls="bc-res" onClick={() => choose(k)}>
                  {k === f && <span className="bc-sq" aria-hidden="true" />}{k === "all" ? "All" : KIND[k]}
                </button>
              ))}
            </div>
            <p className="bc-count" aria-hidden="true">{plural(list.length)}{pages > 1 && <> · page {pg} / {pages}</>}</p>
          </div>
        </div>
      </section>

      {/* ── the results ── */}
      <section id="bc-res" className="bc-res" aria-labelledby="bc-res-t">
        <h2 id="bc-res-t" ref={head} tabIndex={-1} className="sr-only">Posts{label ? `: ${label}` : ""}{term ? `, matching “${term}”` : ""}</h2>
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{said}</p>

        {list.length === 0 && (
          <div className="bl-row bl-row--end bc-empty" data-row="">
            <div className="bl-cell">
              <p className="bc-empty__t" data-rv="">No posts match{term ? <> “{term}”</> : null}{label ? <> in {label}</> : null}.</p>
              <button type="button" className="bc-pill bc-pill--btn" onClick={clear} data-rv="">Clear filters</button>
            </div>
          </div>
        )}

        {lead.length > 0 && (
          <div key={`lead-${f}-${ver}`} className={`bl-row bl-row--end bc-lead${ver ? " is-shown" : ""}`} data-row="">
            <div className="bl-cell bc-lead__f"><Featured p={lead[0]} i={from} /></div>
            {lead.length > 1 && (
              <div className="bl-cell bc-lead__s">
                <ol className="bc-sides">{lead.slice(1).map((p, k) => <Side key={p.id} p={p} i={from + 1 + k} />)}</ol>
              </div>
            )}
          </div>
        )}

        {rows.length > 0 && (
          <div className={`bc-cards${ver ? " is-shown" : ""}`}>
            {rows.map((r, k) => (
              <div key={`r-${f}-${q}-${pg}-${ver}-${k}`} className={`bl-row bc-row${k === rows.length - 1 ? " bl-row--end" : ""}`} data-row="">
                {r.map((p, j) => <Card key={p.id} p={p} i={at(k * 3 + j)} j={k * 3 + j} />)}
                {Array.from({ length: 3 - r.length }, (_, j) => <div key={`pad${j}`} className="bl-cell bc-pad" aria-hidden="true" />)}
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="bc-foot">
            <Pager pages={pages} at={pg} go={go} />
            <p className="bc-count" aria-hidden="true">Page {pg} of {pages}</p>
          </div>
        )}
      </section>
    </div>
  );
}
