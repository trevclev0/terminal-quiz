import { useCreateProgramMutation } from "@api/mutations/useCreateProgramMutation";
import { useDeleteProgramMutation } from "@api/mutations/useDeleteProgramMutation";
import { useMyProgramsQuery } from "@api/queries/useMyProgramsQuery";
import { useCopyToClipboard } from "@hooks/useCopyToClipboard";
import { Link, useNavigate } from "@tanstack/react-router";
import { type SubmitEvent, useState } from "react";
import LoadingScreen from "./LoadingScreen";
import styles from "./ManageProgramsList.module.css";
import MutationError from "./MutationError";
import selectStyles from "./select.module.css";

export default function ManageProgramsList() {
  const { data: programs, isLoading, error } = useMyProgramsQuery();
  const createMutation = useCreateProgramMutation();
  const deleteMutation = useDeleteProgramMutation();
  const navigate = useNavigate();

  const [newName, setNewName] = useState("");
  const [newVisibility, setNewVisibility] = useState("public");
  const { copy, statusOf } = useCopyToClipboard();

  const handleCreate = async (e: SubmitEvent) => {
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

  const handleCopyLink = (id: string) =>
    copy(`${window.location.origin}/programs/${id}`, id);

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
    return <LoadingScreen message="Loading Programs..." />;
  }

  if (error) {
    return <p className={styles.errorText}>Failed to load programs.</p>;
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
        <span className={selectStyles.selectContainer}>
          <select
            aria-label="Visibility"
            value={newVisibility}
            onChange={(e) => setNewVisibility(e.target.value)}
            className={`${selectStyles.select} ${selectStyles.compact}`}
          >
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
          </select>
        </span>
        <button
          type="submit"
          disabled={createMutation.isPending || !newName.trim()}
          className={styles.button}
        >
          {createMutation.isPending ? "Creating..." : "Create Program"}
        </button>
      </form>
      <MutationError action="create" error={createMutation.error?.message} />

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
                  {statusOf(program.id) === "failed"
                    ? "Failed"
                    : statusOf(program.id) === "copied"
                      ? "Copied!"
                      : "Copy Link"}
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
          <MutationError
            action="delete"
            error={deleteMutation.error?.message}
          />
        </div>
      )}
    </div>
  );
}
