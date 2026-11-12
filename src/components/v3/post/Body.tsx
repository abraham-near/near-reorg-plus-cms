"use client";
// The post's body, the same markup in all three layouts (pb-* classes); each layout styles it in its own CSS. Notes either sit beside / under their
// paragraph (notes="aside") or become numbered footnotes (notes="foot", with <Footnotes /> at the end). Plus the small shared pieces: byline, tags, share,
// and the card the layouts' "more posts" use. A CMS body is sanitized HTML already given pb-* classes on the server (lib/blog/html.ts); post.css styles
// the rest of its tags under .pb-body--html. It has no notes.
import { Fragment, useState, useSyncExternalStore, type ReactNode } from "react";
import { isExt } from "../blog/data";
import { Arrow, Photo } from "../blog/parts";
import type { Article, Block, Img, MorePost } from "./article";

/** **bold** and *italic* inside a string */
export function inline(t: string): ReactNode[] {
  return t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map((s, i) =>
    s.startsWith("**") ? <strong key={i}>{s.slice(2, -2)}</strong> : s.startsWith("*") ? <em key={i}>{s.slice(1, -1)}</em> : <Fragment key={i}>{s}</Fragment>,
  );
}

/** the notes of a typed body (an HTML body has none) */
export const notesOf = (a: Article) => ("blocks" in a.body ? a.body.blocks.flatMap((b) => (b.k === "p" && b.note ? [b.note] : [])) : []);

export function Figure({ img, cls = "", eager, size }: { img: Img; cls?: string; eager?: boolean; size?: string }) {
  return (
    <figure className={`pb-fig ${cls}`} data-size={size} data-reveal="">
      <div className="pb-fig__ph"><img className="pb-fig__img" src={img.src} alt={img.alt} loading={eager ? "eager" : "lazy"} decoding="async" /></div>
      {img.cap && <figcaption className="pb-cap">{img.cap}</figcaption>}
    </figure>
  );
}

/** notes: "aside" = a note box under its paragraph; "margin" = the note first, for a layout that floats it beside the paragraph; "foot" = numbered footnotes */
export function Body({ article, notes = "aside" }: { article: Article; notes?: "aside" | "margin" | "foot" }) {
  if ("html" in article.body) return <div className="pb-body pb-body--html" dangerouslySetInnerHTML={{ __html: article.body.html }} />;
  let h = 0, fn = 0;
  const one = (b: Block, i: number): ReactNode => {
    switch (b.k) {
      case "p": {
        if (!b.note) return <p key={i} className="pb-p">{inline(b.t)}</p>;
        if (notes === "foot") {
          const n = ++fn;
          return <p key={i} className="pb-p">{inline(b.t)}<sup className="pb-fn"><a id={`fnref-${n}`} href={`#fn-${n}`} aria-label={`Note ${n}`}>{n}</a></sup></p>;
        }
        const aside = <aside className="pb-note"><span className="pb-note__l">Note</span>{inline(b.note)}</aside>;
        return notes === "margin"
          ? <Fragment key={i}>{aside}<p className="pb-p">{inline(b.t)}</p></Fragment>
          : <Fragment key={i}><p className="pb-p">{inline(b.t)}</p>{aside}</Fragment>;
      }
      case "h2": {
        const n = String(++h).padStart(2, "0");
        return <h2 key={i} id={b.id} className="pb-h2" data-reveal=""><span className="pb-h2__n" aria-hidden="true">{n}</span><span className="pb-h2__t">{b.t}</span></h2>;
      }
      case "h3": return <h3 key={i} className="pb-h3">{b.t}</h3>;
      case "quote":
        return (
          <figure key={i} className="pb-quote" data-reveal="">
            <blockquote><p>{inline(b.t)}</p></blockquote>
            {b.by && <figcaption className="pb-quote__by">{b.by}</figcaption>}
          </figure>
        );
      case "fig": return <Figure key={i} img={b.img} size={b.size || "col"} />;
      case "pair":
        return (
          <figure key={i} className="pb-pair" data-reveal="">
            <div className="pb-pair__row">
              {b.imgs.map((m) => <div key={m.src} className="pb-fig__ph"><img className="pb-fig__img" src={m.src} alt={m.alt} loading="lazy" decoding="async" /></div>)}
            </div>
            {b.cap && <figcaption className="pb-cap">{b.cap}</figcaption>}
          </figure>
        );
      case "list": {
        const L = b.ordered ? "ol" : "ul";
        return <L key={i} className={`pb-list${b.ordered ? " pb-list--ol" : ""}`}>{b.items.map((t, j) => <li key={j}>{inline(t)}</li>)}</L>;
      }
      case "callout":
        return <aside key={i} className="pb-callout" data-reveal=""><p className="pb-callout__t">{b.title}</p><p className="pb-callout__b">{inline(b.t)}</p></aside>;
      case "stats":
        return (
          <div key={i} className="pb-stats" data-reveal="">
            <ul className="pb-stats__list">{b.items.map((s) => <li key={s.l} className="pb-stat"><strong className="pb-stat__n">{s.n}</strong><span className="pb-stat__l">{s.l}</span></li>)}</ul>
            <p className="pb-stats__note">{b.note}</p>
          </div>
        );
      case "code":
        return <pre key={i} className="pb-code" data-lang={b.lang}><code>{b.t}</code></pre>;
    }
  };
  return <div className="pb-body">{article.body.blocks.map(one)}</div>;
}

