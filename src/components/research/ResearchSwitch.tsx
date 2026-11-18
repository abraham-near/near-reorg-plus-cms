// The switch between the Research page's versions (top left, under the header): plain links. Same pill as the Community and Analytics switches.
import "../v4/revenue/switch.css";

export const RESEARCH_VERSIONS = [
  { k: "a", href: "/research-a", name: "Ruled grid" },
  { k: "b", href: "/research-b", name: "Drawn" },
  { k: "c", href: "/research-c", name: "Editorial" },
] as const;

export function ResearchSwitch({ on }: { on: (typeof RESEARCH_VERSIONS)[number]["k"] }) {
  return (
    <nav className="rv-sw" style={{ top: 96, bottom: "auto" }} aria-label="Research page versions">
      <span className="rv-sw__l">Research</span>
      {RESEARCH_VERSIONS.map((v) => (
        <a key={v.k} className="rv-sw__a" href={v.href} aria-current={v.k === on ? "true" : undefined} title={v.name}>{v.k.toUpperCase()}</a>
      ))}
    </nav>
  );
}
