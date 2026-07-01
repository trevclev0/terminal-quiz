import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { ActiveGate as ActiveGateType } from "@api/queries/useProgramProgressionQuery";
import { createRef } from "react";
import ActiveGate from "./ActiveGate";

const mockActiveGate: ActiveGateType = {
  id: "gate-1",
  label: "Gate 1",
  question: "What is 2+2?",
};

const mockChangeHandler = vi.fn();
const mockSubmitHandler = vi.fn((e: React.FormEvent) => e.preventDefault());
const mockInputRef = createRef<HTMLInputElement>();

const mockRequestClueMutation = {
  isPending: false,
  data: { clueText: null, isClueLimitReached: false, cluesRemaining: 3 },
};
const mockHandleRequestClue = vi.fn();

function renderActiveGate(
  props: Partial<React.ComponentProps<typeof ActiveGate>> = {},
) {
  const fullProps = {
    id: "gate-0",
    gate: mockActiveGate,
    guess: "",
    message: null,
    isShaking: false,
    isPending: false,
    inputRef: mockInputRef,
    changeHandler: mockChangeHandler,
    handleSubmit: mockSubmitHandler,
    canRequestClue: false,
    requestClueMutation: mockRequestClueMutation,
    handleRequestClue: mockHandleRequestClue,
    clues: [],
    ...props,
  };
  return render(<ActiveGate {...fullProps} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ActiveGate", () => {
  it("renders label", () => {
    renderActiveGate();
    expect(screen.getByText("Gate 1")).toBeInTheDocument();
  });

  it("renders question", () => {
    renderActiveGate();
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
  });

  it("input is enabled by default", () => {
    renderActiveGate();
    expect(screen.getByRole("textbox")).not.toBeDisabled();
  });

  it("input is disabled when isPending is true", () => {
    renderActiveGate({ isPending: true });
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("applies .shake class when isShaking is true", () => {
    const { container } = renderActiveGate({ isShaking: true });
    const gateDiv = container.querySelector("#gate-0");
    expect(gateDiv).toHaveClass("shake");
  });

  it("does not apply .shake class when isShaking is false", () => {
    const { container } = renderActiveGate({ isShaking: false });
    const gateDiv = container.querySelector("#gate-0");
    expect(gateDiv).not.toHaveClass("shake");
  });

  it("renders response message with .fail class for incorrect response", () => {
    renderActiveGate({ message: "Access Denied." });
    const response = screen.getByText("Access Denied.");
    expect(response).toHaveClass("fail");
  });

  it("renders response message without .fail class for correct response", () => {
    renderActiveGate({ message: "Access Granted." });
    const response = screen.getByText("Access Granted.");
    expect(response).not.toHaveClass("fail");
  });

  it("no response message rendered when message is null", () => {
    renderActiveGate({ message: null });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(/Access/)).not.toBeInTheDocument();
  });

  it("calls changeHandler on input change", () => {
    renderActiveGate();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    expect(mockChangeHandler).toHaveBeenCalledTimes(1);
  });

  it("calls handleSubmit on form submit", () => {
    renderActiveGate();
    const form = screen.getByRole("form");
    fireEvent.submit(form);
    expect(mockSubmitHandler).toHaveBeenCalledTimes(1);
  });
});

describe("Clue Functionality", () => {
  it("does not render 'Get Clue' button when canRequestClue is false", () => {
    renderActiveGate({ canRequestClue: false });
    expect(
      screen.queryByRole("button", { name: /get clue/i }),
    ).not.toBeInTheDocument();
  });

  it("renders 'Get Clue' button when canRequestClue is true", () => {
    renderActiveGate({ canRequestClue: true });
    expect(
      screen.getByRole("button", { name: /get clue/i }),
    ).toBeInTheDocument();
  });

  it("disables 'Get Clue' button and shows 'Fetching Clue...' when requestClueMutation is pending", () => {
    renderActiveGate({
      canRequestClue: true,
      requestClueMutation: { ...mockRequestClueMutation, isPending: true },
    });
    const button = screen.getByRole("button", { name: /fetching clue/i });
    expect(button).toBeDisabled();
  });

  it("disables 'Get Clue' button when isClueLimitReached is true", () => {
    renderActiveGate({
      canRequestClue: true,
      requestClueMutation: {
        isPending: false,
        data: { clueText: null, isClueLimitReached: true, cluesRemaining: 0 },
      },
    });
    const button = screen.getByRole("button", { name: /get clue/i });
    expect(button).toBeDisabled();
  });

  it("calls handleRequestClue when 'Get Clue' button is clicked", () => {
    renderActiveGate({ canRequestClue: true });
    fireEvent.click(screen.getByRole("button", { name: /get clue/i }));
    expect(mockHandleRequestClue).toHaveBeenCalledTimes(1);
  });

  it("renders clues in a list when clues array is not empty", () => {
    renderActiveGate({ clues: ["First Clue", "Second Clue"] });
    expect(screen.getByText("Clues:")).toBeInTheDocument();
    expect(screen.getByText("First Clue")).toBeInTheDocument();
    expect(screen.getByText("Second Clue")).toBeInTheDocument();
  });
});