export function Footnotes({ article }: { article: Article }) {
  const NOTES = notesOf(article);
  if (!NOTES.length) return null;
  return (
    <section className="pb-fns" aria-label="Notes">
      <p className="pb-fns__h">Notes</p>
      <ol>{NOTES.map((t, i) => <li key={i} id={`fn-${i + 1}`}>{inline(t)} <a href={`#fnref-${i + 1}`} aria-label="Back to the text">↩</a></li>)}</ol>
    </section>
  );
}

export const Avatar = ({ article, cls = "" }: { article: Article; cls?: string }) => <span className={`pb-av ${cls}`} aria-hidden="true">{article.author.initials}</span>;

export function Tags({ article, cls = "" }: { article: Article; cls?: string }) {
  if (!article.tags.length) return null;
  return <ul className={`pb-tags ${cls}`} aria-label="Tags">{article.tags.map((t) => <li key={t.name}>{t.href ? <a className="pb-tag" href={t.href}>{t.name}</a> : <span className="pb-tag pb-tag--plain">{t.name}</span>}</li>)}</ul>;
}

const noop = () => () => {};

/** copy the link, or share it on X / LinkedIn (plain links: no scripts of theirs) */
export function Share({ title, cls = "", label = true }: { title: string; cls?: string; label?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }).catch(() => {});
  };
  const here = useSyncExternalStore(noop, () => location.href, () => "");   // the server has no URL: the share links fill in on the client
  const u = encodeURIComponent(here), t = encodeURIComponent(title);
  return (
    <div className={`pb-share ${cls}`}>
      {label && <span className="pb-share__l">Share</span>}
      <button type="button" className="pb-share__b" onClick={copy} aria-label="Copy link">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 9.5l3-3M7 4.5l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7L10.7 8.2M9 11.5l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7l1.2-1.2" /></svg>
        <span className="pb-share__tip" aria-live="polite">{copied ? "Copied" : ""}</span>
      </button>
      <a className="pb-share__b" href={`https://x.com/intent/post?text=${t}&url=${u}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X (another site)">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13" /></svg>
      </a>
      <a className="pb-share__b" href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn (another site)">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6.5V12M4 4v.01M7.5 12V6.5M7.5 9a2.2 2.2 0 0 1 4.5 0V12" /></svg>
      </a>
    </div>
  );
}

/** a post card for the layouts' "more posts", in the blog index's card markup (blog/parts.tsx Card), fed by a MorePost: its own photo and label */
export function MoreCard({ p, j = 0 }: { p: MorePost; j?: number }) {
  return (
    <article className="bl-card" style={{ ["--j" as string]: j }}>
      <a className="bl-card__a" href={p.href}>
        {p.img ? <Photo src={p.img} cls="bl-card__ph" /> : <div className="bl-ph bl-card__ph pb-noimg" aria-hidden="true" />}
        {p.type === "watch" && <span className="bl-play" aria-hidden="true"><i data-icon="play" /></span>}
        <div className="bl-card__body" data-rv="" data-rise="">
          <span className="bl-meta t-label">{p.type && <i className="bl-glyph" data-icon={`deeper-${p.type}`} aria-hidden="true" />}{p.label}</span>
          <h3 className="bl-card__t">{p.title}{isExt(p.href) && <span className="sr-only"> (another site)</span>}</h3>
          <span className="bl-card__foot"><span className="bl-card__src">{p.source}</span><span className="bl-card__go" aria-hidden="true"><Arrow /></span></span>
        </div>
      </a>
      {p.note && <p className="bl-card__note" data-rv="" data-rise="">{p.note}</p>}
    </article>
  );
}

/** a hero for a post without a photo: a plain panel in the photo's place */
export const NoImg = ({ cls = "" }: { cls?: string }) => <div className={`pb-noimg ${cls}`} aria-hidden="true" />;
