"use client";
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { mount } from "./motion";
import "./origin.css";

// Origin (Figma 496:571): one full-bleed band, the photo on the left, the green bar on the seam, the grey panel on the right with the heading and the account.
export function Origin() {
  const ref = useRef<HTMLElement>(null);
  useScrollMotion(ref, mount);
  return (
    <section ref={ref} className="og" id="origin" aria-labelledby="origin-title">
      <div className="og-inner">
        <figure className="og-fig">
          <img className="og-img" src="/home/origin/home-origin-attention-v1.webp" alt="" width={1400} height={1046} loading="lazy" decoding="async" />
        </figure>
        <div className="og-panel">
          <span className="og-bar" aria-hidden="true" />
          <h2 id="origin-title" className="og-h">
            Built by people who helped <span className="acc">invent modern AI</span>
          </h2>
          <div className="og-body">
            {/* each run of text stays ONE string (one text node), so the staircase splits it into whole words */}
            <p className="og-p">
              NEAR began in 2017 as an AI lab. <span className="og-nw">Co-founder</span> <span className="og-nw">Illia Polosukhin</span>{" "}
              <span className="og-nw">co-authored</span>
              {" “Attention Is All You Need”, the paper that introduced the Transformer behind today’s AI models. NEAR exists so the next era of AI is owned by its users."}
            </p>
            <p className="og-cta">
              <a className="og-btn" href="/about">
                Our story
                <svg className="og-ext" viewBox="0 0 10 10" width="9" height="9" aria-hidden="true" focusable="false">
                  <path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
