import styles from "./Selector.module.css";
import { COUNT, GROUPS } from "./extra/pages";

const EXTRA_LINE = GROUPS.map((g) => `${g.title} (${g.pages.length})`).join(" · ");

// The index: a choice between the homepage directions. Plain <a> on purpose: each version loads fresh (their global CSS and their boots never meet).
const VERSIONS = [
  {
    href: "/home-v1",
    n: "01",
    name: "Flat design",
    note: "Drawn in dots and lines: a dot-matrix globe, a rail that draws itself as you scroll, and flat isometric illustrations.",
    tags: ["Dot globe", "Vector rail", "Isometrics"],
    img: "/selector-v1.webp",
  },
  {
    href: "/home-v2",
    n: "02",
    name: "3D render",
    note: "Rendered in 3D: filmed landscapes scrubbed by the scroll, glass and chrome objects, and a rendered Stack.",
    tags: ["Rendered film", "3D scenes", "Scroll-scrubbed"],
    img: "/selector-v2.webp",
  },
  {
    href: "/home-v3",
    n: "03",
    name: "Flat + b10",
    note: "The flat direction with b10's navigation and buttons: a floating pill nav whose menus unfold out of it, and b10's pill buttons.",
    tags: ["Dot globe", "Pill nav", "b10 buttons"],
    img: "/selector-v3.webp",
  },
  {
    href: "/home-v4",
    n: "04",
    name: "New copy",
    note: "Flat + b10 with the October 2026 copy: a new intro, rail and Stack, a revenue row, updated figures and six voices.",
    tags: ["Oct 2026 copy", "Revenue row", "Six voices"],
    img: "/selector-v4.webp",
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
        <h1 className={styles.h}>Four versions of the homepage<span className={styles.sq} aria-hidden="true" /></h1>
        <p className={styles.sub}>Drawn in dots and lines, rendered in 3D, or flat with b10’s navigation and buttons; and that last one again with the October 2026 copy.</p>
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
