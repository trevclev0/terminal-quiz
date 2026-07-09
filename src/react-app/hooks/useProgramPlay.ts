import { useRequestClueMutation } from "@api/mutations/useRequestClueMutation";
import { useSubmitGuessMutation } from "@api/mutations/useSubmitGuessMutation";
import { useResetSession } from "@hooks/useResetSession";
import useShake from "@hooks/useShake";
import { type ChangeEvent, type SubmitEvent, useEffect, useState } from "react";

type UseProgramPlayProps = {
  programId: string;
  currentGateId: string | null | undefined;
};

function useProgramPlay({ programId, currentGateId }: UseProgramPlayProps) {
  const submitGuessMutation = useSubmitGuessMutation(programId);
  const requestClueMutation = useRequestClueMutation(programId);
  const resetSessionMutation = useResetSession();

  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [guessSucceeded, setGuessSucceeded] = useState<boolean | null>(null);
  const [canRequestClue, setCanRequestClue] = useState(false);
  const [clues, setClues] = useState<string[]>([]);
  const [isClueLimitReached, setIsClueLimitReached] = useState(false);
  const { isShaking, shake, clearShake } = useShake();

  // Clear response message, shake, clues, and canRequestClue when currentGate.id changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: clearShake is stable from useShake, only re-run when currentGateId changes
  useEffect(() => {
    setMessage(null);
    setGuessSucceeded(null);
    clearShake();
    setClues([]);
    setCanRequestClue(false);
    setIsClueLimitReached(false);
  }, [currentGateId]);

  const changeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setGuess(e.target.value);
    setCanRequestClue(false);
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (submitGuessMutation.isPending) {
      return;
    }

    if (!currentGateId) {
      setMessage("No active gate to submit guess to");
      setGuessSucceeded(false);
      return;
    }
    setMessage(null);
    setGuessSucceeded(null);

    try {
      const result = await submitGuessMutation.mutateAsync({
        gateId: currentGateId,
        guess,
      });

      if (result.success) {
        setMessage(result.message ?? null);
        setGuessSucceeded(true);
        setGuess("");
      } else {
        setMessage(result.message ?? "Access Denied.");
        setGuessSucceeded(false);
        shake();
        setCanRequestClue(result.canRequestClue);
      }
    } catch {
      setMessage("Error submitting guess");
      setGuessSucceeded(false);
    }
  };

  const handleRequestClue = () => {
    if (!currentGateId) return;
    requestClueMutation.mutate(
      { gateId: currentGateId, currentGuess: guess },
      {
        onSuccess: (data) => {
          if (data.clueText) {
            setClues((prev) => [...prev, data.clueText as string]);
            setCanRequestClue(false);
          } else {
            setMessage("Failed to generate a clue. Please try again.");
          }
          setIsClueLimitReached(data.isClueLimitReached);
        },
        onError: () => {
          setMessage("Error requesting clue. Please try again.");
        },
      },
    );
  };

  return {
    guess,
    message,
    guessSucceeded,
    isShaking,
    isPending: submitGuessMutation.isPending,
    changeHandler,
    handleSubmit,
    canRequestClue,
    isClueLimitReached,
    clues,
    handleRequestClue,
    requestClueMutation,
    resetSessionMutation,
  };
}

export default useProgramPlay;
