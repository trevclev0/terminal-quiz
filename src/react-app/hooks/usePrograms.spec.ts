import { programKeys } from "@api/queryKeys";
import usePrograms from "@hooks/usePrograms";
import { createQueryWrapper } from "@test-utils/queryTestUtils";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const mockPrograms = [
  { id: "1", name: "Program A", isSelected: false },
  { id: "2", name: "Program B", isSelected: false },
];

describe("usePrograms hook", () => {
  it("updates the cache when selectProgram is called", async () => {
    const { queryClient, wrapper } = createQueryWrapper();

    queryClient.setQueryData(programKeys.all, mockPrograms);

    const { result } = renderHook(() => usePrograms(), { wrapper });

    expect(result.current.programs[0].isSelected).toBe(false);

    act(() => {
      result.current.selectProgram("1");
    });

    await waitFor(() => {
      expect(result.current.programs[0].isSelected).toBe(true);
      expect(result.current.programs[1].isSelected).toBe(false);
      expect(result.current.activeProgram?.id).toBe("1");
    });
  });
});
