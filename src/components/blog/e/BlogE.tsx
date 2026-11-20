"use client";
/* eslint-disable @next/next/no-img-element */
// Blog index E (/blog; D221, rebuilt as the study's A2: D240–D244).
// The heading with a short line at its right over a hairline; the lead post, always on screen (D242); then the filters and a grid of cards.
//   - Types: All, Blog, Press, Watch as large words, one at a time, the chosen one in ink with the site's green dot sliding to it (as Go deeper's tabs).
//   - Tags: pills under them, several at once (a post with any of them shows), × on a chosen pill, then Clear. The four product tags lead (tags.ts).
//   - Cards: the homepage's own (Go deeper, proof-deeper.css): cells of a ruled grid with + where the lines meet, the photo inset 24 px, the type and the
//     date under it, the title, the source, then the post's tags; a paper fill and the green dot on hover. Nine at a time, with Show more.
// Posts: the CMS's live ones first (components/blog/live.ts), each with its own photo, date, excerpt and tags; then data.ts's Go deeper items, in black
// and white (/images/blog/<id>.webp), with no dates of their own. Labels are /blog's (J's KIND): Blog, Press, Watch.
import { useLayoutEffect, useRef, useState } from "react";
import type { BlogItem } from "@/components/blog/live";
import { POSTS, href, isExt, type FilterKey, type Type } from "@/components/v3/blog/data";
import { DEEPER_TAGS, tagKey, tagList } from "./tags";
import "./blog-e.css";

const STEP = 9;   // cards shown at first, and added by each Show more
const NONE: BlogItem[] = [];
const LABEL: Record<Type, string> = { read: "Blog", story: "Press", watch: "Watch" };
const TABS: { key: FilterKey; label: string }[] = [{ key: "all", label: "All" }, { key: "read", label: "Blog" }, { key: "story", label: "Press" }, { key: "watch", label: "Watch" }];
const plural = (n: number) => `${n} ${n === 1 ? "post" : "posts"}`;

