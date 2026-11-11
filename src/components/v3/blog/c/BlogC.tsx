"use client";
// Blog C · Archive. A dense index on the ruled grid: the heading row, then the controls (a search over titles and sources, the type filters with their
// counts, how many posts match), then one row of two cells: the list (a column head, then the posts in two groups, Latest and Earlier; each row
// number · type · title · source · arrow, as Go deeper's list and Get into NEAR's rows) and, on wide screens, a sticky preview cell whose photo follows
// the row you point at or focus. ↑ / ↓ move between rows. Below 1100 px each row carries its own thumbnail instead of the preview.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import type { Grid } from "../grid";
import { BLOG, FILTERS, POSTS, SHORT_LABEL, TYPE_LABEL, href, idx, img, type FilterKey, type Post } from "../data";
import { Arrow, ExtSr, Tabs } from "../parts";
import { mount } from "./motion";
import "./blog-c.css";

const LATEST = 6;   // the first six posts are Latest, the rest Earlier (the list has no dates)
const GROUPS = [{ key: "latest", label: "Latest" }, { key: "earlier", label: "Earlier" }] as const;
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const matches = (p: Post, q: string) => !q || fold(`${p.title} ${p.source} ${TYPE_LABEL[p.type]}`).includes(q);
const counts = (q: string) => Object.fromEntries(FILTERS.map((f) => [f.key, POSTS.filter((p) => (f.key === "all" || p.type === f.key) && matches(p, q)).length])) as Record<FilterKey, number>;

/** the title with the search term marked */
function Hl({ text, q }: { text: string; q: string }): ReactNode {
  if (!q) return text;
  const at = fold(text).indexOf(q);
  if (at < 0) return text;
  return <>{text.slice(0, at)}<mark className="bl-c__hl">{text.slice(at, at + q.length)}</mark>{text.slice(at + q.length)}</>;
}

