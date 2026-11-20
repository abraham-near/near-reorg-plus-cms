// The switch between the Economics page's versions (top left, under the header): plain links. Same pill as the Community and Analytics switches.
import "../v4/revenue/switch.css";

export const ECONOMICS_VERSIONS = [
  { k: "a", href: "/economics-a", name: "Ruled grid" },
  { k: "b", href: "/economics-b", name: "Drawn" },
  { k: "c", href: "/economics-c", name: "Editorial" },
  { k: "x", href: "/economics", name: "MVP" },
] as const;

export function EconomicsSwitch({ on }: { on: (typeof ECONOMICS_VERSIONS)[number]["k"] }) {
  return (
    <nav className="rv-sw" style={{ top: 96, bottom: "auto" }} aria-label="Economics page versions">
      <span className="rv-sw__l">Economics</span>
      {ECONOMICS_VERSIONS.map((v) => (
        <a key={v.k} className="rv-sw__a" href={v.href} aria-current={v.k === on ? "true" : undefined} title={v.name}>{v.k.toUpperCase()}</a>
      ))}
    </nav>
  );
}
