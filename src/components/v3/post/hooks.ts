"use client";
// The post layouts' reading behaviour: which section is being read (for the contents lists) and how far through the article the reader is.
import { useEffect, useState, type RefObject } from "react";

/** the id of the section whose heading last passed the upper third of the view */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const line = innerHeight * 0.35;
      let cur = ids[0];
      for (const id of ids) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= line) cur = id; }
      setActive(cur);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, [ids]);
  return active;
}

/** writes --read (0…1: how far the article has been read) on `out`, measured over `article` */
export function useReadProgress(article: RefObject<HTMLElement | null>, out: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let raf = 0, last = "";
    const read = () => {
      raf = 0;
      const a = article.current, o = out.current; if (!a || !o) return;
      const r = a.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / Math.max(1, r.height - innerHeight * 0.25)));
      const v = p.toFixed(4); if (v !== last) { last = v; o.style.setProperty("--read", v); }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, [article, out]);
}

/** adds .is-in to every [data-reveal] inside `root` as it enters the view (all at once with reduced motion) */
export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current; if (!el) return;
    const items = [...el.querySelectorAll<HTMLElement>("[data-reveal]")];
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { items.forEach((i) => i.classList.add("is-in")); return; }
    el.setAttribute("data-reveals", "");
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" });
    items.forEach((i) => io.observe(i));
    return () => { io.disconnect(); el.removeAttribute("data-reveals"); };
  }, [root]);
}
