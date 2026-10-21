import { useRequestClueMutation } from "@api/mutations/useRequestClueMutation";
import { useSubmitGuessMutation } from "@api/mutations/useSubmitGuessMutation";
import { useResetSession } from "@hooks/useResetSession";
import useShake from "@hooks/useShake";
import { parseGameCommand } from "@shared/gameCommands";
import {
  type ChangeEvent,
  type SubmitEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type UseProgramPlayProps = {
  programId: string;
  currentGateId: string | null | undefined;
  onHelpCommand?: () => void;
};

export const CLUE_COMMAND_MESSAGES = {
  noGuess: "Make a guess first, then type /clue.",
  notYet: "No clue available right now.",
  limit: "No clues left for this gate.",
  cooldown: (seconds: number) => `Clue cooldown — try again in ${seconds}s`,
};

// The last wrong guess, kept apart from the input box so `/clue` can send it
// even though typing the command replaced the box's contents.
type RememberedGuess = { guess: string; canRequestClue: boolean };

// A gate solved by a guess on this mount, as opposed to one that loaded
// already solved. A fresh object per solve, so "Play again" solving the same
// gate id again still reads as a new solve to anything comparing by identity.
export type Solve = { gateId: string };

function useProgramPlay({
  programId,
  currentGateId,
  onHelpCommand,
}: UseProgramPlayProps) {
  const [lastSolve, setLastSolve] = useState<Solve | null>(null);
  const submitGuessMutation = useSubmitGuessMutation(programId, {
    onSolved: (gateId) => setLastSolve({ gateId }),
  });
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
  const [rememberedGuess, setRememberedGuess] =
    useState<RememberedGuess | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const currentGateIdRef = useRef(currentGateId);
  const { isShaking, shake, clearShake } = useShake();

  // Clear response message, shake, clues, canRequestClue, and the remembered
  // wrong guess when currentGate.id changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: clearShake is stable from useShake, only re-run when currentGateId changes
  useEffect(() => {
    currentGateIdRef.current = currentGateId;
    setMessage(null);
    setGuessSucceeded(null);
    clearShake();
    setClues([]);
    setCanRequestClue(false);
    setIsClueLimitReached(false);
    setRememberedGuess(null);
    // NOTE: clueCooldownUntil intentionally persists across gates — the
    // backend rate limit is session-wide, so moving gates must not re-enable
    // a clue request the server would reject.
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

    const command = parseGameCommand(guess);
    if (command === "/help") {
      setGuess("");
      onHelpCommand?.();
      return;
    }
    if (command === "/clue") {
      setGuess("");
      handleClueCommand();
      return;
    }

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
        setRememberedGuess(null);
      } else {
        setMessage(result.message ?? "Access Denied.");
        setGuessSucceeded(false);
        shake();
        setCanRequestClue(result.canRequestClue);
        setRememberedGuess({
          guess: guess.trim(),
          canRequestClue: result.canRequestClue,
        });
      }
    } catch {
      setMessage("Error submitting guess");
      setGuessSucceeded(false);
    }
  };

  const requestClue = (currentGuess: string) => {
    const requestGateId = currentGateId;
    if (!requestGateId || isClueCooldown) return;
    requestClueMutation.mutate(
      { gateId: requestGateId, currentGuess },
      {
        onSuccess: (data) => {
          // Ignore responses from a request started on a now-inactive gate.
          if (currentGateIdRef.current !== requestGateId) {
            return;
          }
          if (data.clueText) {
            setClues((prev) => [...prev, data.clueText as string]);
            setCanRequestClue(false);
            // A clue spends the eligibility the wrong guess earned; the
            // next wrong guess renews it.
            setRememberedGuess((prev) =>
              prev ? { ...prev, canRequestClue: false } : prev,
            );
          } else if (data.isAiBudgetExhausted) {
            setMessage(
              "AI hint budget exhausted for today — try again tomorrow.",
            );
          } else if (data.isRateLimited) {
            const retryAfterMs = data.retryAfterMs;
            if (retryAfterMs != null && retryAfterMs > 0) {
              const nowMs = Date.now();
              setNow(nowMs);
              setClueCooldownUntil(nowMs + retryAfterMs);
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
          if (currentGateIdRef.current !== requestGateId) {
            return;
          }
          setMessage("Error requesting clue. Please try again.");
        },
      },
    );
  };

  const handleRequestClue = () => requestClue(guess);

  function handleClueCommand() {
    const showMessage = (text: string) => {
      setMessage(text);
      setGuessSucceeded(null);
    };
    if (!rememberedGuess) {
      showMessage(CLUE_COMMAND_MESSAGES.noGuess);
    } else if (isClueLimitReached) {
      showMessage(CLUE_COMMAND_MESSAGES.limit);
    } else if (isClueCooldown) {
      showMessage(CLUE_COMMAND_MESSAGES.cooldown(cooldownSeconds));
    } else if (!rememberedGuess.canRequestClue) {
      showMessage(CLUE_COMMAND_MESSAGES.notYet);
    } else if (!requestClueMutation.isPending) {
      requestClue(rememberedGuess.guess);
    }
  }

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
    lastSolve,
  };
}

export default useProgramPlay;
