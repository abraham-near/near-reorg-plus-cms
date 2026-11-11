"use client";
// The blog's small shared pieces, b10's grammar (as in proof-deeper/ProofDeeper.tsx): the drawn arrows, a framed photo, the "another site" note,
// and the filter tablist with its sliding green dot (click, arrows, Home / End; roving tabindex).
import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { FILTERS, TYPE_LABEL, href, img, isExt, type FilterKey, type Post } from "./data";

// the fonts have no → (drawn, as in their GoArrow.tsx)
export const Arrow = () => (
  <svg className="bl-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
export const Ext = () => (
  <svg className="bl-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>
);
export const ExtSr = ({ h }: { h: string }) => (isExt(h) ? <span className="sr-only"> (another site)</span> : null);

/** a photo in its frame: the image is taller than the frame, so it can drift inside it (data-ph: grid.ts) */
export const Photo = ({ src, cls = "", eager }: { src: string; cls?: string; eager?: boolean }) => (
  <div className={`bl-ph ${cls}`} data-ph=""><img className="bl-img" src={src} alt="" loading={eager ? "eager" : "lazy"} decoding="async" /></div>
);

/** a post card: its photo (a play mark on a talk), the type, the title, the source and an arrow that steps in on hover; a disclosure note stays under it */
export function Card({ p, j = 0, h = "h3", cls = "" }: { p: Post; j?: number; h?: "h2" | "h3"; cls?: string }) {
  const H = h, u = href(p);
  return (
    <article className={`bl-card ${cls}`} style={{ ["--j" as string]: j }}>
      <a className="bl-card__a" href={u}>
        <Photo src={img(p.id)} cls="bl-card__ph" />
        {p.type === "watch" && <span className="bl-play" aria-hidden="true"><i data-icon="play" /></span>}
        <div className="bl-card__body" data-rv="" data-rise="">
          <span className="bl-meta t-label"><i className="bl-glyph" data-icon={`deeper-${p.type}`} aria-hidden="true" />{TYPE_LABEL[p.type]}</span>
          <H className="bl-card__t">{p.title}<ExtSr h={u} /></H>
          <span className="bl-card__foot"><span className="bl-card__src">{p.source}</span><span className="bl-card__go" aria-hidden="true"><Arrow /></span></span>
        </div>
      </a>
      {p.note && <p className="bl-card__note" data-rv="" data-rise="">{p.note}</p>}
    </article>
  );
}

/** the filters: a tablist over one results region (`controls`); the green dot slides to the chosen tab */
export function Tabs({ value, onChange, id, controls, label = "Filter by type", counts }: {
  value: FilterKey; onChange: (k: FilterKey) => void; id: string; controls: string; label?: string; counts?: Record<FilterKey, number>;
}) {
  const ref = useRef<HTMLDivElement>(null), dot = useRef<HTMLElement>(null);
  // the dot sits 14 px before the chosen label (b10's .l-tabs); placed again on resize and once the fonts are in
  useLayoutEffect(() => {
    const place = () => {
      const t = ref.current?.querySelector<HTMLElement>('[aria-selected="true"]');
      if (t && dot.current) dot.current.style.translate = `${(t.offsetLeft - 14).toFixed(1)}px ${(t.offsetTop + t.offsetHeight / 2 - 3).toFixed(1)}px`;
    };
    place();
    addEventListener("resize", place); document.fonts?.ready.then(place);
    return () => removeEventListener("resize", place);
  }, [value]);
  const keys = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = FILTERS.length, to = ({ ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 } as Record<string, number>)[e.key];
    if (to === undefined) return;
    e.preventDefault(); onChange(FILTERS[to].key);
    ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[to]?.focus();
  };
  return (
    <div ref={ref} className="bl-tabs" role="tablist" aria-label={label}>
      {FILTERS.map((f, i) => (
        <button key={f.key} className="bl-tab" type="button" role="tab" id={`${id}-${f.key}`} aria-controls={controls}
          aria-selected={value === f.key} tabIndex={value === f.key ? 0 : -1} onClick={() => onChange(f.key)} onKeyDown={(e) => keys(e, i)}>
          {f.label}{counts && <span className="bl-tab__n" aria-hidden="true">{counts[f.key]}</span>}
        </button>
      ))}
      <i ref={dot} className="bl-tabs__dot" aria-hidden="true" />
    </div>
  );
}
