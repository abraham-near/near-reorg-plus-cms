"use client";
/* eslint-disable @next/next/no-img-element */
// Blog index E, "Tabs over a grid" (Lawrence's choice, D221; built from the local study D216, after Windsurf's and Assembly's blogs on Mobbin).
// The heading with a short line at its right over a hairline; one lead post (photo left, text right); then the types as a row of text tabs with
// their counts over a grid of cards, three to a row, nine at a time with Show more. A tab filters the grid; the lead post stays.
// Posts: the CMS's live ones first (components/blog/live.ts), each with its own photo, date and excerpt when it has them; then data.ts's Go deeper
// items, in black and white (/images/blog/<id>.webp, as on the homepage). Labels are /blog's (J's KIND): Blog, Press, Watch.
import { useState } from "react";
import type { BlogItem } from "@/components/blog/live";
import { POSTS, href, isExt, type FilterKey, type Type } from "@/components/v3/blog/data";
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

function Pic({ p, className = "", lazy }: { p: BlogItem; className?: string; lazy?: boolean }) {
  const src = picOf(p);
  return <span className={`be-pic ${className}`}>{src && <img src={src} alt="" loading={lazy ? "lazy" : undefined} />}</span>;
}

function Meta({ p }: { p: BlogItem }) {
  const d = dateOf(p);
  return <span className="be-src">{p.source}{d && <> · <time dateTime={p.date}>{d}</time></>}</span>;
}

/** `live`: the CMS's published posts, listed before data.ts's */
export function BlogE({ live = NONE }: { live?: BlogItem[] }) {
  const all: BlogItem[] = [...live, ...POSTS];
  const [tab, setTab] = useState<FilterKey>("all");
  const [shown, setShown] = useState(STEP);
  const lead = all[0];
  const list = all.filter((p) => (tab === "all" ? p !== lead : p.type === tab));
  const count = (k: FilterKey) => all.filter((p) => k === "all" || p.type === k).length;

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
            <span className="be-chip">{LABEL[lead.type]}</span>
            <span className="be-lead__title">{lead.title}</span>
            {lead.excerpt && <span className="be-lead__x">{lead.excerpt}</span>}
            <Meta p={lead} />
          </span>
        </a>
      )}

      <div className="be-bar">
        <div className="be-tabs" role="group" aria-label="Show posts by type">
          {TABS.map((t) => (
            <button key={t.key} type="button" className="be-tab" aria-pressed={tab === t.key} onClick={() => { setTab(t.key); setShown(STEP); }}>
              {t.label}<sup>{count(t.key)}</sup>
            </button>
          ))}
        </div>
        <p className="be-n" aria-live="polite">{plural(list.length)}</p>
      </div>

      <ul className="be-grid">
        {list.slice(0, shown).map((p) => (
          <li key={p.id}>
            <a className="be-card" {...linkOf(p)}>
              <Pic p={p} lazy />
              <span className="be-chip">{LABEL[p.type]}</span>
              <span className="be-card__title">{p.title}</span>
              <Meta p={p} />
            </a>
          </li>
        ))}
      </ul>
      {list.length > shown && (
        <div className="be-more"><button type="button" className="be-more__b" onClick={() => setShown((n) => n + STEP)}>Show more <span aria-hidden="true">+</span></button></div>
      )}
    </div>
  );
}
