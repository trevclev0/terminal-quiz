import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendBeaconMock = vi.fn();

// Object.defineProperty replacement is not restored by vi.restoreAllMocks(),
// so capture the original descriptor and restore it explicitly.
const originalSendBeaconDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "sendBeacon",
);

function setSendBeacon(value: ReturnType<typeof vi.fn> | undefined) {
  Object.defineProperty(navigator, "sendBeacon", {
    configurable: true,
    value,
  });
}

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
  setSendBeacon(sendBeaconMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  if (originalSendBeaconDescriptor) {
    Object.defineProperty(
      navigator,
      "sendBeacon",
      originalSendBeaconDescriptor,
    );
  } else {
    delete (navigator as Partial<Navigator>).sendBeacon;
  }
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

  it("sanitizes sensitive text before sending", async () => {
    reportError({
      source: "boundary",
      message: "fetch failed: https://api.example.com?token=abc123",
    });

    const body = sendBeaconMock.mock.calls[0][1] as Blob;
    const payload = JSON.parse(await body.text()) as Record<string, string>;
    expect(payload.message).toContain("[REDACTED]");
    expect(payload.message).not.toContain("abc123");
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
    setSendBeacon(undefined);

    expect(() =>
      reportError({ source: "boundary", message: "boom" }),
    ).not.toThrow();
  });

  it("combines error.stack with an explicitly passed stack", async () => {
    const error = new Error("boom");
    reportError({
      source: "boundary",
      error,
      stack: "\n    in Child\n    in Parent",
    });

    const body = sendBeaconMock.mock.calls[0][1] as Blob;
    const payload = JSON.parse(await body.text()) as Record<string, string>;
    expect(payload.stack).toContain("boom");
    expect(payload.stack).toContain("in Child");
    expect(payload.stack).toContain("in Parent");
  });
});
