import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useTypewriter from "./useTypewriter";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("initial state", () => {
  it("starts with empty displayedText and isComplete false", () => {
    const { result } = renderHook(() => useTypewriter("hello"));
    expect(result.current.displayedText).toBe("");
    expect(result.current.isComplete).toBe(false);
  });

  it("is complete immediately for an empty string", () => {
    const { result } = renderHook(() => useTypewriter(""));
    expect(result.current.displayedText).toBe("");
    expect(result.current.isComplete).toBe(true);
  });
});

describe("typing progression", () => {
  it("reveals one character per speed interval", () => {
    const { result } = renderHook(() => useTypewriter("abc", { speed: 30 }));
    expect(result.current.displayedText).toBe("");
    act(() => vi.advanceTimersByTime(30));
    expect(result.current.displayedText).toBe("a");
    act(() => vi.advanceTimersByTime(30));
    expect(result.current.displayedText).toBe("ab");
    act(() => vi.advanceTimersByTime(30));
    expect(result.current.displayedText).toBe("abc");
  });

  it("marks isComplete after the final character", () => {
    const { result } = renderHook(() => useTypewriter("abc"));
    act(() => vi.advanceTimersByTime(90));
    expect(result.current.displayedText).toBe("abc");
    expect(result.current.isComplete).toBe(true);
  });

  it("renders a surrogate pair as a single typing unit", () => {
    const { result } = renderHook(() => useTypewriter("💡", { speed: 30 }));
    expect(result.current.displayedText).toBe("");
    act(() => vi.advanceTimersByTime(30));
    expect(result.current.displayedText).toBe("💡");
    expect(result.current.isComplete).toBe(true);
  });

  it("treats non-BMP characters as one unit in mixed text", () => {
    const { result } = renderHook(() => useTypewriter("a💡b", { speed: 30 }));
    act(() => vi.advanceTimersByTime(30));
    expect(result.current.displayedText).toBe("a");
    act(() => vi.advanceTimersByTime(30));
    expect(result.current.displayedText).toBe("a💡");
    act(() => vi.advanceTimersByTime(30));
    expect(result.current.displayedText).toBe("a💡b");
    expect(result.current.isComplete).toBe(true);
  });
});

describe("onComplete", () => {
  it("fires exactly once after natural completion", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTypewriter("abc", { onComplete }));
    act(() => vi.advanceTimersByTime(90));
    expect(onComplete).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.isComplete).toBe(true);
  });
});

describe("skip()", () => {
  it("jumps straight to the full text", () => {
    const { result } = renderHook(() => useTypewriter("abcdef"));
    act(() => vi.advanceTimersByTime(60));
    expect(result.current.displayedText).toBe("ab");
    act(() => result.current.skip());
    expect(result.current.displayedText).toBe("abcdef");
    expect(result.current.isComplete).toBe(true);
  });

  it("does not double-fire onComplete when skipped mid-type", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useTypewriter("abcdef", { onComplete }),
    );
    act(() => result.current.skip());
    expect(onComplete).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(10000));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not double-fire onComplete when skipped after completion", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTypewriter("abc", { onComplete }));
    act(() => vi.advanceTimersByTime(90));
    expect(onComplete).toHaveBeenCalledTimes(1);
    act(() => result.current.skip());
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe("text changes", () => {
  it("resets and retypes the new text", () => {
    const { result, rerender } = renderHook(
      (props: { text: string }) => useTypewriter(props.text, { speed: 30 }),
      { initialProps: { text: "hello" } },
    );
    act(() => vi.advanceTimersByTime(60));
    expect(result.current.displayedText).toBe("he");
    rerender({ text: "world" });
    expect(result.current.displayedText).toBe("");
    act(() => vi.advanceTimersByTime(30));
    expect(result.current.displayedText).toBe("w");
    act(() => vi.advanceTimersByTime(150));
    expect(result.current.displayedText).toBe("world");
    expect(result.current.isComplete).toBe(true);
  });

  it("fires onComplete again for the new text value", () => {
    const onComplete = vi.fn();
    const { result, rerender } = renderHook(
      (props: { text: string }) =>
        useTypewriter(props.text, { speed: 30, onComplete }),
      { initialProps: { text: "hello" } },
    );
    act(() => vi.advanceTimersByTime(150));
    expect(onComplete).toHaveBeenCalledTimes(1);
    rerender({ text: "world" });
    act(() => vi.advanceTimersByTime(150));
    expect(onComplete).toHaveBeenCalledTimes(2);
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.skip());
    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});

describe("startDelay", () => {
  it("delays the first character", () => {
    const { result } = renderHook(() =>
      useTypewriter("ab", { speed: 30, startDelay: 100 }),
    );
    act(() => vi.advanceTimersByTime(90));
    expect(result.current.displayedText).toBe("");
    act(() => vi.advanceTimersByTime(10));
    expect(result.current.displayedText).toBe("");
    act(() => vi.advanceTimersByTime(30));
    expect(result.current.displayedText).toBe("a");
    act(() => vi.advanceTimersByTime(30));
    expect(result.current.displayedText).toBe("ab");
    expect(result.current.isComplete).toBe(true);
  });
});

describe("reduced motion", () => {
  it("shows the full text immediately and schedules no timers", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTypewriter("hello", { onComplete }));
    expect(result.current.displayedText).toBe("hello");
    expect(result.current.isComplete).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe("enabled: false", () => {
  it("behaves like reduced motion", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useTypewriter("hello", { enabled: false, onComplete }),
    );
    expect(result.current.displayedText).toBe("hello");
    expect(result.current.isComplete).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe("cleanup", () => {
  it("clears pending timers on unmount", () => {
    const { unmount } = renderHook(() => useTypewriter("abcdef"));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
