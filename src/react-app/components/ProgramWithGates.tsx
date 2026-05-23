import Gate from "@components/Gate";
import useProgressionScroll from "@hooks/useProgressionScroll";
import type { ProgramWithGates } from "@shared/types";
import getGatesToRender from "@utils/getGatesToRender";
import { useEffect, useMemo, useRef } from "react";

type ProgramProps = {
  program: ProgramWithGates;
  resetProgram: () => void;
  clearActiveProgram: () => void;
  updateProgram: (program: ProgramWithGates) => void;
};

function Program({
  program,
  resetProgram,
  clearActiveProgram,
  updateProgram,
}: ProgramProps) {
  const selectNewProgramRef = useRef<HTMLButtonElement>(null);
  const { gatesToRender, nextGateIndex } = useMemo(
    () => getGatesToRender(program.gates),
    [program.gates],
  );

  useProgressionScroll(nextGateIndex);

  const isTheEnd = nextGateIndex === -1;

  useEffect(() => {
    if (isTheEnd) {
      selectNewProgramRef.current?.focus();
    }
  }, [isTheEnd]);

  const handleSelectNewProgram = () => {
    // Prompt the user. Returns true for "OK", false for "Cancel"
    const shouldReset = window.confirm(
      "Reset progress before selecting a new program?",
    );

    if (shouldReset) {
      resetProgram();
    }

    // Always clear the active program to return to the selector
    clearActiveProgram();
  };

  return (
    <>
      <h1 className="title">{program.name}</h1>
      {gatesToRender.map((gateToRender, index) => (
        <Gate
          key={gateToRender.id}
          id={`gate-${index}`}
          gate={gateToRender}
          onSolve={() =>
            updateProgram({
              ...program,
              gates: program.gates.map((programGate) =>
                programGate.id === gateToRender.id
                  ? { ...programGate, isSolved: true }
                  : programGate,
              ),
            })
          }
        />
      ))}
      {isTheEnd && (
        <div id="classic-ending">
          <h2>The End</h2>
          <div className="action-buttons">
            <button type="button" onClick={resetProgram}>
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

export default Program;
