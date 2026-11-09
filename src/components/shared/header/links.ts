// The header's menu: the client's copy and links, verbatim (nav-data.ts, as b10 carries it). One source for the desktop panels and the phone map.
// icon: b10's id, one name for both icon sets (the panels' line icons in public/nav/icons, the map's isometric sprite public/nav/sprite.svg).
export type Item = { name: string; desc: string; href: string; icon: string };
export type Section = { name?: string; items: Item[] };
export type Group = { id: string; name: string; kind: "cards" | "cols"; secs: Section[] };

/** links that leave for another NEAR site carry the ↗ mark and a screen-reader note */
export const isExt = (href: string) => /^https?:\/\//.test(href);

export const GROUPS: Group[] = [
  {
    id: "products", name: "Products", kind: "cards",
    secs: [{ items: [
      { name: "near.com", desc: "One account, 35+ chains, confidential by default", href: "https://near.com", icon: "account" },
      { name: "Intents", desc: "The universal liquidity layer for onchain markets", href: "https://intents.near.org", icon: "intents" },
      { name: "NEAR AI", desc: "Confidential, verifiable inference and agents", href: "https://near.ai", icon: "enclave" },
    ] }],
  },
  {
    id: "stack", name: "Stack", kind: "cards",
    secs: [{ items: [
      { name: "Protocol", desc: "The settlement layer for the agent economy", href: "/protocol", icon: "protocol" },
      { name: "Chain Abstraction", desc: "How NEAR connects any chain", href: "/chain-abstraction", icon: "chain-abstraction" },
      { name: "Quantum Security", desc: "Post-quantum keys, live on mainnet", href: "/quantum-security", icon: "quantum" },
    ] }],
  },
  {
    id: "resources", name: "Resources", kind: "cols",
    secs: [
      { name: "Build", items: [
        { name: "Docs", desc: "Build on NEAR", href: "https://docs.near.org/", icon: "docs" },
        { name: "Solutions", desc: "Explore use cases", href: "/solutions", icon: "solutions" },
      ] },
      { name: "Learn", items: [
        { name: "Research", desc: "White paper and protocol work", href: "/research", icon: "research" },
        { name: "Blog", desc: "News and deep dives", href: "/blog", icon: "blog" },
        { name: "Analytics", desc: "Live onchain metrics", href: "/analytics", icon: "analytics" },
      ] },
      { name: "Connect", items: [
        { name: "Brand", desc: "Logos and guidelines", href: "/brand", icon: "brand" },
        { name: "Contact", desc: "Connect with the team", href: "/contact-us", icon: "contact" },
        { name: "Careers", desc: "Build the agent economy", href: "https://job-boards.eu.greenhouse.io/nearfoundation", icon: "careers" },
      ] },
    ],
  },
  {
    id: "about", name: "About", kind: "cols",
    secs: [
      { name: "Fundamentals", items: [
        { name: "History", desc: "From 2017 to now", href: "/about", icon: "history" },
        { name: "Roadmap", desc: "What ships next", href: "https://roadmap.near.org/", icon: "roadmap" },
        { name: "Economics", desc: "Revenue, buybacks, supply", href: "/economics", icon: "economics" },
      ] },
      { name: "Ecosystem", items: [
        { name: "NEAR Foundation", desc: "Supporting a decentralized ecosystem", href: "/near-foundation", icon: "foundation" },
        { name: "Community", desc: "Validators, builders, Legion, and events", href: "/community", icon: "community" },
        { name: "Governance", desc: "House of Stake", href: "https://houseofstake.org/", icon: "governance" },
      ] },
    ],
  },
];
