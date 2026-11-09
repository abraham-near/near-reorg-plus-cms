import type { OwnKey } from "../chapter-one/OwnArt";

// The story after the anthem (D29): the mission line and "Own your" as one beat. Copy verbatim from spec/pages/home.md
// §1.3–1.4. On the rail (D38) the problem flows straight into the answer, which stays up while the four things you own
// arrive under it; the lab options still turn "NEAR is where they connect." into the answer (morph.ts).

export const CONNECT = ["AI is the frontend.", "Blockchain is the backend."];
export const MEET = { near: "NEAR", rest: " is where they connect." };
export const PROBLEM = "Whoever runs the layer beneath your agents sees what they see and keeps what they earn.";
export const ANSWER = { pre: "On ", near: "NEAR", mid: ", that layer is ", owned: "user-owned." };

export const OWN: { key: OwnKey; word: string; line: string }[] = [
  { key: "data", word: "data.", line: "Transactions and prompts stay confidential, even from the infrastructure running them." },
  { key: "assets", word: "assets.", line: "Hold, swap and move everything you have from one account only you control." },
  { key: "intelligence", word: "intelligence.", line: "Inference and agents run inside hardware enclaves, and every request returns a signed proof of what ran." }, // F17
  { key: "identity", word: "identity.", line: "One NEAR account that reads like a name, works across 35+ chains, and upgrades to post-quantum keys in a single rotation." },
];
