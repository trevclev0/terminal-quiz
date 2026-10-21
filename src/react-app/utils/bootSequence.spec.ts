import { describe, expect, it } from "vitest";
import {
  BANNER_PAUSE_MS,
  BOOT_BANNER_MS,
  BOOT_STAGE_TIMEOUT_MS,
  type BootStage,
  bootReducer,
  initialBootStage,
} from "./bootSequence";

const ALL_STAGES: BootStage[] = [
  "flash",
  "blackout",
  "cursor",
  "banner",
  "hold",
  "done",
];

describe("bootReducer", () => {
  it.each(ALL_STAGES)("start restarts from flash in %s", (stage) => {
    expect(bootReducer(stage, { type: "start" })).toBe("flash");
  });

  it.each(ALL_STAGES)("skip ends the boot from %s", (stage) => {
    expect(bootReducer(stage, { type: "skip" })).toBe("done");
  });

  it("timeout walks flash → blackout → cursor → banner", () => {
    expect(bootReducer("flash", { type: "timeout" })).toBe("blackout");
    expect(bootReducer("blackout", { type: "timeout" })).toBe("cursor");
    expect(bootReducer("cursor", { type: "timeout" })).toBe("banner");
  });

  it("timeout in banner is the fallback to done", () => {
    expect(bootReducer("banner", { type: "timeout" })).toBe("done");
  });

  it("timeout in hold ends the boot", () => {
    expect(bootReducer("hold", { type: "timeout" })).toBe("done");
  });

  it("timeout in done stays done", () => {
    expect(bootReducer("done", { type: "timeout" })).toBe("done");
  });

  it("bannerTyped moves banner to hold", () => {
    expect(bootReducer("banner", { type: "bannerTyped" })).toBe("hold");
  });

  // A typewriter that finishes after the fallback already fired must not
  // drag a finished boot back into `hold`.
  it.each(["flash", "blackout", "cursor", "hold", "done"] as const)(
    "bannerTyped is ignored in %s",
    (stage) => {
      expect(bootReducer(stage, { type: "bannerTyped" })).toBe(stage);
    },
  );
});

describe("BOOT_STAGE_TIMEOUT_MS", () => {
  it("matches the shipped boot timing", () => {
    expect(BOOT_STAGE_TIMEOUT_MS).toEqual({
      flash: 150,
      blackout: 650,
      cursor: 1050,
      banner: 4000,
      hold: 500,
      done: null,
    });
    expect(BOOT_BANNER_MS).toBe(1850);
    expect(BANNER_PAUSE_MS).toBe(500);
  });
});

describe("initialBootStage", () => {
  it.each([
    [true, false, "flash"],
    [false, false, "done"],
    [true, true, "done"],
    [false, true, "done"],
  ] as const)(
    "powerOn=%s, reducedMotion=%s starts in %s",
    (powerOn, reducedMotion, expected) => {
      expect(initialBootStage(powerOn, reducedMotion)).toBe(expected);
    },
  );
});
