import usePrograms from "@hooks/usePrograms";
import { useEffect, useRef } from "react";

function ProgramSelector() {
  const selectRef = useRef<HTMLSelectElement>(null);

  const { programs, selectProgram } = usePrograms();

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
      <select
        ref={selectRef}
        onChange={(e) => selectProgram(e.target.value)}
        defaultValue=""
      >
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
