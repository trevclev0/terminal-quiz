import type { ProgramWithGates } from "@shared/types";
import { type ChangeEvent, useEffect, useRef } from "react";

type ProgramSelectorProps = {
  programs: ProgramWithGates[];
  selectProgram: (programName: string) => void;
};

function ProgramSelector({ programs, selectProgram }: ProgramSelectorProps) {
  const selectRef = useRef<HTMLSelectElement>(null);

  function selectChangeHandler(event: ChangeEvent<HTMLSelectElement>) {
    const selectedProgramName = event.target.value;
    selectProgram(selectedProgramName);
  }

  useEffect(() => {
    if (selectRef.current) {
      selectRef.current.focus();
    }
  }, []);

  if (programs.length === 0) {
    return (
      <h2 id="program-selector" className="warning">
        No programs found
      </h2>
    );
  }

  return (
    <div id="program-selector">
      <select ref={selectRef} onChange={selectChangeHandler} defaultValue="">
        <option value="" disabled hidden>
          Select your program
        </option>

        {programs.map((program) => (
          <option key={program.id} value={program.id}>
            {program.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ProgramSelector;
