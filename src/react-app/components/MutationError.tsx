import styles from "./MutationError.module.css";

type MutationErrorProps = {
  /** Verb for the failed action — "save" renders "Failed to save: ...". */
  action: string;
  /** Renders nothing when absent, so call sites need no surrounding guard. */
  error?: string | null;
};

export default function MutationError({ action, error }: MutationErrorProps) {
  if (!error) return null;

  return (
    <p className={styles.errorText}>
      Failed to {action}: {error}
    </p>
  );
}
