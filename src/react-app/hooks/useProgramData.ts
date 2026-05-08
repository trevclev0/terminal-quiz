import { ProgramDataContext } from "@contexts/ProgramDataContext";
import { useContext } from "react";

export function useProgramData(): ProgramDataContext {
  const ctx = useContext(ProgramDataContext);
  if (!ctx) {
    throw new Error(
      "useProgramData must be used within a ProgramDataContext.Provider",
    );
  }

  return ctx;
}
