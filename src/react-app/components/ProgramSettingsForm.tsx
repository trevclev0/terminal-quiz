import { useCopyToClipboard } from "@hooks/useCopyToClipboard";
import FormField from "./FormField";
import MutationError from "./MutationError";
import styles from "./ProgramSettingsForm.module.css";
import selectStyles from "./select.module.css";

type ProgramSettingsFormProps = {
  programName: string;
  programVisibility: string;
  onProgramNameChange: (value: string) => void;
  onProgramVisibilityChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isUnlisted: boolean;
  copyUrl: string;
  updateError?: string | null;
};

export default function ProgramSettingsForm({
  programName,
  programVisibility,
  onProgramNameChange,
  onProgramVisibilityChange,
  onSave,
  isSaving,
  isUnlisted,
  copyUrl,
  updateError,
}: ProgramSettingsFormProps) {
  const { copy, status } = useCopyToClipboard();

  return (
    <>
      <div className={styles.metaRow}>
        <FormField label="Name" required>
          <input
            type="text"
            value={programName}
            onChange={(e) => onProgramNameChange(e.target.value)}
            className={styles.input}
            required
            aria-invalid={programName.trim() === ""}
          />
        </FormField>
        <FormField label="Visibility">
          <span className={selectStyles.selectContainer}>
            <select
              value={programVisibility}
              onChange={(e) => onProgramVisibilityChange(e.target.value)}
              className={`${selectStyles.select} ${selectStyles.compact}`}
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
            </select>
          </span>
        </FormField>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || programName.trim() === ""}
          className={styles.button}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        {isUnlisted && (
          <button
            type="button"
            onClick={() => copy(copyUrl)}
            className={styles.copyLinkButton}
          >
            {status === "failed"
              ? "Failed"
              : status === "copied"
                ? "Copied!"
                : "Copy Link"}
          </button>
        )}
      </div>
      <MutationError action="save" error={updateError} />
    </>
  );
}
