// The switch between the blog post layouts (top left), same pill as the Foundation pages: plain links to /post-a, /post-b, /post-c.
import "../../v4/revenue/switch.css";

export const POST_VERSIONS = [
  { k: "a", href: "/post-a", name: "Ruled" },
  { k: "b", href: "/post-b", name: "Cover" },
  { k: "c", href: "/post-c", name: "Notebook" },
] as const;

export function PostSwitch({ on }: { on: (typeof POST_VERSIONS)[number]["k"] }) {
  return (
    <nav className="rv-sw" style={{ top: 22, bottom: "auto" }} aria-label="Blog post layouts">
      <span className="rv-sw__l">Post</span>
      {POST_VERSIONS.map((v) => (
        <a key={v.k} className="rv-sw__a" href={v.href} aria-current={v.k === on ? "true" : undefined} title={v.name}>{v.k.toUpperCase()}</a>
      ))}
    </nav>
  );
}
