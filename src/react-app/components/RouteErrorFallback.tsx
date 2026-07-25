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
  return (
    <div className={styles.errorScreen}>
      <p>{message}</p>
      {error && (
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
