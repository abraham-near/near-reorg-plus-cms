"use client";

import { useEffect, useRef } from "react";

// Flags html[data-hero-in-view] while the hero's claim (with its green "Get started") is on screen, so the header's
// action can step back to an outline: one coloured action per screen (D15). Other pages never set it.
export function HeroInView() {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const claim = anchor.current?.closest('[data-ch="root"]')?.querySelector('[data-beat="claim"] .btn');
    if (!claim) return;
    const html = document.documentElement;
    const io = new IntersectionObserver(([e]) => html.toggleAttribute("data-hero-in-view", e.isIntersecting), { threshold: 0 });
    io.observe(claim);
    return () => { io.disconnect(); html.removeAttribute("data-hero-in-view"); };
  }, []);

  return <span ref={anchor} hidden />;
}
