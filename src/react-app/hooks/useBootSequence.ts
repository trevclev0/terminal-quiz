import { useBoot } from "@contexts/BootContext";
import {
  BOOT_STAGE_TIMEOUT_MS,
  type BootStage,
  bootReducer,
  initialBootStage,
} from "@utils/bootSequence";
import { prefersReducedMotion } from "@utils/prefersReducedMotion";
import { useCallback, useEffect, useReducer } from "react";

/**
 * Runs the CRT power-on sequence and reports its end to `BootContext`.
 * `onBannerTyped` is the banner typewriter's `onComplete`.
 */
export function useBootSequence(powerOn: boolean): {
  stage: BootStage;
  onBannerTyped: () => void;
} {
  const { markBootComplete, resetBoot } = useBoot();
  // Reduced motion is checked here as well as in the effect below so a
  // skipped boot is `done` on the first paint, not one frame of flash later.
  const [stage, dispatch] = useReducer(bootReducer, powerOn, (on) =>
    initialBootStage(on, prefersReducedMotion()),
  );

  useEffect(() => {
    if (!powerOn || prefersReducedMotion()) {
      dispatch({ type: "skip" });
      return;
    }
    // Only on the path that actually starts a boot. The skip above reports
    // complete through `done` instead.
    resetBoot();
    dispatch({ type: "start" });
  }, [powerOn, resetBoot]);

  useEffect(() => {
    const ms = BOOT_STAGE_TIMEOUT_MS[stage];
    if (ms === null) return;
    const timer = setTimeout(() => dispatch({ type: "timeout" }), ms);
    return () => clearTimeout(timer);
  }, [stage]);

  // One reporting point for every path into `done`. bootReducer is the only
  // way to get there, whether by typing, fallback timer or skip. Consumers
  // gate typing on this flag, so a missed report would hang the chain.
  useEffect(() => {
    if (stage !== "done") return;
    markBootComplete();
  }, [stage, markBootComplete]);

  const onBannerTyped = useCallback(
    () => dispatch({ type: "bannerTyped" }),
    [],
  );

  return { stage, onBannerTyped };
}
