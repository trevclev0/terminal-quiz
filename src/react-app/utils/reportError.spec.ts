import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendBeaconMock = vi.fn();

type ReportErrorFn = typeof import("./reportError").reportError;
let reportError: ReportErrorFn;

beforeEach(async () => {
  // Reset the module registry so the in-memory throttle state resets.
  vi.resetModules();
  const mod = await import("./reportError");
  reportError = mod.reportError;

  vi.stubEnv("DEV", false);
  sendBeaconMock.mockReset();
  localStorage.setItem("terminal_quiz_session_id", "session-uuid-123");
  Object.defineProperty(navigator, "sendBeacon", {
    configurable: true,
    value: sendBeaconMock,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("reportError", () => {
  it("sends a beacon with session id, source, and message", async () => {
    reportError({ source: "boundary", message: "boom" });

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    const [url, body] = sendBeaconMock.mock.calls[0] as [string, Blob];
    expect(url).toBe("/api/error");

    const payload = JSON.parse(await body.text()) as Record<string, string>;
    expect(payload).toMatchObject({
      sessionId: "session-uuid-123",
      source: "boundary",
      message: "boom",
    });
    expect(payload.path).toBe(window.location.pathname);
    expect(payload.userAgent).toBe(navigator.userAgent);
  });

  it("prefers error.message and error.stack over the message fallback", async () => {
    const error = new Error("crash");
    reportError({ source: "route", error, path: "/programs/x" });

    const body = sendBeaconMock.mock.calls[0][1] as Blob;
    const payload = JSON.parse(await body.text()) as Record<string, string>;
    expect(payload.source).toBe("route");
    expect(payload.message).toBe("crash");
    expect(payload.stack).toContain("crash");
    expect(payload.path).toBe("/programs/x");
  });

  it("throttles to one beacon per second", () => {
    reportError({ source: "boundary", message: "first" });
    reportError({ source: "boundary", message: "second" });

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
  });

  it("no-ops in dev", () => {
    vi.stubEnv("DEV", true);
    reportError({ source: "boundary", message: "boom" });

    expect(sendBeaconMock).not.toHaveBeenCalled();
  });

  it("no-ops when sendBeacon is unavailable", () => {
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: undefined,
    });

    expect(() =>
      reportError({ source: "boundary", message: "boom" }),
    ).not.toThrow();
  });
});
