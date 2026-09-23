import { gateTextSchema } from "@shared/validation";
import type { SubmitEvent } from "react";
import styles from "./AddGateForm.module.css";
import FormField from "./FormField";
import MutationError from "./MutationError";
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
      <MutationError action="add" error={createError} />
      <FormField label="Label" required>
        <input
          type="text"
          value={newGate.label}
          onChange={(e) => onNewGateChange({ label: e.target.value })}
          className={styles.input}
          disabled={isPending}
          required
        />
      </FormField>
      <FormField label="Question" required>
        <textarea
          value={newGate.question}
          onChange={(e) => onNewGateChange({ question: e.target.value })}
          className={styles.textarea}
          rows={3}
          disabled={isPending}
          required
        />
      </FormField>
      <FormField label="Correct Answer" required>
        <input
          type="text"
          value={newGate.correctAnswer}
          onChange={(e) => onNewGateChange({ correctAnswer: e.target.value })}
          className={styles.input}
          disabled={isPending}
          required
        />
      </FormField>
      <FormField label="Success Message" required>
        <textarea
          value={newGate.successMessage}
          onChange={(e) => onNewGateChange({ successMessage: e.target.value })}
          className={styles.textarea}
          rows={2}
          disabled={isPending}
          required
        />
      </FormField>
      <button
        type="submit"
        disabled={isPending || !gateTextSchema.safeParse(newGate).success}
        className={styles.button}
      >
        {isPending ? "Adding..." : "Add Gate"}
      </button>
    </form>
  );
}
