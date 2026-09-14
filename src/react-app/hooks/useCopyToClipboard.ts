import { useEffect, useRef, useState } from "react";

export type CopyStatus = "idle" | "copied" | "failed";

type CopyResult = {
  status: Exclude<CopyStatus, "idle">;
  // Identifies which call site the result belongs to when one hook instance
  // serves several copy buttons (e.g. one per row in a list). `undefined` for
  // single-button consumers.
  key: string | undefined;
};

/**
 * Copy text to the clipboard and expose transient "copied"/"failed" feedback
 * that clears itself after `resetMs`.
 *
 * Success and failure share one state slot, so the two can never be displayed
 * at once, and a single timer means a re-copy restarts the countdown instead of
 * leaking the previous one. Only the most recently started copy can set that
 * slot, so an earlier write settling late cannot move the feedback.
 */
export function useCopyToClipboard(resetMs = 2000) {
  const [result, setResult] = useState<CopyResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    if (result === null) return;
    timerRef.current = setTimeout(() => setResult(null), resetMs);
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [result, resetMs]);

  const copy = async (text: string, key?: string) => {
    const requestId = ++latestRequestRef.current;

    let status: CopyResult["status"];
    try {
      await navigator.clipboard.writeText(text);
      status = "copied";
    } catch {
      status = "failed";
    }

    // Clipboard writes can settle out of order. A later copy has already
    // superseded this one, so dropping the stale result keeps the feedback —
    // and its reset timer — on the row the user asked for most recently.
    if (latestRequestRef.current !== requestId) return;

    setResult({ status, key });
  };

  const statusOf = (key?: string): CopyStatus =>
    result !== null && result.key === key ? result.status : "idle";

  return { copy, statusOf, status: statusOf() };
}
