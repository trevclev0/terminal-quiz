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
        <label className={styles.field}>
          Label
          <input
            type="text"
            value={draft.label}
            onChange={(e) => onDraftChange({ label: e.target.value })}
            className={styles.input}
          />
        </label>
        <label className={styles.field}>
          Question
          <textarea
            value={draft.question}
            onChange={(e) => onDraftChange({ question: e.target.value })}
            className={styles.textarea}
            rows={3}
          />
        </label>
        <label className={styles.field}>
          Correct Answer
          <input
            type="text"
            value={draft.correctAnswer}
            onChange={(e) => onDraftChange({ correctAnswer: e.target.value })}
            className={styles.input}
          />
        </label>
        <label className={styles.field}>
          Success Message
          <textarea
            value={draft.successMessage}
            onChange={(e) => onDraftChange({ successMessage: e.target.value })}
            className={styles.textarea}
            rows={2}
          />
        </label>
        <div className={styles.inlineFields}>
          <label className={styles.field}>
            Acceptance
            <input
              type="number"
              step="0.001"
              min="0"
              max="1"
              value={draft.acceptanceThreshold}
              onChange={(e) =>
                onDraftChange({
                  acceptanceThreshold: Math.min(
                    1,
                    Math.max(0, Number(e.target.value)),
                  ),
                })
              }
              className={styles.inputSmall}
            />
          </label>
          <label className={styles.field}>
            Guidance Enabled
            <input
              type="checkbox"
              checked={draft.guidanceEnabled}
              onChange={(e) =>
                onDraftChange({ guidanceEnabled: e.target.checked })
              }
              className={styles.checkbox}
            />
          </label>
          <label className={styles.field}>
            Guidance Threshold
            <input
              type="number"
              min="0"
              step="1"
              value={draft.guidanceThreshold}
              onChange={(e) =>
                onDraftChange({
                  guidanceThreshold: Math.max(0, Number(e.target.value)),
                })
              }
              className={styles.inputSmall}
            />
          </label>
        </div>
      </div>

      <div className={styles.gateActions}>
        <button
          type="button"
          onClick={() => onSave(gate.id)}
          disabled={savingGateId !== null}
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
