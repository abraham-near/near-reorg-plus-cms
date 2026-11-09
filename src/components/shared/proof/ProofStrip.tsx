"use client";
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { mount } from "./motion";
import "./ProofStrip.css";

const FIGURES: { num: string; unit?: string; cap: string }[] = [
  { num: "$36.8B+", cap: "settled through NEAR Intents, all time" },
  { num: "35+", unit: "chains", cap: "reachable from one account" },
  { num: "1.2", unit: "s", cap: "finality by protocol design, with ~600 ms blocks measured" },
  { num: "1M+", unit: "TPS", cap: "in a public, reproducible benchmark (70 shards, Dec 2025)" },
  { num: "5+", unit: "years", cap: "on mainnet, since 2020" },
];

/** The proof strip: five figures right after the Stack. */
export function ProofStrip() {
  const ref = useRef<HTMLElement>(null);
  useScrollMotion(ref, mount);
  return (
    <section ref={ref} className="pf" id="proof" aria-labelledby="proof-title">
      <div className="pf-inner">
        <h2 id="proof-title" className="sr-only">NEAR in numbers</h2>
        <ul className="pf-figs" role="list">
          {FIGURES.map((f) => (
            <li key={f.num} className="pf-cell">
              <p className="pf-value">
                <span className="pf-num">{f.num}</span>
                {f.unit && <span className="pf-unit">{f.unit}</span>}
              </p>
              <p className="pf-cap">{f.cap}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
