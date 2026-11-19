"use client";
// Blog index B: the Figma frame 980:723 ("News and deep dives"). The eyebrow, the heading with its Kepler accent and the pill search at its right, then the
// type chips between two rules; while browsing, the featured post (a large photo, its number · type · source, the title) beside the next three as
// numbered rows, a rule, and the rest as boxed white cards three to a row; numbered pages at the foot, the current one green.
// A type or a search turns the page into the matching posts as cards. Posts: the CMS's live ones first (components/blog/live.ts), then data.ts's.
import { useEffect, useRef, useState } from "react";
import type { BlogItem } from "@/components/blog/live";
import { POSTS, type FilterKey } from "@/components/v3/blog/data";
import { Card, Featured, LABEL, Pager, Row } from "./parts";
import searchIcon from "./search.svg";
import "./blog-b.css";

const PER = 6;   // cards to a page (two rows of three, as in the frame)
const NONE: BlogItem[] = [];
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const plural = (n: number) => `${n} ${n === 1 ? "post" : "posts"}`;
const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** `live`: the CMS's published posts, listed before data.ts's */
export function BlogB({ live = NONE }: { live?: BlogItem[] }) {
  const all: BlogItem[] = [...live, ...POSTS];
  // the chips: All, then only the types some post carries
  const types: { key: FilterKey; label: string }[] = [{ key: "all", label: "All" },
    ...(["story", "read", "watch"] as const).filter((t) => all.some((p) => p.type === t)).map((t) => ({ key: t, label: LABEL[t] }))];

  const [f, setF] = useState<FilterKey>("all");
  const [raw, setRaw] = useState("");
  const [page, setPage] = useState(1);
  const [said, setSaid] = useState("");
  const input = useRef<HTMLInputElement>(null), head = useRef<HTMLHeadingElement>(null), jump = useRef(false);

  /* ── the list ── */
  const q = fold(raw.trim()), term = raw.trim();
  const browsing = f === "all" && !q;
  const list = all.filter((p) => (f === "all" || p.type === f) && (!q || fold(`${p.title} ${p.source}`).includes(q)));
  // browsing: the first post is featured, the next three are the rows, the rest are cards; otherwise every match is a card
  const cards = browsing ? list.slice(4) : list;
  const pages = Math.max(1, Math.ceil(cards.length / PER)), pg = Math.min(page, pages);
  const shown = cards.slice((pg - 1) * PER, pg * PER);
  const top = browsing && pg === 1 && list.length > 0;
  const label = types.find((t) => t.key === f)?.label ?? "All";

  /* ── the live region: one message once the list settles ── */
  useEffect(() => {
    const t = window.setTimeout(() => {
      const parts = [list.length ? `Showing ${plural(list.length)}` : "No posts match"];
      if (f !== "all") parts.push(label);
      if (term) parts.push(`matching “${term}”`);
      if (pages > 1) parts.push(`page ${pg} of ${pages}`);
      setSaid(parts.join(", "));
    }, 450);
    return () => clearTimeout(t);
  }, [list.length, f, label, term, pages, pg]);

  /* ── after a page change: bring the posts' heading into view and move focus to it (the pressed button may be gone) ── */
  useEffect(() => {
    if (!jump.current) return;
    jump.current = false;
    const h = head.current; if (!h) return;
    const y = h.getBoundingClientRect().top + scrollY - 112;   // clear the floating header
    scrollTo({ top: Math.max(0, y), behavior: reduced() ? "auto" : "smooth" });
    h.focus({ preventScroll: true });
  }, [pg]);

  const choose = (k: FilterKey) => { if (k !== f) { setF(k); setPage(1); } };
  const type = (v: string) => { setRaw(v); setPage(1); };
  const go = (n: number) => { if (n < 1 || n > pages || n === pg) return; jump.current = true; setPage(n); };
  const clearAll = () => { setRaw(""); setF("all"); setPage(1); input.current?.focus(); };

  return (
    <div className="bl bl-b">
      {/* ── the head: eyebrow, heading | search ── */}
      <header className="bb-head">
        <p className="bb-eyebrow"><i aria-hidden="true" />NEAR blog</p>
        <div className="bb-hrow">
          <h1 className="bb-h1">News and deep <span className="accent">dives</span></h1>
          <form role="search" className="bb-search" aria-label="Posts" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="bb-q" className="sr-only">Search posts by title or source</label>
            <input ref={input} id="bb-q" type="search" value={raw} placeholder="Search" autoComplete="off" spellCheck={false} aria-controls="bb-feed"
              onChange={(e) => type(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape" && raw) { e.preventDefault(); type(""); } }} />
            {raw
              ? <button type="button" className="bb-clear" onClick={() => { type(""); input.current?.focus(); }}><span className="sr-only">Clear search</span><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5" /></svg></button>
              // eslint-disable-next-line @next/next/no-img-element -- the Figma's 14 px SVG icon, as it is
              : <img className="bb-mag" src={searchIcon.src} width={14} height={14} alt="" />}
          </form>
        </div>
      </header>

      {/* ── the type chips, between two rules ── */}
      <div className="bb-bar" role="group" aria-label="Filter by type">
        {types.map((t) => (
          <button key={t.key} type="button" className="bb-tb" aria-pressed={f === t.key} aria-controls="bb-feed" onClick={() => choose(t.key)}>
            {f === t.key && <i aria-hidden="true" />}{t.label}
          </button>
        ))}
      </div>

      <section id="bb-feed" className="bb-feed" aria-labelledby="bb-feed-t">
        <h2 id="bb-feed-t" ref={head} tabIndex={-1} className="sr-only">
          {browsing ? "Posts" : `${list.length ? plural(list.length) : "No posts"}${f !== "all" ? `: ${label}` : ""}${term ? ` matching “${term}”` : ""}`}
        </h2>
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{said}</p>

        {/* ── page 1 while browsing: the featured post and the next three ── */}
        {top && (
          <>
            <div className="bb-panel">
              <Featured p={list[0]} n={0} />
              {list.length > 1 && <ol className="bb-rows" aria-label="Also new">{list.slice(1, 4).map((p, i) => <Row key={p.id} p={p} n={i + 1} />)}</ol>}
            </div>
            {shown.length > 0 && <hr className="bb-rule" />}
          </>
        )}

        {/* ── a type or a search: how many match ── */}
        {!browsing && list.length > 0 && (
          <p className="bb-count" aria-hidden="true">{plural(list.length)}{f !== "all" ? <> · {label}</> : null}{term ? <> · “{term}”</> : null}</p>
        )}

        {list.length === 0 && (
          <div className="bb-empty">
            <p className="bb-empty__t">No posts match{term ? <> “{term}”</> : null}{f !== "all" ? <> in {label}</> : null}.</p>
            <button type="button" className="bb-pill bb-pill--btn" onClick={clearAll}>Clear filters</button>
          </div>
        )}

        {shown.length > 0 && <ul className="bb-grid">{shown.map((p) => <Card key={p.id} p={p} />)}</ul>}

        {pages > 1 && <Pager pg={pg} pages={pages} go={go} />}
      </section>
    </div>
  );
}
