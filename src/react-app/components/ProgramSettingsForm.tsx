import { useEffect, useRef, useState } from "react";
import styles from "./ProgramSettingsForm.module.css";

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
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (copied) {
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }
    return () => {
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, [copied]);

  useEffect(() => {
    if (copyFailed) {
      copyTimerRef.current = setTimeout(() => setCopyFailed(false), 2000);
    }
    return () => {
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, [copyFailed]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(copyUrl);
      setCopied(true);
    } catch {
      setCopyFailed(true);
    }
  };

  return (
    <>
      <div className={styles.metaRow}>
        <label className={styles.label}>
          Name
          <input
            type="text"
            value={programName}
            onChange={(e) => onProgramNameChange(e.target.value)}
            className={styles.input}
          />
        </label>
        <label className={styles.label}>
          Visibility
          <select
            value={programVisibility}
            onChange={(e) => onProgramVisibilityChange(e.target.value)}
            className={styles.select}
          >
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
          </select>
        </label>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
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
