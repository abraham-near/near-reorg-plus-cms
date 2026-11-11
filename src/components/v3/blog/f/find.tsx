// Blog F's search: plain matching over the 12 posts (title, source and the format's names), every word must match; and the highlight of those words.
import { FILTERS, POSTS, SHORT_LABEL, TYPE_LABEL, type Post, type Type } from "../data";

/** the words a format answers to, besides its titles and sources (UI names only: "talk" is this page's name for a Watch) */
const ALIAS: Record<Type, string> = { story: "stories customer", read: "reads", watch: "talk talks video inside near" };
const HAY = new Map<string, string>(POSTS.map((p) => [p.id, [p.title, p.source, TYPE_LABEL[p.type], SHORT_LABEL[p.type], FILTERS.find((f) => f.key === p.type)?.label, ALIAS[p.type]].join(" ").toLowerCase()]));

export const terms = (q: string) => q.toLowerCase().trim().split(/\s+/).filter(Boolean);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** a word matches at the start of a word ("ai" finds "NEAR AI", not "Rails") */
const starts = (w: string) => new RegExp(`(?<![\\p{L}\\p{N}])${esc(w)}`, "iu");
/** the posts that match every word of q, in the blog's order (all of them for an empty q) */
export const match = (q: string): Post[] => {
  const t = terms(q).map(starts);
  return t.length ? POSTS.filter((p) => t.every((re) => re.test(HAY.get(p.id)!))) : POSTS;
};
/** text with q's words marked */
export function Hl({ text, q }: { text: string; q: string }) {
  const t = terms(q);
  if (!t.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(?<![\\p{L}\\p{N}])(${t.sort((a, b) => b.length - a.length).map(esc).join("|")})`, "giu"));
  return <>{parts.map((s, i) => (i % 2 ? <mark key={i} className="bl-f-mark">{s}</mark> : s))}</>;
}
