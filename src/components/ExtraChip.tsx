"use client";
// A floating "← Extra pages" chip (bottom right) on the extra pages, back to /extra. Temporary: to drop it, remove <ExtraChip /> where it is used
// (components/v3/blog/BlogShell.tsx). Its × hides it for the rest of the visit (sessionStorage).
import { useEffect, useState } from "react";
import s from "./ExtraChip.module.css";

const KEY = "extra-chip-hidden";

export function ExtraChip() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let hidden = false;
    try { hidden = sessionStorage.getItem(KEY) === "1"; } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the server can't read sessionStorage
    if (!hidden) setOn(true);
  }, []);
  if (!on) return null;
  const hide = () => { setOn(false); try { sessionStorage.setItem(KEY, "1"); } catch {} };
  return (
    <div className={s.chip}>
      <a className={s.link} href="/extra"><span aria-hidden="true">←</span> Extra pages</a>
      <button className={s.x} type="button" onClick={hide} aria-label="Hide the Extra pages link">
        <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M2 2l6 6M8 2 2 8" /></svg>
      </button>
    </div>
  );
}
