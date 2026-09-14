import styles from "./MutationError.module.css";

type MutationErrorProps = {
  /** Verb for the failed action — "save" renders "Failed to save: ...". */
  action: string;
  /** Renders nothing when absent, so call sites need no surrounding guard. */
  error?: string | null;
  /**
   * Whether the mutation failed, when that is knowable independently of the
   * message. Pass a mutation's own `isError` so a failure still surfaces if it
   * carries an empty message. Defaults to whether `error` has text.
   */
  isError?: boolean;
};

export default function MutationError({
  action,
  error,
  isError,
}: MutationErrorProps) {
  if (!(isError ?? Boolean(error))) return null;

  return (
    <p className={styles.errorText}>
      {error ? `Failed to ${action}: ${error}` : `Failed to ${action}.`}
    </p>
  );
}
