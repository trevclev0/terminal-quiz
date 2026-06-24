import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { CompletedGate as CompletedGateType } from "@api/queries/useProgramProgressionQuery";
import CompletedGate from "./CompletedGate";

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

  it("input is disabled and shows ✔ {correctAnswer}", () => {
    render(<CompletedGate id="gate-0" gate={mockCompletedGate} />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(input).toHaveValue("✔ 4");
  });

  it("success message rendered with .clue class", () => {
    render(<CompletedGate id="gate-0" gate={mockCompletedGate} />);
    const clue = screen.getByText("Correct!");
    expect(clue).toHaveClass("clue");
  });

  it("details element has open attribute", () => {
    const { container } = render(
      <CompletedGate id="gate-0" gate={mockCompletedGate} />,
    );
    const details = container.querySelector("details");
    expect(details).toHaveAttribute("open");
  });
});
