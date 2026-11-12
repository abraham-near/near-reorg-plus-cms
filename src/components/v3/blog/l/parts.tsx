"use client";
// Blog L's own pieces (the shared ones live in ../parts.tsx): an open picture (no frame, no cell: a small radius, the photo still), the type label,
// a post in the archive as a list row or as a card (no border, no background: the picture, the label, the title, the source, an arrow that steps in),
// the vertical type filter (a radio group; the green dot slides to the chosen type, down the rail or along the bar on phones), the small text toggles
// (Sort, View: the chosen one inks up behind a green dot) and the newsletter (the homepage close's copy and behaviour, verbatim).
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { TYPE_LABEL, href, img, type FilterKey, type Post, type Type } from "../data";
import { Arrow, ExtSr } from "../parts";
import { Hl } from "./find";

/** a picture: a small radius, the photo fills it; it zooms a little inside on hover (blog-l.css) */
export const Pic = ({ id, cls = "", eager, play }: { id: string; cls?: string; eager?: boolean; play?: boolean }) => (
  <span className={`bl-l-pic ${cls}`}>
    <img src={img(id)} alt="" loading={eager ? "eager" : "lazy"} decoding="async" />
    {play && <span className="bl-l-play" aria-hidden="true"><i data-icon="play" /></span>}
  </span>
);

/** the type, with its line glyph (header/icons.ts draws it) */
export const Kind = ({ t, children }: { t: Type; children?: ReactNode }) => (
  <span className="bl-l-kind t-label"><i className="bl-glyph" data-icon={`deeper-${t}`} aria-hidden="true" />{children ?? TYPE_LABEL[t]}</span>
);

/** a post in the archive: a row (list) or a card (grid); the title is the link and covers the whole post */
export function Entry({ p, j, q, view }: { p: Post; j: number; q: string; view: "list" | "grid" }) {
  const u = href(p);
  return (
    <li className={`bl-l-e bl-l-e--${view}`} style={{ ["--j" as string]: j }} data-in="" data-ic="">
      <Pic id={p.id} cls="bl-l-e__pic" play={p.type === "watch"} />
      <div className="bl-l-e__body">
        <Kind t={p.type} />
        <h3 className="bl-l-e__t"><a className="bl-l-stretch" href={u}><Hl text={p.title} q={q} /><ExtSr h={u} /></a></h3>
        <p className="bl-l-e__src"><span>{p.source}</span><span className="bl-l-e__go" aria-hidden="true"><Arrow /></span></p>
        {p.note && <p className="bl-l-e__note">{p.note}</p>}
      </div>
    </li>
  );
}

/** roving focus over a radio group: arrows (both axes), Home / End */
function rove(e: KeyboardEvent<HTMLElement>, i: number, n: number, pick: (to: number) => void, box: HTMLElement | null) {
  const to = ({ ArrowDown: (i + 1) % n, ArrowRight: (i + 1) % n, ArrowUp: (i - 1 + n) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 } as Record<string, number>)[e.key];
  if (to === undefined) return;
  e.preventDefault(); pick(to);
  box?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[to]?.focus();
}

/** the type filter: a radio group; the green dot slides to the chosen type (down the rail, or along the bar on phones); each type carries its count */
export function TypeList({ items, value, onChange, counts, labelId }: {
  items: { key: FilterKey; label: string }[]; value: FilterKey; onChange: (k: FilterKey) => void; counts: Record<FilterKey, number>; labelId: string;
}) {
  const ref = useRef<HTMLDivElement>(null), dot = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const place = () => {
      const t = ref.current?.querySelector<HTMLElement>('[aria-checked="true"]');
      if (t && dot.current) dot.current.style.translate = `${(t.offsetLeft + 2).toFixed(1)}px ${(t.offsetTop + t.offsetHeight / 2 - 3).toFixed(1)}px`;
    };
    place();
    addEventListener("resize", place); document.fonts?.ready.then(place);
    return () => removeEventListener("resize", place);
  }, [value]);
  return (
    <div ref={ref} className="bl-l-types" role="radiogroup" aria-labelledby={labelId}>
      {items.map((it, i) => (
        <button key={it.key} type="button" role="radio" className="bl-l-type" data-zero={counts[it.key] ? undefined : ""} aria-checked={value === it.key} tabIndex={value === it.key ? 0 : -1}
          onClick={() => onChange(it.key)} onKeyDown={(e) => rove(e, i, items.length, (to) => onChange(items[to].key), ref.current)}>
          <span className="bl-l-type__l">{it.label}</span>
          <span className="bl-l-type__n" aria-hidden="true">{counts[it.key]}</span>
          <span className="sr-only">, {counts[it.key]} {counts[it.key] === 1 ? "post" : "posts"}</span>
        </button>
      ))}
      <i ref={dot} className="bl-l-types__dot" aria-hidden="true" />
    </div>
  );
}

