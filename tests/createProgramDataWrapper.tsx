import type React from "react";
import { vi } from "vitest";
import { ProgramDataContext } from "../src/contexts/ProgramDataContext";

const defaultContextValue: ProgramDataContext = {
  programs: [],
  activeProgram: undefined,
  selectProgram: vi.fn(),
  updateProgram: vi.fn(),
};

export function createProgramDataWrapper(
  overrides: Partial<ProgramDataContext> = {},
) {
  const contextValue: ProgramDataContext = {
    ...defaultContextValue,
    ...overrides,
  };

  function wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ProgramDataContext.Provider value={contextValue}>
        {children}
      </ProgramDataContext.Provider>
    );
  }

  return { wrapper, contextValue };
}
