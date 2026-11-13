"use client";
// Blog J's own pieces (copied from E's and loosened: no cells, no boxes): the photo in a rounded frame, the search-term mark, the post as a card
// (grid view), as a row (list view) and as the lead, the vertical type filter (the green dot slides to the chosen type), the small text toggles
// (Sort, View: the chosen one inks up over a hairline) and the newsletter (the homepage close's copy, verbatim, as E has it).
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { ACTION, href, picOf, type FilterKey, type Post, type Type } from "../data";

/** J's categories (the final index): the reads are Blog, the customer stories Press, the talks Watch */
export const KIND: Record<Type, string> = { read: "Blog", story: "Press", watch: "Watch" };
import { Arrow, ExtSr } from "../parts";

/** a photo in its rounded frame (it zooms a little inside it on hover) */
export const Pic = ({ p, cls = "", eager }: { p: Post; cls?: string; eager?: boolean }) => (
  <span className={`bj-ph ${cls}`}>
    {picOf(p) && <img className="bj-img" src={picOf(p)!} alt="" loading={eager ? "eager" : "lazy"} decoding="async" />}
    {p.type === "watch" && <span className="bj-play" aria-hidden="true"><i /></span>}
  </span>
);

/** the title with the search term marked */
export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export function Hl({ text, q }: { text: string; q: string }): ReactNode {
  if (!q) return text;
  const at = fold(text).indexOf(q);
  if (at < 0) return text;
  return <>{text.slice(0, at)}<mark className="bj-hl">{text.slice(at, at + q.length)}</mark>{text.slice(at + q.length)}</>;
}

/** the type: its line glyph (header/icons.ts draws it), a green dot that opens before it on hover, the label */
const Kind = ({ p, pre }: { p: Post; pre?: string }) => (
  <span className="bj-kind t-label"><i className="bl-glyph" data-icon={`deeper-${p.type}`} aria-hidden="true" />{pre}{KIND[p.type]}</span>
);

/** a post in the grid view: the photo, the type, the title (the link: it covers the whole card), the source and an arrow that steps in */
export function Card({ p, q, w, d }: { p: Post; q: string; w: 2 | 3; d: number }) {
  const u = href(p);
  return (
    <article className="bj-card" data-in="" data-ic="" data-w={w} style={{ ["--d" as string]: `${d}s` }}>
      <Pic p={p} cls="bj-card__ph" />
      <Kind p={p} />
      <h3 className="bj-card__t"><a className="bj-stretch" href={u}><Hl text={p.title} q={q} /><ExtSr h={u} /></a></h3>
      <p className="bj-src">{p.source}<span className="bj-go" aria-hidden="true"><Arrow /></span></p>
      {p.note && <p className="bj-note">{p.note}</p>}
    </article>
  );
}

/** a post in the list view: the photo in a third, the type, the title, the source; the arrow steps in at the right */
export function Row({ p, q, d }: { p: Post; q: string; d: number }) {
  const u = href(p);
  return (
    <article className="bj-row" data-in="" data-ic="" style={{ ["--d" as string]: `${d}s` }}>
      <Pic p={p} cls="bj-row__ph" />
      <div className="bj-row__body">
        <Kind p={p} />
        <h3 className="bj-row__t"><a className="bj-stretch" href={u}><Hl text={p.title} q={q} /><ExtSr h={u} /></a></h3>
        <p className="bj-src">{p.source}</p>
        {p.note && <p className="bj-note">{p.note}</p>}
      </div>
      <span className="bj-row__go" aria-hidden="true"><Arrow /></span>
    </article>
  );
}

/** the latest post while browsing (Newest, no search, page 1): a wide photo, the copy beside it, its action as a link */
export function Lead({ p }: { p: Post }) {
  const u = href(p);
  return (
    <article className="bj-lead" data-in="" data-ic="">
      <Pic p={p} cls="bj-lead__ph" eager />
      <div className="bj-lead__body">
        <Kind p={p} pre="Latest · " />
        <h3 className="bj-lead__t"><a className="bj-stretch" href={u}>{p.title}<ExtSr h={u} /></a></h3>
        <p className="bj-src">{p.source}</p>
        <span className="bj-lead__go" aria-hidden="true"><span>{ACTION[p.type]}</span><Arrow /></span>
        {p.note && <p className="bj-note">{p.note}</p>}
      </div>
    </article>
  );
}

