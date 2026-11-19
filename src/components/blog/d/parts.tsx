// Blog D's pieces: the Figma's icons (path data verbatim from node 756:41, stroked in currentColor), the photo, the lead card, the boxed card and the pager.
import type { ReactNode } from "react";
import type { BlogItem } from "../live";
import { href, isExt, picOf, type Type } from "@/components/v3/blog/data";

/** the type labels as the Figma names them (the reads are Essays) */
export const LABEL: Record<Type, string> = { story: "Customer story", read: "Essay", watch: "Watch" };
/** what a post's button says */
export const ACT: Record<Type, string> = { story: "Read", read: "Read", watch: "Play episode" };

export const Chev = () => (
  <svg className="bd-ic" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false"><path d="M3 5L7 9L11 5" strokeWidth="1.2" /></svg>
);
export const Mag = () => (
  <svg className="bd-ic" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">
    <path d="M10.2 6C10.2 8.3196 8.3196 10.2 6 10.2C3.6804 10.2 1.8 8.3196 1.8 6C1.8 3.6804 3.6804 1.8 6 1.8C8.3196 1.8 10.2 3.6804 10.2 6Z" strokeWidth="1.2" />
    <path d="M9.2 9.2L12.5 12.5" strokeWidth="1.2" />
  </svg>
);
export const Cross = () => (
  <svg className="bd-ic" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false"><path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" strokeWidth="1.2" /></svg>
);
const Prev = () => (
  <svg className="bd-ic" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false"><path d="M9 3L5 7L9 11" strokeWidth="1.4" /></svg>
);
const Next = () => (
  <svg className="bd-ic" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false"><path d="M5 3L9 7L5 11" strokeWidth="1.4" /></svg>
);

/** the post's line under its title: the CMS's excerpt when it has one, else its source (no copy of our own) */
const lineOf = (p: BlogItem) => p.excerpt?.trim() || p.source;

/** the link: external ones open in a new tab and say so */
function PostLink({ p, children }: { p: BlogItem; children: ReactNode }) {
  const u = href(p), ext = isExt(u);
  return (
    <a className="bd-stretch" href={u} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}{ext && <span className="sr-only"> (another site, opens in a new tab)</span>}
    </a>
  );
}

/** the photo: the Go deeper images have a 960 px cut for the cards; a CMS photo is used as it is; none leaves the grey plate */
function Photo({ p, cls, sizes, eager }: { p: BlogItem; cls: string; sizes: string; eager?: boolean }) {
  const src = picOf(p);
  const local = p.pic === undefined && src;
  return (
    <span className={`bd-ph ${cls}`}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element -- the Go deeper photos carry their own 960 px cut (srcSet); a CMS photo comes from the bucket as it is
        <img className="bd-img" src={src} alt="" loading={eager ? "eager" : "lazy"} decoding="async"
          {...(local ? { srcSet: `${src.replace(/\.webp$/, "-960.webp")} 960w, ${src} 1600w`, sizes } : {})} />
      )}
    </span>
  );
}

const Tag = ({ t }: { t: Type }) => <p className="bd-tag"><i aria-hidden="true" />{LABEL[t]}</p>;

/** the lead: the first post of the current filter, wide: the photo (its type on it) at the left, the type, title, line and button at the right */
export function Lead({ p }: { p: BlogItem }) {
  return (
    <article className="bd-lead bd-box" data-in="">
      <div className="bd-lead__media">
        <Photo p={p} cls="bd-lead__ph" sizes="(max-width: 820px) 100vw, 640px" eager />
        <span className="bd-chip" aria-hidden="true"><i />{LABEL[p.type]}</span>
      </div>
      <div className="bd-lead__body">
        <Tag t={p.type} />
        <h2 className="bd-lead__t"><PostLink p={p}>{p.title}</PostLink></h2>
        <p className="bd-lead__x">{lineOf(p)}</p>
        {p.note && <p className="bd-note">{p.note}</p>}
        <span className="bd-btn" aria-hidden="true">{ACT[p.type]}</span>
      </div>
    </article>
  );
}

/** a boxed card: the photo, the type, the title (its link covers the card), the line and the button */
export function Card({ p, d }: { p: BlogItem; d: number }) {
  return (
    <article className="bd-card bd-box" data-in="" style={{ ["--d" as string]: `${d}s` }}>
      <Photo p={p} cls="bd-card__ph" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px" />
      <div className="bd-card__body">
        <Tag t={p.type} />
        <h3 className="bd-card__t"><PostLink p={p}>{p.title}</PostLink></h3>
        <p className="bd-card__x">{lineOf(p)}</p>
        {p.note && <p className="bd-note">{p.note}</p>}
        <span className="bd-btn" aria-hidden="true">{ACT[p.type]}</span>
      </div>
    </article>
  );
}

/** the pages to number: all of them up to seven, else the first, the last and the current one's neighbours, with gaps */
function pagesToShow(n: number, cur: number): (number | "gap")[] {
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1);
  const s = new Set([1, n, cur - 1, cur, cur + 1]);
  if (cur <= 4) [2, 3, 4, 5].forEach((k) => s.add(k));
  if (cur >= n - 3) [n - 4, n - 3, n - 2, n - 1].forEach((k) => s.add(k));
  const list = [...s].filter((k) => k >= 1 && k <= n).sort((a, b) => a - b);
  return list.flatMap((k, i) => (i && k - list[i - 1] > 1 ? ["gap" as const, k] : [k]));
}

/** the numbered squares (the current one green), with Previous and Next */
export function Pager({ pages, page, go }: { pages: number; page: number; go: (n: number) => void }) {
  return (
    <nav className="bd-pager" aria-label="Pages">
      <button type="button" className="bd-sq" onClick={() => go(page - 1)} disabled={page === 1} aria-label="Previous page"><Prev /></button>
      <ol className="bd-pgs">
        {pagesToShow(pages, page).map((k, i) => k === "gap"
          ? <li key={`g${i}`} className="bd-gap" aria-hidden="true">...</li>
          : <li key={k}><button type="button" className="bd-sq" aria-current={k === page ? "page" : undefined} onClick={() => go(k)}><span className="sr-only">Page </span>{k}</button></li>)}
      </ol>
      <button type="button" className="bd-sq" onClick={() => go(page + 1)} disabled={page === pages} aria-label="Next page"><Next /></button>
    </nav>
  );
}
