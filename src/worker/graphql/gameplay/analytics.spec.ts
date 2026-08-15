import { describe, expect, it, vi } from "vitest";
import { MAX_EVENT_DETAIL_LENGTH, trackEvent } from "./analytics";
import type { AppGraphQLContext } from "./types";

function makeContext(opts: {
  sessionId?: string;
  analytics?: { writeDataPoint: ReturnType<typeof vi.fn> };
  environment?: string;
}): AppGraphQLContext {
  return {
    get: vi.fn((key: string) =>
      key === "sessionId" ? opts.sessionId : undefined,
    ),
    env: {
      ANALYTICS: opts.analytics,
      ENVIRONMENT: opts.environment ?? "production",
    },
  } as unknown as AppGraphQLContext;
}

describe("trackEvent", () => {
  it("writes a data point with the positional column contract", () => {
    const writeDataPoint = vi.fn();
    const c = makeContext({
      sessionId: "session-uuid-123",
      analytics: { writeDataPoint },
      environment: "preview",
    });

    trackEvent(c, {
      name: "gate_completed",
      programId: "prog-1",
      gateId: "gate-1",
      outcome: "correct",
      attemptCount: 3,
      isCorrect: true,
      aiLatencyMs: 42,
    });

    expect(writeDataPoint).toHaveBeenCalledWith({
      indexes: ["session-uuid-123"],
      blobs: ["gate_completed", "prog-1", "gate-1", "correct", "preview", ""],
      doubles: [3, 1, 42],
    });
  });

  it("emits empty strings and zeros for absent optional fields", () => {
    const writeDataPoint = vi.fn();
    const c = makeContext({
      sessionId: "session-uuid-123",
      analytics: { writeDataPoint },
    });

    trackEvent(c, { name: "session_reset", outcome: "reset" });

    expect(writeDataPoint).toHaveBeenCalledWith({
      indexes: ["session-uuid-123"],
      blobs: ["session_reset", "", "", "reset", "production", ""],
      doubles: [0, 0, 0],
    });
  });

  it("truncates detail to the documented limit", () => {
    const writeDataPoint = vi.fn();
    const c = makeContext({
      sessionId: "session-uuid-123",
      analytics: { writeDataPoint },
    });

    trackEvent(c, {
      name: "client_error",
      outcome: "boundary",
      detail: "x".repeat(MAX_EVENT_DETAIL_LENGTH + 500),
    });

    const blobs = writeDataPoint.mock.calls[0][0].blobs as string[];
    expect(blobs[5]).toHaveLength(MAX_EVENT_DETAIL_LENGTH);
  });

  it("no-ops when the Analytics Engine binding is missing", () => {
    const writeDataPoint = vi.fn();
    const c = makeContext({ sessionId: "session-uuid-123" });

    trackEvent(c, { name: "gate_attempt", outcome: "incorrect" });

    expect(writeDataPoint).not.toHaveBeenCalled();
  });

  it("no-ops when the session id is missing", () => {
    const writeDataPoint = vi.fn();
    const c = makeContext({ analytics: { writeDataPoint } });

    trackEvent(c, { name: "gate_attempt", outcome: "incorrect" });

    expect(writeDataPoint).not.toHaveBeenCalled();
  });

  it("tolerates a bare context without env (unit-test mocks)", () => {
    const c = {
      get: vi.fn(() => "session-uuid-123"),
    } as unknown as AppGraphQLContext;

    expect(() => trackEvent(c, { name: "gate_attempt" })).not.toThrow();
  });
});
