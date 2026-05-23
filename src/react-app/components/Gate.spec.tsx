import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import RiddleComponent from "@components/Gate";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------------------
// Module mocks — isolate from hook implementations
// ---------------------------------------------------------------------------

vi.mock("@hooks/useShake", () => ({
  default: vi.fn(),
}));

vi.mock("@hooks/useGateGuess", () => ({
  default: vi.fn(),
}));

import useGateGuess from "@hooks/useGateGuess";
import useShake from "@hooks/useShake";
import type { Gate } from "@shared/types";
import { defaultNullishGateProps } from "@test-utils/testTypes";
import type { SubmitEvent } from "react";

const mockUseShake = vi.mocked(useShake);
const mockuseGateGuess = vi.mocked(useGateGuess);

// ---------------------------------------------------------------------------
// Default mock implementations
// ---------------------------------------------------------------------------

const defaultShake = {
  isShaking: false,
  shake: vi.fn(),
  clearShake: vi.fn(),
};

const defaultRiddleGuess = {
  guess: "",
  response: "",
  guessResult: null as "correct" | "incorrect" | null,
  changeHandler: vi.fn(),
  submitHandler: vi.fn((e: SubmitEvent<HTMLFormElement>) => e.preventDefault()),
};

beforeEach(() => {
  mockUseShake.mockReturnValue(defaultShake);
  mockuseGateGuess.mockReturnValue(defaultRiddleGuess);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const lockedRiddle: Gate = {
  id: "2fe67eac-ec4b-4858-9234-891c609c20df",
  label: "Step 1",
  correctAnswer: "secret",
  question: "What has keys but no locks?",
  successMessage: "A keyboard",
  isSolved: false,
  ...defaultNullishGateProps,
  programId: "63e52b69-0bb3-4598-8957-e531c90175ba",
  sequenceOrder: 1,
};

const unlockedRiddle: Gate = { ...lockedRiddle, isSolved: true };

const mockOnSolve = vi.fn();

function renderRiddle(riddle: Gate = lockedRiddle, id = "riddle-0") {
  return render(
    <RiddleComponent id={id} riddle={riddle} onSolve={mockOnSolve} />,
  );
}

// ---------------------------------------------------------------------------
// Rendering — locked state
// ---------------------------------------------------------------------------

describe("locked riddle", () => {
  it("renders the riddle id in the summary", () => {
    renderRiddle();
    expect(screen.getByText("Step 1")).toBeInTheDocument();
  });

  it("renders the riddle question", () => {
    renderRiddle();
    expect(screen.getByText("What has keys but no locks?")).toBeInTheDocument();
  });

  it("renders an enabled input", () => {
    renderRiddle();
    expect(screen.getByRole("textbox")).not.toBeDisabled();
  });

  it("does not render the clue", () => {
    renderRiddle();
    expect(screen.queryByText("A keyboard")).not.toBeInTheDocument();
  });

  it("does not show a response message when response is empty", () => {
    renderRiddle();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Rendering — unlocked state
// ---------------------------------------------------------------------------

describe("unlocked riddle", () => {
  it("renders the decoded answer in the input prefixed with ✔", () => {
    renderRiddle(unlockedRiddle);
    expect(screen.getByRole("textbox")).toHaveValue("✔ secret");
  });

  it("renders the clue", () => {
    renderRiddle(unlockedRiddle);
    expect(screen.getByText("A keyboard")).toBeInTheDocument();
  });

  it("renders a disabled input", () => {
    renderRiddle(unlockedRiddle);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("renders the details element as open", () => {
    renderRiddle(unlockedRiddle);
    expect(screen.getByRole("group")).toHaveAttribute("open");
  });
});

// ---------------------------------------------------------------------------
// Response messages
// ---------------------------------------------------------------------------

describe("response display", () => {
  it("renders the response text when present", () => {
    mockuseGateGuess.mockReturnValue({
      ...defaultRiddleGuess,
      response: "Access Denied.",
      guessResult: "incorrect",
    });
    renderRiddle();
    expect(screen.getByText("Access Denied.")).toBeInTheDocument();
  });

  it("applies the fail class for an incorrect guess", () => {
    mockuseGateGuess.mockReturnValue({
      ...defaultRiddleGuess,
      response: "Access Denied.",
      guessResult: "incorrect",
    });
    renderRiddle();
    expect(screen.getByText("Access Denied.")).toHaveClass("fail");
  });

  it("does not apply the fail class for a correct guess", () => {
    mockuseGateGuess.mockReturnValue({
      ...defaultRiddleGuess,
      response: "Access Granted.",
      guessResult: "correct",
    });
    renderRiddle();
    expect(screen.getByText("Access Granted.")).not.toHaveClass("fail");
  });
});

// ---------------------------------------------------------------------------
// Shake CSS class
// ---------------------------------------------------------------------------

describe("shake state", () => {
  it("applies the shake class to the form when isShaking is true", () => {
    mockUseShake.mockReturnValue({ ...defaultShake, isShaking: true });
    renderRiddle();
    // The form has aria-label containing the riddle id
    const riddle = screen.getByTestId("riddle-0");
    expect(riddle).toHaveClass("shake");
  });

  it("does not apply the shake class when isShaking is false", () => {
    renderRiddle();
    expect(screen.getByRole("form")).not.toHaveClass("shake");
  });
});

// ---------------------------------------------------------------------------
// Toggle behaviour
// ---------------------------------------------------------------------------

describe("details toggle", () => {
  it("focuses the input when the details element is toggled open", () => {
    const mockRiddle: Gate = {
      id: "7b24833a-dbcf-45b0-8efd-7f6f692a84ab",
      label: "riddle-1",
      question: "I speak without a mouth and hear without ears. What am I?",
      correctAnswer: "",
      isSolved: false,
      successMessage: "Sound reflects.",
      ...defaultNullishGateProps,
      programId: "63e52b69-0bb3-4598-8957-e531c90175ba",
      sequenceOrder: 1,
    };

    const { container } = render(
      <RiddleComponent id="test-1" riddle={mockRiddle} onSolve={mockOnSolve} />,
    );

    const input = screen.getByPlaceholderText("Enter password...");
    const details = container.querySelector("details");

    expect(details).not.toBeNull();
    if (details === null) throw new Error("details should not be null");
    expect(input).not.toHaveFocus(); // Ensure it isn't focused initially

    // We use defineProperty to bypass strict TypeScript/virtual DOM limitations
    // regarding the relatively new ToggleEvent 'newState' property.
    const toggleEvent = new Event("toggle");
    Object.defineProperty(toggleEvent, "newState", { value: "open" });

    fireEvent(details, toggleEvent);

    expect(input).toHaveFocus();
  });

  it("forwards changeHandler to the input", async () => {
    const user = userEvent.setup();
    const changeHandler = vi.fn();
    mockuseGateGuess.mockReturnValue({
      ...defaultRiddleGuess,
      changeHandler,
    });

    const { unmount } = renderRiddle(lockedRiddle);

    // Open the details first
    const details = screen.getByRole("group");
    details.dispatchEvent(new Event("toggle"));

    const input = screen.getAllByRole("textbox")[0];
    await user.type(input, "hello");

    expect(changeHandler).toHaveBeenCalledTimes(5);
    unmount();
  });
});
