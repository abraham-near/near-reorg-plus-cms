// v4's copy for the sections after the Stack (v3's ProofDeeper, ../v3/proof-deeper): the October 2026 doc (near.org-airnauts), verbatim.
// Go deeper, the newsletter, the header and the footer read the same in the doc as in v3, so they stay as they are.
import type { DeeperContent } from "../v3/proof-deeper/ProofDeeper";

export const V4_DEEPER: DeeperContent = {
  figures: [
    { value: "$38B+", caption: "settled through NEAR Intents, all-time", icon: "near-intents" },
    { value: "35+", unit: "chains", caption: "reachable from one account", icon: "chain-abstraction" },
    { value: "1.2", unit: "s", caption: "finality, with 600 ms blocks", icon: "clock" },
    { value: "1M+", unit: "TPS", caption: "in a publicly verifiable benchmark", icon: "analytics" },
    { value: "6+", unit: "years", caption: "on mainnet, with 100% uptime", icon: "history" },
  ],
  origin: {
    title: <>Built by the people who helped <span className="l-nb">invent modern AI</span></>,
    text: <>
      NEAR began in{" "}2017 as an AI lab. <span className="l-nb">Co-founder</span> <span className="l-nb">Illia Polosukhin</span>{" "}
      <span className="l-nb">co-authored</span> “Attention Is All You Need”
      <sup className="l-mark"><a href="#l-origin-src"><span className="sr-only">Source </span>1</a></sup>
      , the paper that introduced the Transformer, the architecture behind today’s AI models. NEAR exists so the next era of AI is owned{" "}by{" "}its{" "}users.
    </>,
  },
  voices: [
    { text: "I wouldn’t bet against NEAR.", name: "Hunter Horsley", role: "CEO of Bitwise" },
    { text: "NEAR Intents is an insanely good product.", name: "Dan Smith", role: "Blockworks Research" },
    { text: "Their AI work is the only AI x Crypto thing I’m looking forward to.", name: "Austin Federa", role: "Co-founder of DoubleZero" },
    { text: "Intents are the future of crypto.", name: "Charles Hoskinson", role: "Cardano" },
    { text: <>Game changing at <span className="l-nb">a multi-generational</span> scale.</>, name: "Josh Swihart", role: "Founder of ZODL" },
    { text: "The most underrated team in crypto.", name: "Mert Mumtaz", role: "Co-founder of Helius" },
  ],
  paths: [
    { name: "Trade on NEAR", line: <>Trade, earn yield, and go confidential, all from one near.com account.</>,
      label: "Open near.com", href: "https://near.com", host: "near.com", img: "/home/get-into/home-paths-trade-v3.webp" },
    { name: "Integrate NEAR", line: <>Add <span className="l-nb">NEAR Intents</span> for confidential <span className="l-nb">cross-chain</span> execution, or <span className="l-nb">NEAR AI</span> for private inference you can verify.</>,
      label: "Integration docs", href: "https://docs.near.org/", host: "docs.near.org", img: "/home/get-into/home-paths-integrate-v2.webp" },
    { name: "Build on NEAR", line: <>Build onchain apps and AI agents on battle-tested infrastructure with built-in confidentiality and <span className="l-nb">cross-chain</span> reach.</>,
      label: "Start building", href: "https://docs.near.org/", host: "docs.near.org", img: "/home/get-into/home-paths-build-v3.webp" },
  ],
};
