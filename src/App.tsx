import { useMemo } from "react";
import Program from "./components/Program";
import ProgramSelector from "./components/ProgramSelector";
import { ProgramDataContext } from "./contexts/ProgramDataContext";
import useProgramStorage from "./hooks/useProgramStorage";

function App() {
  const {
    programs,
    activeProgram,
    error,
    isLoading,
    selectProgram,
    updateActiveProgram,
    resetProgram,
    clearActiveProgram,
  } = useProgramStorage();

  const contextValue = useMemo(
    () => ({
      programs,
      activeProgram,
      selectProgram,
      updateActiveProgram,
    }),
    [programs, activeProgram, selectProgram, updateActiveProgram],
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
          <Program
            program={activeProgram}
            resetProgram={resetProgram}
            clearActiveProgram={clearActiveProgram}
          />
        ) : (
          <ProgramSelector />
        )}
      </ProgramDataContext.Provider>
    </div>
  );
}

export default App;
