"use client";
// v3's footer: b10's (near-homepage-directions /b10, js/footer.js "dark", the b8 composition), on our black. In normal flow after the page (no takeover).
// Top to bottom: the client's line with Get started · Products and Stack as six rows (icon, name, arrow) · five link columns · the socials with their icons,
// Back to top · ©, the legal links · the big `near`, which fills in once on arrival and has a short matte depth that leans toward the pointer (motion.ts).
// Copy: the client's, verbatim (nav-data.ts FOOTER, SiteFooter.tsx); socials from the brief.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { mount } from "./motion";
import { WORD_PATHS, WORD_VIEWBOX } from "./wordmark-paths";
import "./footer.css";

type Link = { name: string; href: string; icon?: string };
const ext = (h: string) => /^https?:/.test(h);
const PRODUCTS: [string, Link[]] = ["Products", [
  { name: "near.com", href: "https://near.com", icon: "menu-account" },
  { name: "Intents", href: "https://intents.near.org", icon: "menu-intents" },
  { name: "NEAR AI", href: "https://near.ai", icon: "menu-enclave" },
]];
const STACK: [string, Link[]] = ["Stack", [
  { name: "Protocol", href: "/protocol", icon: "menu-protocol" },
  { name: "Chain Abstraction", href: "/chain-abstraction", icon: "menu-chain-abstraction" },
  { name: "Quantum Security", href: "/quantum-security", icon: "menu-quantum" },
]];
const COLS: [string, Link[]][] = [
  ["Build", [{ name: "Docs", href: "https://docs.near.org/" }, { name: "Solutions", href: "/solutions" }]],
  ["Learn", [{ name: "Research", href: "/research" }, { name: "Blog", href: "/blog" }, { name: "Analytics", href: "/analytics" }]],
  ["Connect", [{ name: "Brand", href: "/brand" }, { name: "Contact", href: "/contact-us" }, { name: "Careers", href: "https://job-boards.eu.greenhouse.io/nearfoundation" }]],
  ["Fundamentals", [{ name: "History", href: "/about" }, { name: "Roadmap", href: "https://roadmap.near.org/" }, { name: "Economics", href: "/economics" }]],
  ["Ecosystem", [{ name: "NEAR Foundation", href: "/near-foundation" }, { name: "Ecosystem", href: "/ecosystem" }, { name: "Community", href: "/community" }, { name: "Governance", href: "https://houseofstake.org/" }]],
];
const LEGAL: Link[] = [{ name: "Terms of Use", href: "/terms" }, { name: "Privacy Policy", href: "/privacy" }, { name: "Cookie Policy", href: "/cookies" }, { name: "Official Rules", href: "/official-rules" }];
const SOCIAL: [string, string][] = [["X", "https://x.com/nearprotocol"], ["YouTube", "https://www.youtube.com/@NEARProtocol"], ["GitHub", "https://github.com/near"],
  ["Reddit", "https://www.reddit.com/r/nearprotocol/"], ["Telegram", "https://t.me/cryptonear"], ["Discord", "https://near.chat/"]];
const UI = { line: "Where money actually", accent: "moves.", cta: "Get started", ctaU: "https://near.com", copy: "© 2026 NEAR. All rights reserved.", top: "Back to top", ext: " (another NEAR site)" };

const Sr = ({ h }: { h: string }) => (ext(h) ? <span className="sr-only">{UI.ext}</span> : null);
const Ext = () => (
  <svg className="b10f-ext" viewBox="0 0 10 10" width="9" height="9" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
);
/** the line, one mask per word (it rises word by word) */
const words = (t: string, from: number) => t.split(" ").map((w, i) => (
  <span key={i}>{i > 0 && " "}<span className="b10f-w"><span className="b10f-wi" style={{ ["--d" as string]: `${(from + i) * 70}ms` }}>{w}</span></span></span>
));
const ms = (n: number) => ({ ["--d" as string]: `${Math.round(n)}ms` });

function Index({ g: [h, items], k }: { g: [string, Link[]]; k: number }) {
  return (
    <div className="b10f-idx">
      <p className="b10f-h" style={ms(k * 120)}>{h}</p>
      <ul>
        {items.map((it, i) => (
          <li key={it.name} style={ms(120 + k * 120 + i * 110)}>
            <a className="b10f-row" href={it.href} {...(ext(it.href) ? { target: "_blank", rel: "noopener" } : {})}>
              <i className="b10f-ic" data-icon={it.icon} data-icon-size="32" aria-hidden="true" />
              <span className="b10f-tx"><span className="b10f-nm">{it.name}</span></span>
              <span className="b10f-go" aria-hidden="true">{ext(it.href) ? "↗" : "→"}</span>
              <Sr h={it.href} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function V3Footer() {
  const ref = useRef<HTMLElement>(null);
  useScrollMotion(ref, mount);
  return (
    <footer ref={ref} className="b10f" id="footer" data-footer="dark">
      <div className="b10f-in">
        <div className="b10f-head b10f-rv">
          <p className="b10f-line">{words(UI.line, 0)} <span className="accent">{words(UI.accent, UI.line.split(" ").length)}</span></p>
          <a className="b10f-cta" href={UI.ctaU} target="_blank" rel="noopener" style={ms(420)}>
            <span className="b10f-cta-l">{UI.cta}</span>
            <svg className="b10f-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
            <Sr h={UI.ctaU} />
          </a>
        </div>
        <nav className="b10f-map" aria-label="Footer">
          <div className="b10f-prod b10f-rv"><Index g={PRODUCTS} k={0} /><Index g={STACK} k={1} /></div>
          <div className="b10f-cols b10f-rv">
            {COLS.map(([h, items], k) => (
              <div key={h} className="b10f-col" style={ms(k * 90)}>
                <p className="b10f-h">{h}</p>
                <ul>
                  {items.map((it, i) => (
                    <li key={it.name} style={ms(k * 90 + 160 + i * 45)}>
                      <a className="b10f-a" href={it.href} {...(ext(it.href) ? { target: "_blank", rel: "noopener" } : {})}>{it.name}{ext(it.href) && <Ext />}<Sr h={it.href} /></a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
        <div className="b10f-meta b10f-rv">
          <ul className="b10f-inline b10f-soc" style={ms(120)}>
            {SOCIAL.map(([s, u], i) => (
              <li key={s} style={ms(120 + i * 50)}>
                <a className="b10f-a" href={u} rel="me noopener" target="_blank"><i data-icon={s.toLowerCase()} data-icon-size="16" aria-hidden="true" />{s}</a>
              </li>
            ))}
          </ul>
          <a className="b10f-top" href="#" data-b10f-top="" style={ms(200)}>{UI.top} <span aria-hidden="true">↑</span></a>
          <div className="b10f-base" style={ms(280)}>
            <p className="b10f-copy">{UI.copy}</p>
            <ul className="b10f-legal">{LEGAL.map((l) => <li key={l.name}><a className="b10f-a" href={l.href}>{l.name}</a></li>)}</ul>
          </div>
        </div>
        <div className="b10f-word" aria-hidden="true">
          <svg viewBox={WORD_VIEWBOX} preserveAspectRatio="xMinYMin meet" focusable="false">{WORD_PATHS.map((d, i) => <path key={i} d={d} />)}</svg>
        </div>
      </div>
    </footer>
  );
}
