// The switch between the Foundation page's versions (top left, clear of the pages' own bottom rows): plain links to /foundation, /foundation-b … d. Same pill as home v4's revenue switch.
import "../v4/revenue/switch.css";

export const FOUNDATION_VERSIONS = [
  { k: "a", href: "/foundation", name: "Ruled grid" },
  { k: "b", href: "/foundation-b", name: "Devolve" },
  { k: "c", href: "/foundation-c", name: "The Stiftung" },
  { k: "d", href: "/foundation-d", name: "People around the world" },
] as const;

export function FoundationSwitch({ on }: { on: (typeof FOUNDATION_VERSIONS)[number]["k"] }) {
  return (
    <nav className="rv-sw" style={{ top: 22, bottom: "auto" }} aria-label="Foundation page versions">
      <span className="rv-sw__l">Foundation</span>
      {FOUNDATION_VERSIONS.map((v) => (
        <a key={v.k} className="rv-sw__a" href={v.href} aria-current={v.k === on ? "true" : undefined} title={v.name}>{v.k.toUpperCase()}</a>
      ))}
    </nav>
  );
}
