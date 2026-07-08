import { programProgressionQueryOptions } from "@api/queries/useProgramProgressionQuery";
import { programsQueryOptions } from "@api/queries/useProgramsQuery";
import ActiveGate from "@components/ActiveGate";
import CompletedGate from "@components/CompletedGate";
import useProgramPlay from "@hooks/useProgramPlay";
import useProgressionScroll from "@hooks/useProgressionScroll";
import { useResetSession } from "@hooks/useResetSession";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getSessionId } from "@utils/session";
import { useEffect, useRef } from "react";
import { Route } from "../routes/programs/$programId";
import styles from "./ProgramPlay.module.css";

function ProgramPlay() {
  const { programId } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: progression, isLoading } = useQuery(
    programProgressionQueryOptions(programId),
  );

  const { data: programsData } = useQuery(programsQueryOptions);

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
  } = useProgramPlay({ programId, currentGateId: currentGate?.id });

  const resetSessionMutation = useResetSession(programId);

  const inputRef = useRef<HTMLInputElement>(null);
  const selectNewProgramRef = useRef<HTMLButtonElement>(null);

  // Look up program name from cached programs list
  const program = programsData?.find((p) => p.id === programId);
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

  // Focus select new program button at end
  useEffect(() => {
    if (isTheEnd) {
      selectNewProgramRef.current?.focus();
    }
  }, [isTheEnd]);

  if (isLoading) {
    return <h2 className="loading-screen">Loading Program...</h2>;
  }

  const handleSelectNewProgram = () => {
    navigate({
      to: "/programs/select",
    });
  };

  const handlePlayAgain = () => {
    const sessionId = getSessionId();
    resetSessionMutation.mutate({ sessionId, programId });
  };

  return (
    <>
      <h1 className={styles.title}>{programName}</h1>
      {completedGates.map((gate, index) => (
        <CompletedGate key={gate.id} id={`gate-${index}`} gate={gate} />
      ))}
      {currentGate && (
        <ActiveGate
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
          <div className="action-buttons">
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
            <button
              ref={selectNewProgramRef}
              type="button"
              onClick={handleSelectNewProgram}
            >
              Select new program
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ProgramPlay;
