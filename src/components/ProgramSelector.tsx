import type { ChangeEvent } from "react";
import { useProgramData } from "../hooks/useProgramData";

function ProgramSelector() {
  const { programs, selectProgram } = useProgramData();

  function selectChangeHandler(event: ChangeEvent<HTMLSelectElement>) {
    const selectedProgramName = event.target.value;
    selectProgram(selectedProgramName);
  }

  if (programs.length === 0) {
    return (
      <h2 id="program-selector" className="warning">
        No programs found
      </h2>
    );
  }

  return (
    <div id="program-selector">
      <select onChange={selectChangeHandler} defaultValue="">
        <option value="" disabled hidden>
          Select your program
        </option>

        {programs.map((program) => (
          <option key={program.name} value={program.name}>
            {program.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ProgramSelector;
