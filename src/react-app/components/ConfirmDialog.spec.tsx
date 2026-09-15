import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ConfirmDialog from "./ConfirmDialog";

const baseProps = {
  ariaLabel: "Test Confirmation",
  message: "Are you sure?",
  confirmLabel: "Confirm",
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe("ConfirmDialog", () => {
  it("renders the message", () => {
    render(<ConfirmDialog {...baseProps} onConfirm={vi.fn()} />);
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("names the dialog with the ariaLabel prop", () => {
    render(
      <ConfirmDialog
        {...baseProps}
        ariaLabel="Delete Gate Confirmation"
        onConfirm={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("dialog", { name: "Delete Gate Confirmation" }),
    ).toBeInTheDocument();
  });

  it("calls onConfirm when the confirm button is clicked", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        {...baseProps}
        confirmLabel="Reset Progress"
        onConfirm={onConfirm}
      />,
    );
    await userEvent.click(screen.getByText("Reset Progress"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onSecondary when the secondary button is clicked", async () => {
    const onSecondary = vi.fn();
    render(
      <ConfirmDialog
        {...baseProps}
        onConfirm={vi.fn()}
        secondaryLabel="Keep Progress"
        onSecondary={onSecondary}
      />,
    );
    await userEvent.click(screen.getByText("Keep Progress"));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it("omits the secondary button when no secondary action is given", () => {
    render(<ConfirmDialog {...baseProps} onConfirm={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByRole("button")).toHaveLength(2);
  });

  it("calls onCancel when the cancel button is clicked", async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        {...baseProps}
        onConfirm={vi.fn()}
        cancelLabel="Cancel"
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("omits the cancel button when no cancelLabel is given", () => {
    render(<ConfirmDialog {...baseProps} onConfirm={vi.fn()} />);
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });

  it("always renders the [x] close affordance", async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog {...baseProps} onConfirm={vi.fn()} onCancel={onCancel} />,
    );
    await userEvent.click(screen.getByText("[x]"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when Enter is pressed on a neutral dialog", async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />);
    // Confirm is auto-focused at neutral tone, so Enter triggers a click
    await userEvent.keyboard("{Enter}");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("focuses cancel, not confirm, on a danger dialog", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        {...baseProps}
        confirmLabel="Delete"
        onConfirm={onConfirm}
        cancelLabel="Cancel"
        onCancel={onCancel}
        tone="danger"
      />,
    );
    expect(screen.getByText("Cancel")).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("falls back to the [x] for focus when a danger dialog has no cancel", () => {
    render(<ConfirmDialog {...baseProps} onConfirm={vi.fn()} tone="danger" />);
    expect(screen.getByText("[x]")).toHaveFocus();
  });

  it("marks the confirm button as danger for destructive confirms", () => {
    render(
      <ConfirmDialog
        {...baseProps}
        confirmLabel="Delete"
        onConfirm={vi.fn()}
        tone="danger"
      />,
    );
    expect(screen.getByText("Delete")).toHaveAttribute("data-tone", "danger");
  });

  it("leaves the confirm button untoned by default", () => {
    render(<ConfirmDialog {...baseProps} onConfirm={vi.fn()} />);
    expect(screen.getByText("Confirm")).not.toHaveAttribute("data-tone");
  });

  it("calls onCancel when Escape key is pressed", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog {...baseProps} onConfirm={vi.fn()} onCancel={onCancel} />,
    );
    // Escape triggers the cancel event on the dialog
    const dialog = screen.getByRole("dialog");
    fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders error message when provided", () => {
    render(
      <ConfirmDialog
        {...baseProps}
        onConfirm={vi.fn()}
        errorMessage="Failed to reset progress"
      />,
    );
    expect(screen.getByText("Failed to reset progress")).toBeInTheDocument();
  });

  it("does not render error element when errorMessage is undefined", () => {
    render(<ConfirmDialog {...baseProps} onConfirm={vi.fn()} />);
    expect(
      screen.queryByText("Failed to reset progress"),
    ).not.toBeInTheDocument();
  });

  it("does not render error element when errorMessage is null", () => {
    render(
      <ConfirmDialog {...baseProps} onConfirm={vi.fn()} errorMessage={null} />,
    );
    expect(
      screen.queryByText("Failed to reset progress"),
    ).not.toBeInTheDocument();
  });
});
