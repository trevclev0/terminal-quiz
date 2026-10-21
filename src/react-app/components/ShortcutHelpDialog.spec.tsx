import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ShortcutHelpDialog from "./ShortcutHelpDialog";

describe("ShortcutHelpDialog", () => {
  it("renders a dialog named Keyboard shortcuts", () => {
    render(<ShortcutHelpDialog onClose={vi.fn()} />);
    expect(
      screen.getByRole("dialog", { name: "Keyboard shortcuts" }),
    ).toBeInTheDocument();
  });

  it.each(["/clue", "/help", "?", "Esc", "Enter", "R", "N", "Ctrl+Shift+,"])(
    "lists %s",
    (shortcut) => {
      render(<ShortcutHelpDialog onClose={vi.fn()} />);
      const dialog = screen.getByRole("dialog", { name: "Keyboard shortcuts" });
      expect(within(dialog).getByText(shortcut)).toBeInTheDocument();
    },
  );

  it("focuses the [x] button on open", () => {
    render(<ShortcutHelpDialog onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: "[x]" })).toHaveFocus();
  });

  it("calls onClose when [x] is clicked", async () => {
    const onClose = vi.fn();
    render(<ShortcutHelpDialog onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "[x]" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the dialog is cancelled with Escape", () => {
    const onClose = vi.fn();
    render(<ShortcutHelpDialog onClose={onClose} />);
    const dialog = screen.getByRole("dialog", { name: "Keyboard shortcuts" });
    fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
