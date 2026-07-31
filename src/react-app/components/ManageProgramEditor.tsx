import { useCreateGateMutation } from "@api/mutations/useCreateGateMutation";
import { useDeleteGateMutation } from "@api/mutations/useDeleteGateMutation";
import { useReorderGatesMutation } from "@api/mutations/useReorderGatesMutation";
import { useUpdateGateMutation } from "@api/mutations/useUpdateGateMutation";
import { useUpdateProgramMutation } from "@api/mutations/useUpdateProgramMutation";
import { useMyProgramsQuery } from "@api/queries/useMyProgramsQuery";
import { useProgramGatesQuery } from "@api/queries/useProgramGatesQuery";
import { useGateDrafts } from "@hooks/useGateDrafts";
import { useGateErrorState } from "@hooks/useGateErrorState";
import { useNewGateForm } from "@hooks/useNewGateForm";
import { useProgramSettings } from "@hooks/useProgramSettings";
import type { SubmitEvent } from "react";
import AddGateForm from "./AddGateForm";
import GateEditorCard from "./GateEditorCard";
import styles from "./ManageProgramEditor.module.css";
import ProgramSettingsForm from "./ProgramSettingsForm";

export default function ManageProgramEditor({
  programId,
}: {
  programId: string;
}) {
  const { data: programs, isLoading: programsLoading } = useMyProgramsQuery();
  const { data: gates, isLoading } = useProgramGatesQuery(programId);

  const updateProgram = useUpdateProgramMutation();
  const createGate = useCreateGateMutation(programId);
  const updateGate = useUpdateGateMutation(programId);
  const deleteGate = useDeleteGateMutation(programId);
  const reorderGates = useReorderGatesMutation(programId);

  const program = programs?.find((p) => p.id === programId);

  const {
    programName,
    setProgramName,
    programVisibility,
    setProgramVisibility,
  } = useProgramSettings(program);

  const [gateDrafts, setGateDrafts] = useGateDrafts(gates);
  const {
    savingGateId,
    beginSave,
    recordSaveResult,
    recordDeleteResult,
    gateSaveError,
    gateDeleteError,
  } = useGateErrorState(updateGate.error?.message, deleteGate.error?.message);
  const { newGate, onNewGateChange, resetNewGate } = useNewGateForm();

  const handleSaveProgram = () => {
    updateProgram.mutate({
      id: programId,
      name: programName,
      visibility: programVisibility,
    });
  };

  const handleSaveGate = (gateId: string) => {
    const draft = gateDrafts[gateId];
    if (!draft) return;
    beginSave(gateId);
    updateGate.mutate(
      { id: gateId, ...draft },
      {
        onSuccess: () => recordSaveResult(gateId, true),
        onError: () => recordSaveResult(gateId, false),
      },
    );
  };

  const handleDeleteGate = (gateId: string) => {
    if (window.confirm("Delete this gate? This cannot be undone.")) {
      deleteGate.mutate(
        { id: gateId },
        {
          onSuccess: () => recordDeleteResult(gateId, true),
          onError: () => recordDeleteResult(gateId, false),
        },
      );
    }
  };

  const handleReorder = (idx: number, direction: "up" | "down") => {
    if (!gates) return;
    const newOrder = [...gates];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[idx]];
    reorderGates.mutate({
      programId,
      orderedGateIds: newOrder.map((g) => g.id),
    });
  };

  const handleAddGate = (e: SubmitEvent) => {
    e.preventDefault();
    if (!newGate.label.trim()) return;
    const maxOrder = Math.max(0, ...(gates?.map((g) => g.sequenceOrder) ?? []));
    createGate.mutate(
      {
        programId,
        label: newGate.label.trim(),
        question: newGate.question.trim(),
        correctAnswer: newGate.correctAnswer.trim(),
        successMessage: newGate.successMessage.trim(),
        sequenceOrder: maxOrder + 1,
      },
      { onSuccess: resetNewGate },
    );
  };

  if (programsLoading || isLoading) {
    return <h2 className="loading-screen">Loading Editor...</h2>;
  }

  if (!program) {
    return <p className={styles.errorText}>Program not found.</p>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Edit: {program.name}</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Program Settings</h2>
        <ProgramSettingsForm
          programName={programName}
          programVisibility={programVisibility}
          onProgramNameChange={setProgramName}
          onProgramVisibilityChange={setProgramVisibility}
          onSave={handleSaveProgram}
          isSaving={updateProgram.isPending}
          isUnlisted={programVisibility === "unlisted"}
          copyUrl={`${window.location.origin}/programs/${programId}`}
          updateError={updateProgram.error?.message}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Gates ({gates?.length ?? 0})</h2>

        {(!gates || gates.length === 0) && (
          <p className={styles.empty}>
            No gates yet. Fill out the Add Gate form below to create your first
            riddle.
          </p>
        )}

        {reorderGates.isError && (
          <p className={styles.errorText}>
            Failed to reorder: {reorderGates.error?.message}
          </p>
        )}

        <div className={styles.gateList}>
          {gates?.map((gate, idx) => {
            const draft = gateDrafts[gate.id];
            if (!draft) return null;
            return (
              <GateEditorCard
                key={gate.id}
                gate={gate}
                draft={draft}
                index={idx}
                isFirst={idx === 0}
                isLast={idx === gates.length - 1}
                isReorderPending={reorderGates.isPending}
                isDeletePending={deleteGate.isPending}
                savingGateId={savingGateId}
                onReorder={handleReorder}
                onSave={handleSaveGate}
                onDelete={handleDeleteGate}
                onDraftChange={(patch) =>
                  setGateDrafts((prev) => ({
                    ...prev,
                    [gate.id]: { ...prev[gate.id], ...patch },
                  }))
                }
                updateError={gateSaveError(gate.id)}
                deleteError={gateDeleteError(gate.id)}
              />
            );
          })}
        </div>

        <AddGateForm
          newGate={newGate}
          onNewGateChange={onNewGateChange}
          onSubmit={handleAddGate}
          isPending={createGate.isPending}
          createError={createGate.error?.message}
        />
      </section>
    </div>
  );
}
