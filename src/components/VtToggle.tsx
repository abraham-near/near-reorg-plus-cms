"use client";
// A floating "Transition A | B" pill (bottom left) to compare the two page transitions (styles/view-transitions.css) while navigating. Temporary: to drop it,
// remove <VtToggle /> from app/(site)/layout.tsx once one version is chosen. The pick is written where the layout's head script reads it (<html data-vt>,
// localStorage "near-vt"), so it holds on every page of this browser; the same as ?vt=a / ?vt=b.
import { useEffect, useState } from "react";
import s from "./VtToggle.module.css";

const KEY = "near-vt";
const OPTS = [
  { v: "a", label: "A", name: "Quiet: the page fades and lifts out, the next rises in" },
  { v: "b", label: "B", name: "Curtain: the next page is drawn up over the last" },
] as const;
type V = (typeof OPTS)[number]["v"];

export function VtToggle() {
  const [on, setOn] = useState<V | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the server can't read the choice (it lives in this browser)
    setOn(document.documentElement.dataset.vt === "b" ? "b" : "a");
  }, []);
  // rendered from the server too (only the pressed state waits for the browser), so the pill is already there when a page transition captures it
  const pick = (v: V) => {
    setOn(v);
    document.documentElement.setAttribute("data-vt", v);
    try { localStorage.setItem(KEY, v); } catch {}
  };
  return (
    <div className={s.pill} role="group" aria-label="Page transition">
      <span className={s.lbl} aria-hidden="true">Transition</span>
      {OPTS.map((o) => (
        <button key={o.v} type="button" className={s.opt} aria-pressed={on === o.v} title={o.name} onClick={() => pick(o.v)}>
          <span className="sr-only">Transition </span>{o.label}
        </button>
      ))}
    </div>
  );
}
