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
  const [clueCooldownUntil, setClueCooldownUntil] = useState<number | null>(
    null,
  );
  const [now, setNow] = useState(() => Date.now());
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
    setClueCooldownUntil(null);
  }, [currentGateId]);

  // Re-tick `now` while a clue cooldown is active so cooldownSeconds counts
  // down live. Tears the interval down (by clearing the cooldown) on expiry.
  useEffect(() => {
    if (clueCooldownUntil === null) {
      return;
    }
    const tick = () => {
      const nowMs = Date.now();
      setNow(nowMs);
      if (clueCooldownUntil <= nowMs) {
        setClueCooldownUntil(null);
      }
    };
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [clueCooldownUntil]);

  const cooldownSeconds =
    clueCooldownUntil === null
      ? 0
      : Math.max(0, Math.ceil((clueCooldownUntil - now) / 1000));
  const isClueCooldown = cooldownSeconds > 0;

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
    if (!currentGateId || isClueCooldown) return;
    requestClueMutation.mutate(
      { gateId: currentGateId, currentGuess: guess },
      {
        onSuccess: (data) => {
          if (data.clueText) {
            setClues((prev) => [...prev, data.clueText as string]);
            setCanRequestClue(false);
          } else if (data.isRateLimited) {
            const retryAfterMs = data.retryAfterMs;
            if (retryAfterMs != null && retryAfterMs > 0) {
              setClueCooldownUntil(Date.now() + retryAfterMs);
            } else {
              setMessage(
                "You've requested too many clues. Please try again later.",
              );
            }
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
    clueCooldownUntil,
    cooldownSeconds,
    requestClueMutation,
    resetSessionMutation,
  };
}

export default useProgramPlay;
