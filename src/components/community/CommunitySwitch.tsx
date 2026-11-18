// The switch between the Community page's versions (top left, under the header): plain links. Same pill as the Analytics and Foundation switches.
import "../v4/revenue/switch.css";

export const COMMUNITY_VERSIONS = [
  { k: "a", href: "/community-a", name: "Ruled grid" },
  { k: "b", href: "/community", name: "Drawn" },
  { k: "c", href: "/community-c", name: "Editorial" },
] as const;

export function CommunitySwitch({ on }: { on: (typeof COMMUNITY_VERSIONS)[number]["k"] }) {
  return (
    <nav className="rv-sw" style={{ top: 96, bottom: "auto" }} aria-label="Community page versions">
      <span className="rv-sw__l">Community</span>
      {COMMUNITY_VERSIONS.map((v) => (
        <a key={v.k} className="rv-sw__a" href={v.href} aria-current={v.k === on ? "true" : undefined} title={v.name}>{v.k.toUpperCase()}</a>
      ))}
    </nav>
  );
}
