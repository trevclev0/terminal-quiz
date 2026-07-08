import { useEffect, useRef } from "react";
import styles from "./TerminalConfirmModal.module.css";

type TerminalConfirmModalProps = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function TerminalConfirmModal({
  message,
  onConfirm,
  onCancel,
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
      onClose={onCancel}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <button
          ref={confirmRef}
          type="button"
          onClick={onConfirm}
          className={styles.confirmButton}
        >
          Reset Progress
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
        >
          Keep Progress
        </button>
      </div>
    </dialog>
  );
}

export default TerminalConfirmModal;
