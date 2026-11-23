"use client";
/* eslint-disable @next/next/no-img-element */
// Blog index F (/blog; D254, D255): version E (D221, D240–D244, now frozen at /blog-index-e) with the CMS's 24 newest posts hard-coded (./posts.ts),
// so /blog shows them without the database. Design changes from here on go in F; E stays as it was.
// The heading with a short line at its right over a hairline; the lead post, always on screen (D242), set as an editorial opener (D255): a "Latest"
// kicker, the title large in the display face, the summary as a standfirst; then the filters and a grid of cards.
//   - Types: All, Blog, Press, Watch as large words, one at a time (only the types the posts
//     have; none while every post is one type), the chosen one in ink with the site's green dot sliding to it (as Go deeper's tabs).
//   - Tags: pills under them, several at once (a post with any of them shows), × on a chosen pill, then Clear. The four product tags lead (tags.ts);
//     only tags some post carries get a pill.
//   - Cards: the homepage's own (Go deeper, proof-deeper.css): cells of a ruled grid with + where the lines meet, the photo inset 24 px, the type and the
//     date under it, the title, the source, then the post's tags; a paper fill and the green dot on hover. Nine at a time, with Show more.
// Posts: the CMS's 24 (./posts.ts), each with its own photo, date, summary and tags where the CMS has them; then data.ts's Go deeper items as samples,
// so the Press and Watch categories show (D255), in black and white (/images/blog/<id>.webp), with no dates, less the two that are among the 24
// (the agent economy read, Ledger). Of the other ten, none is a CMS article. Labels are /blog's (J's KIND): Blog, Press, Watch.
import { useLayoutEffect, useRef, useState } from "react";
import type { BlogItem } from "@/components/blog/live";
import { POSTS, href, isExt, type FilterKey, type Type } from "@/components/v3/blog/data";
import { DEEPER_TAGS, tagKey, tagList } from "../e/tags";
import { CMS_POSTS } from "./posts";
import "./blog-f.css";

const STEP = 9;   // cards shown at first, and added by each Show more
const LABEL: Record<Type, string> = { read: "Blog", story: "Press", watch: "Watch" };
const TABS: { key: FilterKey; label: string }[] = [{ key: "all", label: "All" }, { key: "read", label: "Blog" }, { key: "story", label: "Press" }, { key: "watch", label: "Watch" }];
const plural = (n: number) => `${n} ${n === 1 ? "post" : "posts"}`;

