"use client";
// Blog C's small pieces: the photo in its frame (it drifts a little inside it: data-ph, v3/blog/grid.ts), the type label, the post link (the title; it
// covers its cell), the featured post, a side row, a card, and the numbered pager. Copy comes from the posts only: their title, type, source, excerpt and note.
import type { ReactNode } from "react";
import { href, isExt, type Type } from "@/components/v3/blog/data";
import type { BlogItem } from "@/components/blog/live";

/** the types as this index names them (the Figma's chips): the reads are essays */
export const KIND: Record<Type, string> = { story: "Customer story", read: "Essay", watch: "Watch" };
/** what a post's pill says */
export const ACT: Record<Type, string> = { story: "Read", read: "Read", watch: "Play episode" };

/** a list position as two digits */
export const num = (i: number) => String(i + 1).padStart(2, "0");
/** accents off, lower case: what the search compares */
export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** the photo: a CMS post's own, else the Go deeper image (a 960 px cut for the small frames); a post without one keeps a quiet frame with its type's glyph */
function Pic({ p, big, cls }: { p: BlogItem; big?: boolean; cls: string }) {
  const own = p.pic, deeper = own === undefined;
  const src = deeper ? (big ? `/v3/deeper/${p.id}.webp` : `/v3/deeper/${p.id}-960.webp`) : own;
  return (
    <div className={`bl-ph bc-ph ${cls}`} data-ph="">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- grid.ts drifts the plain <img> inside its frame; the deeper images have their own 960 px cuts
        <img className="bl-img" src={src} alt="" loading={big ? "eager" : "lazy"} decoding="async"
          {...(deeper && big ? { srcSet: `/v3/deeper/${p.id}-960.webp 960w, /v3/deeper/${p.id}.webp 1600w`, sizes: "(max-width: 859px) 100vw, 46vw" } : {})} />
      ) : <span className="bc-ph__none" aria-hidden="true"><i className="bl-glyph" data-icon={`deeper-${p.type}`} /></span>}
    </div>
  );
}

/** the post's link: its title, stretched over the cell; another site opens in a new tab and says so */
function Go({ p, children }: { p: BlogItem; children: ReactNode }) {
  const u = href(p), ext = isExt(u);
  return (
    <a className="bc-link" href={u} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}{ext && <span className="sr-only"> (opens another site in a new tab)</span>}
    </a>
  );
}

/** number · TYPE · source, in mono (the source in the text face) */
const Meta = ({ p, i }: { p: BlogItem; i: number }) => (
  <p className="bc-meta" data-rv="">
    <span className="bc-meta__n">{num(i)}</span>
    <span className="bc-meta__t">{KIND[p.type]}</span>
    <span className="bc-meta__s">{p.source}</span>
  </p>
);

/** the first post: the large photo, its meta and the big title */
export function Featured({ p, i }: { p: BlogItem; i: number }) {
  return (
    <article className="bc-feat bc-hit">
      <Pic p={p} big cls="bc-feat__ph" />
      <div className="bc-feat__txt">
        <Meta p={p} i={i} />
        <h3 className="bc-feat__t" data-rv=""><Go p={p}>{p.title}</Go></h3>
        {p.note && <p className="bc-note" data-rv="">{p.note}</p>}
      </div>
    </article>
  );
}

/** the next three, as numbered rows beside it: meta and title, the thumbnail at the right */
export function Side({ p, i }: { p: BlogItem; i: number }) {
  return (
    <li className="bc-side bc-hit">
      <div className="bc-side__txt">
        <Meta p={p} i={i} />
        <h3 className="bc-side__t" data-rv=""><Go p={p}>{p.title}</Go></h3>
      </div>
      <Pic p={p} cls="bc-side__ph" />
    </li>
  );
}

/** a card, open in its cell: the photo, the ■ type and its number, the title, the excerpt (else the source), the pill */
export function Card({ p, i, j }: { p: BlogItem; i: number; j: number }) {
  return (
    <article className="bl-cell bc-card bc-hit" style={{ ["--j" as string]: j }}>
      <Pic p={p} cls="bc-card__ph" />
      <div className="bc-card__body" data-rv="" data-rise="">
        <p className="bc-card__k"><span className="bc-sq" aria-hidden="true" />{KIND[p.type]}<span className="bc-card__n" aria-hidden="true">{num(i)}</span></p>
        <h3 className="bc-card__t"><Go p={p}>{p.title}</Go></h3>
        <p className="bc-card__x">{p.excerpt || p.source}</p>
        {p.note && <p className="bc-note">{p.note}</p>}
        <span className="bc-pill" aria-hidden="true">{ACT[p.type]}</span>
      </div>
    </article>
  );
}

/** the pages to show: all of them up to seven, else the first, the last and the ones around the current, with gaps */
export function pageList(n: number, at: number): (number | "gap")[] {
  if (n <= 7) return Array.from({ length: n }, (_, k) => k + 1);
  const lo = Math.max(2, Math.min(at - 1, n - 4)), hi = Math.min(n - 1, Math.max(at + 1, 5));
  const out: (number | "gap")[] = [1];
  if (lo > 2) out.push("gap");
  for (let k = lo; k <= hi; k++) out.push(k);
  if (hi < n - 1) out.push("gap");
  out.push(n);
  return out;
}

const Chev = ({ back }: { back?: boolean }) => (
  <svg className="bc-chev" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d={back ? "M8.5 3 4.5 7l4 4" : "M5.5 3l4 4-4 4"} /></svg>
);

/** the numbered pages: previous, the numbers (the current one green), next */
export function Pager({ pages, at, go }: { pages: number; at: number; go: (n: number) => void }) {
  return (
    <nav className="bc-pager" aria-label="Pages">
      <button type="button" className="bc-pg bc-pg--step" onClick={() => go(at - 1)} disabled={at === 1} aria-label="Previous page"><Chev back /></button>
      <ol className="bc-pgs">
        {pageList(pages, at).map((n, k) => n === "gap"
          ? <li key={`g${k}`} className="bc-gap" aria-hidden="true">…</li>
          : <li key={n}><button type="button" className="bc-pg" aria-current={n === at ? "page" : undefined} onClick={() => go(n)}><span className="sr-only">Page </span>{n}</button></li>)}
      </ol>
      <button type="button" className="bc-pg bc-pg--step" onClick={() => go(at + 1)} disabled={at === pages} aria-label="Next page"><Chev /></button>
    </nav>
  );
}
