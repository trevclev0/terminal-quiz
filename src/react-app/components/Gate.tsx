import useGateGuess from "@hooks/useGateGuess";
import useShake from "@hooks/useShake";
import type { Gate as GateT } from "@shared/types";
import { type ToggleEvent, useEffect, useRef, useState } from "react";

type GateProps = {
  id: string;
  gate: GateT;
  onSolve: () => void;
};

function Gate({ id, gate, onSolve }: GateProps) {
  const summaryRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(gate.isSolved);
  const { isShaking, shake, clearShake } = useShake();
  const { guess, response, guessResult, changeHandler, submitHandler } =
    useGateGuess({
      gate,
      shake,
      clearShake,
      onSolve,
    });

  const inputVal = gate.isSolved ? `✔ ${gate.correctAnswer}` : guess;
  const rspClasses = guessResult === "incorrect" ? "response fail" : "response";

  function toggleHandler(event: ToggleEvent<HTMLDetailsElement>) {
    const isOpen = event.newState === "open";
    setIsOpen(isOpen);
    if (isOpen) {
      inputRef.current?.focus();
    }
  }

  // Force open when solved
  useEffect(() => {
    if (gate.isSolved) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      summaryRef.current?.focus();
    }
  }, [gate.isSolved]);

  return (
    <div id={id} className={isShaking ? "gate shake" : "gate"} data-testid={id}>
      <details onToggle={toggleHandler} open={isOpen}>
        <summary ref={summaryRef}>{gate.label}</summary>
        <form
          onSubmit={submitHandler}
          aria-label={`${gate.label} - enter password and press Enter to submit`}
        >
          <p className="description">{gate.question}</p>
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter password..."
            value={inputVal}
            onChange={changeHandler}
            disabled={gate.isSolved}
          />
          {response && (
            <p aria-live="polite" className={rspClasses}>
              {response}
            </p>
          )}
          {gate.isSolved && <p className="clue">{gate.successMessage}</p>}
        </form>
      </details>
    </div>
  );
}

export default Gate;
