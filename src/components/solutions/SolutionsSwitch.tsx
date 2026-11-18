// The switch between the Solutions page's versions (top left, under the header): plain links. Same pill as the Community and Analytics switches.
import "../v4/revenue/switch.css";

export const SOLUTIONS_VERSIONS = [
  { k: "a", href: "/solutions-a", name: "Ruled grid" },
  { k: "b", href: "/solutions-b", name: "Drawn" },
  { k: "c", href: "/solutions-c", name: "Editorial" },
] as const;

export function SolutionsSwitch({ on }: { on: (typeof SOLUTIONS_VERSIONS)[number]["k"] }) {
  return (
    <nav className="rv-sw" style={{ top: 96, bottom: "auto" }} aria-label="Solutions page versions">
      <span className="rv-sw__l">Solutions</span>
      {SOLUTIONS_VERSIONS.map((v) => (
        <a key={v.k} className="rv-sw__a" href={v.href} aria-current={v.k === on ? "true" : undefined} title={v.name}>{v.k.toUpperCase()}</a>
      ))}
    </nav>
  );
}
