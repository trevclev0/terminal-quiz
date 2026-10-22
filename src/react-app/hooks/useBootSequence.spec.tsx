import { BootProvider, useBoot } from "@contexts/BootContext";
import { stubReducedMotion } from "@test-utils/reducedMotion";
import { act, renderHook } from "@testing-library/react";
import { BOOT_STAGE_TIMEOUT_MS, type BootStage } from "@utils/bootSequence";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBootSequence } from "./useBootSequence";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function renderBoot(powerOn: boolean) {
  return renderHook(
    ({ powerOn }) => ({ ...useBootSequence(powerOn), ...useBoot() }),
    { wrapper: BootProvider, initialProps: { powerOn } },
  );
}

// Each stage's timer is scheduled when that stage commits, so the sequence
// is advanced one stage at a time, each step taken from the timeout table.
function advanceStage(stage: BootStage) {
  const ms = BOOT_STAGE_TIMEOUT_MS[stage];
  if (ms === null) throw new Error(`${stage} has no timeout`);
  act(() => vi.advanceTimersByTime(ms));
}

describe("useBootSequence", () => {
  it("walks the timed stages from flash to banner", () => {
    const { result } = renderBoot(true);
    expect(result.current.stage).toBe("flash");

    advanceStage("flash");
    expect(result.current.stage).toBe("blackout");

    advanceStage("blackout");
    expect(result.current.stage).toBe("cursor");

    advanceStage("cursor");
    expect(result.current.stage).toBe("banner");
    expect(result.current.bootComplete).toBe(false);
  });

  it("holds after the banner types, then reports done", () => {
    const { result } = renderBoot(true);
    advanceStage("flash");
    advanceStage("blackout");
    advanceStage("cursor");

    act(() => result.current.onBannerTyped());
    expect(result.current.stage).toBe("hold");
    expect(result.current.bootComplete).toBe(false);

    advanceStage("hold");
    expect(result.current.stage).toBe("done");
    expect(result.current.bootComplete).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("falls back to done when the banner never finishes typing", () => {
    const { result } = renderBoot(true);
    advanceStage("flash");
    advanceStage("blackout");
    advanceStage("cursor");

    advanceStage("banner");

    expect(result.current.stage).toBe("done");
    expect(result.current.bootComplete).toBe(true);
  });

  it("skips straight to done when power is off", () => {
    const { result } = renderBoot(false);

    expect(result.current.stage).toBe("done");
    expect(result.current.bootComplete).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("skips straight to done under reduced motion", () => {
    stubReducedMotion(true);
    const { result } = renderBoot(true);

    expect(result.current.stage).toBe("done");
    expect(result.current.bootComplete).toBe(true);
  });

  it("ends and reports when power is switched off mid-boot", () => {
    const { result, rerender } = renderBoot(true);
    advanceStage("flash");
    advanceStage("blackout");
    expect(result.current.stage).toBe("cursor");

    rerender({ powerOn: false });

    expect(result.current.stage).toBe("done");
    expect(result.current.bootComplete).toBe(true);
  });

  it("replays and re-gates when power comes back on", () => {
    const { result, rerender } = renderBoot(false);
    expect(result.current.bootComplete).toBe(true);

    rerender({ powerOn: true });

    expect(result.current.stage).toBe("flash");
    expect(result.current.bootComplete).toBe(false);
  });

  it("keeps onBannerTyped stable across stages", () => {
    const { result } = renderBoot(true);
    const first = result.current.onBannerTyped;

    advanceStage("flash");

    expect(result.current.onBannerTyped).toBe(first);
  });

  it("clears its timer on unmount", () => {
    const { result, unmount } = renderBoot(true);
    advanceStage("flash");
    expect(result.current.stage).toBe("blackout");

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
