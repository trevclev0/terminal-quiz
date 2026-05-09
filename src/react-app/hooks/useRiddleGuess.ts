import { useProgramData } from "@hooks/useProgramData";
import type { Gate } from "@shared/types";
import isGuessCloseEnough from "@utils/isGuessCloseEnough";
import { type ChangeEvent, type SubmitEvent, useEffect, useState } from "react";

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

  useEffect(() => {
    if (!riddle.isSolved) {
      setGuess("");
      setResponse("");
      setGuessResult(null);
    }
  }, [riddle.isSolved]);

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
