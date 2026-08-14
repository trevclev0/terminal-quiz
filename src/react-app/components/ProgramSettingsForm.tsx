import { useEffect, useRef, useState } from "react";
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
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyFailedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (copied) {
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }
    return () => {
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, [copied]);

  useEffect(() => {
    if (copyFailed) {
      copyFailedTimerRef.current = setTimeout(() => setCopyFailed(false), 2000);
    }
    return () => {
      if (copyFailedTimerRef.current !== null) {
        clearTimeout(copyFailedTimerRef.current);
      }
    };
  }, [copyFailed]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(copyUrl);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopyFailed(true);
      setCopied(false);
    }
  };

  return (
    <>
      <div className={styles.metaRow}>
        <label className={`${styles.label} ${styles.requiredField}`}>
          Name
          <input
            type="text"
            value={programName}
            onChange={(e) => onProgramNameChange(e.target.value)}
            className={styles.input}
            required
            aria-invalid={programName.trim() === ""}
          />
        </label>
        <label className={styles.label}>
          Visibility
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
        </label>
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
            onClick={handleCopyLink}
            className={styles.copyLinkButton}
          >
            {copyFailed ? "Failed" : copied ? "Copied!" : "Copy Link"}
          </button>
        )}
      </div>
      {updateError && (
        <p className={styles.errorText}>Failed to save: {updateError}</p>
      )}
    </>
  );
}
