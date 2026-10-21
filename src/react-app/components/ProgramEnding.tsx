import { useKeyboardShortcuts } from "@hooks/useKeyboardShortcuts";
import useTypewriter from "@hooks/useTypewriter";
import type { GetProgramProgressionQuery } from "@shared/generated/graphql";
import formatElapsed from "@utils/formatElapsed";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ProgramEnding.module.css";

export const THE_END_TEXT = "The End";
// Deliberately slower than gameplay text. This is the terminal moment at the
// end of a program, not a line to get through.
export const THE_END_TYPE_SPEED = 120;

// Faster than the heading: the readout is reference data, not the moment.
export const STATS_TYPE_SPEED = 25;
// Minimum dots between a label and its value, so the longest row still reads
// as a leader rather than a bare gap.
const MIN_LEADER_DOTS = 3;

// Null until the run is complete, and each field is null when the run
// predates tracking (see the server's stats resolver).
export type RunStats = NonNullable<
  GetProgramProgressionQuery["getProgramProgression"]
>["stats"];

type ProgramEndingProps = {
  canType: boolean;
  resetError: string | null;
  isResetting: boolean;
  // False while a dialog sits over the page, so R/N cannot act behind it.
  shortcutsEnabled: boolean;
  stats: RunStats | null;
  onSelectNewProgram: () => void;
  onPlayAgain: () => void;
};

function EndingHeading({ displayedText }: { displayedText: string }) {
  return (
    <h2>
      <span className="sr-only">{THE_END_TEXT}</span>
      <span aria-hidden="true" data-testid="the-end-heading">
        {displayedText}
      </span>
    </h2>
  );
}

// Mounted only once typing is cleared to start, for the same reason as every
// other typed surface: the hook resolves `enabled: false` to instant full
// text, so gating by that flag would flash the whole heading first.
function TypedHeading({ onComplete }: { onComplete: () => void }) {
  const { displayedText } = useTypewriter(THE_END_TEXT, {
    speed: THE_END_TYPE_SPEED,
    onComplete,
  });

  return <EndingHeading displayedText={displayedText} />;
}

type StatRow = { label: string; value: string };

// An untracked figure is left out rather than shown as "0" or "-", which
// would read as a real result.
function statRows(stats: NonNullable<RunStats>): StatRow[] {
  const rows: StatRow[] = [];
  if (stats.totalGuesses !== null) {
    rows.push({ label: "guesses", value: String(stats.totalGuesses) });
  }
  rows.push({ label: "hints used", value: String(stats.cluesUsed) });
  if (stats.elapsedSeconds !== null) {
    rows.push({ label: "time", value: formatElapsed(stats.elapsedSeconds) });
  }
  return rows;
}

// The dots are real characters, padded so every row is the same width in the
// monospace face. That lets the typewriter reveal the leaders along with the
// text, which a CSS-drawn leader could not.
function leaderText(rows: StatRow[]): string {
  const width =
    Math.max(...rows.map(({ label, value }) => label.length + value.length)) +
    MIN_LEADER_DOTS;
  return rows
    .map(({ label, value }) => {
      const dots = ".".repeat(width - label.length - value.length);
      return `> ${label} ${dots} ${value}`;
    })
    .join("\n");
}

// Mounted only after the heading finishes, which already implies typing was
// cleared to start, so the hook never needs its `enabled` option here.
function RunStatsReadout({ stats }: { stats: NonNullable<RunStats> }) {
  const rows = statRows(stats);
  const text = leaderText(rows);
  const { displayedText } = useTypewriter(text, { speed: STATS_TYPE_SPEED });

  return (
    <div className={styles.stats} data-testid="run-stats">
      <ul className="sr-only">
        {rows.map(({ label, value }) => (
          <li key={label}>
            {label} {value}
          </li>
        ))}
      </ul>
      <div className={styles.statsTyped}>
        {/* Invisible full-text copy holding the block at its final height, so
            the buttons below do not drop a line at a time while typing. */}
        <pre aria-hidden="true" className={styles.statsSizer}>
          {text}
        </pre>
        <pre aria-hidden="true" data-testid="run-stats-typed">
          {displayedText}
        </pre>
      </div>
    </div>
  );
}

// Rendered only while the program is finished, so unmounting on "play again"
// resets the reveal without an effect to clear it.
export default function ProgramEnding({
  canType,
  resetError,
  isResetting,
  shortcutsEnabled,
  stats,
  onSelectNewProgram,
  onPlayAgain,
}: ProgramEndingProps) {
  const [headingTyped, setHeadingTyped] = useState(false);
  const handleHeadingComplete = useCallback(() => setHeadingTyped(true), []);
  const selectNewProgramRef = useRef<HTMLButtonElement>(null);

  // Keyed on the reveal rather than on mount: the buttons are not in the tree
  // until the heading finishes, so there is nothing to focus before then.
  useEffect(() => {
    if (!headingTyped) return;
    selectNewProgramRef.current?.focus();
  }, [headingTyped]);

  // Gated on the reveal so a key cannot fire an action whose button is not
  // on screen yet, and on isResetting to match the disabled buttons.
  const enabled = shortcutsEnabled && headingTyped && !isResetting;
  useKeyboardShortcuts([
    { key: "r", onKey: onPlayAgain, enabled },
    { key: "n", onKey: onSelectNewProgram, enabled },
  ]);

  return (
    <div id="classic-ending" className={styles.ending}>
      {canType ? (
        <TypedHeading onComplete={handleHeadingComplete} />
      ) : (
        <EndingHeading displayedText="" />
      )}
      {headingTyped && stats && <RunStatsReadout stats={stats} />}
      {resetError && <p className={styles.resetError}>{resetError}</p>}
      {headingTyped && (
        <div className={styles.actionButtons}>
          <button
            ref={selectNewProgramRef}
            type="button"
            onClick={onSelectNewProgram}
            disabled={isResetting}
            title="Select new program"
          >
            Select new program
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            disabled={isResetting}
            title={isResetting ? "Restarting..." : "Play program again"}
          >
            {isResetting ? "Restarting..." : "Play program again"}
          </button>
        </div>
      )}
    </div>
  );
}
