import type { ActiveGate as ActiveGateType } from "@api/queries/useProgramProgressionQuery";
import { MAX_CLUES_PER_GATE } from "@shared/types";
import type { ChangeEvent, RefObject, SubmitEvent } from "react";

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
    <div id={id} className={isShaking ? "gate shake" : "gate"}>
      <details open>
        <summary>{gate.label}</summary>
        <form onSubmit={handleSubmit} aria-label={formAriaLabel}>
          <p className="description">{gate.question}</p>
          <div className="prompt-line">
            <span className="prompt-caret" aria-hidden="true">
              &gt;
            </span>
            <input
              aria-label={`${gate.label} password input`}
              ref={inputRef}
              type="text"
              placeholder="enter password..."
              value={guess}
              onChange={changeHandler}
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
                    ? "response fail"
                    : "response"
              }
            >
              {displayMessage}
            </p>
          )}

          {canRequestClue && !isClueLimitReached && (
            <p className="clue-prompt">
              <button
                type="button"
                className="clue-link"
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
            <div className="clues-list" aria-live="polite">
              <p className="clues-heading">Clues:</p>
              {clues.map((clue, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: clues are read-only and order is stable
                <p key={index} className="clue-line">
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
