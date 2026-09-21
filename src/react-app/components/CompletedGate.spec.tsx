import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { CompletedGate as CompletedGateType } from "@api/queries/useProgramProgressionQuery";
import CompletedGate from "./CompletedGate";

// Mirrors the real hook's contract closely enough for these tests: text is
// revealed for whichever mount receives it, and completion is reported once
// from an effect. Reporting matters here — it is what releases the next
// gate's question, so a held-back message must not report.
vi.mock("@hooks/useTypewriter", async () => {
  const { useEffect } = await import("react");

  return {
    default: (text: string, options?: { onComplete?: () => void }) => {
      const onComplete = options?.onComplete;

      useEffect(() => {
        onComplete?.();
      }, [onComplete]);

      return { displayedText: text, isComplete: true, skip: () => {} };
    },
  };
});

const mockCompletedGate: CompletedGateType = {
  id: "gate-1",
  label: "Gate 1",
  question: "What is 2+2?",
  correctAnswer: "4",
  successMessage: "Correct!",
};

describe("CompletedGate", () => {
  it("renders label in summary", () => {
    render(<CompletedGate id="gate-0" gate={mockCompletedGate} />);
    expect(screen.getByText("Gate 1")).toBeInTheDocument();
  });

  it("renders question", () => {
    render(<CompletedGate id="gate-0" gate={mockCompletedGate} />);
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
  });

  it("input is disabled and shows [OK] {correctAnswer}", () => {
    render(<CompletedGate id="gate-0" gate={mockCompletedGate} />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(input).toHaveValue("4");
  });

  it("success message rendered with .clue class", () => {
    render(<CompletedGate id="gate-0" gate={mockCompletedGate} />);
    const clue = screen.getByTestId("success-message");
    expect(clue).toHaveClass("clue");
    expect(clue).toHaveAttribute("aria-hidden", "true");
    expect(clue).toHaveTextContent("Correct!");
  });

  it("details element has open attribute", () => {
    const { container } = render(
      <CompletedGate id="gate-0" gate={mockCompletedGate} />,
    );
    const details = container.querySelector("details");
    expect(details).toHaveAttribute("open");
  });

  it("renders empty input when correctAnswer is empty string", () => {
    const gate: CompletedGateType = {
      ...mockCompletedGate,
      correctAnswer: "",
    };
    render(<CompletedGate id="gate-0" gate={gate} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });

  it("renders long answer without truncation", () => {
    const longAnswer = "a".repeat(500);
    const gate: CompletedGateType = {
      ...mockCompletedGate,
      correctAnswer: longAnswer,
    };
    render(<CompletedGate id="gate-0" gate={gate} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue(longAnswer);
  });

  it("renders long question text", () => {
    const longQuestion =
      "What is the answer to life, the universe, and everything? "
        .repeat(5)
        .trim();
    const gate: CompletedGateType = {
      ...mockCompletedGate,
      question: longQuestion,
    };
    render(<CompletedGate id="gate-0" gate={gate} />);
    expect(screen.getByText(longQuestion)).toBeInTheDocument();
  });
});

describe("CompletedGate boot gating", () => {
  it("holds the last gate's message back until cleared to type", () => {
    render(
      <CompletedGate
        id="gate-0"
        gate={mockCompletedGate}
        isLast
        canType={false}
      />,
    );

    expect(screen.getByTestId("success-message")).toHaveTextContent("");
  });

  it("types the last gate's message once cleared", () => {
    render(
      <CompletedGate id="gate-0" gate={mockCompletedGate} isLast canType />,
    );

    expect(screen.getByTestId("success-message")).toHaveTextContent("Correct!");
  });

  // The release signal for the next gate's question. Firing it while the
  // boot sequence is still running is exactly the overlap this gating
  // exists to prevent.
  it("does not report completion while held back", () => {
    const onComplete = vi.fn();

    render(
      <CompletedGate
        id="gate-0"
        gate={mockCompletedGate}
        isLast
        canType={false}
        onComplete={onComplete}
      />,
    );

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("reports completion once cleared to type", () => {
    const onComplete = vi.fn();

    render(
      <CompletedGate
        id="gate-0"
        gate={mockCompletedGate}
        isLast
        canType
        onComplete={onComplete}
      />,
    );

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("renders earlier gates statically regardless of the boot flag", () => {
    render(
      <CompletedGate id="gate-0" gate={mockCompletedGate} canType={false} />,
    );

    expect(screen.getByTestId("success-message")).toHaveTextContent("Correct!");
  });

  it("keeps the message readable to assistive tech while held back", () => {
    const { container } = render(
      <CompletedGate
        id="gate-0"
        gate={mockCompletedGate}
        isLast
        canType={false}
      />,
    );

    expect(container.querySelector(".sr-only")).toHaveTextContent("Correct!");
  });
});
