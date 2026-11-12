"use client";
// The small pieces shared by the three loose indexes (G · Feature stream, H · Chapters, I · Atlas): they leave v3's ruled grid behind but keep its
// type, paper and one green. The type label (its line glyph + the type), the rail's tag (a dark block, a green dot, mono caps: foundation-d's chip),
// the counts per filter, the closing block, and one arrival helper ([data-in] blocks rise once as they come in; reduced motion: simply there).
import type { ReactNode } from "react";
import { BLOG, POSTS, TYPE_LABEL, type FilterKey, type Type } from "./data";
import { Arrow } from "./parts";
import "./loose.css";

export const COUNTS: Record<FilterKey, number> = {
  all: POSTS.length,
  story: POSTS.filter((p) => p.type === "story").length,
  read: POSTS.filter((p) => p.type === "read").length,
  watch: POSTS.filter((p) => p.type === "watch").length,
};

/** the type, with its line glyph (header/icons.ts draws it) */
export const Kind = ({ t, children }: { t: Type; children?: ReactNode }) => (
  <span className="bl-kind t-label"><i className="bl-glyph" data-icon={`deeper-${t}`} aria-hidden="true" />{children ?? TYPE_LABEL[t]}</span>
);

/** the rail's tag: a dark block, a green dot, mono caps */
export const Tag = ({ children, cls = "" }: { children: ReactNode; cls?: string }) => (
  <span className={`bl-tag ${cls}`}><i aria-hidden="true" />{children}</span>
);

/** the close: one line and the way to the full blog */
export function End({ id }: { id: string }) {
  return (
    <section className="bl-end" aria-labelledby={id} data-in="">
      <h2 id={id} className="bl-h2">Everything else is on the NEAR <span className="accent">blog.</span></h2>
      <a className="bl-btn bl-btn--ink" href={BLOG}><span>Visit the blog</span><Arrow /><span className="sr-only"> (another site)</span></a>
    </section>
  );
}

/** [data-in] blocks rise once as they come in (a block already above the view is simply there); returns its clean-up */
export function arrivals(root: HTMLElement, reduced: boolean, sel = "[data-in]") {
  const els = [...root.querySelectorAll<HTMLElement>(sel)];
  if (reduced) { els.forEach((el) => el.classList.add("is-in")); return () => {}; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); e.target.classList.add("is-in"); } }), { rootMargin: "0px 0px -8% 0px" });
  els.forEach((el) => { if (el.getBoundingClientRect().bottom < 0) el.classList.add("is-in"); else io.observe(el); });
  return () => io.disconnect();
}
