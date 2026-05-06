import { type ChangeEvent, type SubmitEvent, useState } from "react";
import type { Gate } from "../../worker/db/types";
import isGuessCloseEnough from "../utils/isGuessCloseEnough";
import { useProgramData } from "./useProgramData";

type UseRiddleGuessArgs = {
  riddle: Gate;
  shake: () => void;
  clearShake: () => void;
};

function useRiddleGuess({ riddle, shake, clearShake }: UseRiddleGuessArgs) {
  const { activeProgram, updateProgram } = useProgramData();

  const [guess, setGuess] = useState("");
  const [response, setResponse] = useState("");
  const [guessResult, setGuessResult] = useState<
    "correct" | "incorrect" | null
  >(null);

  function changeHandler(event: ChangeEvent<HTMLInputElement>) {
    setGuess(event.target.value);
  }

  function submitHandler(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isGuessCloseEnough(guess, riddle.correctAnswer)) {
      setResponse("Access Granted.");
      setGuessResult("correct");
      clearShake();

      if (!activeProgram) return;

      updateProgram({
        ...activeProgram,
        gates: activeProgram.gates.map((gate: Gate) =>
          gate.id === riddle.id ? { ...gate, isSolved: true } : gate,
        ),
      });
    } else {
      setResponse("Access Denied.");
      setGuessResult("incorrect");
      shake();
    }
  }

  return { guess, response, guessResult, changeHandler, submitHandler };
}

export default useRiddleGuess;
