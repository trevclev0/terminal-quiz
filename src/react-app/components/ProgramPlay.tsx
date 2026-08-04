import { programProgressionQueryOptions } from "@api/queries/useProgramProgressionQuery";
import { useProgramQuery } from "@api/queries/useProgramQuery";
import ActiveGate from "@components/ActiveGate";
import CompletedGate from "@components/CompletedGate";
import TerminalConfirmModal from "@components/TerminalConfirmModal";
import useProgramPlay from "@hooks/useProgramPlay";
import useProgressionScroll from "@hooks/useProgressionScroll";
import { Route } from "@routes/programs/$programId";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import styles from "./ProgramPlay.module.css";

function ProgramPlay() {
  const { programId } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: progression, isLoading } = useQuery(
    programProgressionQueryOptions(programId),
  );

  const { data: program } = useProgramQuery(programId);

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
    handleRequestClue,
    clues,
    requestClueMutation,
    resetSessionMutation,
  } = useProgramPlay({ programId, currentGateId: currentGate?.id });

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
    return <h2 className="loading-screen">Loading Program...</h2>;
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
        <CompletedGate key={gate.id} id={`gate-${index}`} gate={gate} />
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
          handleRequestClue={handleRequestClue}
          clues={clues}
          requestClueMutation={requestClueMutation}
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
        <TerminalConfirmModal
          message={`Reset your progress on "${programName}" before selecting a new one?`}
          onConfirm={handleConfirmReset}
          onKeepProgress={handleKeepProgress}
          onCancel={handleCancelReset}
          errorMessage={resetError}
        />
      )}
    </>
  );
}

export default ProgramPlay;
