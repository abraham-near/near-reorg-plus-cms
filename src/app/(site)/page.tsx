import styles from "./Selector.module.css";
import { COUNT, GROUPS } from "./extra/pages";

const EXTRA_LINE = GROUPS.map((g) => `${g.title} (${g.pages.length})`).join(" · ");

// The index: the pages chosen so far, the homepage (home v5 on the forest) and the blog (direction J, at /blog). The other homes (/home-v1…v4) still
// exist, unlisted. Plain <a> on purpose: each page loads fresh (their global CSS and their boots never meet).
const VERSIONS = [
  {
    href: "/home-v5",
    n: "01",
    name: "Homepage",
    note: "The new copy on a forest hero: the wordmark header that spreads, a six-line intro, a still Stack and the revenue story with a flat chart.",
    tags: ["Forest hero", "Wordmark header", "Flat chart"],
    img: "/selector-v5.webp",
  },
  {
    href: "/blog",
    n: "02",
    name: "Blog",
    note: "Reading rail, open: a sticky rail of search, type, sort and view beside the feed, open cards on whitespace, pages of six. The CMS's posts first.",
    tags: ["Sidebar", "Blog / Press / Watch", "CMS posts"],
    img: "/extra/blog-j.webp",
  },
];

export default function Selector() {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <img className={styles.logo} src="/brand/logo.svg" alt="NEAR" width={88} height={23} />
        <div className={styles.topr}>
          <p className={styles.label}>The site</p>
          <a className={styles.toplink} href="/extra">Extra pages <span aria-hidden="true">→</span></a>
        </div>
      </header>

      <div className={styles.intro}>
        <h1 className={styles.h}>The homepage and the blog<span className={styles.sq} aria-hidden="true" /></h1>
        <p className={styles.sub}>The chosen homepage, the October 2026 copy on a misty forest, and the blog it leads to.</p>
      </div>

      <ul className={styles.grid}>
        {VERSIONS.map((v) => (
          <li key={v.n}>
            <a className={styles.card} href={v.href}>
              <span className={styles.frame}>
                <img className={styles.img} src={v.img} alt="" width={1200} height={750} />
              </span>
              <span className={styles.meta}>
                <span className={styles.n}>{v.n}</span>
                <span className={styles.path}>{v.href}</span>
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

      {/* the way into /extra (src/app/extra/pages.ts) */}
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
