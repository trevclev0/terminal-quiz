import { useCreateProgramMutation } from "@api/mutations/useCreateProgramMutation";
import { useDeleteProgramMutation } from "@api/mutations/useDeleteProgramMutation";
import { useMyProgramsQuery } from "@api/queries/useMyProgramsQuery";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import styles from "./ManageProgramsList.module.css";

export default function ManageProgramsList() {
  const { data: programs, isLoading, error } = useMyProgramsQuery();
  const createMutation = useCreateProgramMutation();
  const deleteMutation = useDeleteProgramMutation();
  const navigate = useNavigate();

  const [newName, setNewName] = useState("");
  const [newVisibility, setNewVisibility] = useState("public");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const result = await createMutation.mutateAsync({
        name: newName.trim(),
        visibility: newVisibility,
      });
      setNewName("");
      navigate({
        to: "/programs/manage/$programId",
        params: { programId: result.id },
      });
    } catch {
      // Error handled via createMutation.error below
    }
  };

  const handleCopyLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/programs/${id}`,
      );
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard unavailable in non-secure context
    }
  };

  const handleDelete = (id: string) => {
    if (
      window.confirm(
        "Delete this program and all its gates? This cannot be undone.",
      )
    ) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return <h2 className="loading-screen">Loading Programs...</h2>;
  }

  if (error) {
    return (
      <p className="response" style={{ color: "var(--red)" }}>
        Failed to load programs.
      </p>
    );
  }

  return (
    <div className={styles.container}>
      <h1>My Programs</h1>

      <form onSubmit={handleCreate} className={styles.createForm}>
        <input
          type="text"
          placeholder="Program name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className={styles.input}
          required
        />
        <select
          aria-label="Visibility"
          value={newVisibility}
          onChange={(e) => setNewVisibility(e.target.value)}
          className={styles.select}
        >
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
        </select>
        <button
          type="submit"
          disabled={createMutation.isPending || !newName.trim()}
          className={styles.button}
        >
          {createMutation.isPending ? "Creating..." : "Create Program"}
        </button>
      </form>
      {createMutation.isError && (
        <p className={styles.errorText}>
          Failed to create: {createMutation.error?.message}
        </p>
      )}

      {programs && programs.length === 0 ? (
        <p className={styles.empty}>
          No programs yet. Type a name above, choose visibility, and click
          Create Program to begin.
        </p>
      ) : (
        <div className={styles.list}>
          {programs?.map((program) => (
            <div key={program.id} className={styles.programRow}>
              <Link
                to="/programs/manage/$programId"
                params={{ programId: program.id }}
                className={styles.programName}
              >
                {program.name}
              </Link>
              <span
                className={
                  program.visibility === "public"
                    ? styles.badgePublic
                    : styles.badgeUnlisted
                }
              >
                {program.visibility}
              </span>
              {program.visibility === "unlisted" && (
                <button
                  type="button"
                  onClick={() => handleCopyLink(program.id)}
                  className={styles.copyLinkButton}
                >
                  {copiedId === program.id ? "Copied!" : "Copy Link"}
                </button>
              )}
              <Link
                to="/programs/manage/$programId"
                params={{ programId: program.id }}
                className={styles.editLink}
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(program.id)}
                disabled={deleteMutation.isPending}
                className={styles.deleteButton}
              >
                Delete
              </button>
            </div>
          ))}
          {deleteMutation.isError && (
            <p className={styles.errorText}>
              Failed to delete: {deleteMutation.error?.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
