import type { CompletedGate as CompletedGateType } from "@api/queries/useProgramProgressionQuery";
import useTypewriter from "@hooks/useTypewriter";
import styles from "./Gate.module.css";

type CompletedGateProps = {
  id: string;
  gate: CompletedGateType;
  isLast?: boolean;
  onComplete?: () => void;
};

export default function CompletedGate({
  id,
  gate,
  isLast = false,
  onComplete,
}: CompletedGateProps) {
  const { displayedText } = useTypewriter(gate.successMessage, {
    enabled: isLast,
    onComplete,
  });

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
          <p className="clue" aria-hidden="true" data-testid="success-message">
            {displayedText}
          </p>
          <span className="sr-only">{gate.successMessage}</span>
        </form>
      </details>
    </div>
  );
}
