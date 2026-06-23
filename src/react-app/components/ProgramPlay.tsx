import { programProgressionQueryOptions } from "@api/queries/useProgramProgressionQuery";
import { programsQueryOptions } from "@api/queries/useProgramsQuery";
import useProgramPlay from "@hooks/useProgramPlay";
import useProgressionScroll from "@hooks/useProgressionScroll";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Route } from "../routes/programs/$programId";

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

  const { guess, message, isShaking, changeHandler, handleSubmit } =
    useProgramPlay({ programId, currentGateId: currentGate?.id });

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
    if (currentGate?.id && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentGate?.id]);

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

  return (
    <>
      <h1 className="title">{programName}</h1>
      {completedGates.map((gate, index) => (
        <div key={gate.id} id={`gate-${index}`} className="gate">
          <details open>
            <summary>{gate.label}</summary>
            <form
              aria-label={`${gate.label} - enter password and press Enter to submit`}
            >
              <p className="description">{gate.question}</p>
              <input
                type="text"
                placeholder="Enter password..."
                value={`✔ ${gate.correctAnswer}`}
                disabled
              />
              <p className="clue">{gate.successMessage}</p>
            </form>
          </details>
        </div>
      ))}
      {currentGate && (
        <div
          id={`gate-${completedGates.length}`}
          className={isShaking ? "gate shake" : "gate"}
        >
          <details open>
            <summary>{currentGate.label}</summary>
            <form
              onSubmit={handleSubmit}
              aria-label={`${currentGate.label} - enter password and press Enter to submit`}
            >
              <p className="description">{currentGate.question}</p>
              <input
                ref={inputRef}
                type="text"
                placeholder="Enter password..."
                value={guess}
                onChange={changeHandler}
              />
              {message && (
                <p
                  aria-live="polite"
                  className={
                    message === "Access Denied." ? "response fail" : "response"
                  }
                >
                  {message}
                </p>
              )}
            </form>
          </details>
        </div>
      )}
      {isTheEnd && (
        <div id="classic-ending">
          <h2>The End</h2>
          <div className="action-buttons">
            <button
              type="button"
              disabled
              title="Restarting isn't available yet"
            >
              Play program again
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
