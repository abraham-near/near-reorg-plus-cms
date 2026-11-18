// The switch between the History page's versions (top left, under the header): plain links. Same pill as the Community and Analytics switches.
import "../v4/revenue/switch.css";

export const HISTORY_VERSIONS = [
  { k: "a", href: "/history-a", name: "Ruled grid" },
  { k: "b", href: "/history-b", name: "Drawn" },
  { k: "c", href: "/history", name: "Editorial" },
] as const;

export function HistorySwitch({ on }: { on: (typeof HISTORY_VERSIONS)[number]["k"] }) {
  return (
    <nav className="rv-sw" style={{ top: 96, bottom: "auto" }} aria-label="History page versions">
      <span className="rv-sw__l">History</span>
      {HISTORY_VERSIONS.map((v) => (
        <a key={v.k} className="rv-sw__a" href={v.href} aria-current={v.k === on ? "true" : undefined} title={v.name}>{v.k.toUpperCase()}</a>
      ))}
    </nav>
  );
}
