import type { Metadata } from "next";
import Link from "next/link";
import styles from "../Selector.module.css";
import x from "./Extra.module.css";
import { GROUPS } from "./pages";
import { Fill } from "../Fill";

export const metadata: Metadata = { title: "Extra pages" };

// The extra pages (pages.ts), in the selector's language: each group is its title over its cards, and each card the picture, the address, the name and
// the arrow (the group notes, the card notes and the tags stay in the data). Plain <a> on purpose, as on /index: each page loads fresh.
const Go = () => (
  <span className={styles.go} aria-hidden="true">
    <svg viewBox="0 0 24 24" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.25" /></svg>
  </span>
);

export default function ExtraIndex() {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link href="/index" aria-label="Homepage directions"><img className={styles.logo} src="/brand/logo.svg" alt="NEAR" width={88} height={23} /></Link>
        <Link className={styles.toplink} href="/index"><span aria-hidden="true">←</span> Homepage directions</Link>
      </header>

      <div className={`${styles.intro} ${x.intro}`}>
        <h1 className={styles.h}>Extra pages<span className={styles.sq} aria-hidden="true" /></h1>
        <nav className={x.jump} aria-label="Groups">
          {GROUPS.map((g) => <a key={g.id} href={`#${g.id}`}>{g.title}<span>{g.pages.length}</span></a>)}
        </nav>
      </div>

      {GROUPS.map((g) => (
        <section key={g.id} id={g.id} className={x.group} aria-labelledby={`${g.id}-t`}>
          <div className={x.head}>
            <h2 id={`${g.id}-t`} className={x.h2}>{g.title}</h2>
          </div>
          <ul className={`${styles.grid} ${x.grid}`}>
            {g.pages.map((p) => (
              <li key={p.href}>
                <a className={`${styles.card}${p.featured ? ` ${x.featured}` : ""}`} href={p.href}>
                  <span className={styles.frame}>{p.featured && <span className={x.badge}>Featured</span>}<img className={styles.img} src={p.img} alt="" width={1200} height={750} loading="lazy" /></span>
                  <span className={styles.meta}><span className={styles.path}>{p.href}</span></span>
                  <span className={styles.row}><span className={`${styles.name} ${x.name}`}>{p.name}</span><Go /></span>
                </a>
              </li>
            ))}
            <Fill n={g.pages.length} />
          </ul>
        </section>
      ))}
    </main>
  );
}
