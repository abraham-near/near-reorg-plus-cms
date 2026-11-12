// The switch between the blog post layouts (top left), same pill as the Foundation pages: plain links to /post-a, /post-b, /post-c, or, given a
// post's own address (`base`, e.g. /blog/some-post), to that post in each layout (?layout=…, except the layout it opens in by default: `fallback`).
import "../../v4/revenue/switch.css";

export const POST_VERSIONS = [
  { k: "a", href: "/post-a", name: "Ruled" },
  { k: "b", href: "/post-b", name: "Cover" },
  { k: "c", href: "/post-c", name: "Notebook" },
] as const;
export type PostLayout = (typeof POST_VERSIONS)[number]["k"];

/** fallback: the layout `base` opens in without ?layout= */
export function PostSwitch({ on, base, fallback = "a" }: { on: PostLayout; base?: string; fallback?: PostLayout }) {
  return (
    <nav className="rv-sw" style={{ top: 22, bottom: "auto" }} aria-label="Blog post layouts">
      <span className="rv-sw__l">Post</span>
      {POST_VERSIONS.map((v) => (
        <a key={v.k} className="rv-sw__a" href={base ? (v.k === fallback ? base : `${base}?layout=${v.k}`) : v.href} aria-current={v.k === on ? "true" : undefined} title={v.name}>{v.k.toUpperCase()}</a>
      ))}
    </nav>
  );
}
