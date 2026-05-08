import { useEffect, useMemo, useRef } from "react";
import type { ProgramWithGates } from "../../worker/db/types";
import useProgressionScroll from "../hooks/useProgressionScroll";
import getRiddlesToRender from "../utils/getRiddlesToRender";
import Riddle from "./Riddle";

type ProgramProps = {
  program: ProgramWithGates;
  resetProgram: () => void;
  clearActiveProgram: () => void;
};

function Program({ program, resetProgram, clearActiveProgram }: ProgramProps) {
  const selectNewProgramRef = useRef<HTMLButtonElement>(null);
  const { riddlesToRender, nextRiddleIndex } = useMemo(
    () => getRiddlesToRender(program.gates),
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
        <Riddle key={riddle.id} id={`riddle-${index}`} riddle={riddle} />
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
