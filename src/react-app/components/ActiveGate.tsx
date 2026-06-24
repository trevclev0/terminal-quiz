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
}: ActiveGateProps) {
  return (
    <div id={id} className={isShaking ? "gate shake" : "gate"}>
      <details open>
        <summary>{gate.label}</summary>
        <form
          onSubmit={handleSubmit}
          aria-label={`${gate.label} - enter password and press Enter to submit`}
        >
          <p className="description">{gate.question}</p>
          <input
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
              className={
                message === "Access Denied." ? "response fail" : "response"
              }
            >
              {message}
            </p>
          )}
        </form>
      </details>
    </div>
  );
}
