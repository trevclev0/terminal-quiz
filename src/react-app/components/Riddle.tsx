import useRiddleGuess from "@hooks/useRiddleGuess";
import useShake from "@hooks/useShake";
import { type ToggleEvent, useEffect, useRef, useState } from "react";
import type { Gate } from "@shared/types";

type RiddleProps = {
  id: string;
  riddle: Gate;
};

function Riddle({ id, riddle }: RiddleProps) {
  const summaryRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(riddle.isSolved);
  const { isShaking, shake, clearShake } = useShake();
  const { guess, response, guessResult, changeHandler, submitHandler } =
    useRiddleGuess({
      riddle,
      shake,
      clearShake,
    });

  const inputVal = riddle.isSolved ? `✔ ${riddle.correctAnswer}` : guess;
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
    if (riddle.isSolved) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      summaryRef.current?.focus();
    }
  }, [riddle.isSolved]);

  return (
    <div
      id={id}
      className={isShaking ? "riddle shake" : "riddle"}
      data-testid={id}
    >
      <details onToggle={toggleHandler} open={isOpen}>
        <summary ref={summaryRef}>{riddle.label}</summary>
        <form
          onSubmit={submitHandler}
          aria-label={`${riddle.label} - enter password and press Enter to submit`}
        >
          <p className="description">{riddle.question}</p>
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter password..."
            value={inputVal}
            onChange={changeHandler}
            disabled={riddle.isSolved}
          />
          {response && (
            <p aria-live="polite" className={rspClasses}>
              {response}
            </p>
          )}
          {riddle.isSolved && <p className="clue">{riddle.successMessage}</p>}
        </form>
      </details>
    </div>
  );
}

export default Riddle;