/** a small text toggle (Sort, View): a radio group; the chosen one inks up behind a green dot */
export function Choice<K extends string>({ items, value, onChange, labelId }: {
  items: { key: K; label: string; icon?: ReactNode }[]; value: K; onChange: (k: K) => void; labelId: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="bl-l-ch" role="radiogroup" aria-labelledby={labelId}>
      {items.map((it, i) => (
        <button key={it.key} type="button" role="radio" className="bl-l-ch__b" aria-checked={value === it.key} tabIndex={value === it.key ? 0 : -1}
          onClick={() => onChange(it.key)} onKeyDown={(e) => rove(e, i, items.length, (to) => onChange(items[to].key), ref.current)}>
          {it.icon}<span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

export const ListIcon = () => (
  <svg className="bl-l-ch__ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 4h12M2 8h12M2 12h12" /></svg>
);
export const GridIcon = () => (
  <svg className="bl-l-ch__ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></svg>
);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** the homepage close's newsletter (copy verbatim): required, a simple pattern, an inline error, success in place. No provider is wired: nothing is sent. */
export function Newsletter() {
  const inputRef = useRef<HTMLInputElement>(null), okRef = useRef<HTMLParagraphElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => { if (done) okRef.current?.focus({ preventScroll: true }); }, [done]);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = (inputRef.current?.value ?? "").trim();
    const problem = !v ? "Enter your email address." : !EMAIL.test(v) ? "Enter an email address like name@example.com." : null;
    setError(problem);
    if (problem) { inputRef.current?.focus(); return; }
    // [[TBD: newsletter provider]]: send `v` here. Nothing is sent.
    setDone(true);
  };
  return (
    <form className={`bl-l-form${error ? " is-invalid" : ""}`} method="post" noValidate onSubmit={onSubmit}>
      <label htmlFor="bl-l-email" className="bl-l-form__l t-label">Email address</label>
      <div className={`bl-l-form__slot${done ? " is-done" : ""}`}>
        <div className="bl-l-field" inert={done}>
          <input ref={inputRef} id="bl-l-email" name="email" type="email" required autoComplete="email" inputMode="email" spellCheck={false} placeholder="you@example.com"
            aria-invalid={error ? true : undefined} aria-describedby="bl-l-email-err bl-l-email-note" onInput={() => { if (error) setError(null); }} />
          <button type="submit" className="bl-l-field__btn"><span>Subscribe</span><Arrow /></button>
          <i className="bl-l-field__line" aria-hidden="true" />
        </div>
        <div role="status" className="bl-l-form__status">
          {done && (
            <p ref={okRef} className="bl-l-form__ok" tabIndex={-1}>
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span>Thanks for subscribing.</span><span className="bl-l-form__pre">Preview only: nothing was sent.</span>
            </p>
          )}
        </div>
      </div>
      <p id="bl-l-email-err" className="bl-l-form__err">{error && <span>{error}</span>}</p>
      <p id="bl-l-email-note" className="bl-l-form__note">By subscribing, you agree to our <a href="https://www.near.org/privacy-policy">Privacy Policy</a>.</p>
    </form>
  );
}
