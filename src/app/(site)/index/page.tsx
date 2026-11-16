import type { Metadata } from "next";
import styles from "../Selector.module.css";
import { COUNT, GROUPS } from "../extra/pages";
import { FINALS } from "./pages";

export const metadata: Metadata = { title: "Index" };

const EXTRA_LINE = GROUPS.map((g) => `${g.title} (${g.pages.length})`).join(" · ");

// The index (/index): the site's final pages, one card each (./pages.ts), and the way into /extra, where the explorations live (../extra/pages.ts).
// Plain <a> on purpose: each page loads fresh (their global CSS and their boots never meet).
export default function Selector() {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a plain link on purpose: the homepage loads fresh, as every card here */}
        <a href="/" aria-label="NEAR homepage"><img className={styles.logo} src="/brand/logo.svg" alt="NEAR" width={88} height={23} /></a>
        <div className={styles.topr}>
          <p className={styles.label}>Final pages · {FINALS.length}</p>
          <a className={styles.toplink} href="/extra">Extra pages <span aria-hidden="true">→</span></a>
        </div>
      </header>

      <div className={styles.intro}>
        <h1 className={styles.h}>The site, page by page<span className={styles.sq} aria-hidden="true" /></h1>
        <p className={styles.sub}>The final version of every page, at the address it ships at. Explorations and other versions are in Extra pages.</p>
      </div>

      <ul className={styles.grid}>
        {FINALS.map((v, i) => (
          <li key={v.id}>
            <a className={styles.card} href={v.href}>
              <span className={styles.frame}>
                <img className={styles.img} src={v.img} alt="" width={1200} height={750} loading={i < 3 ? undefined : "lazy"} />
              </span>
              <span className={styles.meta}>
                <span className={styles.n}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.path}>{v.path ?? v.href}</span>
              </span>
              <span className={styles.row}>
                <span className={styles.name}>{v.name}</span>
                <span className={styles.go} aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.25" /></svg>
                </span>
              </span>
              <span className={styles.note}>{v.note}</span>
              <span className={styles.tags}>
                {v.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/* the way into /extra (../extra/pages.ts) */}
      <a className={styles.extra} href="/extra">
        <span className={styles.n}>Extra pages</span>
        <span className={styles.extraName}>{EXTRA_LINE}</span>
        <span className={styles.path}>/extra · {COUNT} pages</span>
        <span className={styles.go} aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.25" /></svg>
        </span>
      </a>
    </main>
  );
}
