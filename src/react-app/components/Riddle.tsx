import React from "react";
import type { Gate } from "../db/types";
import useRiddleGuess from "../hooks/useRiddleGuess";
import useShake from "../hooks/useShake";

type RiddleProps = {
  id: string;
  riddle: Gate;
};

function Riddle({ id, riddle }: RiddleProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = React.useState(riddle.isSolved);
  const { isShaking, shake, clearShake } = useShake();
  const { guess, response, guessResult, changeHandler, submitHandler } =
    useRiddleGuess({
      riddle,
      shake,
      clearShake,
    });

  const inputVal = riddle.isSolved ? `✔ ${riddle.correctAnswer}` : guess;
  const rspClasses = guessResult === "incorrect" ? "response fail" : "response";

  function toggleHandler(event: React.ToggleEvent<HTMLDetailsElement>) {
    const isOpen = event.newState === "open";
    setIsOpen(isOpen);
    if (isOpen) {
      inputRef.current?.focus();
    }
  }

  // Force open when solved
  React.useEffect(() => {
    if (riddle.isSolved) {
      setIsOpen(true);
    }
  }, [riddle.isSolved]);

  return (
    <div
      id={id}
      className={isShaking ? "riddle shake" : "riddle"}
      data-testid={id}
    >
      <details onToggle={toggleHandler} open={isOpen}>
        <summary>{riddle.label}</summary>
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
