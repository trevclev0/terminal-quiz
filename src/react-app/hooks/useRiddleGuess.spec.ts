import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent, SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProgramDataContext as ContextType } from "../contexts/ProgramDataContext";
import { createProgramDataWrapper } from "../test-utils/createProgramDataWrapper";
import useRiddleGuess from "./useRiddleGuess";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("../utils/isGuessCloseEnough", () => ({
  default: vi.fn(),
}));

import type { Gate, ProgramWithGates } from "../../worker/db/types";
import {
  defaultNullishGateProps,
  defaultNullishProgramProps,
} from "../test-utils/testTypes";
import isGuessCloseEnough from "../utils/isGuessCloseEnough";

const mockIsGuessCloseEnough = vi.mocked(isGuessCloseEnough);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const riddle: Gate = {
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

const activeProgram: ProgramWithGates = {
  id: "d9e4309c-a3c2-43bc-9894-540aa0a2fc9c",
  name: "Alpha",
  isSelected: true,
  gates: [
    riddle,
    {
      ...riddle,
      id: "13646090-d5d3-4e86-9485-886802231c3d",
      label: "Step 2",
      isSolved: false,
    },
  ],
  ...defaultNullishProgramProps,
};

// ---------------------------------------------------------------------------
// Wrapper factory
// ---------------------------------------------------------------------------

const shake = vi.fn();
const clearShake = vi.fn();

function renderGuessHook(overrides: Partial<ContextType> = {}) {
  const { wrapper, contextValue } = createProgramDataWrapper({
    activeProgram,
    ...overrides,
  });
  const { result } = renderHook(
    () =>
      useRiddleGuess({
        riddle,
        shake,
        clearShake,
      }),
    { wrapper },
  );
  return { result, contextValue };
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

  it("calls contextValue with the riddle unlocked", () => {
    const { result, contextValue } = renderGuessHook();
    act(() => result.current.submitHandler(makeSubmitEvent()));

    expect(contextValue.updateProgram).toHaveBeenCalledOnce();
    const updatedProgram: ProgramWithGates = vi.mocked(
      contextValue.updateProgram,
    ).mock.calls[0][0];
    const updatedRiddle = updatedProgram.gates.find((r) => r.id === riddle.id);
    expect(updatedRiddle?.isSolved).toBe(true);
  });

  it("does not unlock other riddles", () => {
    const { result, contextValue } = renderGuessHook();
    act(() => result.current.submitHandler(makeSubmitEvent()));

    const updatedProgram: ProgramWithGates = vi.mocked(
      contextValue.updateProgram,
    ).mock.calls[0][0];
    const otherRiddle = updatedProgram.gates.find((r) => r.label === "Step 2");
    expect(otherRiddle?.isSolved).toBe(false);
  });

  it("does not call contextValue when activeProgram is undefined", () => {
    const { result, contextValue } = renderGuessHook({
      activeProgram: undefined,
    });
    act(() => result.current.submitHandler(makeSubmitEvent()));
    expect(contextValue.updateProgram).not.toHaveBeenCalled();
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

  it("does not call contextValue", () => {
    const { result, contextValue } = renderGuessHook();
    act(() => result.current.submitHandler(makeSubmitEvent()));
    expect(contextValue.updateProgram).not.toHaveBeenCalled();
  });
});
