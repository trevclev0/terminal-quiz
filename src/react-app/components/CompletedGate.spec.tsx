import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { CompletedGate as CompletedGateType } from "@api/queries/useProgramProgressionQuery";
import CompletedGate, { ACCESS_GRANTED_FLASH_MS } from "./CompletedGate";

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

describe("CompletedGate ACCESS GRANTED flash", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("flashes before the success message types over it", () => {
    const onComplete = vi.fn();
    const onFlashComplete = vi.fn();

    render(
      <CompletedGate
        id="gate-0"
        gate={mockCompletedGate}
        isLast
        canType
        flash
        onComplete={onComplete}
        onFlashComplete={onFlashComplete}
      />,
    );

    const line = screen.getByTestId("success-message");
    expect(line).toHaveTextContent("ACCESS GRANTED");
    // Completion releases the next question, so it must wait for the flash.
    expect(onComplete).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(ACCESS_GRANTED_FLASH_MS));

    expect(screen.getByTestId("success-message")).toHaveTextContent("Correct!");
    expect(onFlashComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  // The program's last gate: The End follows, and the message is static.
  it("shows a non-typing gate's message statically after the flash", () => {
    render(<CompletedGate id="gate-0" gate={mockCompletedGate} flash />);

    expect(screen.getByTestId("success-message")).toHaveTextContent(
      "ACCESS GRANTED",
    );

    act(() => vi.advanceTimersByTime(ACCESS_GRANTED_FLASH_MS));

    expect(screen.getByTestId("success-message")).toHaveTextContent("Correct!");
  });

  it("keeps the flash out of the accessibility tree", () => {
    const { container } = render(
      <CompletedGate id="gate-0" gate={mockCompletedGate} isLast flash />,
    );

    expect(screen.getByTestId("success-message")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelector(".sr-only")).toHaveTextContent("Correct!");
  });

  it("finishes the flash even when re-rendered with a new callback", () => {
    const onFlashComplete = vi.fn();
    const { rerender } = render(
      <CompletedGate
        id="gate-0"
        gate={mockCompletedGate}
        flash
        onFlashComplete={() => onFlashComplete()}
      />,
    );

    act(() => vi.advanceTimersByTime(ACCESS_GRANTED_FLASH_MS / 2));
    rerender(
      <CompletedGate
        id="gate-0"
        gate={mockCompletedGate}
        flash
        onFlashComplete={() => onFlashComplete()}
      />,
    );
    act(() => vi.advanceTimersByTime(ACCESS_GRANTED_FLASH_MS / 2));

    expect(onFlashComplete).toHaveBeenCalledTimes(1);
  });

  // A known answer can be submitted while the boot sequence is still
  // running; the flash must wait for it, not play out behind the boot layer.
  it("holds the flash until cleared to type", () => {
    const onFlashComplete = vi.fn();
    const { rerender } = render(
      <CompletedGate
        id="gate-0"
        gate={mockCompletedGate}
        isLast
        canType={false}
        flash
        onFlashComplete={onFlashComplete}
      />,
    );

    act(() => vi.advanceTimersByTime(ACCESS_GRANTED_FLASH_MS));
    expect(screen.getByTestId("success-message")).toHaveTextContent(/^$/);
    expect(onFlashComplete).not.toHaveBeenCalled();

    rerender(
      <CompletedGate
        id="gate-0"
        gate={mockCompletedGate}
        isLast
        canType
        flash
        onFlashComplete={onFlashComplete}
      />,
    );
    expect(screen.getByTestId("success-message")).toHaveTextContent(
      "ACCESS GRANTED",
    );

    act(() => vi.advanceTimersByTime(ACCESS_GRANTED_FLASH_MS));
    expect(onFlashComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("success-message")).toHaveTextContent("Correct!");
  });

  it("does not flash unless asked", () => {
    render(<CompletedGate id="gate-0" gate={mockCompletedGate} isLast />);

    expect(screen.queryByText("ACCESS GRANTED")).not.toBeInTheDocument();
  });
});
