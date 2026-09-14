import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCopyToClipboard } from "./useCopyToClipboard";

function stubClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

type Deferred = { resolve: () => void; reject: () => void };

/** Stubs the clipboard so each write stays pending until settled by hand. */
function stubDeferredClipboard() {
  const pending: Deferred[] = [];
  stubClipboard(
    vi.fn(
      () =>
        new Promise<void>((resolve, reject) => {
          pending.push({
            resolve: () => resolve(),
            reject: () => reject(new Error("denied")),
          });
        }),
    ),
  );
  return pending;
}

describe("useCopyToClipboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stubClipboard(vi.fn().mockResolvedValue(undefined));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts idle", () => {
    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.status).toBe("idle");
    expect(result.current.statusOf("row-1")).toBe("idle");
  });

  it("writes the text and reports copied", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("https://example.com/a");
    });

    expect(writeText).toHaveBeenCalledWith("https://example.com/a");
    expect(result.current.status).toBe("copied");
  });

  it("reports failed when the write rejects", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("https://example.com/a");
    });

    expect(result.current.status).toBe("failed");
  });

  it("clears the status after the reset delay", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("https://example.com/a");
    });
    expect(result.current.status).toBe("copied");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.status).toBe("idle");
  });

  it("honours a custom reset delay", async () => {
    const { result } = renderHook(() => useCopyToClipboard(500));

    await act(async () => {
      await result.current.copy("https://example.com/a");
    });

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current.status).toBe("copied");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.status).toBe("idle");
  });

  // Regression: the two hand-rolled implementations this hook replaces tracked
  // success and failure in separate state, so both could be displayed at once.
  it("replaces a failure with a success rather than showing both", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("https://example.com/a");
    });
    expect(result.current.status).toBe("failed");

    stubClipboard(vi.fn().mockResolvedValue(undefined));
    await act(async () => {
      await result.current.copy("https://example.com/a");
    });

    expect(result.current.status).toBe("copied");
  });

  describe("keyed usage", () => {
    it("reports status only for the key that was copied", async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy("https://example.com/a", "row-1");
      });

      expect(result.current.statusOf("row-1")).toBe("copied");
      expect(result.current.statusOf("row-2")).toBe("idle");
      expect(result.current.status).toBe("idle");
    });

    it("moves feedback to the newest key", async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy("https://example.com/a", "row-1");
      });
      await act(async () => {
        await result.current.copy("https://example.com/b", "row-2");
      });

      expect(result.current.statusOf("row-1")).toBe("idle");
      expect(result.current.statusOf("row-2")).toBe("copied");
    });

    // Regression: the previous ManageProgramsList implementation shared one
    // timer ref between two effects, so the second copy clobbered the first
    // handle and left an orphaned timeout behind.
    it("restarts a single timer when a second key is copied", async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy("https://example.com/a", "row-1");
      });

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      await act(async () => {
        await result.current.copy("https://example.com/b", "row-2");
      });

      // row-1's original deadline passes; row-2 must not be cleared early.
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.statusOf("row-2")).toBe("copied");

      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(result.current.statusOf("row-2")).toBe("idle");
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("out-of-order settlement", () => {
    // Regression: without a guard the last write to settle won, so a slow
    // earlier copy could move the feedback onto the wrong row.
    it("keeps the newest copy's result when an older one settles last", async () => {
      const pending = stubDeferredClipboard();
      const { result } = renderHook(() => useCopyToClipboard());

      act(() => {
        result.current.copy("https://example.com/a", "row-1");
        result.current.copy("https://example.com/b", "row-2");
      });

      await act(async () => pending[1].resolve());
      await act(async () => pending[0].resolve());

      expect(result.current.statusOf("row-2")).toBe("copied");
      expect(result.current.statusOf("row-1")).toBe("idle");
    });

    it("does not let a stale failure override a newer success", async () => {
      const pending = stubDeferredClipboard();
      const { result } = renderHook(() => useCopyToClipboard());

      act(() => {
        result.current.copy("https://example.com/a", "row-1");
        result.current.copy("https://example.com/b", "row-2");
      });

      await act(async () => pending[1].resolve());
      await act(async () => pending[0].reject());

      expect(result.current.statusOf("row-2")).toBe("copied");
      expect(result.current.statusOf("row-1")).toBe("idle");
    });

    it("runs only the newest copy's reset timer", async () => {
      const pending = stubDeferredClipboard();
      const { result } = renderHook(() => useCopyToClipboard());

      act(() => {
        result.current.copy("https://example.com/a", "row-1");
        result.current.copy("https://example.com/b", "row-2");
      });

      await act(async () => pending[1].resolve());
      await act(async () => pending[0].resolve());

      // One timer, and it belongs to the newest copy — not the stale one.
      expect(result.current.statusOf("row-2")).toBe("copied");
      expect(vi.getTimerCount()).toBe(1);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.statusOf("row-2")).toBe("idle");
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  it("clears its pending timer on unmount", async () => {
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("https://example.com/a");
    });
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
