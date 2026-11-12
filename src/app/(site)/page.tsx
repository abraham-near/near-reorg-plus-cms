import styles from "./Selector.module.css";
import { COUNT, GROUPS } from "./extra/pages";

const EXTRA_LINE = GROUPS.map((g) => `${g.title} (${g.pages.length})`).join(" · ");

// The index: a choice between the homepage directions in play (3D render, the new copy, and v5 on the forest; /home-v1 and /home-v3 still exist, unlisted). Plain <a> on purpose: each version loads fresh (their global CSS and their boots never meet).
const VERSIONS = [
  {
    href: "/home-v2",
    n: "01",
    name: "3D render",
    note: "Rendered in 3D: filmed landscapes scrubbed by the scroll, glass and chrome objects, and a rendered Stack.",
    tags: ["Rendered film", "3D scenes", "Scroll-scrubbed"],
    img: "/selector-v2.webp",
  },
  {
    href: "/home-v4",
    n: "02",
    name: "New copy",
    note: "Flat + b10 with the October 2026 copy: a new intro, rail and Stack, a revenue row, updated figures and six voices.",
    tags: ["Oct 2026 copy", "Revenue row", "Six voices"],
    img: "/selector-v4.webp",
  },
  {
    href: "/home-v5",
    n: "03",
    name: "Mist forest",
    note: "The new copy on a forest hero: the wordmark header that spreads, a six-line intro, a still Stack and the revenue story with a flat chart.",
    tags: ["Forest hero", "Wordmark header", "Flat chart"],
    img: "/selector-v5.webp",
  },
];

export default function Selector() {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <img className={styles.logo} src="/brand/logo.svg" alt="NEAR" width={88} height={23} />
        <div className={styles.topr}>
          <p className={styles.label}>Homepage directions</p>
          <a className={styles.toplink} href="/extra">Extra pages <span aria-hidden="true">→</span></a>
        </div>
      </header>

      <div className={styles.intro}>
        <h1 className={styles.h}>Three versions of the homepage<span className={styles.sq} aria-hidden="true" /></h1>
        <p className={styles.sub}>Rendered in 3D, flat with b10’s navigation and the October 2026 copy, or that copy on a misty forest.</p>
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
