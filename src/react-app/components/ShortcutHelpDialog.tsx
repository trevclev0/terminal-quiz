import { useRef } from "react";
import { useModalDialog } from "../hooks/useModalDialog";
import styles from "./ShortcutHelpDialog.module.css";

type ShortcutHelpDialogProps = {
  onClose: () => void;
};

const COMMANDS = [
  {
    command: "/clue",
    description: "request a clue after enough wrong guesses",
  },
  { command: "/help", description: "show this help" },
];

const KEYS = [
  { key: "?", description: "toggle this help (when not typing)" },
  { key: "Esc", description: "close" },
  { key: "Enter", description: "submit guess" },
  { key: "R", description: "play again (The End)" },
  { key: "N", description: "select new program (The End)" },
  { key: "Ctrl+Shift+,", description: "cycle CRT preset" },
];

export function ShortcutHelpDialog({ onClose }: ShortcutHelpDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useModalDialog(() => closeRef.current);

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      aria-label="Keyboard shortcuts"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <h2 className={styles.heading}>Commands (type in the answer box)</h2>
      <dl className={styles.list}>
        {COMMANDS.map(({ command, description }) => (
          <div key={command} className={styles.row}>
            <dt>
              <code>{command}</code>
            </dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
      <h2 className={styles.heading}>Keys</h2>
      <dl className={styles.list}>
        {KEYS.map(({ key, description }) => (
          <div key={key} className={styles.row}>
            <dt>
              <kbd>{key}</kbd>
            </dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className={styles.closeButton}
      >
        [x]
      </button>
    </dialog>
  );
}
