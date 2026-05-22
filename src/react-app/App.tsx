import ProgramSelector from "@components/ProgramSelector";
import ProgramWithGates from "@components/ProgramWithGates";
import usePrograms from "@hooks/useProgramsWithGates";

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

  if (isLoading) {
    return <h2 className="loading-screen">Loading...</h2>;
  }

  if (error) {
    return <div className="error-screen">{error.message}</div>;
  }

  return (
    <div className="app">
      {activeProgram ? (
        <ProgramWithGates
          program={activeProgram}
          resetProgram={resetProgram}
          clearActiveProgram={clearActiveProgram}
          updateProgram={updateProgram}
        />
      ) : (
        <ProgramSelector programs={programs} selectProgram={selectProgram} />
      )}
    </div>
  );
}

export default App;
