"use client";
// The final Protocol page's root: the one client piece. It holds the page (rendered on the server: the drawings' SVG never ships as script) and runs
// its motion (./motion.ts) once the markup is in the DOM.
import { useRef, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { mount } from "./motion";

export function FinalRoot({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  return <div ref={ref} className="l-page pr-b pr-f">{children}</div>;
}
