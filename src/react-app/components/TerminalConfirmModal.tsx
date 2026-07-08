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
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Enter") {
        onConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, onConfirm]);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={styles.confirmButton}
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default TerminalConfirmModal;
