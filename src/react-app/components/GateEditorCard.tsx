import styles from "./GateEditorCard.module.css";
import type { GateForm } from "./manageEditorTypes";

type GateEditorCardProps = {
  gate: { id: string };
  draft: GateForm;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isReorderPending: boolean;
  isDeletePending: boolean;
  savingGateId: string | null;
  onReorder: (idx: number, direction: "up" | "down") => void;
  onSave: (gateId: string) => void;
  onDelete: (gateId: string) => void;
  onDraftChange: (patch: Partial<GateForm>) => void;
  updateError?: string | null;
  deleteError?: string | null;
};

const REQUIRED_FIELDS: Array<{ key: keyof GateForm; label: string }> = [
  { key: "label", label: "Label" },
  { key: "question", label: "Question" },
  { key: "correctAnswer", label: "Correct Answer" },
  { key: "successMessage", label: "Success Message" },
];

export default function GateEditorCard({
  gate,
  draft,
  index,
  isFirst,
  isLast,
  isReorderPending,
  isDeletePending,
  savingGateId,
  onReorder,
  onSave,
  onDelete,
  onDraftChange,
  updateError,
  deleteError,
}: GateEditorCardProps) {
  const isMissingRequired = REQUIRED_FIELDS.some(
    (field) => String(draft[field.key]).trim() === "",
  );

  const acceptancePercent = `${(draft.acceptanceThreshold * 100)
    .toFixed(1)
    .replace(/\.0$/, "")}%`;
  const guidanceState = draft.guidanceEnabled ? "on" : "off";

  return (
    <div className={styles.gateCard}>
      <div className={styles.gateHeader}>
        <span className={styles.gateIndex}>#{index + 1}</span>
        <button
          type="button"
          onClick={() => onReorder(index, "up")}
          disabled={isFirst || isReorderPending}
          className={styles.reorderButton}
          aria-label="Move gate up"
        >
          [^]
        </button>
        <button
          type="button"
          onClick={() => onReorder(index, "down")}
          disabled={isLast || isReorderPending}
          className={styles.reorderButton}
          aria-label="Move gate down"
        >
          [v]
        </button>
      </div>

      <div className={styles.gateFields}>
        <label className={`${styles.field} ${styles.requiredField}`}>
          Label
          <input
            type="text"
            value={draft.label}
            onChange={(e) => onDraftChange({ label: e.target.value })}
            className={styles.input}
            required
            aria-invalid={draft.label.trim() === ""}
          />
        </label>
        <label className={`${styles.field} ${styles.requiredField}`}>
          Question
          <textarea
            value={draft.question}
            onChange={(e) => onDraftChange({ question: e.target.value })}
            className={styles.textarea}
            rows={3}
            required
            aria-invalid={draft.question.trim() === ""}
          />
        </label>
        <label className={`${styles.field} ${styles.requiredField}`}>
          Correct Answer
          <input
            type="text"
            value={draft.correctAnswer}
            onChange={(e) => onDraftChange({ correctAnswer: e.target.value })}
            className={styles.input}
            required
            aria-invalid={draft.correctAnswer.trim() === ""}
          />
        </label>
        <label className={`${styles.field} ${styles.requiredField}`}>
          Success Message
          <textarea
            value={draft.successMessage}
            onChange={(e) => onDraftChange({ successMessage: e.target.value })}
            className={styles.textarea}
            rows={2}
            required
            aria-invalid={draft.successMessage.trim() === ""}
          />
        </label>
      </div>

      <details className={styles.advancedDetails}>
        <summary className={styles.advancedSummary}>
          Advanced — guidance {guidanceState} · acceptance {acceptancePercent}
        </summary>
        <div className={styles.inlineFields}>
          <label className={styles.field}>
            Acceptance
            <input
              type="number"
              step="0.001"
              min="0"
              max="1"
              value={draft.acceptanceThreshold}
              onChange={(e) => {
                const value = e.target.valueAsNumber;
                if (Number.isNaN(value)) return;
                onDraftChange({
                  acceptanceThreshold: Math.min(1, Math.max(0, value)),
                });
              }}
              className={styles.inputSmall}
            />
          </label>
          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={draft.guidanceEnabled}
              onChange={(e) =>
                onDraftChange({ guidanceEnabled: e.target.checked })
              }
              className={styles.checkboxInput}
            />
            <span className={styles.checkboxBox} aria-hidden="true" />
            Guidance Enabled
          </label>
          <label className={styles.field}>
            Guidance Threshold
            <input
              type="number"
              min="1"
              max="3"
              step="1"
              value={draft.guidanceThreshold}
              onChange={(e) => {
                const value = e.target.valueAsNumber;
                if (Number.isNaN(value)) return;
                onDraftChange({
                  guidanceThreshold: Math.min(3, Math.max(1, value)),
                });
              }}
              className={styles.inputSmall}
              disabled={!draft.guidanceEnabled}
            />
            <span className={styles.helperText}>
              First clue unlocks after N failed guesses
            </span>
          </label>
        </div>
      </details>

      <div className={styles.gateActions}>
        <button
          type="button"
          onClick={() => onSave(gate.id)}
          disabled={savingGateId !== null || isMissingRequired}
          className={styles.button}
        >
          {savingGateId === gate.id ? "Saving..." : "Save Gate"}
        </button>
        <button
          type="button"
          onClick={() => onDelete(gate.id)}
          disabled={isDeletePending}
          className={styles.deleteButton}
        >
          Delete Gate
        </button>
      </div>
      {updateError && (
        <p className={styles.errorText}>Failed to save: {updateError}</p>
      )}
      {deleteError && (
        <p className={styles.errorText}>Failed to delete: {deleteError}</p>
      )}
    </div>
  );
}
