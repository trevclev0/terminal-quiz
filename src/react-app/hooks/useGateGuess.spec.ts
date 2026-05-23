import useGateGuess from "@hooks/useGateGuess";
import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent, SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("@utils/isGuessCloseEnough", () => ({
  default: vi.fn(),
}));

import type { Gate } from "@shared/types";
import { defaultNullishGateProps } from "@test-utils/testTypes";
import isGuessCloseEnough from "@utils/isGuessCloseEnough";

const mockIsGuessCloseEnough = vi.mocked(isGuessCloseEnough);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const gate: Gate = {
  id: "3a356c09-8802-442f-aa3d-4189651dd35c",
  label: "Step 1",
  correctAnswer: "A keyboard",
  question: "What has keys?",
  successMessage: "Congratulations!",
  isSolved: false,
  ...defaultNullishGateProps,
  programId: "d9e4309c-a3c2-43bc-9894-540aa0a2fc9c",
  sequenceOrder: 1,
};

// ---------------------------------------------------------------------------
// Setup Utilities
// ---------------------------------------------------------------------------

const shake = vi.fn();
const clearShake = vi.fn();
const onSolve = vi.fn();

function renderGuessHook() {
  const { result } = renderHook(() =>
    useGateGuess({
      gate,
      shake,
      clearShake,
      onSolve,
    }),
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
  mockIsGuessCloseEnough.mockReturnValue(false);
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe("initial state", () => {
  it("starts with an empty guess", () => {
    const { result } = renderGuessHook();
    expect(result.current.guess).toBe("");
  });

  it("starts with an empty response", () => {
    const { result } = renderGuessHook();
    expect(result.current.response).toBe("");
  });

  it("starts with a null guessResult", () => {
    const { result } = renderGuessHook();
    expect(result.current.guessResult).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// changeHandler
// ---------------------------------------------------------------------------

describe("changeHandler", () => {
  it("updates the guess value", () => {
    const { result } = renderGuessHook();
    act(() => result.current.changeHandler(makeChangeEvent("hello")));
    expect(result.current.guess).toBe("hello");
  });
});

// ---------------------------------------------------------------------------
// submitHandler — correct guess
// ---------------------------------------------------------------------------

describe("submitHandler with a correct guess", () => {
  beforeEach(() => {
    mockIsGuessCloseEnough.mockReturnValue(true);
  });

  it("prevents the default form submission", () => {
    const { result } = renderGuessHook();
    const event = makeSubmitEvent();
    act(() => result.current.submitHandler(event));
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('sets response to "Access Granted."', () => {
    const { result } = renderGuessHook();
    act(() => result.current.submitHandler(makeSubmitEvent()));
    expect(result.current.response).toBe("Access Granted.");
  });

  it('sets guessResult to "correct"', () => {
    const { result } = renderGuessHook();
    act(() => result.current.submitHandler(makeSubmitEvent()));
    expect(result.current.guessResult).toBe("correct");
  });

  it("calls clearShake", () => {
    const { result } = renderGuessHook();
    act(() => result.current.submitHandler(makeSubmitEvent()));
    expect(clearShake).toHaveBeenCalled();
  });

  it("calls onSolve", () => {
    const { result } = renderGuessHook();
    act(() => result.current.submitHandler(makeSubmitEvent()));
    expect(onSolve).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// submitHandler — incorrect guess
// ---------------------------------------------------------------------------

describe("submitHandler with an incorrect guess", () => {
  it('sets response to "Access Denied."', () => {
    const { result } = renderGuessHook();
    act(() => result.current.submitHandler(makeSubmitEvent()));
    expect(result.current.response).toBe("Access Denied.");
  });

  it('sets guessResult to "incorrect"', () => {
    const { result } = renderGuessHook();
    act(() => result.current.submitHandler(makeSubmitEvent()));
    expect(result.current.guessResult).toBe("incorrect");
  });

  it("calls shake", () => {
    const { result } = renderGuessHook();
    act(() => result.current.submitHandler(makeSubmitEvent()));
    expect(shake).toHaveBeenCalled();
  });

  it("does not call onSolve", () => {
    const { result } = renderGuessHook();
    act(() => result.current.submitHandler(makeSubmitEvent()));
    expect(onSolve).not.toHaveBeenCalled();
  });
});
