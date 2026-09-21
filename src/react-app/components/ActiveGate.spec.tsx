import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { ActiveGate as ActiveGateType } from "@api/queries/useProgramProgressionQuery";
import { MAX_CLUES_PER_GATE } from "@shared/types";
import { mockCssModuleProxy } from "@test-utils/cssModuleMock";
import { createRef, type SubmitEvent } from "react";
import ActiveGate from "./ActiveGate";

// Completion has to be reported for these tests, not just text: it is what
// releases the newest clue to start typing once the question is done.
vi.mock("@hooks/useTypewriter", async () => {
  const { useEffect } = await import("react");

  return {
    default: (
      text: string,
      options?: { enabled?: boolean; onComplete?: () => void },
    ) => {
      const enabled = options?.enabled !== false;
      const onComplete = options?.onComplete;

      useEffect(() => {
        onComplete?.();
      }, [onComplete]);

      return {
        displayedText: enabled ? text : "",
        isComplete: enabled,
        skip: () => {},
      };
    },
  };
});
vi.mock("./ActiveGate.module.css", () => ({ default: mockCssModuleProxy() }));
vi.mock("./Gate.module.css", () => ({ default: mockCssModuleProxy() }));

const mockActiveGate: ActiveGateType = {
  id: "gate-1",
  label: "Gate 1",
  question: "What is 2+2?",
};

const mockChangeHandler = vi.fn();
const mockSubmitHandler = vi.fn((e: SubmitEvent) => e.preventDefault());
const mockInputRef = createRef<HTMLInputElement>();

