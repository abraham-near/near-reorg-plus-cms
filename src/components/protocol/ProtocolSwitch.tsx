// The switch between the Protocol page's versions (top left, under the header): plain links. Same pill as the Solutions and Community switches.
import "../v4/revenue/switch.css";

export const PROTOCOL_VERSIONS = [
  { k: "a", href: "/protocol-a", name: "The stack builds" },
  { k: "b", href: "/protocol", name: "The network lives" },
  { k: "c", href: "/protocol-c", name: "Lateral chapter" },
  { k: "d", href: "/protocol-d", name: "The graphic transforms" },
] as const;

export function ProtocolSwitch({ on }: { on: (typeof PROTOCOL_VERSIONS)[number]["k"] }) {
  return (
    <nav className="rv-sw" style={{ top: 96, bottom: "auto" }} aria-label="Protocol page versions">
      <span className="rv-sw__l">Protocol</span>
      {PROTOCOL_VERSIONS.map((v) => (
        <a key={v.k} className="rv-sw__a" href={v.href} aria-current={v.k === on ? "true" : undefined} title={v.name}>{v.k.toUpperCase()}</a>
      ))}
    </nav>
  );
}
