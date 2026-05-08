import type { ReactNode } from "react";
import { vi } from "vitest";
import { ProgramDataContext } from "../contexts/ProgramDataContext";

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

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <ProgramDataContext.Provider value={contextValue}>
        {children}
      </ProgramDataContext.Provider>
    );
  }

  return { wrapper, contextValue };
}
