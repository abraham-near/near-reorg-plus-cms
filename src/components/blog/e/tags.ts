// The blog index's tags (D243, D244).
// The four product tags always lead the pills, in this order, named as PRODUCT §2 names them. Other tags follow: the topics below, then any other
// tag the CMS's posts carry, A to Z.
// data.ts's Go deeper items have no tags of their own; these are read off each one's title or source only (D216): the product it names, "private"
// in the title, the agent economy / "the rails AI runs on" in the title, the Inside NEAR talk series in the source. A CMS post carries the CMS's tags.
export const TOP_TAGS = ["NEAR AI", "NEAR Intents", "near.com", "NEAR Protocol"] as const;
const TOPICS = ["Privacy", "Agent economy", "Inside NEAR"];

export const DEEPER_TAGS: Record<string, string[]> = {
  "agent-economy": ["Agent economy"],
  abound: ["NEAR AI"],
  nearvana: ["Inside NEAR"],
  ledger: ["NEAR Intents"],
  "private-money-rail": ["Inside NEAR", "Privacy"],
  venice: ["NEAR AI", "Privacy"],
  "who-owns-the-rails": ["Inside NEAR", "Agent economy"],
  brave: ["NEAR AI", "Privacy"],
  "quantum-readiness": ["Inside NEAR"],
  zodl: ["NEAR Intents", "Privacy"],
  "sovereign-economy": ["Inside NEAR"],
  bermuda: ["NEAR AI"],
};

/** a tag's key: its name, case and spacing aside, so the CMS's "Near AI" is the pill "NEAR AI" */
export const tagKey = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ");

/** the pills: the four product tags, the topics, then every other tag the posts carry (A to Z); each once, under its first-listed name */
export function tagList(postTags: string[][]): string[] {
  const out = new Map<string, string>();
  for (const t of [...TOP_TAGS, ...TOPICS]) out.set(tagKey(t), t);
  const rest = [...new Set(postTags.flat().map((t) => t.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  for (const t of rest) if (!out.has(tagKey(t))) out.set(tagKey(t), t);
  return [...out.values()];
}
