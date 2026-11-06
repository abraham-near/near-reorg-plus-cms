"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { LAYERS, type LayerKey } from "./layers";
import styles from "./Stack.module.css";

// The layer list and the selected layer's detail (D14, D18): a vertical tablist, core first, NEAR Protocol selected
// first. Hovering or focusing a row highlights its layer in the drawing (StackInteractions, via data-key). A choice
// (a row, the keys, or a layer in the drawing) is a "stack:select"; where the section is pinned, StackInteractions
// also scrolls to that layer's step. Scrolling through the pinned section sends "stack:step". Panels share one grid
// cell so switching never moves the page; without JS every panel shows, stacked.
export const SELECT_EVENT = "stack:select";
export const STEP_EVENT = "stack:step";
const noop = () => () => {};
const choose = (k: LayerKey) => window.dispatchEvent(new CustomEvent(SELECT_EVENT, { detail: k }));

export function StackLayers() {
  const [active, setActive] = useState<LayerKey>("protocol");
  // Hidden panels leave the tab order at once, though they take 120 ms to fade (D28), so focus can't land in one.
  // Only after hydration: without JS every panel shows and stays reachable.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  // The drawing shows the selection (Stack.module.css reads data-active-layer on the band); where the section is
  // pinned, the drawing is built up to the selected layer (data-build)
  useEffect(() => {
    const root = tabs.current[0]?.closest("[data-stack]");
    root?.setAttribute("data-active-layer", active);
    if (root?.hasAttribute("data-pinned")) root.setAttribute("data-build", String(LAYERS.findIndex((l) => l.key === active)));
  }, [active]);

  useEffect(() => {
    const on = (e: Event) => { const k = (e as CustomEvent<LayerKey>).detail; if (LAYERS.some((l) => l.key === k)) setActive(k); };
    window.addEventListener(SELECT_EVENT, on);
    window.addEventListener(STEP_EVENT, on);
    return () => { window.removeEventListener(SELECT_EVENT, on); window.removeEventListener(STEP_EVENT, on); };
  }, []);

  const onKey = (e: KeyboardEvent, i: number) => {
    const n = LAYERS.length;
    const to = { ArrowDown: (i + 1) % n, ArrowUp: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    choose(LAYERS[to].key);
    tabs.current[to]?.focus();
  };

  return (
    <>
      <div className={styles.list} role="tablist" aria-orientation="vertical" aria-label="The four layers">
        {LAYERS.map((l, i) => (
          <button
            key={l.key} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab"
            id={`stack-tab-${l.key}`} aria-controls={`stack-panel-${l.key}`} aria-selected={l.key === active} tabIndex={l.key === active ? 0 : -1}
            className={styles.tab} data-key={l.key} onClick={() => choose(l.key)} onKeyDown={(e) => onKey(e, i)}
          >
            <span className={styles.index} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <span className={styles.tabName}>{l.name}</span>
          </button>
        ))}
      </div>

      <div className={styles.panels}>
        {LAYERS.map((l) => (
          <div
            key={l.key} role="tabpanel" id={`stack-panel-${l.key}`} aria-labelledby={`stack-tab-${l.key}`}
            className={styles.panel} data-active={l.key === active || undefined} inert={hydrated && l.key !== active}
          >
            <div className={styles.panelTop}>
              <p className={`t-label ${styles.role}`}>{l.role}</p>
              <a className={styles.url} href={l.url.href}>
                {l.url.label}
                <svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
                <span className="sr-only"> (another NEAR site)</span>
              </a>
            </div>
            <p className={styles.line}>{l.line}</p>
            <ul className={styles.features}>
              {l.features.map((f) => (
                <li key={f.title}>
                  <p className={styles.featTitle}>{f.title}</p>
                  <p className={styles.featDetail}>{f.detail}</p>
                </li>
              ))}
            </ul>
            <ul className={styles.stats} aria-label={`${l.name} in numbers`}>
              {l.stats.map((s) => (
                <li key={s.label}>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
