import { useEffect } from "react";
import styles from "./RouteErrorFallback.module.css";

type RouteErrorFallbackProps = {
  error?: Error;
  reset?: () => void;
  message?: string;
};

export default function RouteErrorFallback({
  error,
  reset,
  message = "Something went wrong.",
}: RouteErrorFallbackProps) {
  useEffect(() => {
    if (error) {
      console.error("[RouteErrorFallback]", error);
    }
  }, [error]);

  return (
    <div className={styles.errorScreen}>
      <p>{message}</p>
      {import.meta.env.DEV && error && (
        <details className={styles.errorDetails}>
          <summary>Error details</summary>
          <p>{error.message}</p>
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
