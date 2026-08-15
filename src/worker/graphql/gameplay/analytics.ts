import type { AppGraphQLContext } from "./types";

export const MAX_EVENT_DETAIL_LENGTH = 1024;

export type GameplayEventName =
  | "program_started"
  | "gate_attempt"
  | "gate_completed"
  | "program_completed"
  | "clue_requested"
  | "session_reset"
  | "client_error";

export type GameplayEvent = {
  name: GameplayEventName;
  programId?: string | null;
  gateId?: string | null;
  outcome?: string;
  detail?: string;
  attemptCount?: number;
  isCorrect?: boolean;
  aiLatencyMs?: number;
};

/**
 * Writes one data point to the Analytics Engine `program_events` dataset.
 *
 * Fire-and-forget — never awaited. No-ops when the binding or session id is
 * absent (unit tests, local runs without the binding). Field order is a
 * versioned, positional contract — see docs/analytics.md "Column contract".
 */
export function trackEvent(c: AppGraphQLContext, event: GameplayEvent) {
  const sessionId = c.get("sessionId");
  const dataset = c.env?.ANALYTICS;
  if (!sessionId || !dataset) return;

  const detail = (event.detail ?? "").slice(0, MAX_EVENT_DETAIL_LENGTH);
  dataset.writeDataPoint({
    indexes: [sessionId],
    blobs: [
      event.name,
      event.programId ?? "",
      event.gateId ?? "",
      event.outcome ?? "",
      c.env?.ENVIRONMENT ?? "unknown",
      detail,
    ],
    doubles: [
      event.attemptCount ?? 0,
      event.isCorrect ? 1 : 0,
      event.aiLatencyMs ?? 0,
    ],
  });
}
