// The switch between the Brand page's versions (top left, under the header): plain links. Same pill as the Community and Analytics switches.
import "../v4/revenue/switch.css";

export const BRAND_VERSIONS = [
  { k: "a", href: "/brand-a", name: "Ruled grid" },
  { k: "b", href: "/brand-b", name: "Drawn" },
  { k: "c", href: "/brand-c", name: "Editorial" },
] as const;

export function BrandSwitch({ on }: { on: (typeof BRAND_VERSIONS)[number]["k"] }) {
  return (
    <nav className="rv-sw" style={{ top: 96, bottom: "auto" }} aria-label="Brand page versions">
      <span className="rv-sw__l">Brand</span>
      {BRAND_VERSIONS.map((v) => (
        <a key={v.k} className="rv-sw__a" href={v.href} aria-current={v.k === on ? "true" : undefined} title={v.name}>{v.k.toUpperCase()}</a>
      ))}
    </nav>
  );
}