export function BlogC() {
  const ref = useRef<HTMLDivElement>(null), grid = useRef<Grid | null>(null), input = useRef<HTMLInputElement>(null);
  const [f, setF] = useState<FilterKey>("all");
  const [raw, setRaw] = useState("");
  const [act, setAct] = useState(POSTS[0].id);   // the post in the preview (the last one pointed at or focused)
  const [live, setLive] = useState(false);        // the list has changed once: rows that come in rise (blog-c.css)
  useScrollMotion(ref, (root, ctx) => { const m = mount(root, ctx); grid.current = m; return () => { m.dispose(); grid.current = null; }; });

  const q = fold(raw.trim());
  const list = useMemo(() => POSTS.map((p, i) => ({ p, i })).filter(({ p }) => (f === "all" || p.type === f) && matches(p, q)), [f, q]);
  const n = useMemo(() => counts(q), [q]);
  useEffect(() => { grid.current?.sync(true); }, [f, q]);
  // the preview keeps a post that is still listed
  useEffect(() => { if (list.length && !list.some(({ p }) => p.id === act)) setAct(list[0].p.id); }, [list, act]);

  const choose = (k: FilterKey) => { setF(k); setLive(true); };
  const type = (v: string) => { setRaw(v); setLive(true); };
  const clear = () => { type(""); setF("all"); input.current?.focus(); };
  // ↑ / ↓ between the rows (Home / End: the first and the last)
  const keys = (e: KeyboardEvent<HTMLElement>) => {
    const a = [...(ref.current?.querySelectorAll<HTMLAnchorElement>(".bl-c__a") ?? [])], i = a.indexOf(document.activeElement as HTMLAnchorElement);
    if (i < 0) return;
    const to = ({ ArrowDown: Math.min(a.length - 1, i + 1), ArrowUp: Math.max(0, i - 1), Home: 0, End: a.length - 1 } as Record<string, number>)[e.key];
    if (to === undefined) return;
    e.preventDefault(); a[to].focus();
  };
  const cur = POSTS.find((p) => p.id === act)!;
  const label = FILTERS.find((x) => x.key === f)!.label;

  return (
    <div ref={ref} className="bl bl-c">
      <section aria-labelledby="bl-c-t">
        <div className="bl-row bl-c__head" data-row="" data-start="">
          <div className="bl-cell bl-c__title">
            <h1 id="bl-c-t" className="bl-display bl-c__h1" data-rv="">The <span className="accent">archive</span></h1>
          </div>
          <div className="bl-cell bl-c__intro">
            <p className="bl-lede" data-rv="">Every customer story, read and talk on the NEAR blog, on one list. Search by title or source, or filter by type.</p>
          </div>
        </div>
        <div className="bl-row bl-c__ctl" data-row="">
          <div className="bl-cell bl-c__search">
            <label htmlFor="bl-c-q" className="t-label bl-c__search-l">Search the archive</label>
            <div className="bl-c__field">
              <svg className="bl-c__mag" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="8.5" cy="8.5" r="5.75" /><path d="m13 13 4.5 4.5" /></svg>
              <input ref={input} id="bl-c-q" type="search" value={raw} onChange={(e) => type(e.target.value)} placeholder="Title or source" autoComplete="off" spellCheck={false}
                aria-controls="bl-c-results" onKeyDown={(e) => { if (e.key === "Escape" && raw) { e.preventDefault(); type(""); } }} />
              {raw && <button type="button" className="bl-c__clear" onClick={() => { type(""); input.current?.focus(); }}><span className="sr-only">Clear search</span><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5" /></svg></button>}
              <i className="bl-c__line" aria-hidden="true" />
            </div>
          </div>
          <div className="bl-cell bl-c__filters">
            <Tabs value={f} onChange={choose} id="bl-c-tab" controls="bl-c-results" counts={n} />
            <p className="t-label bl-c__n" role="status">{list.length} {list.length === 1 ? "post" : "posts"}{q ? ` for “${raw.trim()}”` : ""}</p>
          </div>
        </div>
      </section>

      <div className="bl-row bl-c__body" data-row="">
        <div className={`bl-cell bl-c__list${live ? " is-live" : ""}`} id="bl-c-results" role="tabpanel" aria-labelledby={`bl-c-tab-${f}`} onKeyDown={keys}>
          <p className="bl-c__cols t-label" aria-hidden="true"><span>No.</span><span>Type</span><span>Title</span><span>Source</span></p>
          {list.length === 0 && (
            <div className="bl-c__empty">
              <p>Nothing in {label} matches “{raw.trim()}”.</p>
              <button type="button" className="bl-btn" onClick={clear}><span>Clear search and filters</span></button>
            </div>
          )}
          {GROUPS.map((g) => {
            const items = list.filter(({ i }) => (g.key === "latest" ? i < LATEST : i >= LATEST));
            if (!items.length) return null;
            return (
              <section key={g.key} className="bl-c__grp" aria-labelledby={`bl-c-g-${g.key}`}>
                <h2 id={`bl-c-g-${g.key}`} className="bl-c__grp-h"><span>{g.label}</span><span className="bl-c__grp-n t-label">{items.length}</span></h2>
                <ol className="bl-c__ol">
                  {items.map(({ p, i }, k) => {
                    const u = href(p);
                    return (
                      <li key={p.id} className="bl-c__li" style={{ ["--k" as string]: k }} data-on={p.id === act ? "" : undefined}>
                        <a className="bl-c__a" href={u} onPointerEnter={() => setAct(p.id)} onFocus={() => setAct(p.id)}>
                          <span className="bl-c__i" aria-hidden="true">{idx(i)}</span>
                          <span className="bl-c__type t-label"><i className="bl-glyph" data-icon={`deeper-${p.type}`} aria-hidden="true" />{SHORT_LABEL[p.type]}</span>
                          <span className="bl-c__th" aria-hidden="true"><img src={img(p.id)} alt="" loading="lazy" decoding="async" /></span>
                          <span className="bl-c__t"><Hl text={p.title} q={q} /><ExtSr h={u} /></span>
                          <span className="bl-c__src">{p.source}</span>
                          <span className="bl-c__go" aria-hidden="true"><Arrow /></span>
                        </a>
                        {p.note && <p className="bl-c__note">{p.note}</p>}
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
        <div className="bl-cell bl-c__pv" aria-hidden="true">
          <div className="bl-c__pv-in">
            <div className="bl-ph bl-c__frame" data-ph="" data-still="">
              {POSTS.map((p) => <img key={p.id} className={`bl-c__img${p.id === act ? " is-act" : ""}`} src={img(p.id)} alt="" loading="lazy" decoding="async" />)}
            </div>
            <p className="bl-c__cap"><span className="bl-c__cap-t">{TYPE_LABEL[cur.type]}</span><span className="bl-c__cap-s">{cur.source}</span></p>
          </div>
        </div>
      </div>

      <div className="bl-row bl-row--end bl-c__foot" data-row="">
        <div className="bl-cell bl-c__foot-cell">
          <p className="bl-c__foot-n">Looking for something older?</p>
          <a className="bl-link" href={BLOG}><span>View everything on near.org</span><Arrow /><span className="sr-only"> (another site)</span></a>
        </div>
      </div>
    </div>
  );
}
