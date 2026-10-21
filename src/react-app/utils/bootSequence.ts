// `hold` is the pause after the banner finishes typing. The banner stays
// mounted through it, so `banner` and `hold` must render the same element.
export type BootStage =
  | "flash"
  | "blackout"
  | "cursor"
  | "banner"
  | "hold"
  | "done";

export type BootEvent =
  | { type: "start" }
  | { type: "skip" }
  | { type: "timeout" }
  | { type: "bannerTyped" };

const FLASH_MS = 150;
const BLACKOUT_MS = 650;
const CURSOR_MS = 1050;
// The banner normally ends by typing out (`bannerTyped`). This only fires if
// the typewriter never reports completion, so the boot can't hang.
const BANNER_FALLBACK_MS = 4000;
export const BANNER_PAUSE_MS = 500;

/** Time from boot start until the banner starts typing. */
export const BOOT_BANNER_MS = FLASH_MS + BLACKOUT_MS + CURSOR_MS;

/** How long each stage lasts before `timeout`; null stages never time out. */
export const BOOT_STAGE_TIMEOUT_MS: Readonly<Record<BootStage, number | null>> =
  {
    flash: FLASH_MS,
    blackout: BLACKOUT_MS,
    cursor: CURSOR_MS,
    banner: BANNER_FALLBACK_MS,
    hold: BANNER_PAUSE_MS,
    done: null,
  };

const AFTER_TIMEOUT: Readonly<Record<BootStage, BootStage>> = {
  flash: "blackout",
  blackout: "cursor",
  cursor: "banner",
  banner: "done",
  hold: "done",
  done: "done",
};

export function bootReducer(stage: BootStage, event: BootEvent): BootStage {
  switch (event.type) {
    case "start":
      return "flash";
    case "skip":
      return "done";
    case "timeout":
      return AFTER_TIMEOUT[stage];
    case "bannerTyped":
      return stage === "banner" ? "hold" : stage;
  }
}

export function initialBootStage(
  powerOn: boolean,
  reducedMotion: boolean,
): BootStage {
  return powerOn && !reducedMotion ? "flash" : "done";
}
