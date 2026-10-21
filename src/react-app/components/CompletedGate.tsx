import type { CompletedGate as CompletedGateType } from "@api/queries/useProgramProgressionQuery";
import useTypewriter from "@hooks/useTypewriter";
import { useEffect, useRef, useState } from "react";
import styles from "./Gate.module.css";

// Must match the accessGranted animation's duration in Gate.module.css. A
// timer, not animationend, ends the flash: the typing chain behind it would
// stall for good if the animation were ever dropped or never ran.
export const ACCESS_GRANTED_FLASH_MS = 900;

type CompletedGateProps = {
  id: string;
  gate: CompletedGateType;
  isLast?: boolean;
  canType?: boolean;
  onComplete?: () => void;
  /**
   * Plays the ACCESS GRANTED flash in the success-message line before the
   * message shows (#313). For a gate just solved by a live guess only; the
   * caller leaves it off under reduced motion.
   */
  flash?: boolean;
  onFlashComplete?: () => void;
};

// Mounted only once this gate's successMessage is cleared to type. Gating the
// hook with `enabled` instead would paint the full message for a frame (the
// hook resolves `enabled: false` to instant full text), then wipe and retype
// once cleared. Same pattern as ActiveGate's TypedQuestion and the boot
// banner — see docs/typewriter-text.md "Mount when active".
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
  flash = false,
  onFlashComplete,
}: CompletedGateProps) {
  // Derived rather than seeded from `flash` on mount, so the flash still
  // plays if the prop arrives a render after the gate does.
  const [flashDone, setFlashDone] = useState(false);
  const isFlashing = flash && !flashDone;
  // Read through a ref so a parent re-render (a clue cooldown ticks every
  // 250ms) handing over a new callback can't restart the timer.
  const onFlashCompleteRef = useRef(onFlashComplete);
  onFlashCompleteRef.current = onFlashComplete;

  useEffect(() => {
    if (!isFlashing) return;
    const timer = setTimeout(() => {
      setFlashDone(true);
      onFlashCompleteRef.current?.();
    }, ACCESS_GRANTED_FLASH_MS);
    return () => clearTimeout(timer);
  }, [isFlashing]);

  // Only the last completed gate types — earlier ones are solved context and
  // stay static. `canType` holds that last one back while the CRT boot
  // sequence is still running, so the two never type over each other, and
  // the flash holds it back the same way: the message types over the flash.
  const shouldType = isLast && canType && !isFlashing;

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
          {isFlashing ? (
            <p
              className="clue"
              aria-hidden="true"
              data-testid="success-message"
            >
              <span className={styles.accessGranted}>ACCESS GRANTED</span>
            </p>
          ) : shouldType ? (
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
