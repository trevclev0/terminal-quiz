import type { SubmitEvent } from "react";
import styles from "./AddGateForm.module.css";
import type { NewGateForm } from "./manageEditorTypes";

type AddGateFormProps = {
  newGate: NewGateForm;
  onNewGateChange: (patch: Partial<NewGateForm>) => void;
  onSubmit: (e: SubmitEvent) => void;
  isPending: boolean;
  createError?: string | null;
};

export default function AddGateForm({
  newGate,
  onNewGateChange,
  onSubmit,
  isPending,
  createError,
}: AddGateFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={styles.addGateForm}
      aria-label="Add Gate"
    >
      <h3 className={styles.addGateTitle}>Add Gate</h3>
      {createError && (
        <p className={styles.errorText}>Failed to add: {createError}</p>
      )}
      <label className={styles.field}>
        Label
        <input
          type="text"
          value={newGate.label}
          onChange={(e) => onNewGateChange({ label: e.target.value })}
          className={styles.input}
          disabled={isPending}
          required
        />
      </label>
      <label className={styles.field}>
        Question
        <textarea
          value={newGate.question}
          onChange={(e) => onNewGateChange({ question: e.target.value })}
          className={styles.textarea}
          rows={3}
          disabled={isPending}
          required
        />
      </label>
      <label className={styles.field}>
        Correct Answer
        <input
          type="text"
          value={newGate.correctAnswer}
          onChange={(e) => onNewGateChange({ correctAnswer: e.target.value })}
          className={styles.input}
          disabled={isPending}
          required
        />
      </label>
      <label className={styles.field}>
        Success Message
        <textarea
          value={newGate.successMessage}
          onChange={(e) => onNewGateChange({ successMessage: e.target.value })}
          className={styles.textarea}
          rows={2}
          disabled={isPending}
          required
        />
      </label>
      <button
        type="submit"
        disabled={
          isPending ||
          !newGate.label.trim() ||
          !newGate.question.trim() ||
          !newGate.correctAnswer.trim() ||
          !newGate.successMessage.trim()
        }
        className={styles.button}
      >
        {isPending ? "Adding..." : "Add Gate"}
      </button>
    </form>
  );
}
