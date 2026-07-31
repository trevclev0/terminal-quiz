import { useCreateGateMutation } from "@api/mutations/useCreateGateMutation";
import { useDeleteGateMutation } from "@api/mutations/useDeleteGateMutation";
import { useReorderGatesMutation } from "@api/mutations/useReorderGatesMutation";
import { useUpdateGateMutation } from "@api/mutations/useUpdateGateMutation";
import { useUpdateProgramMutation } from "@api/mutations/useUpdateProgramMutation";
import { useMyProgramsQuery } from "@api/queries/useMyProgramsQuery";
import { useProgramGatesQuery } from "@api/queries/useProgramGatesQuery";
import { useEffect, useRef, useState } from "react";
import styles from "./ManageProgramEditor.module.css";

type GateForm = {
  label: string;
  question: string;
  correctAnswer: string;
  successMessage: string;
  acceptanceThreshold: number;
  guidanceEnabled: boolean;
  guidanceThreshold: number;
};

type NewGateForm = {
  label: string;
  question: string;
  correctAnswer: string;
  successMessage: string;
};

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
  const isReorderPending = reorderGates.isPending;

  const program = programs?.find((p) => p.id === programId);

  const [programName, setProgramName] = useState("");
  const [programVisibility, setProgramVisibility] = useState("public");

  const [gateDrafts, setGateDrafts] = useState<Record<string, GateForm>>({});
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newGate, setNewGate] = useState<NewGateForm>({
    label: "",
    question: "",
    correctAnswer: "",
    successMessage: "",
  });
  const [savingGateId, setSavingGateId] = useState<string | null>(null);

  useEffect(() => {
    if (program) {
      setProgramName(program.name);
      setProgramVisibility(program.visibility);
    }
  }, [program]);

  useEffect(() => {
    if (gates) {
      setGateDrafts((prev) => {
        const next = { ...prev };
        for (const gate of gates) {
          if (!next[gate.id]) {
            next[gate.id] = {
              label: gate.label,
              question: gate.question,
              correctAnswer: gate.correctAnswer,
              successMessage: gate.successMessage,
              acceptanceThreshold: gate.acceptanceThreshold,
              guidanceEnabled: gate.guidanceEnabled,
              guidanceThreshold: gate.guidanceThreshold,
            };
          }
        }
        for (const id of Object.keys(next)) {
          if (!gates.some((g) => g.id === id)) {
            delete next[id];
          }
        }
        return next;
      });
    }
  }, [gates]);

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
    setSavingGateId(gateId);
    updateGate.mutate(
      { id: gateId, ...draft },
      {
        onSettled: () => setSavingGateId(null),
      },
    );
  };

  const handleDeleteGate = (gateId: string) => {
    if (window.confirm("Delete this gate? This cannot be undone.")) {
      deleteGate.mutate({ id: gateId });
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/programs/${programId}`,
      );
      setCopied(true);
    } catch {
      setCopyFailed(true);
    }
  };

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

  const handleAddGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGate.label.trim()) return;
    const maxOrder =
      gates && gates.length > 0
        ? Math.max(...gates.map((g) => g.sequenceOrder))
        : 0;
    createGate.mutate(
      {
        programId,
        label: newGate.label.trim(),
        question: newGate.question.trim(),
        correctAnswer: newGate.correctAnswer.trim(),
        successMessage: newGate.successMessage.trim(),
        sequenceOrder: maxOrder + 1,
      },
      {
        onSuccess: () => {
          setNewGate({
            label: "",
            question: "",
            correctAnswer: "",
            successMessage: "",
          });
        },
      },
    );
  };

  if (programsLoading || isLoading) {
    return <h2 className="loading-screen">Loading Editor...</h2>;
  }

  if (!program) {
    return (
      <p className="response" style={{ color: "var(--red)" }}>
        Program not found.
      </p>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Edit: {program.name}</h1>

      {/* Program metadata */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Program Settings</h2>
        <div className={styles.metaRow}>
          <label className={styles.label}>
            Name
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className={styles.input}
            />
          </label>
          <label className={styles.label}>
            Visibility
            <select
              value={programVisibility}
              onChange={(e) => setProgramVisibility(e.target.value)}
              className={styles.select}
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
            </select>
          </label>
          <button
            type="button"
            onClick={handleSaveProgram}
            disabled={updateProgram.isPending}
            className={styles.button}
          >
            {updateProgram.isPending ? "Saving..." : "Save"}
          </button>
          {programVisibility === "unlisted" && (
            <button
              type="button"
              onClick={handleCopyLink}
              className={styles.copyLinkButton}
            >
              {copyFailed ? "Failed" : copied ? "Copied!" : "Copy Link"}
            </button>
          )}
        </div>
        {updateProgram.isError && (
          <p className={styles.errorText}>
            Failed to save: {updateProgram.error?.message}
          </p>
        )}
      </section>

      {/* Gates */}
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
            const isFirst = idx === 0;
            const isLast = idx === gates.length - 1;

            return (
              <div key={gate.id} className={styles.gateCard}>
                <div className={styles.gateHeader}>
                  <span className={styles.gateIndex}>#{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleReorder(idx, "up")}
                    disabled={isFirst || isReorderPending}
                    className={styles.reorderButton}
                    aria-label="Move gate up"
                  >
                    [^]
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReorder(idx, "down")}
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
                      onChange={(e) =>
                        setGateDrafts((prev) => ({
                          ...prev,
                          [gate.id]: {
                            ...prev[gate.id],
                            label: e.target.value,
                          },
                        }))
                      }
                      className={styles.input}
                    />
                  </label>
                  <label className={styles.field}>
                    Question
                    <textarea
                      value={draft.question}
                      onChange={(e) =>
                        setGateDrafts((prev) => ({
                          ...prev,
                          [gate.id]: {
                            ...prev[gate.id],
                            question: e.target.value,
                          },
                        }))
                      }
                      className={styles.textarea}
                      rows={3}
                    />
                  </label>
                  <label className={styles.field}>
                    Correct Answer
                    <input
                      type="text"
                      value={draft.correctAnswer}
                      onChange={(e) =>
                        setGateDrafts((prev) => ({
                          ...prev,
                          [gate.id]: {
                            ...prev[gate.id],
                            correctAnswer: e.target.value,
                          },
                        }))
                      }
                      className={styles.input}
                    />
                  </label>
                  <label className={styles.field}>
                    Success Message
                    <textarea
                      value={draft.successMessage}
                      onChange={(e) =>
                        setGateDrafts((prev) => ({
                          ...prev,
                          [gate.id]: {
                            ...prev[gate.id],
                            successMessage: e.target.value,
                          },
                        }))
                      }
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
                          setGateDrafts((prev) => ({
                            ...prev,
                            [gate.id]: {
                              ...prev[gate.id],
                              acceptanceThreshold: Math.min(
                                1,
                                Math.max(0, Number(e.target.value)),
                              ),
                            },
                          }))
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
                          setGateDrafts((prev) => ({
                            ...prev,
                            [gate.id]: {
                              ...prev[gate.id],
                              guidanceEnabled: e.target.checked,
                            },
                          }))
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
                          setGateDrafts((prev) => ({
                            ...prev,
                            [gate.id]: {
                              ...prev[gate.id],
                              guidanceThreshold: Math.max(
                                0,
                                Number(e.target.value),
                              ),
                            },
                          }))
                        }
                        className={styles.inputSmall}
                      />
                    </label>
                  </div>
                </div>

                <div className={styles.gateActions}>
                  <button
                    type="button"
                    onClick={() => handleSaveGate(gate.id)}
                    disabled={savingGateId !== null}
                    className={styles.button}
                  >
                    {savingGateId === gate.id ? "Saving..." : "Save Gate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGate(gate.id)}
                    disabled={deleteGate.isPending}
                    className={styles.deleteButton}
                  >
                    Delete Gate
                  </button>
                </div>
                {updateGate.isError && (
                  <p className={styles.errorText}>
                    Failed to save: {updateGate.error?.message}
                  </p>
                )}
                {deleteGate.isError && (
                  <p className={styles.errorText}>
                    Failed to delete: {deleteGate.error?.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Gate */}
        <form
          onSubmit={handleAddGate}
          className={styles.addGateForm}
          aria-label="Add Gate"
        >
          <h3 className={styles.addGateTitle}>Add Gate</h3>
          {createGate.isError && (
            <p className={styles.errorText}>
              Failed to add: {createGate.error?.message}
            </p>
          )}
          <label className={styles.field}>
            Label
            <input
              type="text"
              value={newGate.label}
              onChange={(e) =>
                setNewGate((prev) => ({ ...prev, label: e.target.value }))
              }
              className={styles.input}
              disabled={createGate.isPending}
              required
            />
          </label>
          <label className={styles.field}>
            Question
            <textarea
              value={newGate.question}
              onChange={(e) =>
                setNewGate((prev) => ({ ...prev, question: e.target.value }))
              }
              className={styles.textarea}
              rows={3}
              disabled={createGate.isPending}
              required
            />
          </label>
          <label className={styles.field}>
            Correct Answer
            <input
              type="text"
              value={newGate.correctAnswer}
              onChange={(e) =>
                setNewGate((prev) => ({
                  ...prev,
                  correctAnswer: e.target.value,
                }))
              }
              className={styles.input}
              disabled={createGate.isPending}
              required
            />
          </label>
          <label className={styles.field}>
            Success Message
            <textarea
              value={newGate.successMessage}
              onChange={(e) =>
                setNewGate((prev) => ({
                  ...prev,
                  successMessage: e.target.value,
                }))
              }
              className={styles.textarea}
              rows={2}
              disabled={createGate.isPending}
              required
            />
          </label>
          <button
            type="submit"
            disabled={createGate.isPending || !newGate.label.trim()}
            className={styles.button}
          >
            {createGate.isPending ? "Adding..." : "Add Gate"}
          </button>
        </form>
      </section>
    </div>
  );
}
