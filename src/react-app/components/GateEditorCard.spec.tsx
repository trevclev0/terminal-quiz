import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import GateEditorCard from "./GateEditorCard";
import type { GateForm } from "./manageEditorTypes";

const gate = { id: "gate-1" };

const draft: GateForm = {
  label: "Gate One",
  question: "First question?",
  correctAnswer: "answer-1",
  successMessage: "Correct!",
  acceptanceThreshold: 0.875,
  guidanceEnabled: false,
  guidanceThreshold: 3,
};

function setup(overrides: Record<string, unknown> = {}) {
  const props = {
    gate,
    draft,
    index: 0,
    isFirst: true,
    isLast: false,
    isReorderPending: false,
    isDeletePending: false,
    savingGateId: null,
    onReorder: vi.fn(),
    onSave: vi.fn(),
    onDelete: vi.fn(),
    onDraftChange: vi.fn(),
    updateError: null,
    deleteError: null,
    ...overrides,
  };
  render(<GateEditorCard {...props} />);
  return props;
}

describe("GateEditorCard", () => {
  it("renders draft values and gate index", () => {
    setup();

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Gate One")).toBeInTheDocument();
    expect(screen.getByDisplayValue("First question?")).toBeInTheDocument();
    expect(screen.getByDisplayValue("answer-1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Correct!")).toBeInTheDocument();
    expect(screen.getByDisplayValue("0.875")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
  });

  it("marks required fields as required", () => {
    setup();

    expect(screen.getByDisplayValue("Gate One")).toBeRequired();
    expect(screen.getByDisplayValue("First question?")).toBeRequired();
    expect(screen.getByDisplayValue("answer-1")).toBeRequired();
    expect(screen.getByDisplayValue("Correct!")).toBeRequired();
  });

  it("renders the advanced summary with guidance and acceptance state", () => {
    setup();

    expect(
      screen.getByText("Advanced — guidance off · acceptance 87.5%"),
    ).toBeInTheDocument();
  });

  it("disables save when a required field is blank", () => {
    setup({
      draft: { ...draft, label: "" },
    });

    expect(screen.getByRole("button", { name: "Save Gate" })).toBeDisabled();
  });

  it("disables guidance threshold while guidance is disabled", () => {
    setup({ draft: { ...draft, guidanceEnabled: false } });

    expect(screen.getByDisplayValue("3")).toBeDisabled();
  });

  it("enables guidance threshold when guidance is enabled", () => {
    setup({ draft: { ...draft, guidanceEnabled: true } });

    expect(screen.getByDisplayValue("3")).toBeEnabled();
  });

  it("calls onDraftChange with a patch on edit", () => {
    const { onDraftChange } = setup();

    fireEvent.change(screen.getByDisplayValue("Gate One"), {
      target: { value: "Updated Gate" },
    });

    expect(onDraftChange).toHaveBeenCalledWith({ label: "Updated Gate" });
  });

  it("toggles guidance via checkbox", async () => {
    const { onDraftChange } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("checkbox"));

    expect(onDraftChange).toHaveBeenCalledWith({ guidanceEnabled: true });
  });

  it("saves the gate", async () => {
    const { onSave } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Save Gate" }));

    expect(onSave).toHaveBeenCalledWith("gate-1");
  });

  it("disables all save buttons while another gate saves", () => {
    setup({ savingGateId: "other-gate" });

    expect(screen.getByRole("button", { name: "Save Gate" })).toBeDisabled();
  });

  it("shows Saving label on the saving gate", () => {
    setup({ savingGateId: "gate-1" });

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });

  it("deletes the gate", async () => {
    const { onDelete } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Delete Gate" }));

    expect(onDelete).toHaveBeenCalledWith("gate-1");
  });

  it("disables delete while delete is pending", () => {
    setup({ isDeletePending: true });

    expect(screen.getByRole("button", { name: "Delete Gate" })).toBeDisabled();
  });

  it("disables reorder up at first position", () => {
    setup({ isFirst: true, isLast: false });

    expect(screen.getByLabelText("Move gate up")).toBeDisabled();
    expect(screen.getByLabelText("Move gate down")).toBeEnabled();
  });

  it("disables reorder down at last position", () => {
    setup({ isFirst: false, isLast: true });

    expect(screen.getByLabelText("Move gate up")).toBeEnabled();
    expect(screen.getByLabelText("Move gate down")).toBeDisabled();
  });

  it("reorders with the card index", async () => {
    const { onReorder } = setup({ index: 1, isFirst: false, isLast: false });
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("Move gate up"));
    await user.click(screen.getByLabelText("Move gate down"));

    expect(onReorder).toHaveBeenCalledWith(1, "up");
    expect(onReorder).toHaveBeenCalledWith(1, "down");
  });

  it("disables reorder buttons while reorder is pending", () => {
    setup({ isFirst: false, isLast: false, isReorderPending: true });

    expect(screen.getByLabelText("Move gate up")).toBeDisabled();
    expect(screen.getByLabelText("Move gate down")).toBeDisabled();
  });

  it("shows update and delete errors", () => {
    setup({ updateError: "Update failed", deleteError: "Delete failed" });

    expect(
      screen.getByText("Failed to save: Update failed"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Failed to delete: Delete failed"),
    ).toBeInTheDocument();
  });
});
