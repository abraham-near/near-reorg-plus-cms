// The switch between the Analytics page's versions (top left): plain links to /analytics, /analytics-b, /analytics-c. Same pill as the Foundation switch.
import "../v4/revenue/switch.css";

export const ANALYTICS_VERSIONS = [
  { k: "a", href: "/analytics", name: "Overview" },
  { k: "b", href: "/analytics-b", name: "Instrument panel" },
  { k: "c", href: "/analytics-c", name: "Living network" },
] as const;

export function AnalyticsSwitch({ on }: { on: (typeof ANALYTICS_VERSIONS)[number]["k"] }) {
  return (
    <nav className="rv-sw" style={{ top: 22, bottom: "auto" }} aria-label="Analytics page versions">
      <span className="rv-sw__l">Analytics</span>
      {ANALYTICS_VERSIONS.map((v) => (
        <a key={v.k} className="rv-sw__a" href={v.href} aria-current={v.k === on ? "true" : undefined} title={v.name}>{v.k.toUpperCase()}</a>
      ))}
    </nav>
  );
}
