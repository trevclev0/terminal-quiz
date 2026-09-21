import type { CompletedGate as CompletedGateType } from "@api/queries/useProgramProgressionQuery";
import useTypewriter from "@hooks/useTypewriter";
import styles from "./Gate.module.css";

type CompletedGateProps = {
  id: string;
  gate: CompletedGateType;
  isLast?: boolean;
  canType?: boolean;
  onComplete?: () => void;
};

// Mounted only once this gate's successMessage is cleared to type. Gating the
// hook with `enabled` instead would paint the full message for a frame (the
// hook resolves `enabled: false` to instant full text), then wipe and retype
// once cleared. Same pattern as ActiveGate's TypedQuestion and the boot
// banner — see docs/typewriter-text.md §2b.
function TypedSuccessMessage({
  text,
  onComplete,
}: {
  text: string;
  onComplete?: () => void;
}) {
  const { displayedText } = useTypewriter(text, { onComplete });

  return (
    <p className="clue" aria-hidden="true" data-testid="success-message">
      {displayedText}
    </p>
  );
}

export default function CompletedGate({
  id,
  gate,
  isLast = false,
  canType = true,
  onComplete,
}: CompletedGateProps) {
  // Only the last completed gate types — earlier ones are solved context and
  // stay static. `canType` holds that last one back while the CRT boot
  // sequence is still running, so the two never type over each other.
  const shouldType = isLast && canType;

  return (
    <div id={id} className={styles.gate}>
      <details open>
        <summary className={styles.gateSummary}>{gate.label}</summary>
        <form aria-label={`${gate.label} - completed`}>
          <p className="description">{gate.question}</p>
          <div className={styles.promptLine}>
            <span className={styles.promptCaret} aria-hidden="true">
              [OK]
            </span>
            <input
              type="text"
              aria-label={gate.question}
              placeholder="Password entered correctly"
              value={gate.correctAnswer ? gate.correctAnswer : ""}
              disabled
              className={styles.gateInput}
              readOnly
            />
          </div>
          {shouldType ? (
            <TypedSuccessMessage
              text={gate.successMessage}
              onComplete={onComplete}
            />
          ) : (
            <p
              className="clue"
              aria-hidden="true"
              data-testid="success-message"
            >
              {isLast ? "" : gate.successMessage}
            </p>
          )}
          <span className="sr-only">{gate.successMessage}</span>
        </form>
      </details>
    </div>
  );
}
