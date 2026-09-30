import styles from "./GateProgress.module.css";

const BAR_CELLS = 10;

type GateProgressProps = {
  completed: number;
  total: number;
};

/**
 * ASCII progress bar for a program run (#310). Drawn with `#` and `.`
 * rather than block characters: the VT220 font has no block-drawing glyphs,
 * so `█` / `░` would fall back to Courier.
 */
export function GateProgress({ completed, total }: GateProgressProps) {
  if (total <= 0) return null;

  // Defensive clamp: the total is counted live, so an author deleting gates
  // mid-play must not push the bar past full.
  const done = Math.min(Math.max(completed, 0), total);
  // Floor, not round, so the bar is full only once every gate is solved.
  const filled = Math.floor((done / total) * BAR_CELLS);
  const bar = "#".repeat(filled) + ".".repeat(BAR_CELLS - filled);

  const summary = `${done} of ${total} gates completed`;

  // progressbar children are presentational, so screen readers announce
  // aria-valuetext instead of reading the bar out character by character.
  // A progressbar isn't announced when its value changes, though, and on a
  // correct guess ActiveGate (and its role="status" line) unmounts straight
  // away. The polite live region is what tells a screen-reader user the
  // gate counted; it stays silent on first render, so page load is quiet.
  return (
    <>
      <div
        className={styles.progress}
        role="progressbar"
        aria-label="Program progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={summary}
        data-testid="gate-progress"
      >
        <span className={styles.label}>PROGRESS: </span>[{bar}] {done}/{total}
      </div>
      <span
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        data-testid="gate-progress-announcement"
      >
        {summary}
      </span>
    </>
  );
}
