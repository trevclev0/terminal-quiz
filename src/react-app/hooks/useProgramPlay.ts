import { useRequestClueMutation } from "@api/mutations/useRequestClueMutation";
import { useSubmitGuessMutation } from "@api/mutations/useSubmitGuessMutation";
import { useResetSession } from "@hooks/useResetSession";
import { parseGameCommand } from "@shared/gameCommands";
import {
  type ChangeEvent,
  type SubmitEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type UseProgramPlayProps = {
  programId: string;
  currentGateId: string | null | undefined;
  onHelpCommand?: () => void;
};

// How long a denial blink plays. Must match the `.accessDenied` animation
// duration in Gate.module.css: a denial only blinks once the previous blink
// has finished (measured from when it actually started, see
// `onDenialBlinkStart`), which keeps rapid wrong guesses under three flashes
// a second.
export const DENIAL_BLINK_MS = 900;

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
  // Stryker disable next-line ArrowFunction: `now` is only read while a
  // cooldown runs, and every path that starts one sets it first.
  const [now, setNow] = useState(() => Date.now());
  const currentGateIdRef = useRef(currentGateId);
  // Describes the wrong guess the shown message belongs to, and is null for
  // every other message. A fresh id per denial lets the UI restart its blink
  // even when the same guess is denied twice in a row; `blinks` is false for
  // a denial that came too soon after the last blink to be allowed one.
  const [denial, setDenial] = useState<{ id: number; blinks: boolean } | null>(
    null,
  );
  const denialCount = useRef(0);
  // Set when the blink animation really starts, not when a denial arrives:
  // boot can hold the class back, so the two can be seconds apart, and timing
  // from the denial would let a second blink overlap a deferred first one.
  const lastBlinkStartedAt = useRef<number | null>(null);
  // Stryker disable ArrayDeclaration: a constant [] dep never changes, so any
  // constant array keeps the callback just as stable
  const onDenialBlinkStart = useCallback(() => {
    lastBlinkStartedAt.current = Date.now();
  }, []);
  // Stryker restore ArrayDeclaration

  // Shows a message that is not a wrong-guess denial, dropping any denial so
  // a stale one can never keep blinking a clue or error message. (The
  // gate-change effect resets both directly: it cannot depend on this.)
  const showMessage = (text: string | null) => {
    setMessage(text);
    setDenial(null);
  };

  // Clear response message, denial, clues, canRequestClue, and the remembered
  // wrong guess when currentGate.id changes
  useEffect(() => {
    currentGateIdRef.current = currentGateId;
    setMessage(null);
    setDenial(null);
    setGuessSucceeded(null);
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
      showMessage("No active gate to submit guess to");
      setGuessSucceeded(false);
      return;
    }
    showMessage(null);
    setGuessSucceeded(null);

    try {
      const result = await submitGuessMutation.mutateAsync({
        gateId: currentGateId,
        guess,
      });

      if (result.success) {
        showMessage(result.message ?? null);
        setGuessSucceeded(true);
        setGuess("");
        setRememberedGuess(null);
      } else {
        setMessage(result.message ?? "Access Denied.");
        denialCount.current += 1;
        const nowMs = Date.now();
        const blinks =
          lastBlinkStartedAt.current === null ||
          nowMs - lastBlinkStartedAt.current >= DENIAL_BLINK_MS;
        setDenial({ id: denialCount.current, blinks });
        setGuessSucceeded(false);
        setCanRequestClue(result.canRequestClue);
        setRememberedGuess({
          guess: guess.trim(),
          canRequestClue: result.canRequestClue,
        });
      }
    } catch {
      showMessage("Error submitting guess");
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
              // Stryker disable next-line ObjectLiteral: only `canRequestClue`
              // is read before the next wrong guess replaces the whole object.
              prev ? { ...prev, canRequestClue: false } : prev,
            );
          } else if (data.isAiBudgetExhausted) {
            showMessage(
              "AI hint budget exhausted for today — try again tomorrow.",
            );
          } else if (data.isRateLimited) {
            const retryAfterMs = data.retryAfterMs;
            if (retryAfterMs != null && retryAfterMs > 0) {
              const nowMs = Date.now();
              setNow(nowMs);
              setClueCooldownUntil(nowMs + retryAfterMs);
            } else {
              showMessage(
                "You've requested too many clues. Please try again later.",
              );
            }
          } else {
            showMessage("Failed to generate a clue. Please try again.");
          }
          setIsClueLimitReached(data.isClueLimitReached);
        },
        onError: () => {
          if (currentGateIdRef.current !== requestGateId) {
            return;
          }
          showMessage("Error requesting clue. Please try again.");
        },
      },
    );
  };

  const handleRequestClue = () => requestClue(guess);

  function handleClueCommand() {
    const showReply = (text: string) => {
      showMessage(text);
      setGuessSucceeded(null);
    };
    if (!rememberedGuess) {
      showReply(CLUE_COMMAND_MESSAGES.noGuess);
    } else if (isClueLimitReached) {
      showReply(CLUE_COMMAND_MESSAGES.limit);
    } else if (isClueCooldown) {
      showReply(CLUE_COMMAND_MESSAGES.cooldown(cooldownSeconds));
    } else if (!rememberedGuess.canRequestClue) {
      showReply(CLUE_COMMAND_MESSAGES.notYet);
    } else if (!requestClueMutation.isPending) {
      requestClue(rememberedGuess.guess);
    }
  }

  return {
    guess,
    message,
    guessSucceeded,
    denialId: denial?.id ?? null,
    denialBlinks: denial?.blinks ?? false,
    onDenialBlinkStart,
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
