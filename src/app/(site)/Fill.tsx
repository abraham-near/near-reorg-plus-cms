import styles from "./Selector.module.css";

// Empty ruled cells that close the last row of a card grid (Selector.module.css .grid: three columns, two below 1200 px, one below 900 px), so every
// row of the grid has its rules and its + even when it holds fewer cards. Decorative: hidden from assistive tech.
export function Fill({ n }: { n: number }) {
  const three = (3 - (n % 3)) % 3, two = (2 - (n % 2)) % 2;
  return (
    <>
      {Array.from({ length: Math.max(three, two) }, (_, i) => (
        <li key={i} className={`${styles.fill}${i < three ? ` ${styles.fill3}` : ""}${i < two ? ` ${styles.fill2}` : ""}`} aria-hidden="true" />
      ))}
    </>
  );
}
