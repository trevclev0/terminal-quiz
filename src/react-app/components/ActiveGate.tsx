import type { ActiveGate as ActiveGateType } from "@api/queries/useProgramProgressionQuery";
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
    data?: {
      clueText: string | null;
      isClueLimitReached: boolean;
      cluesRemaining: number;
    } | null;
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
  isClueLimitReached: propIsClueLimitReached,
  requestClueMutation,
  handleRequestClue,
  clues = [],
}: ActiveGateProps) {
  const formAriaLabel = `${gate.label} - enter password and press Enter to submit`;
  const isClueLimitReached =
    propIsClueLimitReached ??
    requestClueMutation?.data?.isClueLimitReached ??
    false;
  const isMutationPending = requestClueMutation?.isPending ?? false;
  const cluesRemaining = requestClueMutation?.data?.cluesRemaining;
  const clueNumber = clues.length + 1;
  const clueSuffix =
    clueNumber === 1
      ? "st"
      : clueNumber === 2
        ? "nd"
        : clueNumber === 3
          ? "rd"
          : "th";
  const isFinalClue = cluesRemaining === 1;

  return (
    <div id={id} className={isShaking ? "gate shake" : "gate"}>
      <details open>
        <summary>{gate.label}</summary>
        <form onSubmit={handleSubmit} aria-label={formAriaLabel}>
          <p className="description">{gate.question}</p>
          <input
            aria-label={`${gate.label} password input`}
            ref={inputRef}
            type="text"
            placeholder="Enter password..."
            value={guess}
            onChange={changeHandler}
            disabled={isPending}
          />
          {message && (
            <p
              aria-live="polite"
              role="status"
              className={
                guessSucceeded === false ? "response fail" : "response"
              }
            >
              {message}
            </p>
          )}

          {canRequestClue && !isClueLimitReached && (
            <div className="clue-section" style={{ marginTop: "1rem" }}>
              <button
                type="button"
                onClick={handleRequestClue}
                disabled={isMutationPending || guess.trim() === ""}
              >
                {isMutationPending
                  ? "Fetching Clue..."
                  : isFinalClue
                    ? "Get Final Clue"
                    : `Get ${clueNumber}${clueSuffix} Clue`}
              </button>
            </div>
          )}

          {clues.length > 0 && (
            <div className="clues-list" style={{ marginTop: "1rem" }}>
              <strong>Clues:</strong>
              <ul>
                {clues.map((clue, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: clues are read-only and order is stable
                  <li key={index}>{clue}</li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </details>
    </div>
  );
}
