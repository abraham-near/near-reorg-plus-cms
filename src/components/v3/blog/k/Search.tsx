"use client";
// Blog K's typeahead (f/Search.tsx, made controlled): a combobox over a listbox of suggestions (WAI-ARIA APG, "list autocomplete"). Focus stays in the field;
// the arrows move the active option (aria-activedescendant), Enter opens it (or, with none active, shows every result in place of the sections),
// Escape closes the list, then clears the field (and the results). The last option is always "See all N results". "/" or Cmd / Ctrl + K focuses the field.
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent } from "react";
import { SHORT_LABEL, href, img, isExt } from "../data";
import { Arrow } from "../parts";
import { Hl, match } from "./find";

const MAX = 5;   // suggestions, then "See all"
const none = () => () => {};
/** a Mac shows ⌘ in the hint, others Ctrl (the server renders Ctrl) */
const useMac = () => useSyncExternalStore(none, () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent), () => false);

export function Search({ value: q, onChange: setQ, onSeeAll, onClear }: {
  value: string; onChange: (v: string) => void; onSeeAll: (q: string) => void; onClear: () => void;
}) {
  const uid = useId().replace(/:/g, ""), lb = `bk-lb-${uid}`, inId = `bk-q-${uid}`, hint = `bk-hint-${uid}`;
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [act, setAct] = useState(-1);
  const [focused, setFocused] = useState(false);
  const [said, setSaid] = useState("");
  const mac = useMac();

  const has = q.trim() !== "";
  const res = useMemo(() => (has ? match(q) : []), [q, has]);
  const top = res.slice(0, MAX);
  const n = top.length ? top.length + 1 : 0;   // the suggestions + See all
  const expanded = open && has && n > 0;
  const close = () => { setOpen(false); setAct(-1); };

  // the count, said once typing settles
  useEffect(() => {
    const t = window.setTimeout(() => setSaid(!has || !open ? "" : res.length
      ? `${res.length} ${res.length === 1 ? "post" : "posts"} found. Up and down arrows to review, Enter to see them all.`
      : `No posts match ${q.trim()}.`), 450);
    return () => window.clearTimeout(t);
  }, [q, has, open, res.length]);

  // "/" (outside a field) or Cmd / Ctrl + K: to the field
  useEffect(() => {
    const on = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      const slash = e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey;
      const k = (e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k";
      if (!slash && !k) return;
      e.preventDefault();
      input.current?.focus(); input.current?.select();
    };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  }, []);

  const seeAll = () => { const v = q.trim(); if (!v) return; close(); onSeeAll(v); };
  const choose = (i: number) => { if (i < top.length) window.location.assign(href(top[i])); else seeAll(); };
  const clear = () => { setQ(""); close(); onClear(); };

  const keys = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!expanded) { if (has) { setOpen(true); if (!e.altKey) setAct(0); } }
        else setAct((a) => (a + 1) % n);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (expanded) setAct((a) => (a <= 0 ? n - 1 : a - 1));
        else if (has && n) { setOpen(true); setAct(n - 1); }
        break;
      case "Enter":
        e.preventDefault();
        if (expanded && act >= 0) choose(act); else seeAll();
        break;
      case "Escape":
        if (expanded) { e.preventDefault(); e.stopPropagation(); close(); }
        else if (q) { e.preventDefault(); clear(); }
        break;
      case "Tab":
        close();
        break;
    }
  };
  const submit = (e: FormEvent) => { e.preventDefault(); seeAll(); };
  const optId = (i: number) => `${lb}-${i}`;

  return (
    <form role="search" aria-label="Blog" className={`bk-s${expanded ? " is-open" : ""}`} onSubmit={submit} noValidate>
      <label htmlFor={inId} className="bk-s__label t-label">Search the blog</label>
      <div className="bk-s__field">
        <svg className="bk-s__ic" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="8.5" cy="8.5" r="5.75" /><path d="m13 13 4.5 4.5" /></svg>
        <input ref={input} id={inId} type="text" role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls={lb}
          aria-activedescendant={expanded && act >= 0 ? optId(act) : undefined} aria-describedby={hint} aria-keyshortcuts="/ Control+K Meta+K"
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} enterKeyHint="search"
          placeholder="Stories, talks, teams, speakers" value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setAct(-1); }}
          onKeyDown={keys}
          onFocus={() => { setFocused(true); if (has) setOpen(true); }}
          onBlur={() => { setFocused(false); close(); }} />
        {q
          ? <button type="button" className="bk-s__clear" aria-label="Clear search" onClick={() => { clear(); input.current?.focus(); }}>
              <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" /></svg>
            </button>
          : <span className={`bk-s__keys${focused ? " is-off" : ""}`} aria-hidden="true"><kbd>/</kbd><span className="bk-s__or">or</span><kbd>{mac ? "⌘" : "Ctrl"}</kbd><kbd>K</kbd></span>}
        <i className="bk-s__line" aria-hidden="true" />
      </div>
      <p id={hint} className="sr-only">Suggestions appear as you type. Enter shows every result in place of the sections below.</p>

      <div className="bk-s__pop" hidden={!(open && has)}>
        <ul role="listbox" id={lb} aria-label="Suggested posts" className="bk-s__list">
          {top.map((p, i) => (
            <li key={p.id} role="option" id={optId(i)} aria-selected={act === i} className="bk-o"
              onMouseDown={(e) => e.preventDefault()} onMouseMove={() => act !== i && setAct(i)} onClick={() => choose(i)}>
              <span className="bk-o__th"><img src={img(p.id)} alt="" loading="lazy" decoding="async" /></span>
              <span className="bk-o__txt">
                <span className="bk-o__type">{SHORT_LABEL[p.type]}</span>
                <span className="bk-o__t"><Hl text={p.title} q={q} /></span>
                <span className="bk-o__src"><Hl text={p.source} q={q} />{isExt(href(p)) && <span className="sr-only"> (another site)</span>}</span>
              </span>
              <span className="bk-o__go" aria-hidden="true"><Arrow /></span>
            </li>
          ))}
          {n > 0 && (
            <li role="option" id={optId(top.length)} aria-selected={act === top.length} className="bk-o bk-o--all"
              onMouseDown={(e) => e.preventDefault()} onMouseMove={() => act !== top.length && setAct(top.length)} onClick={() => choose(top.length)}>
              <span>See all {res.length} {res.length === 1 ? "result" : "results"}<span className="sr-only"> for {q.trim()}</span></span>
              <span className="bk-o__go bk-o__down" aria-hidden="true"><Arrow /></span>
            </li>
          )}
        </ul>
        {!n && <p className="bk-s__none">No posts match “{q.trim()}”.</p>}
      </div>
      <div role="status" className="sr-only">{said}</div>
    </form>
  );
}
