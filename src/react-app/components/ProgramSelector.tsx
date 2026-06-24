import usePrograms from "@hooks/usePrograms";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Route } from "../routes/programs/select";

function ProgramSelector() {
  const selectRef = useRef<HTMLSelectElement>(null);
  const { programs } = usePrograms();
  const { programId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const isValidSelection = programs.some((p) => p.id === programId);

  useEffect(() => {
    if (programId && programs.length > 0 && !isValidSelection) {
      navigate({
        search: {},
        replace: true,
      });
    }
  }, [programId, programs.length, isValidSelection, navigate]);

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

  /**
   * Update the URL when the user picks a new option
   * @param e
   */
  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    navigate({
      search: { programId: e.target.value },
      replace: true,
    });
  };

  const handleStartProgram = () => {
    if (!programId || !isValidSelection) return;
    navigate({
      to: "/programs/$programId",
      params: { programId },
    });
  };

  return (
    <div id="program-selector">
      <select
        id="program-selector-select"
        ref={selectRef}
        onChange={handleSelect}
        value={isValidSelection ? programId : ""}
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
      <br />
      {programId && (
        <button
          type="button"
          onClick={handleStartProgram}
          disabled={!isValidSelection}
        >
          Start Program
        </button>
      )}
    </div>
  );
}

export default ProgramSelector;
