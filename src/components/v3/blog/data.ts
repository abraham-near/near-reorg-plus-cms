// The blog index's posts: v3's Go deeper items (proof-deeper/ProofDeeper.tsx ITEMS), copy and data verbatim, in the same order (newest first).
// No dates, authors or figures of our own: an item without its own url goes to the NEAR blog.
export type Type = "story" | "read" | "watch";
export type Post = { id: string; type: Type; title: string; source: string; url?: string; note?: string };
export type FilterKey = "all" | Type;

export const BLOG = "https://www.near.org/blog";
export const FILTERS: { key: FilterKey; label: string }[] = [{ key: "all", label: "All" }, { key: "story", label: "Stories" }, { key: "read", label: "Read" }, { key: "watch", label: "Watch" }];
export const TYPE_LABEL: Record<Type, string> = { story: "Customer story", read: "Read", watch: "Watch" };
export const SHORT_LABEL: Record<Type, string> = { ...TYPE_LABEL, story: "Story" };
/** what the post's link says */
export const ACTION: Record<Type, string> = { story: "Read the story", read: "Read", watch: "Watch" };

export const POSTS: Post[] = [
  { id: "agent-economy", type: "read", title: "The Agent Economy: Who Owns the Rails AI Runs On", source: "NEAR blog" },
  { id: "abound", type: "story", title: "Abound is bringing agentic payments to cross-border finance with NEAR AI", source: "Abound", url: "https://near.ai/blog/near-ai-and-the-times-of-india-groups-abound-are-bringing-agentic-payments-to-cross-border-finance", note: "NEAR Foundation is an investor in Abound." },
  { id: "nearvana", type: "watch", title: "NEARvana", source: "Illia Polosukhin, Inside NEAR" },
  { id: "ledger", type: "story", title: "Ledger Wallet integrates NEAR Intents to power seamless cross-chain swaps", source: "Ledger", url: "https://www.near.org/blog/cross-chain-swaps-near-intents-ledger-wallet" },
  { id: "private-money-rail", type: "watch", title: "Private Money Rail", source: "Alex Shevchenko, Inside NEAR" },
  { id: "venice", type: "story", title: "Venice is now verifiably private with NEAR AI", source: "Venice" },
  { id: "who-owns-the-rails", type: "watch", title: "Who Owns the Rails AI Runs On", source: "George Zeng, Inside NEAR" },
  { id: "brave", type: "story", title: "A new frontier for Brave AI privacy with NEAR AI", source: "Brave", url: "https://brave.com/blog/browser-ai-tee/" },
  { id: "quantum-readiness", type: "watch", title: "Quantum Readiness", source: "Illia Polosukhin, Inside NEAR" },
  { id: "zodl", type: "story", title: "Privacy-first Zcash wallet Zodl uses NEAR Intents to give users cross-chain access", source: "Zodl" },
  { id: "sovereign-economy", type: "watch", title: "The Sovereign Economy", source: "David Norris, Inside NEAR" },
  { id: "bermuda", type: "story", title: "Government of Bermuda and NEAR AI partner to deploy AI-powered public services", source: "Government of Bermuda", url: "https://near.ai/blog/government-of-bermuda-and-near-ai-partner-to-deploy-ai-powered-public-services" },
];

export const img = (id: string) => `/v3/deeper/${id}.webp`;
export const href = (p: Post) => p.url || BLOG;
export const isExt = (h: string) => /^https?:/.test(h);
export const byType = (f: FilterKey) => POSTS.filter((p) => f === "all" || p.type === f);
export const idx = (i: number) => String(i + 1).padStart(2, "0");
/** n items in rows of k */
export const chunk = <T,>(a: T[], k: number) => Array.from({ length: Math.ceil(a.length / k) }, (_, i) => a.slice(i * k, i * k + k));
