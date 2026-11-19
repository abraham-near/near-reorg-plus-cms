// Blog index B's pieces (Figma 980:723): the photo, the type tag, the meta line, the featured post, a numbered row, a boxed card and the pager.
// Every post's link is its title, stretched over the whole post (one link per post); the card's pill ("Read", "Play episode") is part of that link's target.
import type { ReactNode } from "react";
import type { BlogItem } from "@/components/blog/live";
import { href, isExt, picOf, type Type } from "@/components/v3/blog/data";
import prevIcon from "./prev.svg";
import nextIcon from "./next.svg";

/** the index's names for the types (the Figma's chips): the reads are essays */
export const LABEL: Record<Type, string> = { story: "Customer story", read: "Essay", watch: "Watch" };
/** what the card's pill says */
const ACTION: Record<Type, string> = { story: "Read", read: "Read", watch: "Play episode" };

export const num = (i: number) => String(i + 1).padStart(2, "0");

/** the Go deeper photos have a 960 px copy beside them; a CMS photo is used as it is */
const small = (src: string) => (src.startsWith("/v3/deeper/") ? src.replace(/\.webp$/, "-960.webp") : src);

/** a post's photo in its 16:9 frame; `sizes` picks the copy; a post without a photo keeps the grey frame */
function Pic({ p, cls, sizes, eager }: { p: BlogItem; cls: string; sizes: string; eager?: boolean }) {
  const src = picOf(p);
  const deeper = !!src && src.startsWith("/v3/deeper/");
  return (
    <span className={`bb-ph ${cls}`}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element -- the posts' own WebP stills (a 960 px copy by srcset) or a CMS photo, as /blog shows them
        <img className="bb-img" src={deeper ? small(src) : src} srcSet={deeper ? `${small(src)} 960w, ${src} 1600w` : undefined} sizes={deeper ? sizes : undefined}
          alt="" loading={eager ? "eager" : "lazy"} decoding="async" />
      )}
    </span>
  );
}

/** the title as the post's link: external posts open in a new tab and say so */
function Link({ p, children }: { p: BlogItem; children: ReactNode }) {
  const u = href(p), ext = isExt(u);
  return (
    <a className="bb-stretch" href={u} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}{ext && <span className="sr-only"> (another site, opens in a new tab)</span>}
    </a>
  );
}

/** number · TYPE · source */
const Meta = ({ p, n }: { p: BlogItem; n: number }) => (
  <p className="bb-meta"><span className="bb-meta__n">{num(n)}</span><span className="bb-meta__t">{LABEL[p.type]}</span><span className="bb-meta__s">{p.source}</span></p>
);

/** the first post: the large photo with its type chip, then the meta line and the title */
export function Featured({ p, n }: { p: BlogItem; n: number }) {
  return (
    <article className="bb-feat">
      <span className="bb-feat__media">
        <Pic p={p} cls="bb-feat__ph" sizes="(min-width: 960px) 46vw, 100vw" eager />
        <span className="bb-chip" aria-hidden="true"><i />{LABEL[p.type]}</span>
      </span>
      <div className="bb-feat__txt">
        <Meta p={p} n={n} />
        <h3 className="bb-feat__t"><Link p={p}>{p.title}</Link></h3>
        {p.note && <p className="bb-note">{p.note}</p>}
      </div>
    </article>
  );
}

/** one of the three numbered rows beside it: the meta line, the title, a thumbnail at the right */
export function Row({ p, n }: { p: BlogItem; n: number }) {
  return (
    <li className="bb-row">
      <div className="bb-row__txt">
        <Meta p={p} n={n} />
        <h3 className="bb-row__t"><Link p={p}>{p.title}</Link></h3>
      </div>
      <Pic p={p} cls="bb-row__ph" sizes="180px" />
    </li>
  );
}

/** a boxed card: the photo, ■ TYPE, the title, the excerpt (else the source line), the pill */
export function Card({ p }: { p: BlogItem }) {
  return (
    <li className="bb-card">
      <Pic p={p} cls="bb-card__ph" sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw" />
      <div className="bb-card__body">
        <p className="bb-tag"><i aria-hidden="true" />{LABEL[p.type]}</p>
        <h3 className="bb-card__t"><Link p={p}>{p.title}</Link></h3>
        <p className="bb-card__x">{p.excerpt || p.source}</p>
        {p.note && <p className="bb-note">{p.note}</p>}
        <span className="bb-pill" aria-hidden="true">{ACTION[p.type]}</span>
      </div>
    </li>
  );
}

/** the pages to number: all of them up to 7, else the first, the last and a window around the current one, with gaps */
function series(pg: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const lo = Math.max(2, Math.min(pg - 1, pages - 4)), hi = Math.min(pages - 1, Math.max(pg + 1, 5));
  const mid = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  return [1, ...(lo > 2 ? ["gap" as const] : []), ...mid, ...(hi < pages - 1 ? ["gap" as const] : []), pages];
}

/** numbered squares, the current one green; the arrows step back and forth */
export function Pager({ pg, pages, go }: { pg: number; pages: number; go: (n: number) => void }) {
  return (
    <nav className="bb-pager" aria-label="Pages">
      <button type="button" className="bb-pg bb-pg--step" onClick={() => go(pg - 1)} disabled={pg === 1} aria-label="Previous page">
        {/* eslint-disable-next-line @next/next/no-img-element -- the Figma's 14 px SVG icon, as it is */}
        <img src={prevIcon.src} width={14} height={14} alt="" />
      </button>
      <ol className="bb-pgs">
        {series(pg, pages).map((n, i) => (n === "gap"
          ? <li key={`g${i}`} className="bb-gap" aria-hidden="true">...</li>
          : <li key={n}><button type="button" className="bb-pg" aria-current={n === pg ? "page" : undefined} onClick={() => go(n)}><span className="sr-only">Page </span>{n}</button></li>))}
      </ol>
      <button type="button" className="bb-pg bb-pg--step" onClick={() => go(pg + 1)} disabled={pg === pages} aria-label="Next page">
        {/* eslint-disable-next-line @next/next/no-img-element -- the Figma's 14 px SVG icon, as it is */}
        <img src={nextIcon.src} width={14} height={14} alt="" />
      </button>
    </nav>
  );
}