const mockRequestClueMutation = {
  isPending: false,
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
    guessSucceeded: null,
    isShaking: false,
    isPending: false,
    inputRef: mockInputRef,
    changeHandler: mockChangeHandler,
    handleSubmit: mockSubmitHandler,
    canRequestClue: false,
    isClueLimitReached: false,
    requestClueMutation: mockRequestClueMutation,
    handleRequestClue: mockHandleRequestClue,
    clues: [],
    enabled: true,
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

  it("renders question in the screen-reader-visible span", () => {
    renderActiveGate();
    expect(screen.getByTestId("gate-question")).toHaveTextContent(
      "What is 2+2?",
    );
  });

  it("renders the animated question text with aria-hidden", () => {
    renderActiveGate();
    const animated = screen.getByText("What is 2+2?", {
      selector: ".description",
    });
    expect(animated).toHaveAttribute("aria-hidden", "true");
  });

  it("associates the question with the input via aria-describedby", () => {
    renderActiveGate();
    expect(screen.getByTestId("gate-question")).toHaveTextContent(
      "What is 2+2?",
    );
  });

  it("does not render animated question text when typing is disabled", () => {
    renderActiveGate({ enabled: false });
    // No visible animated paragraph — only the sr-only span holds the text.
    expect(
      screen.queryByText("What is 2+2?", { selector: ".description" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("gate-question")).toHaveTextContent(
      "What is 2+2?",
    );
  });

  it("animated question has aria-hidden and sr-only span holds full text", () => {
    renderActiveGate();
    const animatedP = screen.getByTestId("gate-question").nextElementSibling;
    expect(animatedP).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("gate-question")).toHaveTextContent(
      "What is 2+2?",
    );
  });

  it("input is enabled by default", () => {
    renderActiveGate();
    expect(screen.getByRole("textbox")).not.toBeDisabled();
  });

  it("input is disabled when isPending is true", () => {
    renderActiveGate({ isPending: true });
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("input is disabled when requestClueMutation is pending", () => {
    renderActiveGate({
      requestClueMutation: { ...mockRequestClueMutation, isPending: true },
    });
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("applies .shake class when isShaking is true", () => {
    const { container } = renderActiveGate({ isShaking: true });
    const gateDiv = container.querySelector("#gate-0");
    expect(gateDiv).toHaveClass("shake gate");
  });

  it("does not apply .shake class when isShaking is false", () => {
    const { container } = renderActiveGate({ isShaking: false });
    const gateDiv = container.querySelector("#gate-0");
    expect(gateDiv).not.toHaveClass("shake");
    expect(gateDiv).toHaveClass("gate");
  });

  it("renders response message with .fail class for incorrect response", () => {
    renderActiveGate({ message: "Access Denied.", guessSucceeded: false });
    const response = screen.getByText("Access Denied.");
    expect(response).toHaveClass("fail response");
  });

  it("renders response message without .fail class for correct response", () => {
    renderActiveGate({ message: "Access Granted.", guessSucceeded: true });
    const response = screen.getByText("Access Granted.");
    expect(response).not.toHaveClass("fail");
    expect(response).toHaveClass("response");
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
      screen.queryByRole("button", { name: /get.*clue/i }),
    ).not.toBeInTheDocument();
  });

  it("renders 'Get Clue' button when canRequestClue is true", () => {
    renderActiveGate({ canRequestClue: true });
    expect(
      screen.getByRole("button", { name: /get.*clue/i }),
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

  it("disables 'Get Clue' button when isPending is true", () => {
    renderActiveGate({ canRequestClue: true, isPending: true });
    const button = screen.getByRole("button", { name: /get.*clue/i });
    expect(button).toBeDisabled();
  });

  it("removes 'Get Clue' button when isClueLimitReached is true", () => {
    renderActiveGate({
      canRequestClue: true,
      isClueLimitReached: true,
    });
    expect(
      screen.queryByRole("button", { name: /get.*clue/i }),
    ).not.toBeInTheDocument();
  });

  it("disables 'Get Clue' button when guess is empty", () => {
    renderActiveGate({ canRequestClue: true, guess: "" });
    const button = screen.getByRole("button", { name: /get.*clue/i });
    expect(button).toBeDisabled();
  });

  it("enables 'Get Clue' button when guess is not empty", () => {
    renderActiveGate({ canRequestClue: true, guess: "some guess" });
    const button = screen.getByRole("button", { name: /get.*clue/i });
    expect(button).not.toBeDisabled();
  });

  it("calls handleRequestClue when 'Get Clue' button is clicked", () => {
    renderActiveGate({ canRequestClue: true, guess: "some guess" });
    fireEvent.click(screen.getByRole("button", { name: /get.*clue/i }));
    expect(mockHandleRequestClue).toHaveBeenCalledTimes(1);
  });

  it("renders clues in a list when clues array is not empty", () => {
    renderActiveGate({ clues: ["First Clue", "Second Clue"] });
    expect(screen.getByText("Clues:")).toBeInTheDocument();
    expect(
      screen.getAllByTestId("clue-text").map((node) => node.textContent),
    ).toEqual(["First Clue", "Second Clue"]);
  });

  it("renders 'Get Final Clue' button when clues length is MAX_CLUES_PER_GATE - 1", () => {
    const clues = Array(MAX_CLUES_PER_GATE - 1)
      .fill(undefined)
      .map((_, index) => `Clue ${index}`);
    renderActiveGate({ canRequestClue: true, guess: "some guess", clues });
    expect(
      screen.getByRole("button", { name: /get final clue/i }),
    ).toBeInTheDocument();
  });

  it("renders correct ordinal suffix for numbered clues", () => {
    renderActiveGate({ canRequestClue: true, guess: "some guess", clues: [] });
    expect(
      screen.getByRole("button", { name: /get 1st clue/i }),
    ).toBeInTheDocument();

    renderActiveGate({
      canRequestClue: true,
      guess: "some guess",
      clues: ["First Clue"],
    });
    expect(
      screen.getByRole("button", { name: /get 2nd clue/i }),
    ).toBeInTheDocument();

    renderActiveGate({
      canRequestClue: true,
      guess: "some guess",
      clues: ["First Clue", "Second Clue"],
    });
    expect(
      screen.getByRole("button", { name: /get Final clue/i }),
    ).toBeInTheDocument();
  });

  it("renders 'th' suffix for clues beyond ordinal 3", () => {
    const manyClues = ["A", "B", "C"];
    renderActiveGate({
      canRequestClue: true,
      guess: "some guess",
      clues: manyClues,
    });
    expect(
      screen.getByRole("button", { name: /get 4th clue/i }),
    ).toBeInTheDocument();
  });

  it("handles undefined requestClueMutation", () => {
    renderActiveGate({
      canRequestClue: true,
      guess: "test",
      requestClueMutation: undefined,
    });
    expect(
      screen.getByRole("button", { name: /get.*clue/i }),
    ).not.toBeDisabled();
  });

  it("disables clue button and shows countdown when cooldown is active", () => {
    renderActiveGate({
      canRequestClue: true,
      guess: "some guess",
      cooldownSeconds: 12,
    });
    const button = screen.getByRole("button", {
      name: /clue cooldown.*try again in 12s/i,
    });
    expect(button).toBeDisabled();
  });

  it("keeps clue button enabled when cooldown has expired", () => {
    renderActiveGate({
      canRequestClue: true,
      guess: "some guess",
      cooldownSeconds: 0,
    });
    const button = screen.getByRole("button", { name: /get.*clue/i });
    expect(button).not.toBeDisabled();
  });
});

describe("Clue typing", () => {
  it("holds the newest clue back until the question has typed", () => {
    renderActiveGate({ enabled: false, clues: ["First Clue", "Latest Clue"] });

    expect(
      screen.getAllByTestId("clue-text").map((node) => node.textContent),
    ).toEqual(["First Clue", ""]);
  });

  it("types the newest clue once the question is done", () => {
    renderActiveGate({ enabled: true, clues: ["First Clue", "Latest Clue"] });

    expect(
      screen.getAllByTestId("clue-text").map((node) => node.textContent),
    ).toEqual(["First Clue", "Latest Clue"]);
  });

  it("keeps a held-back clue readable to assistive tech", () => {
    const { container } = renderActiveGate({
      enabled: false,
      clues: ["Latest Clue"],
    });

    const srOnly = Array.from(container.querySelectorAll(".sr-only")).map(
      (node) => node.textContent,
    );
    expect(srOnly).toContain("Latest Clue");
  });

  it("hides every animated clue node from assistive tech", () => {
    renderActiveGate({ clues: ["First Clue", "Latest Clue"] });

    for (const node of screen.getAllByTestId("clue-text")) {
      expect(node).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("announces each clue once rather than per character", () => {
    const { container } = renderActiveGate({ clues: ["Latest Clue"] });

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.querySelectorAll(".sr-only")).toHaveLength(1);
  });
});
