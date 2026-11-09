// A small fixed control on shared pages: view the page as v1 or v2. Plain links with ?v= (a full load, remembered by the head script);
// the current one is marked from html[data-version] in CSS, so it needs no JS.
import styles from "./VersionSwitch.module.css";

export function VersionSwitch() {
  return (
    <nav className={styles.sw} aria-label="Homepage direction">
      <span className={styles.l}>View as</span>
      <a className={`${styles.o} ${styles.v1}`} href="?v=1">v1 · Flat</a>
      <a className={`${styles.o} ${styles.v2}`} href="?v=2">v2 · 3D</a>
    </nav>
  );
}
