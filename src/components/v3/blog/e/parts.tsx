"use client";
// Blog E's own pieces (the shared ones live in ../parts.tsx): a still photo (no drift: grid.ts skips [data-still]), the post card with a still photo,
// the vertical type filter (a radio group; the green dot slides down to the chosen one), the small segmented toggles (Sort, View) and the newsletter
// (the homepage close's form and copy, verbatim: proof-deeper/ProofDeeper.tsx).
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { TYPE_LABEL, href, img, type FilterKey, type Post } from "../data";
import { Arrow, ExtSr } from "../parts";

/** a photo in its frame that never drifts (data-still) */
export const Still = ({ src, cls = "", eager }: { src: string; cls?: string; eager?: boolean }) => (
  <div className={`bl-ph ${cls}`} data-ph="" data-still=""><img className="bl-img" src={src} alt="" loading={eager ? "eager" : "lazy"} decoding="async" /></div>
);

/** the title with the search term marked */
export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export function Hl({ text, q }: { text: string; q: string }): ReactNode {
  if (!q) return text;
  const at = fold(text).indexOf(q);
  if (at < 0) return text;
  return <>{text.slice(0, at)}<mark className="bl-e__hl">{text.slice(at, at + q.length)}</mark>{text.slice(at + q.length)}</>;
}

/** the shared card (../parts.tsx Card), its photo still and its title marked */
export function ECard({ p, j = 0, q }: { p: Post; j?: number; q: string }) {
  const u = href(p);
  return (
    <article className="bl-card" style={{ ["--j" as string]: j }}>
      <a className="bl-card__a" href={u}>
        <span className="bl-e__phw">
          <Still src={img(p.id)} cls="bl-card__ph" />
          {p.type === "watch" && <span className="bl-play bl-e__play" aria-hidden="true"><i data-icon="play" /></span>}
        </span>
        <div className="bl-card__body" data-rv="" data-rise="">
          <span className="bl-meta t-label"><i className="bl-glyph" data-icon={`deeper-${p.type}`} aria-hidden="true" />{TYPE_LABEL[p.type]}</span>
          <h3 className="bl-card__t"><Hl text={p.title} q={q} /><ExtSr h={u} /></h3>
          <span className="bl-card__foot"><span className="bl-card__src">{p.source}</span><span className="bl-card__go" aria-hidden="true"><Arrow /></span></span>
        </div>
      </a>
      {p.note && <p className="bl-card__note" data-rv="" data-rise="">{p.note}</p>}
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
      if (t && dot.current) dot.current.style.translate = `0 ${(t.offsetTop + t.offsetHeight / 2 - 3).toFixed(1)}px`;
    };
    place();
    addEventListener("resize", place); document.fonts?.ready.then(place);
    return () => removeEventListener("resize", place);
  }, [value, tick]);
  return (
    <div ref={ref} className="bl-e__types" role="radiogroup" aria-labelledby={labelId}>
      {items.map((it, i) => (
        <button key={it.key} type="button" role="radio" className="bl-e__type" data-zero={counts[it.key] ? undefined : ""} aria-checked={value === it.key} tabIndex={value === it.key ? 0 : -1}
          onClick={() => onChange(it.key)} onKeyDown={(e) => rove(e, i, items.length, (to) => onChange(items[to].key), ref.current)}>
          <span className="bl-e__type-l">{it.label}</span>
          <span className="bl-e__type-n" aria-hidden="true">{counts[it.key]}</span>
          <span className="sr-only">, {counts[it.key]} {counts[it.key] === 1 ? "post" : "posts"}</span>
        </button>
      ))}
      <i ref={dot} className="bl-e__types-dot" aria-hidden="true" />
    </div>
  );
}

/** a two-way segmented toggle (Sort, View): a radio group, the ink thumb slides under the chosen one */
export function Seg<K extends string>({ items, value, onChange, labelId }: {
  items: { key: K; label: string; icon?: ReactNode }[]; value: K; onChange: (k: K) => void; labelId: string;
}) {
  const ref = useRef<HTMLDivElement>(null), at = Math.max(0, items.findIndex((x) => x.key === value));
  return (
    <div ref={ref} className="bl-e__seg" role="radiogroup" aria-labelledby={labelId} style={{ ["--at" as string]: at, ["--n" as string]: items.length }}>
      <i className="bl-e__seg-thumb" aria-hidden="true" />
      {items.map((it, i) => (
        <button key={it.key} type="button" role="radio" className="bl-e__seg-b" aria-checked={value === it.key} tabIndex={value === it.key ? 0 : -1}
          onClick={() => onChange(it.key)} onKeyDown={(e) => rove(e, i, items.length, (to) => onChange(items[to].key), ref.current)}>
          {it.icon}<span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

export const ListIcon = () => (
  <svg className="bl-e__seg-ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 4h12M2 8h12M2 12h12" /></svg>
);
export const GridIcon = () => (
  <svg className="bl-e__seg-ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="2" y="2" width="5" height="5" /><rect x="9" y="2" width="5" height="5" /><rect x="2" y="9" width="5" height="5" /><rect x="9" y="9" width="5" height="5" /></svg>
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
    <div className="bl-e__nl">
      <p className="bl-e__nl-lede">Get the latest product launches, protocol milestones, and ecosystem updates straight to your{" "}inbox.</p>
      <form className={`bl-e__form${error ? " is-invalid" : ""}`} method="post" noValidate onSubmit={onSubmit}>
        <label htmlFor="bl-e-email" className="bl-e__form-l t-label"><i data-icon="mail" aria-hidden="true" />Email address</label>
        <div className={`bl-e__slot${done ? " is-done" : ""}`}>
          <div className="bl-e__field bl-e__field--nl" inert={done}>
            <input ref={inputRef} id="bl-e-email" name="email" type="email" required autoComplete="email" inputMode="email" spellCheck={false} placeholder="you@example.com"
              aria-invalid={error ? true : undefined} aria-describedby="bl-e-email-err bl-e-email-note" onInput={() => { if (error) setError(null); }} />
            <button type="submit" className="bl-e__sub-btn"><span>Subscribe</span><Arrow /></button>
          </div>
          <div role="status" className="bl-e__status">
            {done && (
              <p ref={okRef} className="bl-e__ok" tabIndex={-1}>
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span>Thanks for subscribing.</span><span className="bl-e__pre">Preview only: nothing was sent.</span>
              </p>
            )}
          </div>
        </div>
        <p id="bl-e-email-err" className="bl-e__err">
          {error && (<><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5v4.5M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg><span>{error}</span></>)}
        </p>
        <p id="bl-e-email-note" className="bl-e__note">By subscribing, you agree to our <a href="https://www.near.org/privacy-policy">Privacy Policy</a>.</p>
      </form>
    </div>
  );
}
