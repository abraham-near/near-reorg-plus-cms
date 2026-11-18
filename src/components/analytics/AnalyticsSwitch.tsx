// The switch between the Analytics page's versions (top left): plain links to /analytics-a, /analytics (B, the one in the menu) and C–E. Same pill as the Foundation switch.
import "../v4/revenue/switch.css";

export const ANALYTICS_VERSIONS = [
  { k: "a", href: "/analytics-a", name: "Overview" },
  { k: "b", href: "/analytics", name: "Instrument panel" },
  { k: "c", href: "/analytics-c", name: "Ruled grid" },
  { k: "d", href: "/analytics-d", name: "Drawn" },
  { k: "e", href: "/analytics-e", name: "Editorial" },
] as const;

export function AnalyticsSwitch({ on }: { on: (typeof ANALYTICS_VERSIONS)[number]["k"] }) {
  return (
    <nav className="rv-sw" style={{ top: 96, bottom: "auto" }} aria-label="Analytics page versions">
      <span className="rv-sw__l">Analytics</span>
      {ANALYTICS_VERSIONS.map((v) => (
        <a key={v.k} className="rv-sw__a" href={v.href} aria-current={v.k === on ? "true" : undefined} title={v.name}>{v.k.toUpperCase()}</a>
      ))}
    </nav>
  );
}
