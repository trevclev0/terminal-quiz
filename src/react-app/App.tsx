import Program from "@components/Program";
import ProgramSelector from "@components/ProgramSelector";
import { ProgramDataContext } from "@contexts/ProgramDataContext";
import useProgramStorage from "@hooks/useProgramStorage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";

const queryClient = new QueryClient();

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
  } = useProgramStorage();

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
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </div>
  );
}

export default App;
