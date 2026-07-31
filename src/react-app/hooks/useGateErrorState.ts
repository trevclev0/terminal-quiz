import { useState } from "react";

export function useGateErrorState(saveError?: string, deleteError?: string) {
  const [savingGateId, setSavingGateId] = useState<string | null>(null);
  const [saveFailedGateId, setSaveFailedGateId] = useState<string | null>(null);
  const [deleteFailedGateId, setDeleteFailedGateId] = useState<string | null>(
    null,
  );

  const beginSave = (gateId: string) => setSavingGateId(gateId);

  const recordSaveResult = (gateId: string, success: boolean) => {
    setSavingGateId((current) => (current === gateId ? null : current));
    setSaveFailedGateId(success ? null : gateId);
  };

  const recordDeleteResult = (gateId: string, success: boolean) => {
    setDeleteFailedGateId(success ? null : gateId);
  };

  const gateSaveError = (gateId: string) =>
    saveError && saveFailedGateId === gateId ? saveError : undefined;

  const gateDeleteError = (gateId: string) =>
    deleteError && deleteFailedGateId === gateId ? deleteError : undefined;

  return {
    savingGateId,
    beginSave,
    recordSaveResult,
    recordDeleteResult,
    gateSaveError,
    gateDeleteError,
  };
}
