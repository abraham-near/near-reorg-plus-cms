"use client";
// The ruled grid's motion (grid.ts: rows draw, crosshairs, photos drift) around server-rendered rows.
import type { ReactNode } from "react";
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { mountGrid } from "../grid";

export function GridMotion({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, (root, ctx) => { const g = mountGrid(root, ctx); return () => g.dispose(); });
  return <div ref={ref} className={className}>{children}</div>;
}
