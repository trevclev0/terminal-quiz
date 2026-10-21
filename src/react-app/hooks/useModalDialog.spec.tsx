import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { describe, expect, it } from "vitest";
import { useModalDialog } from "./useModalDialog";

function Harness() {
  const firstRef = useRef<HTMLButtonElement>(null);
  const secondRef = useRef<HTMLButtonElement>(null);
  const [useSecond, setUseSecond] = useState(false);
  const dialogRef = useModalDialog(
    () => (useSecond ? secondRef.current : firstRef.current),
    [useSecond],
  );
  return (
    <>
      <button type="button" onClick={() => setUseSecond(true)}>
        switch
      </button>
      <dialog ref={dialogRef} aria-label="Test dialog">
        <button type="button" ref={firstRef}>
          first
        </button>
        <button type="button" ref={secondRef}>
          second
        </button>
      </dialog>
    </>
  );
}

function Host({ open }: { open: boolean }) {
  return (
    <>
      <button type="button">trigger</button>
      {open && <Harness />}
    </>
  );
}

describe("useModalDialog", () => {
  it("opens the dialog on mount", () => {
    render(<Harness />);
    expect(screen.getByRole("dialog", { name: "Test dialog" })).toHaveProperty(
      "open",
      true,
    );
  });

  it("focuses the element returned by getInitialFocus", () => {
    render(<Harness />);
    expect(screen.getByText("first")).toHaveFocus();
  });

  it("re-runs initial focus when deps change", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByText("switch"));
    expect(screen.getByText("second")).toHaveFocus();
  });

  it("returns focus to the previously focused element on unmount", () => {
    const { rerender } = render(<Host open={false} />);
    const trigger = screen.getByText("trigger");
    trigger.focus();
    rerender(<Host open />);
    expect(screen.getByText("first")).toHaveFocus();
    rerender(<Host open={false} />);
    expect(trigger).toHaveFocus();
  });
});
