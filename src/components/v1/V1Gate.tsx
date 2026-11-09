"use client";
// v1's shared sections (the proof strip … the footer) mount their motion only once the world, the rail and the Stack are up (ctx.ts whenReady):
// their pins move every start / end below them.
import type { ReactNode } from "react";
import { MotionGate } from "@/lib/motion/scroll";
import { whenReady } from "./ctx";

export function V1Gate({ children }: { children: ReactNode }) {
  return <MotionGate value={whenReady}>{children}</MotionGate>;
}
