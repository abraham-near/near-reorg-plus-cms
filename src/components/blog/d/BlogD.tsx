"use client";
// Blog D · "Lead card + type menu", from Figma 2026_10_Near_Web node 756:41 (Blog / Cards v2 · Light). The content between the site's header and footer:
//   - the head: the eyebrow (■ NEAR BLOG), the heading with its accent, then a rule over a bar: the type menu (a native select, styled as the Figma's pill)
//     at the left and the search (live, by title and source) at the right;
//   - the lead: the first post of the current filter in one wide white card (the photo with its type at the left, the copy and its button at the right);
//   - a rule over the type chips (the same filter as the menu: they stay in sync; the chosen one is black with a green square);
//   - the rest as boxed white cards three to a row, six to a page, and the numbered pages (the current one green).
// Only the types that have posts are offered. The state rides in the URL (?type=, ?q=, ?page=) so a view can be shared.
import { useEffect, useRef, useState } from "react";
import { POSTS, type FilterKey, type Type } from "@/components/v3/blog/data";
import type { BlogItem } from "../live";
import { Card, Chev, Cross, LABEL, Lead, Mag, Pager } from "./parts";
import "./blog-d.css";

const PER = 6;        // cards to a page: two rows of three, as the Figma
const OFFSET = 104;   // the floating header (16 px inset + 64 px bar) and some air: where the chips land when a page changes
const ORDER: Type[] = ["story", "read", "watch"];
const NONE: BlogItem[] = [];
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const matches = (p: BlogItem, q: string) => !q || fold(`${p.title} ${p.source}`).includes(q);
const plural = (n: number) => `${n} ${n === 1 ? "post" : "posts"}`;
const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** `live`: the CMS's published posts, listed first, before data.ts's */
export function BlogD({ live = NONE }: { live?: BlogItem[] }) {
  const all: BlogItem[] = [...live, ...POSTS];
  // the types on offer: All, then each type that has posts
  const types: { key: FilterKey; label: string }[] = [{ key: "all", label: "All" }, ...ORDER.filter((t) => all.some((p) => p.type === t)).map((t) => ({ key: t, label: LABEL[t] }))];

  const [f, setF] = useState<FilterKey>("all");
  const [raw, setRaw] = useState("");
  const [page, setPage] = useState(1);
  const [ver, setVer] = useState(0);          // bumps on a change: the cards are made anew, so they rise again
  const [said, setSaid] = useState("");       // the live region's text (once typing pauses)
  const input = useRef<HTMLInputElement>(null), head = useRef<HTMLHeadingElement>(null), bar = useRef<HTMLElement>(null);
  const toFocus = useRef(false), ready = useRef(false);

  /* ── the list: the lead is the first post of the filter, the cards are the rest, six to a page ── */
  const q = fold(raw.trim()), term = raw.trim();
  const list = all.filter((p) => (f === "all" || p.type === f) && matches(p, q));
  const lead = list[0] ?? null, rest = list.slice(1);
  const pages = Math.max(1, Math.ceil(rest.length / PER)), pg = Math.min(page, pages);
  const cards = rest.slice((pg - 1) * PER, pg * PER);
  const label = types.find((t) => t.key === f)?.label ?? "All";

  /* ── the URL: read once after hydration (the server renders the default view), then written on every change ── */
  /* eslint-disable react-hooks/set-state-in-effect -- the URL is an external source only the client can read */
  useEffect(() => {
    const s = new URLSearchParams(location.search);
    const t = s.get("type"), qq = s.get("q"), p = parseInt(s.get("page") || "", 10);
    if (t && types.some((x) => x.key === t)) setF(t as FilterKey);
    if (qq) setRaw(qq);
    if (p > 1) setPage(p);
    ready.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, after hydration
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!ready.current) return;
    const s = new URLSearchParams();
    if (f !== "all") s.set("type", f);
    if (term) s.set("q", term);
    if (pg > 1) s.set("page", String(pg));
    const u = `${location.pathname}${s.size ? `?${s}` : ""}${location.hash}`;
    if (u !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(history.state, "", u);
  }, [f, term, pg]);

  /* ── the live region: one message once the list settles ── */
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!list.length) { setSaid(`No posts match${term ? ` “${term}”` : ""}${f !== "all" ? ` in ${label}` : ""}`); return; }
      const parts = [`Showing ${plural(list.length)}`];
      if (f !== "all") parts.push(label);
      if (term) parts.push(`matching “${term}”`);
      if (pages > 1) parts.push(`page ${pg} of ${pages}`);
      setSaid(parts.join(", "));
    }, 450);
    return () => clearTimeout(t);
  }, [list.length, f, label, term, pages, pg]);

  /* ── a page change brings the chips into view and moves focus to the posts' heading ── */
  useEffect(() => {
    if (!toFocus.current) return;
    toFocus.current = false;
    const b = bar.current;
    if (b) scrollTo({ top: Math.max(0, b.getBoundingClientRect().top + scrollY - OFFSET), behavior: reduced() ? "auto" : "smooth" });
    head.current?.focus({ preventScroll: true });
  }, [pg]);

  const choose = (k: FilterKey) => { if (k === f) return; setF(k); setPage(1); setVer((v) => v + 1); };
  const search = (v: string) => { setRaw(v); setPage(1); };
  const go = (n: number) => { if (n < 1 || n > pages || n === pg) return; toFocus.current = true; setVer((v) => v + 1); setPage(n); };
  const clearAll = () => { setRaw(""); setF("all"); setPage(1); setVer((v) => v + 1); input.current?.focus(); };

  return (
    <div className="bl bd">
      {/* ── the head: eyebrow, heading, then the bar (the type menu | the search) under a rule ── */}
      <header className="bd-head">
        <p className="bd-eyebrow"><i aria-hidden="true" />NEAR blog</p>
        <h1 className="bd-h1">News and deep <span className="accent">dives</span></h1>
      </header>

      <div className="bd-bar">
        <div className="bd-pill bd-sel">
          <span className="bd-pill__v" aria-hidden="true">Content by type: {label}</span>
          <select id="bd-type" value={f} onChange={(e) => choose(e.target.value as FilterKey)} aria-label="Content by type" aria-controls="bd-feed">
            {types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <Chev />
        </div>
        <form role="search" className="bd-pill bd-search" aria-label="Posts" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="bd-q" className="sr-only">Search posts by title or source</label>
          <input ref={input} id="bd-q" type="search" value={raw} placeholder="Search" autoComplete="off" spellCheck={false} aria-controls="bd-feed"
            onChange={(e) => search(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape" && raw) { e.preventDefault(); search(""); } }} />
          {raw
            ? <button type="button" className="bd-clear" onClick={() => { search(""); input.current?.focus(); }}><span className="sr-only">Clear search</span><Cross /></button>
            : <Mag />}
        </form>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{said}</p>

      <div id="bd-feed">
        {lead && <Lead key={`lead-${lead.id}-${ver}`} p={lead} />}

        {list.length === 0 && (
          <div className="bd-empty bd-box">
            <p className="bd-empty__t">No posts match{term ? <> “{term}”</> : null}{f !== "all" ? <> in {label}</> : null}.</p>
            <button type="button" className="bd-btn bd-btn--b" onClick={clearAll}>Clear filters</button>
          </div>
        )}

        {/* ── the chips (the same filter as the menu) and the cards ── */}
        <section ref={bar} className="bd-posts" aria-labelledby="bd-posts-t">
          <h2 id="bd-posts-t" ref={head} tabIndex={-1} className="sr-only">More posts</h2>
          <div className="bd-chips" role="group" aria-label="Content by type">
            {types.map((t) => (
              <button key={t.key} type="button" className="bd-chipb" aria-pressed={f === t.key} aria-controls="bd-feed" onClick={() => choose(t.key)}>
                {f === t.key && <i aria-hidden="true" />}{t.label}
              </button>
            ))}
          </div>

          {cards.length > 0 && (
            <div className="bd-grid">
              {cards.map((p, j) => <Card key={`c-${p.id}-${ver}`} p={p} d={(j % 3) * 0.06 + Math.floor(j / 3) * 0.08} />)}
            </div>
          )}

          {pages > 1 && <Pager pages={pages} page={pg} go={go} />}
        </section>
      </div>
    </div>
  );
}
