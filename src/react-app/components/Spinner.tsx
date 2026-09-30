import styles from "./Spinner.module.css";

/**
 * Terminal-style `| / - \` spinner (#311). Purely decorative: the glyphs are
 * drawn by CSS, so the element has no text content, and it is aria-hidden.
 * Place it next to text that says what is loading; that text stays the
 * accessible name and the exact `textContent` tests and E2E match on.
 */
export function Spinner() {
  return (
    <span className={styles.spinner} aria-hidden="true" data-testid="spinner" />
  );
}
