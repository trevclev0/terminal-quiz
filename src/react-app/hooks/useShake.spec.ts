import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useShake from "./useShake";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe("initial state", () => {
  it("starts with isShaking as false", () => {
    const { result } = renderHook(() => useShake());
    expect(result.current.isShaking).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// shake()
// ---------------------------------------------------------------------------

describe("shake()", () => {
  it("sets isShaking to true", () => {
    const { result } = renderHook(() => useShake());
    act(() => result.current.shake());
    expect(result.current.isShaking).toBe(true);
  });

  it("automatically resets isShaking to false after 400ms", () => {
    const { result } = renderHook(() => useShake());

    act(() => result.current.shake());
    expect(result.current.isShaking).toBe(true);

    act(() => vi.advanceTimersByTime(400));
    expect(result.current.isShaking).toBe(false);
  });

  it("does not reset before 400ms have elapsed", () => {
    const { result } = renderHook(() => useShake());

    act(() => result.current.shake());
    act(() => vi.advanceTimersByTime(399));

    expect(result.current.isShaking).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// clearShake()
// ---------------------------------------------------------------------------

describe("clearShake()", () => {
  it("sets isShaking to false immediately", () => {
    const { result } = renderHook(() => useShake());

    act(() => result.current.shake());
    expect(result.current.isShaking).toBe(true);

    act(() => result.current.clearShake());
    expect(result.current.isShaking).toBe(false);
  });

  it("cancels the auto-reset timer when called early", () => {
    const { result } = renderHook(() => useShake());

    act(() => result.current.shake());
    act(() => result.current.clearShake());
    // Advance past the 400ms window — clearTimeout should have cancelled it
    act(() => vi.advanceTimersByTime(400));

    // Should still be false, not toggled back by a stale timer
    expect(result.current.isShaking).toBe(false);
  });

  it("is a no-op when already not shaking", () => {
    const { result } = renderHook(() => useShake());
    expect(() => act(() => result.current.clearShake())).not.toThrow();
    expect(result.current.isShaking).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Repeated shake calls
// ---------------------------------------------------------------------------

describe("calling shake() multiple times", () => {
  it("does not reset the timer if already shaking", () => {
    const { result } = renderHook(() => useShake());

    act(() => result.current.shake());
    act(() => vi.advanceTimersByTime(300));

    // Call shake again — already shaking so this is a no-op
    act(() => result.current.shake());

    // The original 400ms timer still fires at t=400, not t=700
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.isShaking).toBe(false);
  });
});
