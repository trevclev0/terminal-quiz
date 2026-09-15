import { useEffect, useRef } from "react";
import styles from "./ConfirmDialog.module.css";

type ConfirmDialogProps = {
  /**
   * Accessible name for the dialog. Also the stable hook E2E page objects
   * select on, so treat it as part of the call site's public contract.
   */
  ariaLabel: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  /** Dismissal — also fired by the `[x]` button and by Escape. */
  onCancel: () => void;
  /**
   * Renders an explicit dismiss button beside confirm. The `[x]` in the
   * corner renders either way, so omit this where the corner control alone
   * reads as the way out.
   */
  cancelLabel?: string;
  /** A third choice that is neither confirming nor dismissing. */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /**
   * "danger" reddens the confirm button and starts focus on the dismiss
   * control instead, so a stray Enter cannot destroy anything.
   */
  tone?: "neutral" | "danger";
  errorMessage?: string | null;
};

function ConfirmDialog({
  ariaLabel,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  cancelLabel,
  secondaryLabel,
  onSecondary,
  tone = "neutral",
  errorMessage,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  /*
   * Call sites dismiss this dialog by unmounting it rather than calling
   * dialog.close(), so the browser never runs its own focus restoration and a
   * keyboard user is dropped back to the document. Capture the trigger before
   * the focus effect below moves focus in, and hand it back on unmount.
   */
  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    return () => {
      const trigger = triggerRef.current;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    const initialFocus =
      tone === "danger"
        ? (cancelRef.current ?? closeRef.current)
        : confirmRef.current;
    initialFocus?.focus();
  }, [tone]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      aria-label={ariaLabel}
      onClose={onCancel}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <p className={styles.message}>{message}</p>
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      <div className={styles.actions}>
        <button
          ref={confirmRef}
          type="button"
          onClick={onConfirm}
          className={styles.actionButton}
          data-tone={tone === "danger" ? "danger" : undefined}
        >
          {confirmLabel}
        </button>
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            className={styles.actionButton}
          >
            {secondaryLabel}
          </button>
        )}
        {cancelLabel && (
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={styles.actionButton}
          >
            {cancelLabel}
          </button>
        )}
      </div>
      <button
        ref={closeRef}
        type="button"
        onClick={onCancel}
        className={styles.cancelButton}
      >
        [x]
      </button>
    </dialog>
  );
}

export default ConfirmDialog;
