import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useNewGateForm } from "./useNewGateForm";

const empty = {
  label: "",
  question: "",
  correctAnswer: "",
  successMessage: "",
};

describe("useNewGateForm", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useNewGateForm());

    expect(result.current.newGate).toEqual(empty);
  });

  it("merges partial changes", () => {
    const { result } = renderHook(() => useNewGateForm());

    act(() => result.current.onNewGateChange({ label: "Gate A" }));
    act(() => result.current.onNewGateChange({ question: "Q?" }));

    expect(result.current.newGate).toEqual({
      ...empty,
      label: "Gate A",
      question: "Q?",
    });
  });

  it("resets to empty", () => {
    const { result } = renderHook(() => useNewGateForm());

    act(() => result.current.onNewGateChange({ label: "Gate A" }));
    act(() => result.current.resetNewGate());

    expect(result.current.newGate).toEqual(empty);
  });
});
