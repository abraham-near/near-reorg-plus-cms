// Blog D's search: a query is split into words, and a post matches when every word appears in its title, its source or its type's labels
// (accents and case folded). The matched words are marked in the title and the source.
import type { ReactNode } from "react";
import { FILTERS, POSTS, SHORT_LABEL, TYPE_LABEL, type FilterKey, type Post } from "../data";

const DIA = /[̀-ͯ]/g;
export const fold = (s: string) => s.normalize("NFD").replace(DIA, "").replace(/[‘’]/g, "'").toLowerCase();
/** the query's words, without surrounding quotes */
export const terms = (raw: string) => fold(raw).split(/\s+/).map((t) => t.replace(/^["“”'‘’]+|["“”'‘’]+$/g, "")).filter(Boolean);

const hay = (p: Post) => fold(`${p.title} ${p.source} ${TYPE_LABEL[p.type]} ${SHORT_LABEL[p.type]} ${FILTERS.find((f) => f.key === p.type)!.label}`);
export const matches = (p: Post, ts: string[]) => !ts.length || ts.every((t) => hay(p).includes(t));
export const results = (f: FilterKey, ts: string[]) => POSTS.filter((p) => (f === "all" || p.type === f) && matches(p, ts));
export const counts = (ts: string[]) => Object.fromEntries(FILTERS.map((x) => [x.key, results(x.key, ts).length])) as Record<FilterKey, number>;

/** the text with every query word marked (indexes mapped back from the folded text to the original) */
export function Hl({ text, ts }: { text: string; ts: string[] }): ReactNode {
  if (!ts.length) return text;
  let f = ""; const at: number[] = [];
  for (let i = 0; i < text.length; i++) { const c = fold(text[i]); for (let k = 0; k < c.length; k++) at.push(i); f += c; }
  at.push(text.length);
  const rs: [number, number][] = [];
  ts.forEach((t) => { for (let s = f.indexOf(t); s >= 0; s = f.indexOf(t, s + t.length)) rs.push([at[s], at[s + t.length - 1] + 1]); });
  if (!rs.length) return text;
  rs.sort((a, b) => a[0] - b[0]);
  const m: [number, number][] = [];
  rs.forEach((r) => { const l = m[m.length - 1]; if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else m.push([...r]); });
  const out: ReactNode[] = []; let k = 0;
  m.forEach(([a, b], i) => { if (a > k) out.push(text.slice(k, a)); out.push(<mark key={i} className="bl-d__hl">{text.slice(a, b)}</mark>); k = b; });
  if (k < text.length) out.push(text.slice(k));
  return <>{out}</>;
}
