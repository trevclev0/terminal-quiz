import useProgressionScroll from "@hooks/useProgressionScroll";
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeScrollableElement() {
  const el = document.createElement("div");
  el.scrollIntoView = vi.fn();
  return el;
}

beforeEach(() => {
  vi.spyOn(document, "getElementById");
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Mount behaviour (isMounted guard)
// ---------------------------------------------------------------------------

describe("on initial mount", () => {
  it("does not call getElementById on first render", () => {
    renderHook(() => useProgressionScroll(0));
    expect(document.getElementById).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Scenario B — game ongoing (nextRiddleIndex >= 0)
// ---------------------------------------------------------------------------

describe("when nextRiddleIndex changes to a valid index", () => {
  it("scrolls the matching riddle element into view", () => {
    const el = makeScrollableElement();
    vi.mocked(document.getElementById).mockReturnValue(el);

    const { rerender } = renderHook(
      ({ index }) => useProgressionScroll(index),
      { initialProps: { index: 0 } },
    );

    rerender({ index: 1 });

    expect(document.getElementById).toHaveBeenCalledWith("riddle-1");
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("does not throw when the element does not exist in the DOM", () => {
    vi.mocked(document.getElementById).mockReturnValue(null);

    const { rerender } = renderHook(
      ({ index }) => useProgressionScroll(index),
      { initialProps: { index: 0 } },
    );

    expect(() => rerender({ index: 2 })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Scenario A — game over (nextRiddleIndex === -1)
// ---------------------------------------------------------------------------

describe("when nextRiddleIndex changes to -1", () => {
  it("scrolls the classic-ending element into view", () => {
    const el = makeScrollableElement();
    vi.mocked(document.getElementById).mockImplementation((id) =>
      id === "classic-ending" ? el : null,
    );

    const { rerender } = renderHook(
      ({ index }) => useProgressionScroll(index),
      { initialProps: { index: 0 } },
    );

    rerender({ index: -1 });

    expect(document.getElementById).toHaveBeenCalledWith("classic-ending");
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("does not attempt to find a riddle element when the game is over", () => {
    const el = makeScrollableElement();
    vi.mocked(document.getElementById).mockImplementation((id) =>
      id === "classic-ending" ? el : null,
    );

    const { rerender } = renderHook(
      ({ index }) => useProgressionScroll(index),
      { initialProps: { index: 0 } },
    );

    rerender({ index: -1 });

    const riddleCalls = vi
      .mocked(document.getElementById)
      .mock.calls.filter(([id]) => id.startsWith("riddle-"));
    expect(riddleCalls).toHaveLength(0);
  });

  it("does not throw when the ending element does not exist in the DOM", () => {
    vi.mocked(document.getElementById).mockReturnValue(null);

    const { rerender } = renderHook(
      ({ index }) => useProgressionScroll(index),
      { initialProps: { index: 0 } },
    );

    expect(() => rerender({ index: -1 })).not.toThrow();
  });
});
