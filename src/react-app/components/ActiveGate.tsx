import type { ActiveGate as ActiveGateType } from "@api/queries/useProgramProgressionQuery";
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
};

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
          <p className="description">{gate.question}</p>
          <div className={gateStyles.promptLine}>
            <span className={styles.promptCaret} aria-hidden="true">
              &gt;
            </span>
            <input
              aria-label={`${gate.label} password input`}
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
              {clues.map((clue, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: clues are read-only and order is stable
                <p key={index} className={styles.clueLine}>
                  - {clue}
                </p>
              ))}
            </div>
          )}
        </form>
      </details>
    </div>
  );
}
