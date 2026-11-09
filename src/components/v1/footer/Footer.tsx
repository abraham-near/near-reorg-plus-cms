"use client";
/* The footer: near-org-cms's SiteFooter "veil" (components/site/SiteFooter.tsx) in our colours and type, after r17 v1.
 * The headline and the eight link groups render twice: the static dark block (phones, reduced motion, no JS) and the takeover panel (desktop with motion, ./motion.ts). */
import { useRef } from "react";
import { useScrollMotion } from "@/components/v1/motion";
import { mount } from "./motion";
import "./footer.css";

type Link = { label: string; href: string; ext?: boolean };
type Group = { title: string; links: Link[] };

const GROUPS: Group[] = [
  { title: "Products", links: [
    { label: "near.com", href: "https://near.com", ext: true },
    { label: "Intents", href: "https://intents.near.org", ext: true },
    { label: "NEAR AI", href: "https://near.ai", ext: true },
  ] },
  { title: "Stack", links: [
    { label: "Protocol", href: "/protocol" },
    { label: "Chain Abstraction", href: "/chain-abstraction" },
    { label: "Quantum Security", href: "/quantum-security" },
  ] },
  { title: "Build", links: [
    { label: "Docs", href: "https://docs.near.org/", ext: true },
    { label: "Solutions", href: "/solutions" },
  ] },
  { title: "Learn", links: [
    { label: "Research", href: "/research" },
    { label: "Blog", href: "/blog" },
    { label: "Analytics", href: "/analytics" },
  ] },
  { title: "Connect", links: [
    { label: "Brand", href: "/brand" },
    { label: "Contact", href: "/contact-us" },
    { label: "Careers", href: "https://job-boards.eu.greenhouse.io/nearfoundation", ext: true },
  ] },
  { title: "Fundamentals", links: [
    { label: "History", href: "/about" },
    { label: "Roadmap", href: "https://roadmap.near.org/", ext: true },
    { label: "Economics", href: "/economics" },
  ] },
  { title: "Ecosystem", links: [
    { label: "NEAR Foundation", href: "/near-foundation" },
    { label: "Ecosystem", href: "/ecosystem" },
    { label: "Community", href: "/community" },
    { label: "Governance", href: "https://houseofstake.org/", ext: true },
  ] },
  { title: "Terms and Policies", links: [
    { label: "Terms of Use", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Official Rules", href: "/official-rules" },
  ] },
];

function Headline() {
  return <p className="ft-h">Where money<br /><span className="ft-acc">actually moves.</span></p>;
}

function Cols() {
  return (
    <div className="ft-cols">
      {GROUPS.map((g) => (
        <nav key={g.title} className="ft-col" aria-label={g.title}>
          <h2>{g.title}</h2>
          <ul>
            {g.links.map((l) => (
              <li key={l.label}>
                {l.ext ? (
                  <a href={l.href} target="_blank" rel="noreferrer">
                    {l.label}
                    <svg className="ft-ext" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10" fill="none" stroke="currentColor" strokeWidth="1.25" /></svg>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <a href={l.href}>{l.label}</a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
  );
}

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  useScrollMotion(ref, mount);
  return (
    <footer ref={ref} className="ft" id="footer" data-footer>
      {/* a light copy of the wordmark exactly on the real one, so the rising wipe's edge cuts it in two colours */}
      <div className="ft-wipe" aria-hidden="true">
        <div className="ft-wm" data-bounce><img src="/brand/near-wordmark.svg" alt="" width={981} height={255} /></div>
      </div>
      <div className="ft-static"><div className="ft-c"><Headline /><Cols /></div></div>
      {/* the takeover panel: hidden (links included) until the wipe rises */}
      <div className="ft-panel"><div className="ft-c"><Headline /><Cols /></div></div>
      <div className="ft-wm" data-bounce data-wm><img src="/brand/near-wordmark.svg" alt="NEAR" width={981} height={255} /></div>
      <div className="ft-legal"><p>&copy; 2026 NEAR. All rights reserved.</p></div>
    </footer>
  );
}
