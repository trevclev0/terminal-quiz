import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  ACCEPTED_ANSWER_REQUIRED_ERROR,
  ANSWER_CONFLICT_ERROR,
  DUPLICATE_ACCEPTED_ANSWER_ERROR,
  MAX_ACCEPTED_ANSWERS,
} from "../../shared/validation";
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
  acceptedAnswers: [],
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

function RemovalFocusHarness({ initial }: { initial: string[] }) {
  // Holds the whole draft so edits to other fields re-render the card,
  // which is what exposes a focus flag that was never reset.
  const [current, setCurrent] = useState<GateForm>({
    ...draft,
    acceptedAnswers: initial,
  });
  return (
    <GateEditorCard
      gate={gate}
      draft={current}
      index={0}
      isFirst
      isLast={false}
      isReorderPending={false}
      isDeletePending={false}
      savingGateId={null}
      onReorder={vi.fn()}
      onSave={vi.fn()}
      onDelete={vi.fn()}
      onDraftChange={(patch) => setCurrent((prev) => ({ ...prev, ...patch }))}
      updateError={null}
      deleteError={null}
    />
  );
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

  it("flags only the blank field as invalid", () => {
    setup({ draft: { ...draft, question: "   " } });

    expect(screen.getByDisplayValue("Gate One")).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    expect(screen.getByLabelText(/Question/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("disables save when a threshold is outside the server's bounds", () => {
    setup({ draft: { ...draft, acceptanceThreshold: 1.5 } });

    expect(screen.getByRole("button", { name: "Save Gate" })).toBeDisabled();
  });

  it("clamps threshold input to the shared bounds", () => {
    const { onDraftChange } = setup({
      draft: { ...draft, guidanceEnabled: true },
    });

    fireEvent.change(screen.getByDisplayValue("0.875"), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByDisplayValue("3"), {
      target: { value: "0" },
    });

    expect(onDraftChange).toHaveBeenCalledWith({ acceptanceThreshold: 1 });
    expect(onDraftChange).toHaveBeenCalledWith({ guidanceThreshold: 1 });
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

  describe("Also accept", () => {
    const withAliases = (acceptedAnswers: string[], extra = {}) => ({
      draft: {
        ...draft,
        correctAnswer: "New York City",
        ...extra,
        acceptedAnswers,
      },
    });

    it("shows the group with its helper text and no rows by default", () => {
      setup();

      expect(
        screen.getByRole("group", { name: "Also accept" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Other answers that count as correct"),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/^Accepted answer/)).toBeNull();
      expect(
        screen.getByRole("button", { name: "[+] Add answer" }),
      ).toBeEnabled();
    });

    it("renders one labelled input per alias", () => {
      setup(withAliases(["nyc", "big apple"]));

      expect(screen.getByLabelText("Accepted answer 1")).toHaveValue("nyc");
      expect(screen.getByLabelText("Accepted answer 2")).toHaveValue(
        "big apple",
      );
      expect(screen.getByLabelText("Remove accepted answer 2")).toBeVisible();
    });

    it("adds a blank row", async () => {
      const { onDraftChange } = setup(withAliases(["nyc"]));
      const user = userEvent.setup();

      await user.click(screen.getByRole("button", { name: "[+] Add answer" }));

      expect(onDraftChange).toHaveBeenCalledWith({
        acceptedAnswers: ["nyc", ""],
      });
    });

    it("focuses the row it just added", () => {
      const props = {
        gate,
        draft: { ...draft, acceptedAnswers: ["nyc"] },
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
      };
      const { rerender } = render(<GateEditorCard {...props} />);

      fireEvent.click(screen.getByRole("button", { name: "[+] Add answer" }));
      rerender(
        <GateEditorCard
          {...props}
          draft={{ ...draft, acceptedAnswers: ["nyc", ""] }}
        />,
      );

      expect(screen.getByLabelText("Accepted answer 2")).toHaveFocus();
    });

    it("patches only the edited row", () => {
      const { onDraftChange } = setup(withAliases(["nyc", "big apple"]));

      fireEvent.change(screen.getByLabelText("Accepted answer 2"), {
        target: { value: "the city" },
      });

      expect(onDraftChange).toHaveBeenCalledWith({
        acceptedAnswers: ["nyc", "the city"],
      });
    });

    it("removes the chosen row", async () => {
      const { onDraftChange } = setup(withAliases(["nyc", "big apple"]));
      const user = userEvent.setup();

      await user.click(screen.getByLabelText("Remove accepted answer 1"));

      expect(onDraftChange).toHaveBeenCalledWith({
        acceptedAnswers: ["big apple"],
      });
    });

    it("disables add at the alias limit", () => {
      setup(
        withAliases(
          Array.from({ length: MAX_ACCEPTED_ANSWERS }, (_, i) => `alias ${i}`),
        ),
      );

      expect(
        screen.getByRole("button", { name: "[+] Add answer" }),
      ).toBeDisabled();
    });

    it("enables save for a valid alias", () => {
      setup(withAliases(["NYC"]));

      expect(screen.getByRole("button", { name: "Save Gate" })).toBeEnabled();
      expect(screen.getByLabelText("Accepted answer 1")).toHaveAttribute(
        "aria-invalid",
        "false",
      );
    });

    it("disables save and flags a blank row", () => {
      setup(withAliases(["nyc", "  "]));

      expect(screen.getByRole("button", { name: "Save Gate" })).toBeDisabled();
      expect(screen.getByLabelText("Accepted answer 1")).toHaveAttribute(
        "aria-invalid",
        "false",
      );
      expect(screen.getByLabelText("Accepted answer 2")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });

    it("disables save and flags case-insensitive duplicates", () => {
      setup(withAliases(["nyc", "NYC"]));

      expect(screen.getByRole("button", { name: "Save Gate" })).toBeDisabled();
      expect(screen.getByLabelText("Accepted answer 1")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(screen.getByLabelText("Accepted answer 2")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(
        screen.getByText(DUPLICATE_ACCEPTED_ANSWER_ERROR),
      ).toBeInTheDocument();
    });

    it("disables save and flags an alias equal to the correct answer", () => {
      setup(withAliases(["nyc", " new york city "]));

      expect(screen.getByRole("button", { name: "Save Gate" })).toBeDisabled();
      expect(screen.getByLabelText("Accepted answer 1")).toHaveAttribute(
        "aria-invalid",
        "false",
      );
      expect(screen.getByLabelText("Accepted answer 2")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(screen.getByText(ANSWER_CONFLICT_ERROR)).toBeInTheDocument();
    });

    it("does not report a blank answer matching a blank row as a conflict", () => {
      setup(withAliases([""], { correctAnswer: "" }));

      expect(screen.getByRole("button", { name: "Save Gate" })).toBeDisabled();
      expect(screen.queryByText(ANSWER_CONFLICT_ERROR)).not.toBeInTheDocument();
    });

    const HELPER_TEXT = "Other answers that count as correct";

    it("describes an invalid alias with its error and the helper text", () => {
      setup(withAliases(["", "nyc"]));

      const input = screen.getByLabelText("Accepted answer 1");
      expect(input).toHaveAccessibleDescription(
        expect.stringContaining(HELPER_TEXT),
      );
      expect(input).toHaveAccessibleDescription(
        expect.stringContaining(ACCEPTED_ANSWER_REQUIRED_ERROR),
      );
    });

    it("describes a valid alias with the helper text only", () => {
      setup(withAliases(["", "nyc"]));

      const input = screen.getByLabelText("Accepted answer 2");
      expect(input).toHaveAccessibleDescription(
        expect.stringContaining(HELPER_TEXT),
      );
      expect(input).not.toHaveAccessibleDescription(
        expect.stringContaining(ACCEPTED_ANSWER_REQUIRED_ERROR),
      );
    });

    it("gives each card its own description ids", () => {
      const props = {
        gate,
        draft: { ...draft, acceptedAnswers: [""] },
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
      };
      const { container } = render(
        <>
          <section data-testid="card-a">
            <GateEditorCard {...props} />
          </section>
          <section data-testid="card-b">
            <GateEditorCard {...props} />
          </section>
        </>,
      );

      for (const id of ["card-a", "card-b"]) {
        const card = container.querySelector(`[data-testid="${id}"]`);
        const input = card?.querySelector("input[aria-label^='Accepted']");
        const ids = input?.getAttribute("aria-describedby")?.split(" ") ?? [];
        expect(ids.length).toBeGreaterThan(1);
        for (const describedBy of ids) {
          expect(card?.querySelector(`[id="${describedBy}"]`)).not.toBeNull();
          expect(
            container.querySelectorAll(`[id="${describedBy}"]`),
          ).toHaveLength(1);
        }
      }
    });

    describe("removal focus", () => {
      it("focuses the row that slides up after removing a middle row", async () => {
        render(<RemovalFocusHarness initial={["a", "b", "c"]} />);

        await userEvent.click(
          screen.getByLabelText("Remove accepted answer 2"),
        );

        const input = screen.getByLabelText("Accepted answer 2");
        expect(input).toHaveValue("c");
        expect(input).toHaveFocus();
      });

      it("focuses the row that slides up after removing the first row", async () => {
        render(<RemovalFocusHarness initial={["a", "b", "c"]} />);

        await userEvent.click(
          screen.getByLabelText("Remove accepted answer 1"),
        );

        const input = screen.getByLabelText("Accepted answer 1");
        expect(input).toHaveValue("b");
        expect(input).toHaveFocus();
      });

      it("focuses the new last row after removing the last row", async () => {
        render(<RemovalFocusHarness initial={["a", "b"]} />);

        await userEvent.click(
          screen.getByLabelText("Remove accepted answer 2"),
        );

        expect(screen.getByLabelText("Accepted answer 1")).toHaveValue("a");
        expect(screen.getByLabelText("Accepted answer 1")).toHaveFocus();
      });

      it("focuses the add button after removing the only row", async () => {
        render(<RemovalFocusHarness initial={["a"]} />);

        await userEvent.click(
          screen.getByLabelText("Remove accepted answer 1"),
        );

        const add = screen.getByRole("button", { name: "[+] Add answer" });
        expect(add).toBeEnabled();
        expect(add).toHaveFocus();
      });

      it("still lands focus when other rows are invalid", async () => {
        render(<RemovalFocusHarness initial={["", "b", "c"]} />);

        await userEvent.click(
          screen.getByLabelText("Remove accepted answer 2"),
        );

        const input = screen.getByLabelText("Accepted answer 2");
        expect(input).toHaveValue("c");
        expect(input).toHaveFocus();
      });

      it("does not pull focus back once the pending focus is spent", async () => {
        const user = userEvent.setup();
        render(<RemovalFocusHarness initial={["a"]} />);

        await user.click(screen.getByLabelText("Remove accepted answer 1"));
        const add = screen.getByRole("button", { name: "[+] Add answer" });
        expect(add).toHaveFocus();

        await user.click(add);
        expect(screen.getByLabelText("Accepted answer 1")).toHaveFocus();

        const label = screen.getByDisplayValue("Gate One");
        await user.click(label);
        await user.type(label, "!");
        expect(screen.getByDisplayValue("Gate One!")).toHaveFocus();
      });
    });
  });
});
