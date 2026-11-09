"use client";
import { useRef, useState, type ReactNode } from "react";
import { useScrollMotion } from "@/components/v1/motion";
import { mount } from "./motion";
import s from "./GetIntoNear.module.css";

// Get into NEAR (r17 v1 gi-b, "list with preview"). Left: the heading and three rows, each ONE target (its link stretches over the row);
// right: the pointed path's photo and where it goes. Below 1100 px each row carries its own thumbnail instead.
type Path = { name: string; line: ReactNode; label: string; href: string; host: string; img: string };

const nw = (t: string) => <span className={s["gb-nw"]}>{t}</span>;
const PATHS: Path[] = [
  { name: "Trade on NEAR", line: <>Trade, earn yield and go confidential, all from one near.com account.</>,
    label: "Open near.com", href: "https://near.com", host: "near.com", img: "/home/get-into/home-paths-trade-v3.webp" },
  { name: "Integrate NEAR", line: <>Add {nw("NEAR Intents")} for confidential {nw("cross-chain")} execution, or {nw("NEAR AI")} for private inference you can verify.</>,
    label: "Integration docs", href: "https://docs.near.org/", host: "docs.near.org", img: "/home/get-into/home-paths-integrate-v2.webp" },
  { name: "Build on NEAR", line: <>Build onchain apps and AI agents on battle-tested infrastructure with built-in confidentiality and {nw("cross-chain")} reach.</>,
    label: "Start building", href: "https://docs.near.org/", host: "docs.near.org", img: "/home/get-into/home-paths-build-v3.webp" },
];
const idx = (i: number) => String(i + 1).padStart(2, "0");

export function GetIntoNear() {
  const ref = useRef<HTMLElement>(null);
  const [act, setAct] = useState(0);
  useScrollMotion(ref, mount);

  return (
    <section ref={ref} className={s.gb} id="paths" aria-labelledby="gi-b-title">
      <div className={s["gb-inner"]} data-k="inner" data-act={act}>
        <h2 id="gi-b-title" className={s["gb-h"]} data-k="h">Get into <span className={`acc ${s.acc}`}>NEAR</span></h2>
        <ul className={s["gb-list"]} data-k="list" role="list">
          {PATHS.map((p, i) => (
            <li key={p.name} className={s["gb-row"]} data-k="row" data-i={i} onPointerEnter={() => setAct(i)} onFocus={() => setAct(i)}>
              <span className={s["gb-idx"]} aria-hidden="true">{idx(i)}</span>
              <div className={s["gb-th"]}><img src={p.img} alt="" width={800} height={598} decoding="async" /></div>
              <div className={s["gb-txt"]}>
                <h3 className={s["gb-name"]}>{p.name}</h3>
                <p className={s["gb-line"]}>{p.line}</p>
              </div>
              <p className={s["gb-act"]}>
                <a className={s["gb-link"]} href={p.href}>
                  <span className={s["gb-btn"]}>
                    <span className={s["gb-label"]}>{p.label}</span>
                    <svg className={s["gb-ext"]} viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
                  </span>
                  <span className="sr-only"> (another NEAR site)</span>
                </a>
              </p>
            </li>
          ))}
        </ul>
        <div className={s["gb-pv"]} aria-hidden="true">
          <div className={s["gb-pv-frame"]} data-k="frame">
            {PATHS.map((p, i) => (
              <div key={p.name} className={s["gb-pv-img"]} data-i={i}><img src={p.img} alt="" width={800} height={598} decoding="async" /></div>
            ))}
          </div>
          <p className={s["gb-pv-cap"]}>
            {PATHS.map((p, i) => <span key={p.name} data-i={i}>{idx(i)} · {p.host}</span>)}
          </p>
        </div>
      </div>
    </section>
  );
}
