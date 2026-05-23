import type { Gate } from "@shared/types";
import isGuessCloseEnough from "@utils/isGuessCloseEnough";
import { type ChangeEvent, type SubmitEvent, useEffect, useState } from "react";

type UseGateGuessArgs = {
  gate: Gate;
  shake: () => void;
  clearShake: () => void;
  onSolve: () => void;
};

function useGateGuess({ gate, shake, clearShake, onSolve }: UseGateGuessArgs) {
  const [guess, setGuess] = useState("");
  const [response, setResponse] = useState("");
  const [guessResult, setGuessResult] = useState<
    "correct" | "incorrect" | null
  >(null);

  useEffect(() => {
    if (!gate.isSolved) {
      setGuess("");
      setResponse("");
      setGuessResult(null);
    }
  }, [gate.isSolved]);

  function changeHandler(event: ChangeEvent<HTMLInputElement>) {
    setGuess(event.target.value);
  }

  function submitHandler(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isGuessCloseEnough(guess, gate.correctAnswer)) {
      setResponse("Access Granted.");
      setGuessResult("correct");
      clearShake();
      onSolve();
    } else {
      setResponse("Access Denied.");
      setGuessResult("incorrect");
      shake();
    }
  }

  return { guess, response, guessResult, changeHandler, submitHandler };
}

export default useGateGuess;
