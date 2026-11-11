"use client";
// parts.tsx's Tabs, copied for D: the counts follow the search here, so a tab's width changes while the chosen one stays; the green dot is placed
// again whenever the counts change too (the shared one only follows the value). Same markup and classes (.bl-tabs, blog.css).
import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { FILTERS, type FilterKey } from "../data";

export function Tabs({ value, onChange, id, controls, label = "Filter by type", counts }: {
  value: FilterKey; onChange: (k: FilterKey) => void; id: string; controls: string; label?: string; counts: Record<FilterKey, number>;
}) {
  const ref = useRef<HTMLDivElement>(null), dot = useRef<HTMLElement>(null);
  const sig = FILTERS.map((f) => counts[f.key]).join(",");
  useLayoutEffect(() => {
    const place = () => {
      const t = ref.current?.querySelector<HTMLElement>('[aria-selected="true"]');
      if (t && dot.current) dot.current.style.translate = `${(t.offsetLeft - 14).toFixed(1)}px ${(t.offsetTop + t.offsetHeight / 2 - 3).toFixed(1)}px`;
    };
    place();
    addEventListener("resize", place); document.fonts?.ready.then(place);
    return () => removeEventListener("resize", place);
  }, [value, sig]);
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
          {f.label}<span className="bl-tab__n" aria-hidden="true">{counts[f.key]}</span><span className="sr-only">, {counts[f.key]}</span>
        </button>
      ))}
      <i ref={dot} className="bl-tabs__dot" aria-hidden="true" />
    </div>
  );
}