/** roving focus over a radio group: arrows (both axes), Home / End */
function rove(e: KeyboardEvent<HTMLElement>, i: number, n: number, pick: (to: number) => void, box: HTMLElement | null) {
  const to = ({ ArrowDown: (i + 1) % n, ArrowRight: (i + 1) % n, ArrowUp: (i - 1 + n) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 } as Record<string, number>)[e.key];
  if (to === undefined) return;
  e.preventDefault(); pick(to);
  box?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[to]?.focus();
}

/** the type filter, vertical: a radio group; the green dot slides to the chosen type; each type carries how many posts match the search */
export function TypeList({ items, value, onChange, counts, labelId, tick }: {
  items: { key: FilterKey; label: string }[]; value: FilterKey; onChange: (k: FilterKey) => void; counts: Record<FilterKey, number>; labelId: string; tick?: unknown;
}) {
  const ref = useRef<HTMLDivElement>(null), dot = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const place = () => {
      const t = ref.current?.querySelector<HTMLElement>('[aria-checked="true"]');
      if (t && dot.current && t.offsetHeight) dot.current.style.translate = `0 ${(t.offsetTop + t.offsetHeight / 2 - 3).toFixed(1)}px`;
    };
    place();
    addEventListener("resize", place); document.fonts?.ready.then(place);
    return () => removeEventListener("resize", place);
  }, [value, tick]);
  return (
    <div ref={ref} className="bj-types" role="radiogroup" aria-labelledby={labelId}>
      {items.map((it, i) => (
        <button key={it.key} type="button" role="radio" className="bj-type" data-zero={counts[it.key] ? undefined : ""} aria-checked={value === it.key} tabIndex={value === it.key ? 0 : -1}
          onClick={() => onChange(it.key)} onKeyDown={(e) => rove(e, i, items.length, (to) => onChange(items[to].key), ref.current)}>
          <span>{it.label}</span>
          <span className="bj-type__n" aria-hidden="true">{counts[it.key]}</span>
          <span className="sr-only">, {counts[it.key]} {counts[it.key] === 1 ? "post" : "posts"}</span>
        </button>
      ))}
      <i ref={dot} className="bj-types__dot" aria-hidden="true" />
    </div>
  );
}

/** a small segmented text toggle (Sort, View): a radio group; the chosen one inks up over a hairline */
export function Seg<K extends string>({ items, value, onChange, labelId }: {
  items: { key: K; label: string; icon?: ReactNode }[]; value: K; onChange: (k: K) => void; labelId: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="bj-seg" role="radiogroup" aria-labelledby={labelId}>
      {items.map((it, i) => (
        <button key={it.key} type="button" role="radio" className="bj-seg__b" aria-checked={value === it.key} tabIndex={value === it.key ? 0 : -1}
          onClick={() => onChange(it.key)} onKeyDown={(e) => rove(e, i, items.length, (to) => onChange(items[to].key), ref.current)}>
          {it.icon}<span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

export const ListIcon = () => (
  <svg className="bj-seg__ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 4h12M2 8h12M2 12h12" /></svg>
);
export const GridIcon = () => (
  <svg className="bj-seg__ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></svg>
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
    <div className="bj-nl__in">
      <p className="bj-nl__lede">Get the latest product launches, protocol milestones, and ecosystem updates straight to your{" "}inbox.</p>
      <form className={`bj-form${error ? " is-invalid" : ""}`} method="post" noValidate onSubmit={onSubmit}>
        <label htmlFor="bl-j-email" className="sr-only">Email address</label>
        <div className={`bj-slot${done ? " is-done" : ""}`}>
          <div className="bj-field bj-field--nl" inert={done}>
            <input ref={inputRef} id="bl-j-email" name="email" type="email" required autoComplete="email" inputMode="email" spellCheck={false} placeholder="you@example.com"
              aria-invalid={error ? true : undefined} aria-describedby="bl-j-email-err bl-j-email-note" onInput={() => { if (error) setError(null); }} />
            <button type="submit" className="bj-sub"><span>Subscribe</span><Arrow /></button>
          </div>
          <div role="status" className="bj-status">
            {done && (
              <p ref={okRef} className="bj-ok" tabIndex={-1}>
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span>Thanks for subscribing.</span><span className="bj-pre">Preview only: nothing was sent.</span>
              </p>
            )}
          </div>
        </div>
        <p id="bl-j-email-err" className="bj-err">
          {error && (<><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5v4.5M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg><span>{error}</span></>)}
        </p>
        <p id="bl-j-email-note" className="bj-fine">By subscribing, you agree to our <a href="https://www.near.org/privacy-policy">Privacy Policy</a>.</p>
      </form>
    </div>
  );
}