/** a CMS post's own photo (null: none); a Go deeper item's black-and-white one */
const picOf = (p: BlogItem) => (p.pic === undefined ? `/images/blog/${p.id}.webp` : p.pic);
/** a CMS post's publish date, in UTC so the server and the browser agree */
const dateOf = (p: BlogItem) => (p.date ? new Date(p.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : null);
const linkOf = (p: BlogItem) => { const h = href(p); return isExt(h) ? { href: h, target: "_blank", rel: "noreferrer" } : { href: h }; };
/** a post's tags: the CMS's, or those read off a Go deeper item's title and source */
const tagsOf = (p: BlogItem) => p.tags ?? DEEPER_TAGS[p.id] ?? [];

function Pic({ p, className = "", lazy }: { p: BlogItem; className?: string; lazy?: boolean }) {
  const src = picOf(p);
  return <span className={`be-pic ${className}`}>{src && <img src={src} alt="" loading={lazy ? "lazy" : undefined} />}</span>;
}

/** the type, and the date when the post has one */
function Meta({ p }: { p: BlogItem }) {
  const d = dateOf(p);
  return <span className="be-meta"><span className="be-type">{LABEL[p.type]}</span>{d && <time className="be-date" dateTime={p.date}>{d}</time>}</span>;
}

/** a post's tags under the pills' names (the CMS's "Near AI" shows as "NEAR AI"), each once */
function Tags({ p, on, names }: { p: BlogItem; on: Set<string>; names: Map<string, string> }) {
  const keys = [...new Set(tagsOf(p).map(tagKey))];
  return keys.length ? <span className="be-ctags">{keys.map((k) => <span key={k} data-on={on.has(k) || undefined}>{names.get(k) ?? k}</span>)}</span> : null;
}

/** `live`: the CMS's published posts, listed before data.ts's */
export function BlogE({ live = NONE }: { live?: BlogItem[] }) {
  const all: BlogItem[] = [...live, ...POSTS];
  const lead = all[0];
  const tags = tagList(all.map(tagsOf));
  const names = new Map(tags.map((t) => [tagKey(t), t]));
  const [tab, setTab] = useState<FilterKey>("all");
  const [picked, setPicked] = useState<string[]>([]);   // tag keys
  const [shown, setShown] = useState(STEP);
  const on = new Set(picked);
  // the lead stays on screen whatever is chosen (D242): the filters narrow the grid under it
  const matches = (p: BlogItem) => (tab === "all" || p.type === tab) && (!on.size || tagsOf(p).some((t) => on.has(tagKey(t))));
  const list = all.filter((p) => p !== lead && matches(p));
  const leadMatches = !!lead && matches(lead);
  const chosen = tags.filter((t) => on.has(tagKey(t))).join(" or ");
  const pickTab = (k: FilterKey) => { setTab(k); setShown(STEP); };
  const toggle = (k: string) => { setShown(STEP); setPicked((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k])); };
  const clear = () => { setShown(STEP); setPicked([]); };

  // the dot's place: the chosen word's left edge, read after layout (and again once the fonts are in, and on resize); hidden until then
  const rowRef = useRef<HTMLDivElement>(null);
  const [dotX, setDotX] = useState<number | null>(null);
  useLayoutEffect(() => {
    const place = () => { const b = rowRef.current?.querySelector<HTMLElement>(`[data-key="${tab}"]`); if (b) setDotX(b.offsetLeft); };
    place();
    let live = true;
    document.fonts?.ready.then(() => { if (live) place(); });
    window.addEventListener("resize", place);
    return () => { live = false; window.removeEventListener("resize", place); };
  }, [tab]);

  return (
    <div className="bl be">
      <header className="be-head">
        <h1 className="be-h1">The NEAR <span className="accent">blog</span></h1>
        <p className="be-aside">Customer stories from teams building with NEAR, reads on the agent economy and talks from Inside NEAR.</p>
      </header>

      {lead && (
        <a className="be-lead" {...linkOf(lead)}>
          <Pic p={lead} className="be-lead__pic" />
          <span className="be-lead__text">
            <Meta p={lead} />
            <h2 className="be-lead__title">{lead.title}</h2>
            {lead.excerpt && <span className="be-lead__x">{lead.excerpt}</span>}
            <span className="be-src">{lead.source}</span>
            <Tags p={lead} on={on} names={names} />
          </span>
        </a>
      )}

      <div className="be-filters">
        <div className="be-types">
          <div className="be-types__row" role="group" aria-label="Show posts by type" ref={rowRef} style={dotX === null ? undefined : ({ "--dot-x": `${dotX}px` } as React.CSSProperties)}>
            <span className="be-types__dot" aria-hidden="true" data-ready={dotX === null ? undefined : ""} />
            {TABS.map((t) => (
              <button key={t.key} type="button" className="be-tb" data-key={t.key} aria-pressed={tab === t.key} onClick={() => pickTab(t.key)}>{t.label}</button>
            ))}
          </div>
          <p className="be-n" aria-live="polite">{plural(list.length)}</p>
        </div>
        <div className="be-tags" role="group" aria-label="Show posts by tag">
          {tags.map((t) => {
            const k = tagKey(t), sel = on.has(k);
            return (
              <button key={k} type="button" className="be-pill" aria-pressed={sel} onClick={() => toggle(k)}>
                {t}{sel && <span className="be-pill__x" aria-hidden="true">×</span>}
              </button>
            );
          })}
          {on.size > 0 && <button type="button" className="be-clear" onClick={clear}>Clear</button>}
        </div>
      </div>

      {list.length > 0 ? (
        <ul className="be-grid">
          {list.slice(0, shown).map((p) => (
            <li key={p.id} className="be-cell">
              <a className="be-card" {...linkOf(p)}>
                <Pic p={p} lazy />
                <Meta p={p} />
                <h3 className="be-card__title">{p.title}</h3>
                <span className="be-src">{p.source}</span>
                <Tags p={p} on={on} names={names} />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        // nothing in the grid: say so, minding the lead above when it matches what is chosen (it stays on screen, D242)
        <p className="be-empty">
          {leadMatches
            ? `The post above is the only ${tab === "all" ? "" : `${LABEL[tab]} `}post${on.size ? ` on ${chosen}` : ""} so far.`
            : `No ${tab === "all" ? "" : `${LABEL[tab]} `}posts${on.size ? ` on ${chosen}` : ""} yet.`}
          {on.size > 0 && <>{" "}<button type="button" className="be-clear" onClick={clear}>Clear tags</button></>}
        </p>
      )}
      {list.length > shown && (
        <div className="be-more"><button type="button" className="be-more__b" onClick={() => setShown((n) => n + STEP)}>Show more <span aria-hidden="true">+</span></button></div>
      )}
    </div>
  );
}
