import useProgramPlay from "@hooks/useProgramPlay";
import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent, SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("@api/mutations/useSubmitGuessMutation", () => ({
  useSubmitGuessMutation: vi.fn(),
}));

vi.mock("@hooks/useShake", () => ({
  default: vi.fn(),
}));

import { useSubmitGuessMutation } from "@api/mutations/useSubmitGuessMutation";
import useShake from "@hooks/useShake";

const mockMutateAsync = vi.fn();
const mockMutation = {
  mutateAsync: mockMutateAsync,
  isPending: false,
  data: undefined,
  error: null,
  variables: undefined,
  isError: false,
  isSuccess: false,
  failureCount: 0,
  failureReason: null,
  mutate: vi.fn(),
  reset: vi.fn(),
  status: "idle" as const,
  isIdle: true,
  context: undefined,
  isPaused: false,
  submittedAt: 0,
};

vi.mocked(useSubmitGuessMutation).mockReturnValue(
  mockMutation as ReturnType<typeof useSubmitGuessMutation>,
);

const mockShake = vi.fn();
const mockClearShake = vi.fn();
let mockIsShaking = false;

vi.mocked(useShake).mockImplementation(() => {
  return {
    get isShaking() {
      return mockIsShaking;
    },
    shake: () => {
      mockIsShaking = true;
      mockShake();
    },
    clearShake: () => {
      mockIsShaking = false;
      mockClearShake();
    },
  };
});

// ---------------------------------------------------------------------------
// Setup Utilities
// ---------------------------------------------------------------------------

function renderProgramPlayHook(
  currentGateId: string | null | undefined = "gate-1",
) {
  const { result } = renderHook(() =>
    useProgramPlay({ programId: "test-program-id", currentGateId }),
  );
  return { result };
}

function makeSubmitEvent() {
  return { preventDefault: vi.fn() } as unknown as SubmitEvent<HTMLFormElement>;
}

function makeChangeEvent(value: string) {
  return { target: { value } } as ChangeEvent<HTMLInputElement>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsShaking = false;
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe("initial state", () => {
  it("starts with an empty guess", () => {
    const { result } = renderProgramPlayHook();
    expect(result.current.guess).toBe("");
  });

  it("starts with null message", () => {
    const { result } = renderProgramPlayHook();
    expect(result.current.message).toBeNull();
  });

  it("starts with isShaking false", () => {
    const { result } = renderProgramPlayHook();
    expect(result.current.isShaking).toBe(false);
  });

  it("starts with isPending false", () => {
    const { result } = renderProgramPlayHook();
    expect(result.current.isPending).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// changeHandler
// ---------------------------------------------------------------------------

describe("changeHandler", () => {
  it("updates the guess value", () => {
    const { result } = renderProgramPlayHook();
    act(() => result.current.changeHandler(makeChangeEvent("hello")));
    expect(result.current.guess).toBe("hello");
  });
});

// ---------------------------------------------------------------------------
// submitHandler — correct guess
// ---------------------------------------------------------------------------

describe("submitHandler with a correct guess", () => {
  beforeEach(() => {
    mockMutateAsync.mockResolvedValue({ success: true, message: "Correct!" });
  });

  it("prevents the default form submission", async () => {
    const { result } = renderProgramPlayHook();
    const event = makeSubmitEvent();
    await act(async () => result.current.handleSubmit(event));
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('sets message to "Access Granted."', async () => {
    const { result } = renderProgramPlayHook();
    await act(async () => result.current.handleSubmit(makeSubmitEvent()));
    expect(result.current.message).toBe("Access Granted.");
  });

  it("clears the guess", async () => {
    const { result } = renderProgramPlayHook();
    act(() => result.current.changeHandler(makeChangeEvent("test")));
    await act(async () => result.current.handleSubmit(makeSubmitEvent()));
    expect(result.current.guess).toBe("");
  });

  it("does not set isShaking to true", async () => {
    const { result } = renderProgramPlayHook();
    await act(async () => result.current.handleSubmit(makeSubmitEvent()));
    expect(result.current.isShaking).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// submitHandler — incorrect guess
// ---------------------------------------------------------------------------

describe("submitHandler with an incorrect guess", () => {
  beforeEach(() => {
    mockMutateAsync.mockResolvedValue({ success: false, message: "Wrong!" });
  });

  it('sets message to "Access Denied."', async () => {
    const { result } = renderProgramPlayHook();
    await act(async () => result.current.handleSubmit(makeSubmitEvent()));
    expect(result.current.message).toBe("Access Denied.");
  });

  it("sets isShaking to true", async () => {
    const { result } = renderProgramPlayHook();
    await act(async () => result.current.handleSubmit(makeSubmitEvent()));
    expect(result.current.isShaking).toBe(true);
  });

  it("calls shake from useShake", async () => {
    const { result } = renderProgramPlayHook();
    await act(async () => result.current.handleSubmit(makeSubmitEvent()));
    expect(mockShake).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// submitHandler — error
// ---------------------------------------------------------------------------

describe("submitHandler with an error", () => {
  beforeEach(() => {
    mockMutateAsync.mockRejectedValue(new Error("Network error"));
  });

  it("sets message to error text", async () => {
    const { result } = renderProgramPlayHook();
    await act(async () => result.current.handleSubmit(makeSubmitEvent()));
    expect(result.current.message).toBe("Error submitting guess");
  });
});

// ---------------------------------------------------------------------------
// currentGateId change
// ---------------------------------------------------------------------------

describe("when currentGateId changes", () => {
  it("clears shake when currentGateId changes", () => {
    mockClearShake.mockClear();
    const { rerender } = renderHook(
      ({ currentGateId }) =>
        useProgramPlay({ programId: "test", currentGateId }),
      { initialProps: { currentGateId: "gate-1" } },
    );

    // clearShake is called on initial render due to effect
    const initialCallCount = mockClearShake.mock.calls.length;
    rerender({ currentGateId: "gate-2" });
    expect(mockClearShake.mock.calls.length).toBe(initialCallCount + 1);
  });
});
