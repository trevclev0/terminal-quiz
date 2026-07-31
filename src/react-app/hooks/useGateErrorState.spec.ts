import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useGateErrorState } from "./useGateErrorState";

describe("useGateErrorState", () => {
  it("starts with no gate saving or failing", () => {
    const { result } = renderHook(() => useGateErrorState());

    expect(result.current.savingGateId).toBeNull();
    expect(result.current.gateSaveError("g1")).toBeUndefined();
    expect(result.current.gateDeleteError("g1")).toBeUndefined();
  });

  it("tracks the gate being saved", () => {
    const { result } = renderHook(() => useGateErrorState());

    act(() => result.current.beginSave("g1"));

    expect(result.current.savingGateId).toBe("g1");
  });

  it("clears saving state on a successful save", () => {
    const { result } = renderHook(() => useGateErrorState());

    act(() => result.current.beginSave("g1"));
    act(() => result.current.recordSaveResult("g1", true));

    expect(result.current.savingGateId).toBeNull();
    expect(result.current.gateSaveError("g1")).toBeUndefined();
  });

  it("keeps saving state and reports the failed gate on a failed save", () => {
    const { result } = renderHook(() =>
      useGateErrorState("update failed", "delete failed"),
    );

    act(() => result.current.beginSave("g1"));
    act(() => result.current.recordSaveResult("g1", false));

    expect(result.current.savingGateId).toBeNull();
    expect(result.current.gateSaveError("g1")).toBe("update failed");
    expect(result.current.gateSaveError("g2")).toBeUndefined();
  });

  it("reports the failed gate for a failed delete", () => {
    const { result } = renderHook(() =>
      useGateErrorState("update failed", "delete failed"),
    );

    act(() => result.current.recordDeleteResult("g1", false));

    expect(result.current.gateDeleteError("g1")).toBe("delete failed");
    expect(result.current.gateDeleteError("g2")).toBeUndefined();
  });

  it("clears the delete error on success", () => {
    const { result } = renderHook(() => useGateErrorState());

    act(() => result.current.recordDeleteResult("g1", false));
    act(() => result.current.recordDeleteResult("g1", true));

    expect(result.current.gateDeleteError("g1")).toBeUndefined();
  });

  it("returns no error when saveError is undefined", () => {
    const { result } = renderHook(() => useGateErrorState());

    act(() => result.current.recordSaveResult("g1", false));

    expect(result.current.gateSaveError("g1")).toBeUndefined();
  });
});
