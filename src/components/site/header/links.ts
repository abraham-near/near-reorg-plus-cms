// The header's menu: Lawrence's copy and links, verbatim (r17 v1). One source for the desktop panels and the phone map.
export type Item = { name: string; desc: string; href: string };
export type Section = { name?: string; items: Item[] };
export type Group = { id: string; name: string; kind: "cards" | "cols"; secs: Section[] };

/** links that leave for another NEAR site carry the ↗ mark and a screen-reader note */
export const isExt = (href: string) => /^https?:\/\//.test(href);

export const GROUPS: Group[] = [
  {
    id: "products", name: "Products", kind: "cards",
    secs: [{ items: [
      { name: "near.com", desc: "One account, 35+ chains, confidential by default", href: "https://near.com" },
      { name: "Intents", desc: "The universal liquidity layer for onchain markets", href: "https://intents.near.org" },
      { name: "NEAR AI", desc: "Confidential, verifiable inference and agents", href: "https://near.ai" },
    ] }],
  },
  {
    id: "stack", name: "Stack", kind: "cards",
    secs: [{ items: [
      { name: "Protocol", desc: "The settlement layer for the agent economy", href: "/protocol" },
      { name: "Chain Abstraction", desc: "How NEAR connects any chain", href: "/chain-abstraction" },
      { name: "Quantum Security", desc: "Post-quantum keys, live on mainnet", href: "/quantum-security" },
    ] }],
  },
  {
    id: "resources", name: "Resources", kind: "cols",
    secs: [
      { name: "Build", items: [
        { name: "Docs", desc: "Build on NEAR", href: "https://docs.near.org/" },
        { name: "Solutions", desc: "Explore use cases", href: "/solutions" },
      ] },
      { name: "Learn", items: [
        { name: "Research", desc: "White paper and protocol work", href: "/research" },
        { name: "Blog", desc: "News and deep dives", href: "/blog" },
        { name: "Analytics", desc: "Live onchain metrics", href: "/analytics" },
      ] },
      { name: "Connect", items: [
        { name: "Brand", desc: "Logos and guidelines", href: "/brand" },
        { name: "Contact", desc: "Connect with the team", href: "/contact-us" },
        { name: "Careers", desc: "Build the agent economy", href: "https://job-boards.eu.greenhouse.io/nearfoundation" },
      ] },
    ],
  },
  {
    id: "about", name: "About", kind: "cols",
    secs: [
      { name: "Fundamentals", items: [
        { name: "History", desc: "From 2017 to now", href: "/about" },
        { name: "Roadmap", desc: "What ships next", href: "https://roadmap.near.org/" },
        { name: "Economics", desc: "Revenue, buybacks, supply", href: "/economics" },
      ] },
      { name: "Ecosystem", items: [
        { name: "NEAR Foundation", desc: "Supporting a decentralized ecosystem", href: "/near-foundation" },
        { name: "Community", desc: "Validators, builders, Legion, and events", href: "/community" },
        { name: "Governance", desc: "House of Stake", href: "https://houseofstake.org/" },
      ] },
    ],
  },
];
