import ProgramSelector from "@components/ProgramSelector";
import ProgramWithGates from "@components/ProgramWithGates";
import { ProgramDataContext } from "@contexts/ProgramDataContext";
import usePrograms from "@hooks/usePrograms";
import { useMemo } from "react";

function App() {
  const {
    programs,
    activeProgram,
    error,
    isLoading,
    selectProgram,
    updateProgram,
    resetProgram,
    clearActiveProgram,
  } = usePrograms();

  const contextValue = useMemo(
    () => ({
      programs,
      activeProgram,
      selectProgram,
      updateProgram,
    }),
    [programs, activeProgram, selectProgram, updateProgram],
  );

  if (isLoading) {
    return <h2 className="loading-screen">Loading...</h2>;
  }

  if (error) {
    return <div className="error-screen">{error.message}</div>;
  }

  return (
    <div className="app">
      <ProgramDataContext.Provider value={contextValue}>
        {activeProgram ? (
          <ProgramWithGates
            program={activeProgram}
            resetProgram={resetProgram}
            clearActiveProgram={clearActiveProgram}
          />
        ) : (
          <ProgramSelector programs={programs} selectProgram={selectProgram} />
        )}
      </ProgramDataContext.Provider>
    </div>
  );
}

export default App;
