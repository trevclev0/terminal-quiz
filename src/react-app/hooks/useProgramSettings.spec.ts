import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useProgramSettings } from "./useProgramSettings";

type ProgramMeta = { name: string; visibility: string };

describe("useProgramSettings", () => {
  it("starts empty with public visibility", () => {
    const { result } = renderHook(() => useProgramSettings(undefined));

    expect(result.current.programName).toBe("");
    expect(result.current.programVisibility).toBe("public");
  });

  it("syncs name and visibility when a program loads", () => {
    const { result, rerender } = renderHook<
      ReturnType<typeof useProgramSettings>,
      { program: ProgramMeta | undefined }
    >(({ program }) => useProgramSettings(program), {
      initialProps: { program: undefined },
    });

    rerender({ program: { name: "My Program", visibility: "unlisted" } });

    expect(result.current.programName).toBe("My Program");
    expect(result.current.programVisibility).toBe("unlisted");
  });

  it("updates when the program changes", () => {
    const { result, rerender } = renderHook<
      ReturnType<typeof useProgramSettings>,
      { program: ProgramMeta | undefined }
    >(({ program }) => useProgramSettings(program), {
      initialProps: { program: { name: "A", visibility: "public" } },
    });

    rerender({ program: { name: "B", visibility: "unlisted" } });

    expect(result.current.programName).toBe("B");
    expect(result.current.programVisibility).toBe("unlisted");
  });

  it("preserves unsaved edits when a refetch returns equivalent values", () => {
    const { result, rerender } = renderHook<
      ReturnType<typeof useProgramSettings>,
      { program: ProgramMeta | undefined }
    >(({ program }) => useProgramSettings(program), {
      initialProps: { program: { name: "A", visibility: "public" } },
    });

    result.current.setProgramName("Edited");
    result.current.setProgramVisibility("unlisted");
    rerender({ program: { name: "A", visibility: "public" } });

    expect(result.current.programName).toBe("Edited");
    expect(result.current.programVisibility).toBe("unlisted");
  });
});
