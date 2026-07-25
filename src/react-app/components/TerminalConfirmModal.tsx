import { useEffect, useRef } from "react";
import styles from "./TerminalConfirmModal.module.css";

type TerminalConfirmModalProps = {
  message: string;
  onConfirm: () => void;
  onKeepProgress: () => void;
  onCancel: () => void;
  errorMessage?: string | null;
};

function TerminalConfirmModal({
  message,
  onConfirm,
  onKeepProgress,
  onCancel,
  errorMessage,
}: TerminalConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    confirmRef.current?.focus();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      aria-label="Reset Progress Confirmation"
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
        >
          Reset Progress
        </button>
        <button
          type="button"
          onClick={onKeepProgress}
          className={styles.actionButton}
        >
          Keep Progress
        </button>
      </div>
      <button type="button" onClick={onCancel} className={styles.cancelButton}>
        [x]
      </button>
    </dialog>
  );
}

export default TerminalConfirmModal;
