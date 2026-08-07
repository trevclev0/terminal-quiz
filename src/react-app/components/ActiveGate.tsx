import type { ActiveGate as ActiveGateType } from "@api/queries/useProgramProgressionQuery";
import useTypewriter from "@hooks/useTypewriter";
import { MAX_CLUES_PER_GATE } from "@shared/types";
import type { ChangeEvent, RefObject, SubmitEvent } from "react";
import styles from "./ActiveGate.module.css";
import gateStyles from "./Gate.module.css";

type ActiveGateProps = {
  id: string;
  gate: ActiveGateType;
  guess: string;
  message: string | null;
  guessSucceeded?: boolean | null;
  isShaking: boolean;
  isPending: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  changeHandler: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: SubmitEvent<HTMLFormElement>) => void | Promise<void>;
  canRequestClue: boolean;
  isClueLimitReached?: boolean;
  requestClueMutation?: {
    isPending: boolean;
  };
  handleRequestClue: () => void;
  clues?: string[];
  enabled?: boolean;
};

// Mounted only when typing is allowed. The hook types from empty on mount;
// gating with an `enabled` flag instead would paint the full text for a
// frame while `enabled` is false (the hook resolves `enabled: false` to
// instant full text), then wipe and retype once enabled — a visible flash.
// See docs/typewriter-text.md §2b (same pattern as the boot banner).
function TypedQuestion({ text }: { text: string }) {
  const { displayedText } = useTypewriter(text);
  return (
    <p className="description" aria-hidden="true">
      {displayedText}
    </p>
  );
}

export default function ActiveGate({
  id,
  gate,
  guess,
  message,
  guessSucceeded = null,
  isShaking,
  isPending,
  inputRef,
  changeHandler,
  handleSubmit,
  canRequestClue,
  isClueLimitReached = false,
  requestClueMutation,
  handleRequestClue,
  clues = [],
  enabled = true,
}: ActiveGateProps) {
  const formAriaLabel = `${gate.label} - enter password and press Enter to submit`;
  const isMutationPending = requestClueMutation?.isPending ?? false;
  const clueNumber = clues.length + 1;
  const clueSuffix =
    clueNumber === 1
      ? "st"
      : clueNumber === 2
        ? "nd"
        : clueNumber === 3
          ? "rd"
          : "th";
  const isFinalClue = clueNumber === MAX_CLUES_PER_GATE;

  const pendingMessage = isPending ? "Verifying..." : null;
  const displayMessage = pendingMessage ?? message;

  return (
    <div
      id={id}
      className={
        isShaking ? `${gateStyles.gate} ${styles.shake}` : gateStyles.gate
      }
    >
      <details open>
        <summary className={gateStyles.gateSummary}>{gate.label}</summary>
        <form onSubmit={handleSubmit} aria-label={formAriaLabel}>
          <span
            id="gate-question-description"
            className="sr-only"
            data-testid="gate-question"
          >
            {gate.question}
          </span>
          {enabled ? (
            <TypedQuestion text={gate.question} />
          ) : (
            <p className="description" aria-hidden="true" />
          )}
          <div className={gateStyles.promptLine}>
            <span className={styles.promptCaret} aria-hidden="true">
              &gt;
            </span>
            <input
              aria-label={`${gate.label} password input`}
              aria-describedby="gate-question-description"
              ref={inputRef}
              type="text"
              placeholder="enter password..."
              value={guess}
              onChange={changeHandler}
              className={gateStyles.gateInput}
              disabled={isPending || isMutationPending}
            />
          </div>
          {displayMessage && (
            <p
              aria-live="polite"
              role="status"
              className={
                pendingMessage
                  ? "response pending"
                  : guessSucceeded === false
                    ? `response ${styles.fail}`
                    : "response"
              }
            >
              {displayMessage}
            </p>
          )}

          {canRequestClue && !isClueLimitReached && (
            <p className={styles.cluePrompt}>
              <button
                type="button"
                className={styles.clueLink}
                onClick={handleRequestClue}
                disabled={isMutationPending || isPending || guess.trim() === ""}
              >
                {isMutationPending
                  ? "Fetching Clue..."
                  : isFinalClue
                    ? "Get Final Clue"
                    : `Get ${clueNumber}${clueSuffix} Clue`}
              </button>
            </p>
          )}

          {clues.length > 0 && (
            <div className={styles.cluesList} aria-live="polite">
              <p className={styles.cluesHeading}>Clues:</p>
              <ul className={styles.cluesBulletList}>
                {clues.map((clue) => (
                  <li
                    key={clue}
                    className={styles.clueLine}
                    data-testid="clue-text"
                  >
                    {clue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </details>
    </div>
  );
}
