import type { Metadata } from "next";
import Link from "next/link";
import styles from "../Selector.module.css";
import x from "./Extra.module.css";
import { GROUPS } from "./pages";

export const metadata: Metadata = { title: "Extra pages" };

// The extra pages (pages.ts), in the selector's language. Plain <a> on purpose, as on "/": each page loads fresh.
const Go = () => (
  <span className={styles.go} aria-hidden="true">
    <svg viewBox="0 0 24 24" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.25" /></svg>
  </span>
);

export default function ExtraIndex() {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link href="/" aria-label="Homepage directions"><img className={styles.logo} src="/brand/logo.svg" alt="NEAR" width={88} height={23} /></Link>
        <Link className={styles.toplink} href="/"><span aria-hidden="true">←</span> Homepage directions</Link>
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
            <p className={x.gnote}>{g.note}</p>
          </div>
          <ul className={`${styles.grid} ${x.grid}`}>
            {g.pages.map((p) => (
              <li key={p.href}>
                <a className={styles.card} href={p.href}>
                  <span className={styles.frame}><img className={styles.img} src={p.img} alt="" width={1200} height={750} loading="lazy" /></span>
                  <span className={styles.meta}><span className={styles.n}>{p.n}</span><span className={styles.path}>{p.href}</span></span>
                  <span className={styles.row}><span className={`${styles.name} ${x.name}`}>{p.name}</span><Go /></span>
                  <span className={styles.note}>{p.note}</span>
                  <span className={styles.tags}>{p.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
