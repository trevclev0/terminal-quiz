import { describe, expect, it } from "vitest";
import formatElapsed from "./formatElapsed";

describe("formatElapsed", () => {
  it.each([
    [0, "0s"],
    [-5, "0s"],
    [45, "45s"],
    [59, "59s"],
    [60, "1m 00s"],
    [724, "12m 04s"],
    [3599, "59m 59s"],
    [3600, "1h 0m"],
    [11_520, "3h 12m"],
    [86_399, "23h 59m"],
    [86_400, "1d 0h"],
    [187_200, "2d 4h"],
  ])("formats %i seconds as %s", (seconds, expected) => {
    expect(formatElapsed(seconds)).toBe(expected);
  });
});
