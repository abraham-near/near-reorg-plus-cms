// The switch between the blog index's versions (top left, under the header): plain links. Same pill as the Solutions and Community switches.
// F is the live blog (/blog: E's "Tabs over a grid" with the CMS's 20 newest posts hard-coded, D254); E (/blog-index-e, reading the CMS, D221),
// A (direction J) and B–D are versions listed at /extra.
import "../v4/revenue/switch.css";

export const BLOG_VERSIONS = [
  { k: "a", href: "/blog-index-a", name: "Reading rail" },
  { k: "b", href: "/blog-index-b", name: "Figma: featured + cards" },
  { k: "c", href: "/blog-index-c", name: "Figma on the homepage grid" },
  { k: "d", href: "/blog-index-d", name: "Figma: lead card + type menu" },
  { k: "e", href: "/blog-index-e", name: "Tabs over a grid, read from the CMS" },
  { k: "f", href: "/blog", name: "Tabs over a grid, 24 posts hard-coded (current)" },
] as const;

export function BlogSwitch({ on }: { on: (typeof BLOG_VERSIONS)[number]["k"] }) {
  return (
    <nav className="rv-sw" style={{ top: 96, bottom: "auto" }} aria-label="Blog index versions">
      <span className="rv-sw__l">Blog</span>
      {BLOG_VERSIONS.map((v) => (
        <a key={v.k} className="rv-sw__a" href={v.href} aria-current={v.k === on ? "true" : undefined} title={v.name}>{v.k.toUpperCase()}</a>
      ))}
    </nav>
  );
}
