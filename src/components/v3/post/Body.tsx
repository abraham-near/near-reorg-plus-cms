"use client";
// The post's body, the same markup in all three layouts (pb-* classes); each layout styles it in its own CSS. Notes either sit beside / under their
// paragraph (notes="aside") or become numbered footnotes (notes="foot", with <Footnotes /> at the end). Plus the small shared pieces: byline, tags, share.
import { Fragment, useState, useSyncExternalStore, type ReactNode } from "react";
import { ARTICLE, type Block, type Img } from "./article";

/** **bold** and *italic* inside a string */
export function inline(t: string): ReactNode[] {
  return t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map((s, i) =>
    s.startsWith("**") ? <strong key={i}>{s.slice(2, -2)}</strong> : s.startsWith("*") ? <em key={i}>{s.slice(1, -1)}</em> : <Fragment key={i}>{s}</Fragment>,
  );
}

export const NOTES = ARTICLE.blocks.flatMap((b) => (b.k === "p" && b.note ? [b.note] : []));

export function Figure({ img, cls = "", eager, size }: { img: Img; cls?: string; eager?: boolean; size?: string }) {
  return (
    <figure className={`pb-fig ${cls}`} data-size={size} data-reveal="">
      <div className="pb-fig__ph"><img className="pb-fig__img" src={img.src} alt={img.alt} loading={eager ? "eager" : "lazy"} decoding="async" /></div>
      {img.cap && <figcaption className="pb-cap">{img.cap}</figcaption>}
    </figure>
  );
}

/** notes: "aside" = a note box under its paragraph; "margin" = the note first, for a layout that floats it beside the paragraph; "foot" = numbered footnotes */
export function Body({ notes = "aside" }: { notes?: "aside" | "margin" | "foot" }) {
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
  return <div className="pb-body">{ARTICLE.blocks.map(one)}</div>;
}

export function Footnotes() {
  return (
    <section className="pb-fns" aria-label="Notes">
      <p className="pb-fns__h">Notes</p>
      <ol>{NOTES.map((t, i) => <li key={i} id={`fn-${i + 1}`}>{inline(t)} <a href={`#fnref-${i + 1}`} aria-label="Back to the text">↩</a></li>)}</ol>
    </section>
  );
}

export const Avatar = ({ cls = "" }: { cls?: string }) => <span className={`pb-av ${cls}`} aria-hidden="true">{ARTICLE.author.initials}</span>;

export function Tags({ cls = "" }: { cls?: string }) {
  return <ul className={`pb-tags ${cls}`} aria-label="Tags">{ARTICLE.tags.map((t) => <li key={t}><a className="pb-tag" href="#">{t}</a></li>)}</ul>;
}

const noop = () => () => {};

/** copy the link, or share it on X / LinkedIn (plain links: no scripts of theirs) */
export function Share({ cls = "", label = true }: { cls?: string; label?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }).catch(() => {});
  };
  const here = useSyncExternalStore(noop, () => location.href, () => "");   // the server has no URL: the share links fill in on the client
  const u = encodeURIComponent(here), t = encodeURIComponent(ARTICLE.title);
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
