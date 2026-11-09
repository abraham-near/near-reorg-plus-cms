// The four layers of the Stack (spec/pages/home.md §2, D7, D14, D18), core first as the list reads (01 NEAR Protocol …
// 04 near.com): the drawing builds outwards in the same order. Lines are the approved v4 copy. Features and stats come from
// PRODUCT.md (F-IDs noted). Anything not yet verified is left out until confirmed (D16), never invented.

export type LayerKey = "com" | "ai" | "intents" | "protocol";
export type Feature = { title: string; detail: string };
export type Stat = { value: string; label: string };
export type Layer = {
  key: LayerKey;
  name: string;
  role: string;
  url: { label: string; href: string };
  line: string;
  features: Feature[];
  stats: Stat[];
};

export const LAYERS: Layer[] = [
  {
    key: "protocol", name: "NEAR Protocol", role: "Where it settles", url: { label: "nearprotocol.com", href: "https://nearprotocol.com" },
    line: "Everything settles in about a second. NEAR Protocol is a sharded blockchain that adds capacity as demand grows, with post-⁠quantum signing live and five years on mainnet.",
    features: [
      { title: "Dynamic Resharding", detail: "Shards split and merge with demand. Live on mainnet since Jul 2026." }, // F9
      { title: "Post-Quantum Signing", detail: "ML-DSA account keys, live on mainnet." }, // F10
    ],
    stats: [
      { value: "5+ years", label: "on mainnet" }, // F8
      { value: "1M+", label: "TPS in a public benchmark" }, // F7
      { value: "10", label: "shards" }, // F9
      { value: "1.2 s", label: "finality" }, // F6
    ],
  },
  {
    key: "intents", name: "NEAR Intents", role: "How value moves", url: { label: "intents.near.org", href: "https://intents.near.org" },
    line: "Say the outcome you want. Solvers compete to deliver it from whatever you hold, with no bridges and no wrapped tokens. NEAR Intents is the universal liquidity layer for onchain markets.",
    features: [
      { title: "Confidential Intents", detail: "About 40% of the last 30 days' volume, as of 31 Oct 2026." }, // F2
      { title: "In the Wallets People Use", detail: "Ledger, Brave and Zodl route swaps through NEAR Intents." }, // F19
      { title: "Revenue Funds Buybacks", detail: "Fee switch live since Feb 2026." }, // F13
    ],
    stats: [
      { value: "$36.8B+", label: "settled, as of 31 Oct 2026" }, // F1
      { value: "35+", label: "chains" }, // F3
      { value: "120+", label: "assets" }, // F4
    ],
  },
  {
    key: "ai", name: "NEAR AI", role: "Where your agents think", url: { label: "near.ai", href: "https://near.ai" },
    line: "Inference and agents run inside hardware enclaves no one can see into: not the host, not the operator, not NEAR. Every request returns a signed proof of what ran.",
    features: [
      { title: "NEAR AI Cloud", detail: "Private inference on confidential hardware." }, // F17
      { title: "Attestation", detail: "A signed proof on every request." }, // F17
    ],
    stats: [
      { value: "Zero", label: "operator access" }, // v4
    ],
  },
  {
    key: "com", name: "near.com", role: "Where you act", url: { label: "near.com", href: "https://near.com" },
    line: "One account for everything you hold. Swap, send and trade, confidential by default, with every transaction signed on your device.",
    features: [
      { title: "Confidential Swaps and Transfers", detail: "Across 35+ chains, from one account." }, // F3, PRODUCT §3
      { title: "Perps, Yield and RWAs", detail: "In the same account." }, // PRODUCT §3
      { title: "Signed on Your Device", detail: "Every transaction." }, // v4 line
    ],
    stats: [
      { value: "35+", label: "chains" }, // F3
      { value: "Confidential", label: "by default" }, // v4
    ],
  },
];
