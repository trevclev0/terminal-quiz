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
 * leaking the previous one.
 */
export function useCopyToClipboard(resetMs = 2000) {
  const [result, setResult] = useState<CopyResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    try {
      await navigator.clipboard.writeText(text);
      setResult({ status: "copied", key });
    } catch {
      setResult({ status: "failed", key });
    }
  };

  const statusOf = (key?: string): CopyStatus =>
    result !== null && result.key === key ? result.status : "idle";

  return { copy, statusOf, status: statusOf() };
}
