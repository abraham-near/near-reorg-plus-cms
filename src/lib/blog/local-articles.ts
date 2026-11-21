// The 4 newest CMS posts' articles, hard-wired so /blog/<slug> opens them in `next dev` with no database (D256; lib/blog/local.ts uses them).
// Taken on 2026-11-20 from the live site's own pages (each post's /blog/<slug> in its default layout, B): the Article the page hands its layout,
// so the body is the CMS's, already prepared (lib/blog/html.ts), word for word. "More posts" is left out and rebuilt from these four.
// Photos: the hero is public/images/blog/cms/<slug>.webp (as on /blog); the body's images are public/images/blog/cms/<slug>/<id>.webp.
// Generated: edit the CMS, not this file, and pull again.
import type { Article } from "@/components/v3/post/article";

export type LocalArticle = { slug: string; publishedAt: string; layout: string | null; metaTitle: string | null; metaDescription: string | null; article: Omit<Article, "more" | "blogHref"> };

export const LOCAL_ARTICLES: LocalArticle[] = [
 {
  "slug": "near-inflation-rate-reducing-to-1-6-percent",
  "publishedAt": "2026-11-16T16:48:00.000Z",
  "layout": null,
  "metaTitle": "NEAR Protocol Inflation Rate Reducing to 1.6% | HSP-029",
  "metaDescription": "House of Stake ratified HSP-029, lowering NEAR's maximum annual issuance from 2.5% to 1.6% over 24 months. See how it works and what comes next.",
  "article": {
   "category": "Governance",
   "type": "",
   "title": "NEAR Protocol Inflation Rate Reducing to 1.6%",
   "dek": "HSP-029 is ratified. NEAR's maximum annual issuance will be lowered from 2.5% to 1.6% over 24 months, on a schedule anyone can verify onchain.",
   "author": {
    "name": "NEAR",
    "role": "",
    "initials": "N",
    "bio": ""
   },
   "date": "November 16, 2026",
   "dateIso": "2026-11-16",
   "tags": [],
   "hero": {
    "src": "/images/blog/cms/near-inflation-rate-reducing-to-1-6-percent.webp",
    "alt": ""
   },
   "takeaways": [],
   "body": {
    "html": "<p class=\"pb-p\"><em>HSP-029 is ratified. NEAR's maximum annual issuance will be lowered from 2.5% to 1.6% over 24 months, on a schedule anyone can verify onchain.</em></p><p class=\"pb-p\"><a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://houseofstake.org\">House of Stake</a> has ratified <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://houseofstake.org/proposals/29\">HSP-029</a>, a community proposal that lowers NEAR's maximum annual issuance from 2.5% to 1.6%. The Security Council's review window closed with no veto. Once the reduction begins, the cap is lowered by a small amount every epoch until it reaches 1.6% at month 24.</p><p class=\"pb-p\">This is NEAR Protocol’s second inflation reduction in just over a year. It changes a single protocol parameter on a published schedule.</p><h2 id=\"near-s-inflation-rate-5-to-2-5-to-1-6\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">01</span><span class=\"pb-h2__t\">NEAR's inflation rate: 5% to 2.5% to 1.6%</span></h2><p class=\"pb-p\">NEAR’s original 5% rate is still sometimes cited. Here is how the maximum has changed since mainnet launch.</p><ul class=\"pb-list\"><li><p><strong>5%:</strong> NEAR's original maximum annual issuance, designed before mainnet to bootstrap validator security for a new sharded network.</p></li><li><p><strong>2.5%:</strong> the maximum since the <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"/blog/supporting-community-proposals-to-upgrade-near-tokenomics-halving-inflation-and-introducing-rewards-to-support-small-validators-and-venear-holders\">October 2025 halving</a>, which validators adopted through a protocol upgrade. Realized gross issuance runs slightly below the cap because transaction fees are burned. HSP-029 measured it at 2.45% in September 2026.</p></li><li><p><strong>1.6%:</strong> the new maximum under HSP-029, in force 24 months after the reduction begins.</p></li></ul><p class=\"pb-p\">At 1.6%, NEAR will have one of the lowest annual issuance rates among major blockchains, based on information at the time of publishing. The rate follows a fixed schedule with no automatic trigger to raise it.</p><h2 id=\"how-the-reduction-works\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">02</span><span class=\"pb-h2__t\">How the reduction works</span></h2><p class=\"pb-p\">HSP-029 changes one parameter, NEAR's maximum annual issuance rate. The rest of NEAR's economic design stays as it is.</p><ul class=\"pb-list\"><li><p><strong>Lowered every epoch.</strong> The cap is lowered by about 3.75 basis points a month, in equal increments each epoch, with no step dates. The <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://houseofstake.org/proposals/29\">published formula</a> is cap(t) = 2.5% − 0.9% × min(t, 24) / 24, where t is months since the reduction begins.</p></li><li><p><strong>The same split.</strong> Issuance continues to go 90% to staking participants and 10% to the protocol treasury.</p></li><li><p><strong>No new programs.</strong> The proposal creates no spending program, oracle, or administrator, and makes no claim on the treasury.</p></li><li><p><strong>No automatic increases.</strong> The schedule has no trigger that raises issuance. Any future increase would need a new governance proposal and validator adoption.</p></li></ul><p class=\"pb-p\">The proposal models 11.8M NEAR of issuance avoided over two years and 66.1M over six years, compared with keeping the cap at 2.5%. Avoided issuance is NEAR that is never created.</p><h2 id=\"from-ratification-to-1-6\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">03</span><span class=\"pb-h2__t\">From ratification to 1.6%</span></h2><p class=\"pb-p\">Ratification is the first of two required approvals. The issuance cap is a protocol parameter, so the change becomes binding only when validators adopt it through the standard upgrade process.</p><ol class=\"pb-list pb-list--ol\"><li><p><strong>Grace period.</strong> One full quarter after ratification, so wallets, exchanges, custodians, and staking providers can update their systems and disclosures.</p></li><li><p><strong>Protocol upgrade.</strong> NEAR One releases the upgrade, validators independently decide whether to adopt it, and NEAR One publishes the confirmed activation schedule.</p></li><li><p><strong>Reduction begins.</strong> Scheduled for one quarter after ratification. From then, the cap is lowered every epoch.</p></li><li><p><strong>Target rate.</strong> 1.6% maximum annual issuance is in force at month 24.</p></li><li><p><strong>Quarterly reporting.</strong> Transparency reports compare realized issuance with the schedule and track validator set health.</p></li></ol><h2 id=\"what-lower-issuance-means-for-stakers-holders-and-validators\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">04</span><span class=\"pb-h2__t\">What lower issuance means for stakers, holders, and validators</span></h2><p class=\"pb-p\">Lower issuance means fewer new tokens for stakers and slower dilution for every holder. The proposal models both effects and publishes the method to reproduce them.</p><ul class=\"pb-list\"><li><p><strong>Stakers.</strong> Staking rewards adjust gradually, by a small amount each epoch over 24 months, so there is no sudden change. At the target rate, modeled gross staking yield is about 3.37%, compared with about 5.27% today, if today's staking ratio holds.</p></li><li><p><strong>Holders who don't stake.</strong> More than half of NEAR's supply is not staked. For these holders, dilution slows with no offsetting change.</p></li><li><p><strong>Validators.</strong> The change is gradual and published in advance, giving operators 24 months of visibility to plan. The proposal finds that most validator revenue comes from commission on delegated stake, so service quality and fee competition drive validator economics more than the issuance rate does. Pool-level modeling, including operating-cost coverage at the target rate, is published in <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://houseofstake.org/proposals/29\">the proposal</a>.</p></li></ul><p class=\"pb-p\">The full breakeven analysis, validator dataset, and reproducibility method are in <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://houseofstake.org/proposals/29\">the proposal</a>.</p><h2 id=\"a-transparent-onchain-decision\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">05</span><span class=\"pb-h2__t\">A transparent, onchain decision</span></h2><p class=\"pb-p\">HSP-029 was authored by Sal Ternullo, CEO of SVRN, and <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://houseofstake.org/proposals/cmuyez8j80000ru0sz6emyqpe\">opened for forum discussion</a> on October 7. House of Stake's Screening Committee <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://x.com/NEARProtocol/status/2112657610520645980\">approved it for a supermajority vote</a> on October 19. The vote <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://x.com/NEARProtocol/status/2117338455189385533\">closed on November 2</a> with 99.96% of veNEAR cast in favor and none against. The Security Council's 14-day window to veto on legal or technical grounds closed on November 16 with no veto, and the proposal was ratified.</p><p class=\"pb-p\">The two-step structure is deliberate. veNEAR holders set direction through House of Stake, and the validators who run the network consent separately when they adopt the upgrade. NEAR Foundation's role is facilitative, providing research and communications support for community-led proposals.</p><h2 id=\"get-involved\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">06</span><span class=\"pb-h2__t\">Get involved</span></h2><ul class=\"pb-list\"><li><p>Read the full proposal at <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://houseofstake.org/proposals/29\">houseofstake.org/proposals/29</a></p></li><li><p>Lock NEAR into veNEAR to vote on future proposals at <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://houseofstake.org\">houseofstake.org</a></p></li><li><p>Discuss proposals on the <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://gov.near.org\">NEAR Governance Forum</a></p></li><li><p>Follow <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://x.com/NEARGovernance\">@NEARGovernance</a> for updates</p></li></ul><p class=\"pb-p\"><em>Disclaimer: By accessing this site or participating in House of Stake governance or any related smart contract activity, you acknowledge that you do so entirely at your own risk. Nothing on this site constitutes investment, legal, financial, accounting, or tax advice. Participation outcomes are not guaranteed, and token values may fluctuate or result in complete loss. You are solely responsible for understanding and complying with all applicable laws in your jurisdiction, including determining, reporting, and paying any taxes arising from your participation.</em></p>"
   },
   "notes": [],
   "sections": [
    {
     "id": "near-s-inflation-rate-5-to-2-5-to-1-6",
     "t": "NEAR's inflation rate: 5% to 2.5% to 1.6%"
    },
    {
     "id": "how-the-reduction-works",
     "t": "How the reduction works"
    },
    {
     "id": "from-ratification-to-1-6",
     "t": "From ratification to 1.6%"
    },
    {
     "id": "what-lower-issuance-means-for-stakers-holders-and-validators",
     "t": "What lower issuance means for stakers, holders, and validators"
    },
    {
     "id": "a-transparent-onchain-decision",
     "t": "A transparent, onchain decision"
    },
    {
     "id": "get-involved",
     "t": "Get involved"
    }
   ],
   "readMin": 4,
   "video": null
  }
 },
 {
  "slug": "near-intents-live-in-talos-oems",
  "publishedAt": "2026-11-09T14:00:00.000Z",
  "layout": null,
  "metaTitle": "NEAR Intents Is Live in Talos OEMS | NEAR",
  "metaDescription": "Talos's institutional clients can now source cross-chain DeFi liquidity across 30+ chains and CEX venues through NEAR Intents, inside the same Talos workflow.",
  "article": {
   "category": "NEAR Intents",
   "type": "",
   "title": "NEAR Intents Is Live in Talos OEMS: Cross-Chain DeFi Liquidity Inside the Institutional Workflow",
   "dek": "NEAR Intents is now live inside Talos' Order and Execution Management System, bringing solver-sourced cross-chain liquidity to institutional desks without a new workflow.",
   "author": {
    "name": "NEAR",
    "role": "",
    "initials": "N",
    "bio": ""
   },
   "date": "November 9, 2026",
   "dateIso": "2026-11-09",
   "tags": [],
   "hero": {
    "src": "/images/blog/cms/near-intents-live-in-talos-oems.webp",
    "alt": ""
   },
   "takeaways": [],
   "body": {
    "html": "<p class=\"pb-p\">Most attempts to bring institutions onchain have asked the institution to change: new custody arrangements, new counterparty risk, and even new operational surfaces. The premise was that the liquidity was worth the disruption. The math mostly concluded it wasn't.</p><p class=\"pb-p\">With <a href=\"https://intents.near.org/\" target=\"_blank\" rel=\"noopener noreferrer\">NEAR Intents</a> now live inside Talos' Order and Execution Management System (OEMS), it makes sense. Talos's institutional clients can source cross-chain DeFi liquidity through the same order and execution workflow they already use for every other venue, with the custody integrations and controls already in place around it.</p><h2 id=\"what-the-trading-desk-actually-touches\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">01</span><span class=\"pb-h2__t\">What the trading desk actually touches</span></h2><p class=\"pb-p\">Nothing new. That is the point of doing this inside an OMS/EMS rather than alongside one.</p><p class=\"pb-p\">An order staged in Talos routes to NEAR Intents the way it would route to any other venue. The trader expresses what they want done. Everything underneath that, which chains hold the liquidity, how the legs are sequenced, which counterparty ends up filling, is not a decision the trading desk makes or a set of accounts the desk has to fund.</p><h2 id=\"how-the-liquidity-gets-sourced\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">02</span><span class=\"pb-h2__t\">How the liquidity gets sourced</span></h2><p class=\"pb-p\">NEAR Intents does not operate a pool. It takes a stated outcome and delegates it to a competing network of solvers.</p><p class=\"pb-p\">A solver is a professional counterparty that bids to fill the order. To win the flow it has to price better than the others bidding on it, and it can go anywhere to do that: liquidity across more than 30 chains, EVM and non-EVM, plus centralized venues including Binance and other international exchanges where the depth for a given pair often actually lives. The solver absorbs the routing, the inventory risk, and the cross-chain mechanics. The client sees a price and a fill.</p><p class=\"pb-p\">The structure matters more than the plumbing. In a single-venue relationship, execution quality is whatever that venue's book gives you on the day. Here, every order is a small auction. Pricing is set by competition for the flow rather than by the one place you happened to be connected to.</p><p class=\"pb-p\">NEAR Intents has done over $37 billion in total volume and more than $4 billion in the past 30 days, with swaps typically settling in under a second and network fees under a cent.</p><h2 id=\"custody-integrations-and-confidentiality\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">03</span><span class=\"pb-h2__t\">Custody integrations and confidentiality</span></h2><p class=\"pb-p\">Institutions no longer have to give up certain aspects of privacy and security with NEAR Intents.</p><p class=\"pb-p\">Talos clients can continue using their existing custody solutions. The custody integrations already wired into the Talos workflow continue to apply.</p><p class=\"pb-p\">Execution can be <a href=\"https://intents.near.org/confidential\" target=\"_blank\" rel=\"noopener noreferrer\">confidential</a> through Intents. Orders are not broadcast to a public mempool where anyone watching can read intent and position ahead of the fill. For a desk moving size, the difference between confidential and public execution is not a preference. It's where additional margin lives.</p><h2 id=\"assets-fees-and-what-comes-next\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">04</span><span class=\"pb-h2__t\">Assets, fees, and what comes next</span></h2><p class=\"pb-p\">Fungible tokens are supported today across the full cross-chain set. Tokenized RWAs, yield-bearing assets, and prediction markets are next, which extends the same execution path to instruments that currently sit in entirely separate operational silos.</p><p class=\"pb-p\">Fees are volume-tiered and benchmarked against centralized exchange schedules, so accessing decentralized liquidity does not carry a cost penalty for doing so. Details are available for users during onboarding.</p><figure class=\"pb-quote\" data-reveal=\"\"><blockquote><p>\"This is what institutional access to DeFi should look like: existing custody integrations, no new workflow, and competitive cross-chain pricing on every order. Talos connects some of the largest trading desks in digital assets. NEAR Intents is now the route that brings their flow onchain, into the markets and liquidity the rest of DeFi runs on.\"</p></blockquote><figcaption class=\"pb-quote__by\">Alex Shevchenko, CEO of Defuse Labs, developer of NEAR Intents</figcaption></figure><figure class=\"pb-quote\" data-reveal=\"\"><blockquote><p>\"Talos clients asked for access to solver-sourced liquidity without standing up a second operating model to reach it. Competitive quoting is becoming a real source of institutional liquidity, and it now reaches clients through the same Talos request-for-quote workflow they use for spot blocks, options and ETF creations/redemptions.\"</p></blockquote><figcaption class=\"pb-quote__by\">Daniel Packham, VP and Head of Provider Network, Talos</figcaption></figure><h2 id=\"get-access\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">05</span><span class=\"pb-h2__t\">Get access</span></h2><p class=\"pb-p\">NEAR Intents is available now to Talos clients. Request API access at <a href=\"https://partners.near-intents.org\" target=\"_blank\" rel=\"noopener noreferrer\">partners.near-intents.org</a>.</p><p class=\"pb-p\">For fee schedules and onboarding, contact <a href=\"mailto:partnerships@defuse.org\">partnerships@defuse.org</a>.</p>"
   },
   "notes": [],
   "sections": [
    {
     "id": "what-the-trading-desk-actually-touches",
     "t": "What the trading desk actually touches"
    },
    {
     "id": "how-the-liquidity-gets-sourced",
     "t": "How the liquidity gets sourced"
    },
    {
     "id": "custody-integrations-and-confidentiality",
     "t": "Custody integrations and confidentiality"
    },
    {
     "id": "assets-fees-and-what-comes-next",
     "t": "Assets, fees, and what comes next"
    },
    {
     "id": "get-access",
     "t": "Get access"
    }
   ],
   "readMin": 3,
   "video": null
  }
 },
 {
  "slug": "chain-signatures-tee",
  "publishedAt": "2026-10-23T17:23:00.000Z",
  "layout": null,
  "metaTitle": "Chain Signatures Now Run Inside TEEs | NEAR",
  "metaDescription": "NEAR Chain Signatures now run inside Intel TDX TEEs, so any signing operation can be verified onchain.",
  "article": {
   "category": "",
   "type": "",
   "title": "Chain Signatures Now Run Entirely Inside TEEs, Making Every Operation Verifiable Onchain",
   "dek": "NEAR Chain Signatures now run inside Intel TDX TEEs, so any signing operation can be verified onchain.",
   "author": {
    "name": "NEAR",
    "role": "",
    "initials": "N",
    "bio": ""
   },
   "date": "October 23, 2026",
   "dateIso": "2026-10-23",
   "tags": [],
   "hero": {
    "src": "/images/blog/cms/chain-signatures-tee.webp",
    "alt": ""
   },
   "takeaways": [],
   "body": {
    "html": "<p class=\"pb-p\"><em>Anton Astafiev, CTO at Near One, and Mally Anderson, writer at NEAR</em></p><p class=\"pb-p\">Thanks to NEAR Intents, NEAR now moves a <a href=\"https://dune.com/near/near-intents\">significant share</a> of cross-chain volume across all of crypto. The lesser-known pillar of NEAR’s cross-chain infrastructure is <a href=\"https://docs.near.org/chain-abstraction/chain-signatures\">Chain Signatures</a>. In the 2.5 years since Chain Signatures first launched, it has continued to evolve, adding new features and increasing decentralization and security of the MPC (multiparty computation) network. Last week, <a href=\"/blog/mpc-node-infrastructure-incentive-program\">NEAR Foundation announced</a> that NEAR MPC runs with 17 independent operators on mainnet and will be sustainably funded by protocol emissions.</p><p class=\"pb-p\">MPC networks secure a growing share of crypto’s cross-chain activity, and most of them require trusting the operator set. The NEAR MPC network recently achieved a second milestone: all <a href=\"https://mpc-operators.nearone.org/\">Chain Signatures</a> operations now run inside TEEs (trusted execution environments), enabling independent on-chain verification and further upgrading security. These advances make the NEAR MPC the most decentralized and secure, and the only verifiable, MPC network we know of today and the only one running on fully encrypted hardware, by independent operators.</p><h2 id=\"the-evolution-of-chain-signatures\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">01</span><span class=\"pb-h2__t\">The Evolution of Chain Signatures</span></h2><p class=\"pb-p\">Chain Signatures first <a href=\"/blog/chain-signatures-launch-to-enable-transactions-on-any-blockchain-from-a-near-account\">launched</a> in Q1 2024 and were a key pillar of NEAR pioneering the Chain Abstraction movement for Web3: the idea that cross-chain UX like bridges, gas, and wrapped tokens put a high burden of complexity and security risk on the user while fragmenting liquidity across a balkanized crypto landscape. Instead, the NEAR ecosystem posited that users should be able to do whatever they want across chains and go where the liquidity is.</p><p class=\"pb-p\">Using a decentralized MPC network and threshold signatures, Chain Signatures allow a NEAR account to sign transactions for any blockchain. This enabled not only bridgeless DeFi across chains, but also multi-chain account abstraction, or managing accounts/assets from multiple chains from a single NEAR account. Chain Signatures was also one of the first tools to unlock liquidity for non-smart contract chains like Bitcoin and bring them into the DeFi landscape.</p><p class=\"pb-p\">Chain Signatures helped pave the way for NEAR Intents (which launched in November 2024) and powers all the network’s cross-chain volume: more than $35 billion in <a href=\"https://dune.com/near/near-intents\">all-time volume</a> in less than two years. Virtually all BTC and Solana cross-chain flow now moves through the NEAR MPC-powered Omnibridge. Chain Signatures enables cross-chain transactions without a bridge or custodian in the middle, while Intents handles the requests and coordinates their fulfillment. (For a deeper review of how Chain Signatures work, see the <a href=\"https://docs.near.org/chain-abstraction/chain-signatures#interoperability\">documentation</a>.)</p><p class=\"pb-p\">In 2025, the Near One team implemented CKD, or Confidential Key Derivation, for the Chain Signatures MPC. (For a technical deep dive on this topic, see Near One’s <a href=\"https://blog.nearone.org/research/2026/02/23/mpc-ckd.html\">blog post</a>.) CKD derives a secret key for any application that the app can use for whatever purpose – for example, signing or encryption. This key is derived in a way that prevents any of the operators from knowing it, and no single failure or compromise can move funds. The keys are protected against corruption by any individual node and can be used for signing as well as for encryption and decryption. This enables trusted training of models inside TEEs, persistent AI Agents, encrypted storage across TEEs, generating verifiable randomness, and many other applications.</p><h2 id=\"new-milestones-tees-and-increasing-decentralization\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">02</span><span class=\"pb-h2__t\">New Milestones: TEEs and Increasing Decentralization</span></h2><p class=\"pb-p\">The Chain Signatures MPC now runs on mainnet with a required signing threshold of 11 out of 17 nodes, populated by many of the most reputable operators in the industry. This makes Chain Signatures the most decentralized MPC network we know of today. The <a href=\"https://mpc-operators.nearone.org/overview.html\">security overview</a> (including <a href=\"https://github.com/near/mpc/tree/main/audits\">the full audit report</a> of every operator, feature, and code path by Trail of Bits) and <a href=\"https://mpc-operators.nearone.org/\">list of participants</a> is enforced onchain and viewable on a public page. Operators include SVRN, Bitwise, Nansen, Greenfield, Everstake, Near One, and Luganodes.</p><p class=\"pb-p\">Chain Signatures MPC network operations now run inside TEEs (trusted execution environments), enabling independent onchain verification via cryptographic proof. We do not know of another decentralized MPC network running inside fully encrypted hardware, in NEAR’s case Intel TDX. NEAR AI already operates confidential inference in TEEs (the documentation provides a <a href=\"https://docs.near.ai/cloud/private-inference\">high-level explanation</a> of TDX and how they work).</p><p class=\"pb-p\">Each operator also runs a full NEAR node and only signs transactions that come from an onchain request. The participants operate inside secure enclaves to prevent arbitrary code manipulation and ensure the nodes strictly validate on-chain transaction flows. Not only does this make the MPC network more secure, but it also enables verification of all operations to enhance trust in the network.</p><p class=\"pb-p\">This combination of encrypted hardware, verifiability, and decentralization of independent operators make Chain Signatures a truly unique MPC network, pushing the bounds of this technology. The new network architecture also enables a more secure approach to foreign chain transactions via <a href=\"http://mpc.nearone.org/\">Read MPC</a>, which requires MPC operators to query a white-listed quorum of RPC providers (at least 3 out of 5) to verify cross-chain deposits before initiating threshold signing. This method is more secure than simply using RPCs, with additional safety from using TEEs. It also enables fast, non-custodial onboarding of new chains without requiring light client implementations, so the NEAR Intents system –– which already supports more than 35 networks –– can securely and easily add more chains and assets over time.</p><h2 id=\"what-s-ahead\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">03</span><span class=\"pb-h2__t\">What’s Ahead</span></h2><p class=\"pb-p\">The network architecture of the Chain Signatures MPC supports the addition of more operators over time. The tradeoff between adding reputable nodes and maintaining the speed and latency requirements required for performance makes this a low priority for now––indeed, the recent milestone of 17 signers goes far beyond most MPC networks’ security requirements. But the option exists if the requirements shift.</p><p class=\"pb-p\">The Near One team is also actively researching ways to secure the MPC network for the <a href=\"/blog/near-quantum-safe-roadmap\">post-quantum era</a>. There are not yet any practical post-quantum solutions for threshold signing that are ready to be put into production, and the Near One team estimates that they are at least a year away. CKD is also based on threshold signing and uses recovery keys that are not post-quantum secure. These are active research topics for Near One as the field of post-quantum cryptography evolves. In the meantime, NEAR account holders can <a href=\"/blog/near-quantum-safe-roadmap\">secure their assets</a> by updating their keys to be post-quantum secure.</p><p class=\"pb-p\">Given the growth of NEAR Intents and the importance of cross-chain infrastructure to the overall NEAR Protocol and ecosystem, continuing to upgrade the NEAR MPC and Chain Signatures will be a top priority for Near One. For now, the network has achieved a degree of decentralization, security, and resilience that sets a new standard for Web3 and extends NEAR’s standard of independent onchain verifiability to all Chain Signatures operations.</p>"
   },
   "notes": [],
   "sections": [
    {
     "id": "the-evolution-of-chain-signatures",
     "t": "The Evolution of Chain Signatures"
    },
    {
     "id": "new-milestones-tees-and-increasing-decentralization",
     "t": "New Milestones: TEEs and Increasing Decentralization"
    },
    {
     "id": "what-s-ahead",
     "t": "What’s Ahead"
    }
   ],
   "readMin": 5,
   "video": null
  }
 },
 {
  "slug": "introducing-near-business",
  "publishedAt": "2026-10-20T14:00:00.000Z",
  "layout": null,
  "metaTitle": "Introducing NEAR Business: Confidential Multisig Treasury",
  "metaDescription": "Make payroll payments, pay vendors, and swap across 35+ chains from one dashboard. Multisig approvals, confidential from the market, legible to your auditors. Free to start.",
  "article": {
   "category": "NEAR Intents",
   "type": "",
   "title": "Introducing NEAR Business: The Confidential Multisig Treasury for Crypto-Native Teams",
   "dek": "",
   "author": {
    "name": "NEAR",
    "role": "",
    "initials": "N",
    "bio": ""
   },
   "date": "October 20, 2026",
   "dateIso": "2026-10-20",
   "tags": [],
   "hero": {
    "src": "/images/blog/cms/introducing-near-business.webp",
    "alt": ""
   },
   "takeaways": [],
   "body": {
    "html": "<p class=\"pb-p\"><em>Make payroll payments, pay vendors, rebalance reserves, and swap across 35+ chains from one dashboard, with every move approved by your signers. Confidential by default. Customer-controlled by design.</em></p><p class=\"pb-p\">Today we’re launching <a href=\"https://business.near.com/\" rel=\"noopener noreferrer\" target=\"_blank\">NEAR Business</a>, a confidential multisig treasury for crypto-native teams. Pay employees and vendors, swap assets, and allocate capital across 35+ chains from one dashboard, with every move approved under rules your team sets.</p><p class=\"pb-p\">NEAR Business is built around two problems onchain finance teams run into. Salaries, vendor payments, and treasury balances are sensitive business information, and on a public chain anyone with a block explorer can read them. And moving funds, collecting approvals, and keeping the books usually means juggling separate tools. NEAR Business keeps those details confidential and puts the whole workflow in one place.</p><p class=\"pb-p\">It’s free to start, with no subscription, annual contract or per-seat fees, and your team can set it up in minutes. Your team works from a shared dashboard, while funds sit in the NEAR Intents protocol and your Treasury Contract authorises transactions only when your approval rules are met.</p><figure class=\"pb-fig pb-fig--free\" data-size=\"col\" data-reveal=\"\"><div class=\"pb-fig__ph\"><img src=\"/images/blog/cms/introducing-near-business/632525929590d38b.webp\" alt=\"The NEAR Business dashboard on desktop and mobile: a General Fund treasury with a 2-of-3 approval threshold, total balance, asset breakdown, pending requests and recent transactions\" loading=\"lazy\" decoding=\"async\" class=\"pb-fig__img\"></div></figure><h2 id=\"confidential-from-the-market-legible-to-your-auditors\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">01</span><span class=\"pb-h2__t\">Confidential from the market. Legible to your auditors.</span></h2><figure class=\"pb-fig pb-fig--free\" data-size=\"col\" data-reveal=\"\"><div class=\"pb-fig__ph\"><img src=\"/images/blog/cms/introducing-near-business/74cade45512a6fe2.webp\" alt=\"A wallet on a public chain exposes balances, payroll, counterparties and history to anyone watching. The same treasury on NEAR Business keeps balances and payroll recipients off the public record, while signers, board and auditors see everything\" loading=\"lazy\" decoding=\"async\" class=\"pb-fig__img\"></div></figure><p class=\"pb-p\">Confidentiality is about controlling who can watch your operations, not about hiding them. Allocate capital and make payroll payments without publicly exposing who you pay, how much, or when.</p><p class=\"pb-p\">Governance stays verifiable. Your members, roles, and votes live onchain, so anyone can check that a request was approved under your rules, while the amounts, assets and recipients behind it stay with your team.</p><p class=\"pb-p\">Money moving in and out works the same way. Payments to a business.near.com account settle inside the confidential environment, and payments to a public wallet arrive from the business.near.com settlement account, not from your direct treasury's address.</p><p class=\"pb-p\">Transaction data is handled for operational, security and legal purposes as described in the <a href=\"https://business.near.com/privacy-policy\" rel=\"noopener noreferrer\" target=\"_blank\">NEAR Business Privacy Policy</a>.</p><h2 id=\"the-full-operating-surface-of-a-treasury-desk\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">02</span><span class=\"pb-h2__t\">The full operating surface of a treasury desk</span></h2><p class=\"pb-p\">NEAR Business covers the day-to-day work of a finance team, from a single vendor payment to a quarterly rebalance. Every action runs through the same approval rules and lands in the same exportable record.</p><ul class=\"pb-list\"><li><strong>Payments.</strong> Send to any address on any supported chain, or to a business.near.com account. Every payment carries your approval rules and settles with a confidential receipt.</li><li><strong>Bulk payments.</strong> Pay dozens of recipients in one batch: payroll, grants, vendors. Enter them by hand or upload a CSV. One approval flow, one record, zero public exposure on-chain.</li><li><strong>Cross-chain swaps.</strong> Swap between assets and chains without leaving the app, with execution powered by <a href=\"https://intents.near.org/\" rel=\"noopener noreferrer\" target=\"_blank\">NEAR Intents</a>.</li><li><strong>Capital allocation.</strong> Deploy treasury capital across chains and assets: positions, reserves and rebalancing runs, under the same approval thresholds as any other payment.</li><li><strong>Deposits.</strong> Fund the treasury from any supported chain, or straight from a confidential business.near.com account.</li><li><strong>Roles and thresholds.</strong> Requestor, finance, governance. Set rules that match how your organization already makes decisions.</li><li><strong>Contacts.</strong> Named recipients instead of raw addresses. Reduce copy/paste risk.</li><li><strong>Hardware signing.</strong> Sign with a Ledger, a passkey, or your wallet.</li><li><strong>History and exports.</strong> A complete record of every movement, exportable as CSV, Excel or JSON, plus PDF receipts. Your accountants, your auditors and your board, fed from one record.</li><li><strong>Multi-treasury view.</strong> Run a treasury per entity, fund or team and see them all in one place.</li></ul><p class=\"pb-p\">All of it is included from day one. No tiers, no add-ons, no per-seat pricing.</p><h2 id=\"manage-btc-eth-sol-near-and-assets-from-35-chains-from-a-sin\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">03</span><span class=\"pb-h2__t\">Manage BTC, ETH, SOL, NEAR, and assets from 35+ chains from a single dashboard</span></h2><p class=\"pb-p\">NEAR Business supports EVM and non-EVM networks alike, so your team can hold and move assets across chains without managing external bridges or a separate workflow for each network. Supported networks include Arbitrum, Base, Optimism, Polygon, Avalanche, BNB Chain, TON, Sui, Aptos, Cardano, Stellar, XRP, Dogecoin and Litecoin, among others. See the <a href=\"https://docs.near-intents.org/resources/asset-support\" rel=\"noopener noreferrer\" target=\"_blank\">full list of supported assets</a>.</p><h2 id=\"built-for-treasuries-that-run-on-a-mandate\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">04</span><span class=\"pb-h2__t\">Built for treasuries that run on a mandate</span></h2><p class=\"pb-p\">Most organizations holding a treasury don’t spend at one person’s discretion. A council, board, or set of investors decides how funds can move, and NEAR Business turns those decisions into approval rules the Treasury Contract enforces.</p><ul class=\"pb-list\"><li><strong>Foundations.</strong> Mandates, vesting, and grants executed exactly as the council approved them. Prudence your community can verify.</li><li><strong>Digital asset treasury companies.</strong> Multi-treasury view, reporting, and reconciliation across every chain and entity you run.</li><li><strong>Funds, desks, and family offices.</strong> Cross-chain positions, allocation, and settlement risk from one account. Balances and counterparties stay off the public ledger.</li><li><strong>Web3 companies.</strong> Payroll, contractors, and vendors paid across chains from one account, without putting salaries or runway on a block explorer.</li></ul><h2 id=\"advanced-treasury-control-without-enterprise-prices\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">05</span><span class=\"pb-h2__t\">Advanced treasury control without enterprise prices</span></h2><p class=\"pb-p\">Enterprise custody platforms can start at over $18,000 a year, lock teams into annual contracts and take weeks to set up. With NEAR Business, you create as many treasuries as you need, with unlimited users and no asset caps. We currently cover gas for your first 1,000 actions each month, and standard network fees apply after that. Swaps carry a 0.35% fee, included in the quote your approvers see before they sign off.</p><figure class=\"pb-fig pb-fig--free\" data-size=\"col\" data-reveal=\"\"><div class=\"pb-fig__ph\"><img src=\"/images/blog/cms/introducing-near-business/249b255e5cde51ba.webp\" alt=\"Transparent fees, always: $0 to create treasuries, a 0.35% swap fee charged only on swaps, and gas covered for the first 1,000 actions a month. Everything included: confidential treasuries, multichain support, bulk payments, audit-ready exports, granular permissions, multi-treasury view, cross-chain swaps, confidential receipts, Ledger support, unlimited users and no asset caps\" loading=\"lazy\" decoding=\"async\" class=\"pb-fig__img\"></div></figure><p class=\"pb-p\">How NEAR Business compares with other enterprise custody platforms:</p><figure class=\"pb-fig pb-fig--free\" data-size=\"col\" data-reveal=\"\"><div class=\"pb-fig__ph\"><img src=\"/images/blog/cms/introducing-near-business/2ff5db8b2272e5e2.webp\" alt=\"NEAR Business compared with enterprise custody platforms: 35+ chains including BTC, ETH and SOL vs EVM only; confidential treasuries always vs no; team permissions on both; free vs $18,000+ a year; no commitment vs annual contracts; setup in minutes vs weeks\" loading=\"lazy\" decoding=\"async\" class=\"pb-fig__img\"></div></figure><p class=\"pb-p\">Enterprise or need a custom setup? <a href=\"https://business.near.com\" rel=\"noopener noreferrer\" target=\"_blank\">Request early access</a> and we'll tailor it with you.</p><h2 id=\"under-the-hood-your-treasury-built-on-near-intents\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">06</span><span class=\"pb-h2__t\">Under the hood: your treasury, built on NEAR Intents</span></h2><p class=\"pb-p\">Your Treasury Contract is self-custodial. Funds sit in the NEAR Intents protocol and your Treasury Contract authorises transactions only when your organization’s approval rules are satisfied, and NEAR Business holds no key or key share in respect of your Treasury Contract. The contract lives onchain, independent of the NEAR Business app. Four pieces of NEAR infrastructure make that work:</p><p class=\"pb-p\"><strong>The Treasury Contract.</strong> Each treasury is governed by a SputnikDAO multisig contract on NEAR mainnet. Every request commits to its quote by hash, so the public approval is tied to one specific transaction without revealing it.</p><p class=\"pb-p\"><strong>MPC signing.</strong> When a request clears its threshold, the Treasury Contract asks NEAR's multi-party computation (MPC) signing network to sign it. NEAR’s MPC network, the same one behind Chain Signatures, splits the signing key across independent node operators. A signature only exists when a threshold of them cooperate, and signing only starts after your approvals are in.</p><p class=\"pb-p\"><strong>Confidential Intents.</strong> Balances, swaps, and payments run on a confidential NEAR shard operated by independent, permissioned validators. No MEV, no frontrunning, no strategy exposure, and no proofs for your team to generate. It's the same confidential layer behind <a href=\"https://near.com\" rel=\"noopener noreferrer\" target=\"_blank\">near.com</a>.</p><p class=\"pb-p\"><strong>NEAR Intents.</strong> The execution layer underneath it all. You state the outcome you want, solvers (including professional market makers) compete to fill it, and a Verifier contract on NEAR settles it atomically, so a swap either completes in full or is refunded. It's used as core infrastructure by teams like Ledger, Trust Wallet, Brave and LI.FI.</p><h2 id=\"see-it-with-your-own-treasury-structure\" class=\"pb-h2\" data-reveal=\"\"><span class=\"pb-h2__n\" aria-hidden=\"true\">07</span><span class=\"pb-h2__t\">See it with your own treasury structure</span></h2><p class=\"pb-p\">NEAR Business is invite-only while we onboard a small group of teams. Request access and we aim to respond within one business day to set up a 30-minute walkthrough with your actual signer setup and chains. After the walkthrough, we open access for your team. No commitment, and nothing to pay to get started.</p><p class=\"pb-p\"><strong><a href=\"https://business.near.com\" rel=\"noopener noreferrer\" target=\"_blank\">Request early access at business.near.com →</a></strong></p>"
   },
   "notes": [],
   "sections": [
    {
     "id": "confidential-from-the-market-legible-to-your-auditors",
     "t": "Confidential from the market. Legible to your auditors."
    },
    {
     "id": "the-full-operating-surface-of-a-treasury-desk",
     "t": "The full operating surface of a treasury desk"
    },
    {
     "id": "manage-btc-eth-sol-near-and-assets-from-35-chains-from-a-sin",
     "t": "Manage BTC, ETH, SOL, NEAR, and assets from 35+ chains from a single dashboard"
    },
    {
     "id": "built-for-treasuries-that-run-on-a-mandate",
     "t": "Built for treasuries that run on a mandate"
    },
    {
     "id": "advanced-treasury-control-without-enterprise-prices",
     "t": "Advanced treasury control without enterprise prices"
    },
    {
     "id": "under-the-hood-your-treasury-built-on-near-intents",
     "t": "Under the hood: your treasury, built on NEAR Intents"
    },
    {
     "id": "see-it-with-your-own-treasury-structure",
     "t": "See it with your own treasury structure"
    }
   ],
   "readMin": 5,
   "video": null
  }
 }
];
