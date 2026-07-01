import type { ActiveGate as ActiveGateType } from "@api/queries/useProgramProgressionQuery";
import type { ChangeEvent, RefObject, SubmitEvent } from "react";

type ActiveGateProps = {
  id: string;
  gate: ActiveGateType;
  guess: string;
  message: string | null;
  isShaking: boolean;
  isPending: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  changeHandler: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: SubmitEvent<HTMLFormElement>) => void | Promise<void>;
  canRequestClue: boolean;
  requestClueMutation: {
    isPending: boolean;
    data?: {
      clueText: string | null;
      isClueLimitReached: boolean;
      cluesRemaining: number;
    } | null;
  };
  handleRequestClue: () => void;
  clues: string[];
};

export default function ActiveGate({
  id,
  gate,
  guess,
  message,
  isShaking,
  isPending,
  inputRef,
  changeHandler,
  handleSubmit,
  canRequestClue,
  requestClueMutation,
  handleRequestClue,
  clues,
}: ActiveGateProps) {
  const formAriaLabel = `${gate.label} - enter password and press Enter to submit`;
  const isClueLimitReached =
    requestClueMutation.data?.isClueLimitReached ?? false;

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
                message === "Access Denied." ? "response fail" : "response"
              }
            >
              {message}
            </p>
          )}

          {canRequestClue && (
            <div className="clue-section" style={{ marginTop: "1rem" }}>
              <button
                type="button"
                onClick={handleRequestClue}
                disabled={requestClueMutation.isPending || isClueLimitReached}
              >
                {requestClueMutation.isPending
                  ? "Fetching Clue..."
                  : "Get Clue"}
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
