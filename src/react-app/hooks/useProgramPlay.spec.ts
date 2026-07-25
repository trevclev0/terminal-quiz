import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../test-utils/queryTestUtils";
import useProgramPlay from "./useProgramPlay";

// Mock the mutations
const mockMutateAsync = vi.fn();
const mockMutate = vi.fn();
let mockSubmitIsPending = false;

vi.mock("@api/mutations/useSubmitGuessMutation", () => ({
  useSubmitGuessMutation: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    get isPending() {
      return mockSubmitIsPending;
    },
  })),
}));

vi.mock("@api/mutations/useRequestClueMutation", () => ({
  useRequestClueMutation: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
}));

const mockShake = vi.fn();
const mockClearShake = vi.fn();
vi.mock("@hooks/useShake", () => ({
  default: vi.fn(() => ({
    isShaking: false,
    shake: mockShake,
    clearShake: mockClearShake,
  })),
}));

describe("useProgramPlay", () => {
  const programId = "test-program";
  const currentGateId = "gate-1";
  const { wrapper } = createQueryWrapper();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitIsPending = false;
  });

  it("starts with an empty guess", () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    expect(result.current.guess).toBe("");
  });

  it("starts with null message", () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    expect(result.current.message).toBeNull();
  });

  it("starts with isShaking false", () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    expect(result.current.isShaking).toBe(false);
  });

  it("starts with isPending false", () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    expect(result.current.isPending).toBe(false);
  });

  it("updates the guess value", () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    act(() => {
      result.current.changeHandler({
        target: { value: "new guess" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.guess).toBe("new guess");
  });

  it("prevents the default form submission", async () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    const preventDefault = vi.fn();
    mockMutateAsync.mockResolvedValue({ success: true, message: "Correct!" });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault,
      } as unknown as React.SubmitEvent<HTMLFormElement>);
    });

    expect(preventDefault).toHaveBeenCalled();
  });

  it('sets message to "Access Granted."', async () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    mockMutateAsync.mockResolvedValue({ success: true, message: "Correct!" });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.SubmitEvent<HTMLFormElement>);
    });

    expect(result.current.message).toBe("Correct!");
  });

  it("sets message to null when success message is null", async () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    mockMutateAsync.mockResolvedValue({
      success: true,
      message: null,
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.SubmitEvent<HTMLFormElement>);
    });

    expect(result.current.message).toBeNull();
  });

  it("clears the guess", async () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    mockMutateAsync.mockResolvedValue({ success: true, message: "Correct!" });

    act(() => {
      result.current.changeHandler({
        target: { value: "correct guess" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.SubmitEvent<HTMLFormElement>);
    });

    expect(result.current.guess).toBe("");
  });

  it("does not set isShaking to true", async () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    mockMutateAsync.mockResolvedValue({ success: true, message: "Correct!" });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.SubmitEvent<HTMLFormElement>);
    });

    expect(mockShake).not.toHaveBeenCalled();
  });

  it('sets message to "Access Denied."', async () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    mockMutateAsync.mockResolvedValue({ success: false, message: "Wrong!" });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.SubmitEvent<HTMLFormElement>);
    });

    expect(result.current.message).toBe("Wrong!");
  });

  it("falls back to 'Access Denied.' when error message is null", async () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    mockMutateAsync.mockResolvedValue({
      success: false,
      message: null,
      canRequestClue: false,
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.SubmitEvent<HTMLFormElement>);
    });

    expect(result.current.message).toBe("Access Denied.");
  });

  it("does nothing when handleRequestClue is called with no currentGateId", () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId: null }),
      { wrapper },
    );

    act(() => {
      result.current.handleRequestClue();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("sets isShaking to true", async () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    mockMutateAsync.mockResolvedValue({ success: false, message: "Wrong!" });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.SubmitEvent<HTMLFormElement>);
    });

    expect(mockShake).toHaveBeenCalled();
  });

  it("calls shake from useShake", async () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    mockMutateAsync.mockResolvedValue({ success: false, message: "Wrong!" });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.SubmitEvent<HTMLFormElement>);
    });

    expect(mockShake).toHaveBeenCalled();
  });

  it("sets canRequestClue to true if returned by mutation", async () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    mockMutateAsync.mockResolvedValue({
      success: false,
      message: "Wrong!",
      canRequestClue: true,
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.SubmitEvent<HTMLFormElement>);
    });

    expect(result.current.canRequestClue).toBe(true);
  });

  it("resets canRequestClue to false if returned by mutation without changing guess", async () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );

    mockMutateAsync.mockResolvedValue({
      success: false,
      message: "Wrong!",
      canRequestClue: true,
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.SubmitEvent<HTMLFormElement>);
    });

    expect(result.current.canRequestClue).toBe(true);

    mockMutateAsync.mockResolvedValue({
      success: false,
      message: "Wrong!",
      canRequestClue: false,
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.SubmitEvent<HTMLFormElement>);
    });

    expect(result.current.canRequestClue).toBe(false);
  });

  it("returns early when mutation is pending", async () => {
    mockSubmitIsPending = true;

    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.SubmitEvent<HTMLFormElement>);
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("sets error message when currentGateId is null", async () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId: null }),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.SubmitEvent<HTMLFormElement>);
    });

    expect(result.current.message).toBe("No active gate to submit guess to");
    expect(result.current.guessSucceeded).toBe(false);
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("sets message to error text", async () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    mockMutateAsync.mockRejectedValue(new Error("Network error"));

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.SubmitEvent<HTMLFormElement>);
    });

    expect(result.current.message).toBe("Error submitting guess");
  });

  it("calls requestClueMutation.mutate with gateId and guess", () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );
    act(() => {
      result.current.changeHandler({
        target: { value: "my guess" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleRequestClue();
    });

    expect(mockMutate).toHaveBeenCalledWith(
      { gateId: currentGateId, currentGuess: "my guess" },
      expect.any(Object),
    );
  });

  it("appends clue to clues array on success", () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );

    mockMutate.mockImplementation((_variables, options) => {
      options.onSuccess({
        clueText: "Here is a clue",
        isClueLimitReached: false,
      });
    });

    act(() => {
      result.current.handleRequestClue();
    });

    expect(result.current.clues).toEqual(["Here is a clue"]);
  });

  it("sets error message and does not append clue if clueText is null", () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );

    mockMutate.mockImplementation((_variables, options) => {
      options.onSuccess({ clueText: null, isClueLimitReached: false });
    });

    act(() => {
      result.current.handleRequestClue();
    });

    expect(result.current.clues).toEqual([]);
    expect(result.current.message).toBe(
      "Failed to generate a clue. Please try again.",
    );
  });

  it("sets error message and does not append clue on mutation error", () => {
    const { result } = renderHook(
      () => useProgramPlay({ programId, currentGateId }),
      { wrapper },
    );

    mockMutate.mockImplementation((_variables, options) => {
      options.onError(new Error("Network error"));
    });

    act(() => {
      result.current.handleRequestClue();
    });

    expect(result.current.clues).toEqual([]);
    expect(result.current.message).toBe(
      "Error requesting clue. Please try again.",
    );
  });

  it("clears shake when currentGateId changes", () => {
    const { rerender } = renderHook(
      ({ currentGateId }) => useProgramPlay({ programId, currentGateId }),
      { wrapper, initialProps: { currentGateId: "gate-1" } },
    );

    rerender({ currentGateId: "gate-2" });

    expect(mockClearShake).toHaveBeenCalled();
  });

  it("resets clues and canRequestClue when currentGateId changes", () => {
    const { result, rerender } = renderHook(
      ({ currentGateId }) => useProgramPlay({ programId, currentGateId }),
      { wrapper, initialProps: { currentGateId: "gate-1" } },
    );

    mockMutate.mockImplementation((_variables, options) => {
      options.onSuccess({
        clueText: "Here is a clue",
        isClueLimitReached: false,
      });
    });

    act(() => {
      result.current.handleRequestClue();
    });

    expect(result.current.clues).toEqual(["Here is a clue"]);

    rerender({ currentGateId: "gate-2" });

    expect(result.current.clues).toEqual([]);
    expect(result.current.canRequestClue).toBe(false);
  });
});
