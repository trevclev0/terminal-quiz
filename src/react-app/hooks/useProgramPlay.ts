import { useRequestClueMutation } from "@api/mutations/useRequestClueMutation";
import { useSubmitGuessMutation } from "@api/mutations/useSubmitGuessMutation";
import useShake from "@hooks/useShake";
import { type ChangeEvent, type SubmitEvent, useEffect, useState } from "react";

type UseProgramPlayProps = {
  programId: string;
  currentGateId: string | null | undefined;
};

function useProgramPlay({ programId, currentGateId }: UseProgramPlayProps) {
  const submitGuessMutation = useSubmitGuessMutation(programId);
  const requestClueMutation = useRequestClueMutation(programId);

  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [canRequestClue, setCanRequestClue] = useState(false);
  const [clues, setClues] = useState<string[]>([]);
  const { isShaking, shake, clearShake } = useShake();

  // Clear response message, shake, clues, and canRequestClue when currentGate.id changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: clearShake is stable from useShake, only re-run when currentGateId changes
  useEffect(() => {
    setMessage(null);
    clearShake();
    setClues([]);
    setCanRequestClue(false);
  }, [currentGateId]);

  const changeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setGuess(e.target.value);
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (submitGuessMutation.isPending) {
      return;
    }

    if (!currentGateId) {
      setMessage("No active gate to submit guess to");
      return;
    }
    setMessage(null);

    try {
      const result = await submitGuessMutation.mutateAsync({
        gateId: currentGateId,
        guess,
      });

      if (result.success) {
        setMessage("Access Granted.");
        setGuess("");
      } else {
        setMessage("Access Denied.");
        shake();
        if (result.canRequestClue) {
          setCanRequestClue(true);
        }
      }
    } catch {
      setMessage("Error submitting guess");
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
          }
        },
      },
    );
  };

  return {
    guess,
    message,
    isShaking,
    isPending: submitGuessMutation.isPending,
    changeHandler,
    handleSubmit,
    canRequestClue,
    clues,
    handleRequestClue,
    requestClueMutation,
  };
}

export default useProgramPlay;
