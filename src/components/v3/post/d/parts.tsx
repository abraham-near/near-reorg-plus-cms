"use client";
// Post D's pieces, in the October 2026 Figma's language (blog frames 980:723 / 756:41, cover art 725:18 / 739:51): the title with its Kepler accent,
// the mono label with its green square, the share pills and the boxed "more posts" card.
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { isExt } from "../../blog/data";
import type { MorePost } from "../article";

/** the title with its accent word (the Figma sets one word of every title in Kepler): a word in *asterisks* is the accent; else the last word, when it
 *  is a plain lowercase word of four letters or more (never a name, an acronym or a figure); else no accent. The words read the same either way. */
export function accented(t: string): ReactNode {
  const marked = t.match(/^(.*?)\*([^*]+)\*(.*)$/);
  if (marked) return <>{marked[1]}<span className="accent">{marked[2]}</span>{marked[3]}</>;
  const last = t.match(/^(.*\s)([a-z][a-z’'-]{3,})([.!?…]*)$/);
  if (last) return <>{last[1]}<span className="accent">{last[2]}</span>{last[3]}</>;
  return t;
}

/** the Figma's label: mono, uppercase, after a small green square */
export const Label = ({ children, cls = "", as: Tag = "p" }: { children: ReactNode; cls?: string; as?: "p" | "span" }) => (
  <Tag className={`pd-label ${cls}`}><i aria-hidden="true" />{children}</Tag>
);

const noop = () => () => {};

/** copy the link, or share it on X / LinkedIn, as the Figma's outlined pills (plain links: no scripts of theirs) */
export function SharePills({ title, cls = "" }: { title: string; cls?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }).catch(() => {});
  };
  const here = useSyncExternalStore(noop, () => location.href, () => "");   // the server has no URL: the share links fill in on the client
  const u = encodeURIComponent(here), t = encodeURIComponent(title);
  return (
    <div className={`pd-share ${cls}`} role="group" aria-label="Share this post">
      <button type="button" className="pd-pill" onClick={copy}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 9.5l3-3M7 4.5l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7L10.7 8.2M9 11.5l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7l1.2-1.2" /></svg>
        <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
      </button>
      <a className="pd-pill" href={`https://x.com/intent/post?text=${t}&url=${u}`} target="_blank" rel="noopener noreferrer">
        <span>X</span><span className="sr-only"> (share on another site)</span>
      </a>
      <a className="pd-pill" href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener noreferrer">
        <span>LinkedIn</span><span className="sr-only"> (share on another site)</span>
      </a>
    </div>
  );
}

/** a boxed card as the Figma's (756:41): the 16:9 photo, the label, the title (its link covers the card), the line and the pill */
export function Card({ p, j }: { p: MorePost; j: number }) {
  const ext = isExt(p.href);
  return (
    <article className="pd-card pd-box" data-reveal="" style={{ ["--d" as string]: `${j * 0.07}s` }}>
      <span className="pd-card__ph">{p.img ? <img src={p.img} alt="" loading="lazy" decoding="async" /> : <span className="pb-noimg" aria-hidden="true" />}</span>
      <div className="pd-card__body">
        <Label>{p.label}</Label>
        <h3 className="pd-card__t">
          <a className="pd-stretch" href={p.href} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {p.title}{ext && <span className="sr-only"> (another site, opens in a new tab)</span>}
          </a>
        </h3>
        {p.source && <p className="pd-card__x">{p.source}</p>}
        {p.note && <p className="pd-card__note">{p.note}</p>}
        <span className="pd-btn" aria-hidden="true">{p.type === "watch" ? "Play episode" : "Read"}</span>
      </div>
    </article>
  );
}
