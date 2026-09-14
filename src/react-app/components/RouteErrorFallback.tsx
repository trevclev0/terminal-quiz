import { reportError } from "@utils/reportError";
import { useEffect } from "react";
import styles from "./RouteErrorFallback.module.css";

type RouteErrorFallbackProps = {
  // TanStack Router hands boundaries the thrown value as `unknown` — a loader
  // can throw anything, not just an Error — so narrow here instead of claiming
  // a type the runtime does not guarantee.
  error?: unknown;
  reset?: () => void;
  message?: string;
};

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function RouteErrorFallback({
  error,
  reset,
  message = "Something went wrong.",
}: RouteErrorFallbackProps) {
  // `error` is `unknown`, so coerce before using it as a JSX guard.
  const hasError = Boolean(error);

  useEffect(() => {
    if (error) {
      console.error("[RouteErrorFallback]", error);
      // reportError only accepts an Error for stack extraction; a non-Error
      // throw still reports, carrying its description as the message.
      reportError(
        error instanceof Error
          ? { source: "route", error }
          : { source: "route", message: describeError(error) },
      );
    }
  }, [error]);

  return (
    <div className={styles.errorScreen}>
      <p>{message}</p>
      {import.meta.env.DEV && hasError && (
        <details className={styles.errorDetails}>
          <summary>Error details</summary>
          <p>{describeError(error)}</p>
        </details>
      )}
      {reset && (
        <button type="button" onClick={reset} className={styles.retryButton}>
          Retry
        </button>
      )}
    </div>
  );
}
