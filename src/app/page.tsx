import styles from "./Selector.module.css";

// The index: only a choice between the two homepages. Plain <a> on purpose: each version loads fresh (their global CSS and their boots never meet).
const VERSIONS = [
  { href: "/home-v1", n: "v1", name: "Carril vivo", note: "The globe intro, the living rail with the isometrics, the Stack, then Abraham’s sections." },
  { href: "/home-v2", n: "v2", name: "Lawrence + Abraham", note: "Lawrence’s hero, rail and Stack, then Abraham’s header, sections and footer." },
];

export default function Selector() {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <img className={styles.logo} src="/brand/logo.svg" alt="NEAR" width={88} height={23} />
        <p className={styles.label}>Homepage prototypes</p>
      </header>
      <h1 className={styles.h}>
        Choose a <span className={styles.acc}>version.</span>
      </h1>
      <ul className={styles.list}>
        {VERSIONS.map((v) => (
          <li key={v.n}>
            <a className={styles.row} href={v.href}>
              <span className={styles.n}>{v.n}</span>
              <span className={styles.body}>
                <span className={styles.name}>{v.name}</span>
                <span className={styles.note}>{v.note}</span>
              </span>
              <span className={styles.go} aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.25" /></svg>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
