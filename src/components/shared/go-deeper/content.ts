// Go deeper's content (Lawrence's go-deeper/content.ts as r17 v1 lays it out: copy, labels, notes, links and images verbatim).
export type Item = { type: string; src: string; title: string; href: string; external?: boolean; note?: string; img: string };
export type Panel = { key: "all" | "story" | "read" | "watch"; label: string; feat: Item; rows: Item[]; empty?: string };

const I = (f: string) => `/home/go-deeper/${f}`;

const agentEconomy: Item = { type: "Read", src: "NEAR blog", title: "The Agent Economy: Who Owns the Rails AI Runs On", href: "/blog", img: I("home-deeper-agent-economy-v2.webp") };
const ABOUND_HREF = "https://near.ai/blog/near-ai-and-the-times-of-india-groups-abound-are-bringing-agentic-payments-to-cross-border-finance";
const ABOUND_TITLE = "Abound is bringing agentic payments to cross-border finance with NEAR AI";
const ABOUND_NOTE = "NEAR Foundation is an investor in Abound.";
const LEDGER_HREF = "https://www.near.org/blog/cross-chain-swaps-near-intents-ledger-wallet";
const LEDGER_TITLE = "Ledger Wallet integrates NEAR Intents to power seamless cross-chain swaps";
const VENICE_TITLE = "Venice is now verifiably private with NEAR AI";
const BRAVE_HREF = "https://brave.com/blog/browser-ai-tee/";
const BRAVE_TITLE = "A new frontier for Brave AI privacy with NEAR AI";
const ZODL_TITLE = "Privacy-first Zcash wallet Zodl uses NEAR Intents to give users cross-chain access";
const BERMUDA_HREF = "https://near.ai/blog/government-of-bermuda-and-near-ai-partner-to-deploy-ai-powered-public-services";
const BERMUDA_TITLE = "Government of Bermuda and NEAR AI partner to deploy AI-powered public services";

const nearvana: Item = { type: "Watch", src: "Illia Polosukhin, Inside NEAR", title: "NEARvana", href: "/blog", img: I("home-deeper-nearvana-v2.webp") };
const moneyRail: Item = { type: "Watch", src: "Alex Shevchenko, Inside NEAR", title: "Private Money Rail", href: "/blog", img: I("home-deeper-private-money-rail-v2.webp") };
const rails: Item = { type: "Watch", src: "George Zeng, Inside NEAR", title: "Who Owns the Rails AI Runs On", href: "/blog", img: I("home-deeper-who-owns-the-rails-v2.webp") };
const quantum: Item = { type: "Watch", src: "Illia Polosukhin, Inside NEAR", title: "Quantum Readiness", href: "/blog", img: I("home-deeper-quantum-readiness-v2.webp") };
const sovereign: Item = { type: "Watch", src: "David Norris, Inside NEAR", title: "The Sovereign Economy", href: "/blog", img: I("home-deeper-sovereign-economy-v2.webp") };

const abound = (type: string): Item => ({ type, src: "Abound", title: ABOUND_TITLE, href: ABOUND_HREF, external: true, note: ABOUND_NOTE, img: I("home-deeper-abound-v2.webp") });
const ledger = (type: string): Item => ({ type, src: "Ledger", title: LEDGER_TITLE, href: LEDGER_HREF, external: true, img: I("home-deeper-ledger-v2.webp") });
const venice = (type: string): Item => ({ type, src: "Venice", title: VENICE_TITLE, href: "/blog", img: I("home-deeper-venice-v2.webp") });
const brave: Item = { type: "Story", src: "Brave", title: BRAVE_TITLE, href: BRAVE_HREF, external: true, img: I("home-deeper-brave-v2.webp") };
const zodl: Item = { type: "Story", src: "Zodl", title: ZODL_TITLE, href: "/blog", img: I("home-deeper-zodl-v2.webp") };
const bermuda: Item = { type: "Story", src: "Government of Bermuda", title: BERMUDA_TITLE, href: BERMUDA_HREF, external: true, img: I("home-deeper-bermuda-v3.webp") };

export const PANELS: Panel[] = [
  { key: "all", label: "All", feat: agentEconomy, rows: [abound("Customer story"), nearvana, ledger("Story"), moneyRail, venice("Story"), rails, brave, quantum, zodl, sovereign, bermuda] },
  { key: "story", label: "Stories", feat: abound("Customer story"), rows: [ledger("Customer story"), venice("Customer story"), brave, zodl, bermuda] },
  { key: "read", label: "Read", feat: agentEconomy, rows: [], empty: "That’s everything in Read for now." },
  { key: "watch", label: "Watch", feat: nearvana, rows: [moneyRail, rails, quantum, sovereign] },
];
