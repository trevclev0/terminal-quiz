import { useProgramData } from "@hooks/useProgramData";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createProgramDataWrapper } from "../test-utils/createProgramDataWrapper";

describe("useProgramData", () => {
  const { wrapper, contextValue } = createProgramDataWrapper();

  it("throws when used outside of a ProgramDataContext.Provider", () => {
    expect(() => renderHook(() => useProgramData())).toThrow(
      "useProgramData must be used within a ProgramDataContext.Provider",
    );
  });

  it("returns the context value when used inside a Provider", () => {
    const { result } = renderHook(() => useProgramData(), { wrapper });
    expect(result.current).toBe(contextValue);
  });

  it("returns programs from context", () => {
    const { result } = renderHook(() => useProgramData(), { wrapper });
    expect(result.current.programs).toEqual([]);
  });

  it("returns selectProgram from context", () => {
    const { result } = renderHook(() => useProgramData(), { wrapper });
    expect(typeof result.current.selectProgram).toBe("function");
  });
});
