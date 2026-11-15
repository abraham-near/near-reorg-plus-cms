// near.org/analytics: the copy, links and figures shared by the three versions (A /analytics, B /analytics-b, C /analytics-c), from the doc
// "NEAR Analytics — Page Layout & Copy" (near.org-analytics-airnauts, October 2026), verbatim. A lean overview page, not a dashboard: it orients,
// shows a few live numbers and routes people out to the deep tools. Page order: Hero → Core stats → Revenue card + Network status card (side by side)
// → 3rd-party analytics tools → Public products (SVRN, ETPs & Trusts) → the legal line.
// [[TBD: live data]] No feed is wired yet: every figure below is SAMPLE data, shaped like the real thing, except the Intents volume (site copy).
// Each version shows a small "Sample figures" note until the feeds exist. Inspiration named by the doc: hyperscreener.asxn.xyz, revenue.near.org, status.near.org.

export const HERO = {
  h1: "NEAR by the numbers",
  sub: "A live view of NEAR: network activity, revenue, and the tools and products built on top of it. Everything worth watching, in one place.",
  status: "All systems operational",   // links to the status card below (#status)
};

export type Delta = { d24: number; d30: number };   // percent; ▲ positive, ▼ negative
export type Stat = { key: string; label: string; value: string; delta: Delta; source?: string; sample: boolean };
// "Keep top 3 stats, if it feels crowded": the first three are the core; Shards and Price are optional
export const STATS: Stat[] = [
  { key: "fees", label: "Total Fees Generated", value: "$11.6M", delta: { d24: 0.8, d30: 6.2 }, sample: true },
  { key: "tvl", label: "Intents Confidential TVL", value: "$412M", delta: { d24: 1.4, d30: -3.1 }, sample: true },
  { key: "volume", label: "Intents all-time volume", value: "$38B+", delta: { d24: 0.3, d30: 4.9 }, sample: false },
  { key: "shards", label: "Shards online", value: "9", delta: { d24: 0, d30: 12.5 }, source: "https://dune.com/queries/4176199/7029698", sample: true },
  { key: "price", label: "NEAR Price", value: "$2.84", delta: { d24: -1.9, d30: 7.4 }, sample: true },
];
/** "24h ▲ x% / 30d ▼ x%" */
export const deltaText = (v: number) => `${v > 0 ? "▲" : v < 0 ? "▼" : "•"} ${Math.abs(v).toFixed(1)}%`;

export const REVENUE = {
  eyebrow: "Revenue Dashboard",
  h: "NEAR is earning revenue, in real time.",
  body: "Track fees, token burn, emissions, and more.",
  // the preview: one hero number and a small sparkline (the right side of revenue.near.org's hero)
  metric: { label: "Share of total fees captured as protocol revenue", value: "62%", sample: true },
  spark: [41, 44, 43, 47, 46, 50, 49, 53, 52, 55, 54, 58, 57, 60, 59, 62],   // SAMPLE, a 16-week trend
  cta: "Open revenue dashboard",
  href: "https://revenue.near.org/",
};

export type Health = "ok" | "issue";
export const STATUS = {
  eyebrow: "Network Health",
  h: { ok: "No problems detected", issue: "Investigating an issue" } as Record<Health, string>,
  health: "ok" as Health,   // [[TBD: live]] from status.near.org
  // the essentials, with 60-day uptime (SAMPLE); `days`: 60 daily states for a bar strip (1 up, 0.5 degraded, 0 down)
  services: [
    { name: "NEAR Network (mainnet)", uptime: 99.99 },
    { name: "NEAR RPC (mainnet) - near.org", uptime: 99.95 },
    { name: "NEAR Network (testnet)", uptime: 99.87 },
    { name: "NEAR Blocks (mainnet)", uptime: 99.98 },
  ],
  updated: "14:20 UTC",   // "Last updated HH:MM UTC"
  cta: "Full status & history",
  href: "https://status.near.org/",
};
/** 60 daily states for a service's uptime strip (SAMPLE, deterministic): mostly up, a few degraded days where its uptime is lower */
export function days(uptime: number, seed = 1): number[] {
  let s = seed * 9301 + 49297;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const bad = Math.round((100 - uptime) * 30);
  const out = Array.from({ length: 60 }, () => 1);
  for (let i = 0; i < bad; i++) out[Math.floor(r() * 60)] = r() < 0.25 ? 0 : 0.5;
  return out;
}

export const TOOLS_HEAD = { h: "Go deeper", sub: "NEAR lives across the best analytics and research platforms. Learn more below." };
// Allium is left out for now (the doc: coverage pending)
export const TOOLS = [
  { name: "The Tie", line: "Institutional data, analytics, and research for digital assets", href: "https://terminal.thetie.io/networks/near" },
  { name: "Blockworks", line: "Research-grade network dashboards", href: "https://blockworks.com/analytics/near" },
  { name: "Artemis", line: "Industry Investment Metrics", href: "https://www.artemis.ai/company/NEAR" },
  { name: "Dune", line: "Community-built onchain dashboards", href: "https://dune.com/blockchains/near" },
  { name: "DefiLlama", line: "Open-source data aggregator", href: "https://investors.defillama.com/near" },
  { name: "Token Terminal", line: "Blockchain data", href: "https://tokenterminal.com/explorer/projects/near-protocol" },
  { name: "PikeSpeak", line: "3rd party NEAR data & analytics platform", href: "https://pikespeak.ai/" },
  { name: "Yahoo Finance", line: "Stock quotes and live market data", href: "https://finance.yahoo.com/quote/NEAR-USD/" },
];
// [[TBD: logos]] no logo files yet: versions draw the name as a wordmark/monogram, never another company's logo artwork

export const PRODUCTS_HEAD = {
  h: "Get exposure to NEAR",
  sub: "Regulated products and vehicles offering NEAR exposure.",
  disclaimer: "Listing is informational only and not an endorsement or investment advice. Availability varies by jurisdiction.",
};
export const SVRN = {
  h: "SVRN",
  sub: "Ensuring the power of technology remains under your control will require the right infrastructure and the right individuals.",
  cta: "Learn more",
  href: "https://svrn.net/",
};
export const ETPS_HEAD = "Active NEAR ETPs & Trusts.";
export const ETPS = [
  { issuer: "Bitwise", product: "NEAR Staking ETP", href: "https://bitwiseinvestments.eu/products/bitwise-near-staking-etp/" },
  { issuer: "Grayscale", product: "NEAR Trust (GSNR)", href: "https://www.grayscale.com/funds/grayscale-near-trust" },
  { issuer: "21Shares", product: "NEAR Staking ETP", href: "https://www.21shares.com/en-eu/product/near" },
  { issuer: "Virtune", product: "Staked NEAR ETP", href: "https://www.virtune.com/en/product/near" },
  { issuer: "Valour", product: "NEAR SEK", href: "https://www.valour.com/en/products/valour-near" },
];
export const LEGAL = "For informational purposes only, not investment advice.";
export const SAMPLE_NOTE = "Sample figures: live data is not connected yet.";
