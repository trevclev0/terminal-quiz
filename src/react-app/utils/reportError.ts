import { sanitizeErrorText } from "@shared/sanitizeError";
import { getSessionId } from "./session";

const RATE_LIMIT_MS = 1000;
const MAX_STACK_LENGTH = 1024;
const MAX_USER_AGENT_LENGTH = 200;
const MAX_FIELD_LENGTH = 200;

type ReportErrorSource = "boundary" | "route" | "boot";

type ReportErrorOptions = {
  source: ReportErrorSource;
  error?: Error;
  message?: string;
  stack?: string;
  path?: string;
};

let lastSentAt = 0;

/**
 * Reports a client-side error to the first-party /api/error beacon.
 *
 * Anonymous (session-scoped), throttled to ~1/sec, fire-and-forget. No-ops in
 * dev and when sendBeacon is unavailable. The originating component keeps its
 * own console.error for local debugging — this only ships the payload.
 */
export function reportError({
  source,
  error,
  message,
  stack,
  path,
}: ReportErrorOptions) {
  if (import.meta.env.DEV) return;

  const now = Date.now();
  if (now - lastSentAt < RATE_LIMIT_MS) return;
  lastSentAt = now;

  if (typeof navigator === "undefined" || !navigator.sendBeacon) return;

  let sessionId: string;
  try {
    sessionId = getSessionId();
  } catch {
    return;
  }

  // Combine so a boundary's info.componentStack (passed as `stack`) survives
  // alongside error.stack instead of being shadowed by it. Reserve budget for
  // the component stack: a long error.stack must not truncate it away.
  const errorStack = error?.stack ?? "";
  const componentStack = stack ?? "";
  const errorStackBudget =
    componentStack.length > 0
      ? Math.max(0, MAX_STACK_LENGTH - componentStack.length - 1)
      : MAX_STACK_LENGTH;
  const stackText = [errorStack.slice(0, errorStackBudget), componentStack]
    .filter(Boolean)
    .join("\n");

  const payload = {
    sessionId,
    source,
    message: sanitizeErrorText(
      error?.message ?? message ?? "Unknown error",
      MAX_FIELD_LENGTH,
    ),
    stack: sanitizeErrorText(stackText, MAX_STACK_LENGTH),
    path: sanitizeErrorText(path ?? window.location.pathname, MAX_FIELD_LENGTH),
    userAgent: sanitizeErrorText(navigator.userAgent, MAX_USER_AGENT_LENGTH),
  };

  try {
    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/json",
    });
    navigator.sendBeacon("/api/error", blob);
  } catch {
    // Fire-and-forget — never let telemetry break the app.
  }
}
