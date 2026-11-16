// The Foundation page's small shared pieces (FoundationE.tsx, Operate.tsx): the three activities, the links, the arrow and the hero's words.
import type { ReactNode } from "react";

export const ACTS = [
  { t: "Allocate resources", b: "Ensure financial resources are properly allocated and distributed throughout the ecosystem." },
  { t: "Support ecosystem functions", b: "Support ecosystem-level functions that do not yet have a steward, from communication and coordination to governance infrastructure and education." },
  { t: "Champion decentralization", b: "Support the continuing devolution of functions and operations to the ecosystem itself." },
];
// [[TBD: links]] Join the community / Careers: the doc names the buttons, not their targets
export const COMMUNITY = "https://www.near.org/community", CAREERS = "https://careers.near.foundation", ECOSYSTEM = "https://www.near.org/ecosystem";
export const idx = (i: number) => String(i + 1).padStart(2, "0");

export const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
/** a line of words, each in its own window (the hero's words rise out of them); `accent` names the word set in Kepler */
export function Words({ text, accent }: { text: string; accent?: string }) {
  const out: ReactNode[] = [];
  text.split(" ").forEach((w, i) => {
    if (i) out.push(" ");
    out.push(<span key={i} className="fb-w"><span className={`fb-wi${w === accent ? " accent" : ""}`}>{w}</span></span>);
  });
  return <>{out}</>;
}