/** a CMS post's own photo (null: none); a Go deeper sample's black-and-white one */
const picOf = (p: BlogItem) => (p.pic === undefined ? `/images/blog/${p.id}.webp` : p.pic);
/** a CMS post's publish date, in UTC so the server and the browser agree */
const dateOf = (p: BlogItem) => (p.date ? new Date(p.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : null);
const linkOf = (p: BlogItem) => { const h = href(p); return isExt(h) ? { href: h, target: "_blank", rel: "noreferrer" } : { href: h }; };
/** a post's tags: a CMS post's (./posts.ts says where they come from), or those read off a Go deeper sample's title and source (tags.ts) */
const tagsOf = (p: BlogItem) => p.tags ?? DEEPER_TAGS[p.id] ?? [];

/** a Go deeper sample that is also one of the CMS's posts: same slug as its id, or its link ends in the post's slug (Ledger's near.org/blog link) */
const slugOf = (p: BlogItem) => p.url?.split("/").pop() ?? "";
const dupe = (posts: BlogItem[]) => { const s = new Set(posts.map(slugOf)); return (p: BlogItem) => s.has(p.id) || (!!p.url && s.has(slugOf(p))); };

function Pic({ p, className = "", lazy }: { p: BlogItem; className?: string; lazy?: boolean }) {
  const src = picOf(p);
  return <span className={`bf-pic ${className}`}>{src && <img src={src} alt="" loading={lazy ? "lazy" : undefined} style={p.picFocus ? { objectPosition: p.picFocus } : undefined} />}</span>;
}

/** the type, and the date when the post has one */
function Meta({ p }: { p: BlogItem }) {
  const d = dateOf(p);
  return <span className="bf-meta"><span className="bf-type">{LABEL[p.type]}</span>{d && <time className="bf-date" dateTime={p.date}>{d}</time>}</span>;
}

/** a post's tags under the pills' names (the CMS's "Near AI" shows as "NEAR AI"), each once */
function Tags({ p, on, names }: { p: BlogItem; on: Set<string>; names: Map<string, string> }) {
  const keys = [...new Set(tagsOf(p).map(tagKey))];
  return keys.length ? <span className="bf-ctags">{keys.map((k) => <span key={k} data-on={on.has(k) || undefined}>{names.get(k) ?? k}</span>)}</span> : null;
}

/** a title this long gets the lead's smaller size, so it stays beside the photo in a few lines */
const LONG = 64;

/** `posts`: the CMS's posts, newest first (the hard-coded 24 unless given), listed before the Go deeper samples */
export function BlogF({ posts = CMS_POSTS }: { posts?: BlogItem[] }) {
  const isDupe = dupe(posts);
  const all: BlogItem[] = [...posts, ...POSTS.filter((p) => !isDupe(p))];
  const lead = all[0];
  const carried = new Set(all.flatMap((p) => tagsOf(p).map(tagKey)));
  const tags = tagList(all.map(tagsOf)).filter((t) => carried.has(tagKey(t)));
  const types = TABS.filter((t) => t.key !== "all" && all.some((p) => p.type === t.key));
  const tabs = types.length > 1 ? [TABS[0], ...types] : [];
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
    <div className="bl bf">
      <header className="bf-head">
        <h1 className="bf-h1"><span className="accent">News</span> from NEAR</h1>
        <p className="bf-aside">Announcements, deep dives, press and talks from across the NEAR ecosystem.</p>
      </header>

      {lead && (
        <a className="bf-lead" {...linkOf(lead)}>
          <Pic p={lead} className="bf-lead__pic" />
          <span className="bf-lead__text">
            <span className="bf-lead__top"><span className="bf-kicker">Latest</span><Meta p={lead} /></span>
            <h2 className="bf-lead__title" data-long={lead.title.length > LONG || undefined}>{lead.title}</h2>
            {lead.excerpt && <span className="bf-lead__x">{lead.excerpt}</span>}
            <span className="bf-lead__foot"><span className="bf-src">{lead.source}</span><Tags p={lead} on={on} names={names} /></span>
          </span>
        </a>
      )}

      <div className="bf-filters">
        <div className="bf-types" data-none={tabs.length ? undefined : ""}>
          {tabs.length > 0 && <div className="bf-types__row" role="group" aria-label="Show posts by type" ref={rowRef} style={dotX === null ? undefined : ({ "--dot-x": `${dotX}px` } as React.CSSProperties)}>
            <span className="bf-types__dot" aria-hidden="true" data-ready={dotX === null ? undefined : ""} />
            {tabs.map((t) => (
              <button key={t.key} type="button" className="bf-tb" data-key={t.key} aria-pressed={tab === t.key} onClick={() => pickTab(t.key)}>{t.label}</button>
            ))}
          </div>}
          <p className="bf-n" aria-live="polite">{plural(list.length)}</p>
        </div>
        {tags.length > 0 && <div className="bf-tags" role="group" aria-label="Show posts by tag">
          {tags.map((t) => {
            const k = tagKey(t), sel = on.has(k);
            return (
              <button key={k} type="button" className="bf-pill" aria-pressed={sel} onClick={() => toggle(k)}>
                {t}{sel && <span className="bf-pill__x" aria-hidden="true">×</span>}
              </button>
            );
          })}
          {on.size > 0 && <button type="button" className="bf-clear" onClick={clear}>Clear</button>}
        </div>}
      </div>

      {list.length > 0 ? (
        <ul className="bf-grid">
          {list.slice(0, shown).map((p) => (
            <li key={p.id} className="bf-cell">
              <a className="bf-card" {...linkOf(p)}>
                <Pic p={p} lazy />
                <Meta p={p} />
                <h3 className="bf-card__title">{p.title}</h3>
                <span className="bf-src">{p.source}</span>
                <Tags p={p} on={on} names={names} />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        // nothing in the grid: say so, minding the lead above when it matches what is chosen (it stays on screen, D242)
        <p className="bf-empty">
          {leadMatches
            ? `The post above is the only ${tab === "all" ? "" : `${LABEL[tab]} `}post${on.size ? ` on ${chosen}` : ""} so far.`
            : `No ${tab === "all" ? "" : `${LABEL[tab]} `}posts${on.size ? ` on ${chosen}` : ""} yet.`}
          {on.size > 0 && <>{" "}<button type="button" className="bf-clear" onClick={clear}>Clear tags</button></>}
        </p>
      )}
      {list.length > shown && (
        <div className="bf-more"><button type="button" className="bf-more__b" onClick={() => setShown((n) => n + STEP)}>Show more <span aria-hidden="true">+</span></button></div>
      )}
    </div>
  );
}
