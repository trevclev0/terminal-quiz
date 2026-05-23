import Riddle from "@components/Gate";
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
  const { riddlesToRender, nextRiddleIndex } = useMemo(
    () => getGatesToRender(program.gates),
    [program.gates],
  );

  useProgressionScroll(nextRiddleIndex);

  const isTheEnd = nextRiddleIndex === -1;

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
      {riddlesToRender.map((riddle, index) => (
        <Riddle
          key={riddle.id}
          id={`riddle-${index}`}
          riddle={riddle}
          onSolve={() =>
            updateProgram({
              ...program,
              gates: program.gates.map((gate) =>
                gate.id === riddle.id ? { ...gate, isSolved: true } : gate,
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
