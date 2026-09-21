import { programProgressionQueryOptions } from "@api/queries/useProgramProgressionQuery";
import { useProgramQuery } from "@api/queries/useProgramQuery";
import ActiveGate from "@components/ActiveGate";
import CompletedGate from "@components/CompletedGate";
import ConfirmDialog from "@components/ConfirmDialog";
import LoadingScreen from "@components/LoadingScreen";
import { useBoot } from "@contexts/BootContext";
import useProgramPlay from "@hooks/useProgramPlay";
import useProgressionScroll from "@hooks/useProgressionScroll";
import { Route } from "@routes/programs/$programId";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ProgramPlay.module.css";

function ProgramPlay() {
  const { programId } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: progression, isLoading } = useQuery(
    programProgressionQueryOptions(programId),
  );

  const { data: program } = useProgramQuery(programId);

  const { bootComplete } = useBoot();

  const currentGate = progression?.currentGate ?? null;
  const completedGates = progression?.completedGates ?? [];

  const isTheEnd = currentGate === null;

  const {
    guess,
    message,
    guessSucceeded,
    isShaking,
    isPending,
    changeHandler,
    handleSubmit,
    canRequestClue,
    isClueLimitReached,
    cooldownSeconds,
    handleRequestClue,
    clues,
    requestClueMutation,
    resetSessionMutation,
  } = useProgramPlay({ programId, currentGateId: currentGate?.id });

  // Tracks which gate's question has been "released" by its predecessor's
  // successMessage finishing typing. Derived at render time (not reset via
  // an effect) so a gate transition gates the new question immediately —
  // an effect-based reset would lag one frame and flash the full text.
  const [releasedGateId, setReleasedGateId] = useState<string | null>(null);

  const handleSuccessMessageComplete = useCallback(() => {
    setReleasedGateId(currentGate?.id ?? null);
  }, [currentGate?.id]);

  // Boot gates the head of the typing chain, whichever surface that turns out
  // to be on this mount: the first question on a fresh start, or the last
  // completed gate's successMessage on a mid-program reload. Everything
  // downstream is already sequenced by `releasedGateId`, so holding the head
  // is enough to keep the boot banner from typing over gameplay text.
  const canTypeQuestion =
    bootComplete &&
    (completedGates.length === 0 || releasedGateId === currentGate?.id);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const selectNewProgramRef = useRef<HTMLButtonElement>(null);

  const programName = program?.name ?? programId;

  // Calculate next gate index for scrolling
  const nextGateIndex = isTheEnd ? -1 : completedGates.length;
  useProgressionScroll(nextGateIndex);

  // Auto-focus the active gate's input on mount and when currentGate.id changes
  useEffect(() => {
    if (currentGate?.id && !isPending && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentGate?.id, isPending]);

  // Focus select new program button when the program is completed
  useEffect(() => {
    if (isTheEnd) {
      selectNewProgramRef.current?.focus();
    }
  }, [isTheEnd]);

  if (isLoading) {
    return <LoadingScreen message="Loading Program..." />;
  }

  const handleSelectNewProgram = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmReset = async () => {
    setResetError(null);
    try {
      const success = await resetSessionMutation.mutateAsync({ programId });
      if (!success) {
        setResetError("Failed to reset progress. Please try again.");
        return;
      }
      setIsConfirmOpen(false);
      navigate({ to: "/programs/select" });
    } catch (error) {
      console.error(error);
      setResetError("Failed to reset progress. Please try again.");
    }
  };

  const handleKeepProgress = () => {
    setIsConfirmOpen(false);
    navigate({ to: "/programs/select" });
  };

  const handleCancelReset = () => {
    setIsConfirmOpen(false);
  };

  const handlePlayAgain = async () => {
    setResetError(null);
    try {
      const success = await resetSessionMutation.mutateAsync({ programId });
      if (!success) {
        setResetError("Failed to reset progress. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setResetError("Failed to reset progress. Please try again.");
    }
  };

  return (
    <>
      <h1 className={styles.title}>{programName}</h1>
      {completedGates.map((gate, index) => (
        <CompletedGate
          key={gate.id}
          id={`gate-${index}`}
          gate={gate}
          isLast={index === completedGates.length - 1 && !!currentGate}
          canType={bootComplete}
          onComplete={
            index === completedGates.length - 1 && currentGate
              ? handleSuccessMessageComplete
              : undefined
          }
        />
      ))}
      {currentGate && (
        <ActiveGate
          key={currentGate.id}
          id={`gate-${completedGates.length}`}
          gate={currentGate}
          guess={guess}
          message={message}
          guessSucceeded={guessSucceeded}
          isShaking={isShaking}
          isPending={isPending}
          inputRef={inputRef}
          changeHandler={changeHandler}
          handleSubmit={handleSubmit}
          canRequestClue={canRequestClue}
          isClueLimitReached={isClueLimitReached}
          cooldownSeconds={cooldownSeconds}
          handleRequestClue={handleRequestClue}
          clues={clues}
          requestClueMutation={requestClueMutation}
          enabled={canTypeQuestion}
        />
      )}
      {isTheEnd && (
        <div id="classic-ending">
          <h2>The End</h2>
          {resetError && <p className="error-message">{resetError}</p>}
          <div className="action-buttons">
            <button
              ref={selectNewProgramRef}
              type="button"
              onClick={handleSelectNewProgram}
              disabled={resetSessionMutation.isPending}
              title="Select new program"
            >
              Select new program
            </button>
            <button
              type="button"
              onClick={handlePlayAgain}
              disabled={resetSessionMutation.isPending}
              title={
                resetSessionMutation.isPending
                  ? "Restarting..."
                  : "Play program again"
              }
            >
              {resetSessionMutation.isPending
                ? "Restarting..."
                : "Play program again"}
            </button>
          </div>
        </div>
      )}
      {isConfirmOpen && (
        <ConfirmDialog
          ariaLabel="Reset Progress Confirmation"
          message={`Reset your progress on "${programName}" before selecting a new one?`}
          confirmLabel="Reset Progress"
          onConfirm={handleConfirmReset}
          secondaryLabel="Keep Progress"
          onSecondary={handleKeepProgress}
          onCancel={handleCancelReset}
          errorMessage={resetError}
        />
      )}
    </>
  );
}

export default ProgramPlay;
