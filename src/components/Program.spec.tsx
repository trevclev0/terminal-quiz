// src/components/Program.test.tsx

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import Program from "./Program";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("../hooks/useProgressionScroll", () => ({
  default: vi.fn(),
}));

vi.mock("../utils/getRiddlesToRender", () => ({
  default: vi.fn(),
}));

// Mock Riddle so Program tests are not dependent on Riddle's internals
vi.mock("./Riddle", () => ({
  default: ({ id, riddle }: { id: string; riddle: { label: string } }) => (
    <div data-testid={id}>Riddle: {riddle.label}</div>
  ),
}));

import {
  defaultNullishGateProps,
  defaultNullishProgramProps,
} from "../../tests/testTypes";
import type { Gate, ProgramWithGates } from "../db/types";
import useProgressionScroll from "../hooks/useProgressionScroll";
import getRiddlesToRender from "../utils/getRiddlesToRender";

const mockGetRiddlesToRender = vi.mocked(getRiddlesToRender);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const riddles: Gate[] = [
  {
    id: "10a4bca2-59fc-42da-bbac-79b43dc4f76e",
    label: "Step 1",
    correctAnswer: "abc",
    question: "Q1",
    successMessage: "A1",
    isSolved: true,
    ...defaultNullishGateProps,
    programId: "63e52b69-0bb3-4598-8957-e531c90175ba",
    sequenceOrder: 1,
  },
  {
    id: "570d3614-228e-4942-a52b-7ce7805eac46",
    label: "Step 2",
    correctAnswer: "def",
    question: "Q2",
    successMessage: "A2",
    isSolved: false,
    ...defaultNullishGateProps,
    programId: "63e52b69-0bb3-4598-8957-e531c90175ba",
    sequenceOrder: 2,
  },
];

const program: ProgramWithGates = {
  id: "63e52b69-0bb3-4598-8957-e531c90175ba",
  name: "Test Adventure",
  isSelected: true,
  gates: riddles,
  ...defaultNullishProgramProps,
};

beforeEach(() => {
  vi.mocked(useProgressionScroll).mockImplementation(() => {});
  // By default return both riddles with a next index
  mockGetRiddlesToRender.mockReturnValue({
    riddlesToRender: riddles,
    nextRiddleIndex: 1,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("rendering", () => {
  it("renders the program name as a heading", () => {
    render(
      <Program
        program={program}
        resetProgram={vi.fn()}
        clearActiveProgram={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Test Adventure" }),
    ).toBeInTheDocument();
  });

  it("renders each riddle returned by getRiddlesToRender", () => {
    render(
      <Program
        program={program}
        resetProgram={vi.fn()}
        clearActiveProgram={vi.fn()}
      />,
    );
    expect(screen.getByTestId("riddle-0")).toBeInTheDocument();
    expect(screen.getByTestId("riddle-1")).toBeInTheDocument();
  });

  it("passes the correct id prop to each Riddle", () => {
    render(
      <Program
        program={program}
        resetProgram={vi.fn()}
        clearActiveProgram={vi.fn()}
      />,
    );
    expect(screen.getByText("Riddle: Step 1")).toBeInTheDocument();
    expect(screen.getByText("Riddle: Step 2")).toBeInTheDocument();
  });

  it("calls getRiddlesToRender with the program riddles", () => {
    render(
      <Program
        program={program}
        resetProgram={vi.fn()}
        clearActiveProgram={vi.fn()}
      />,
    );
    expect(mockGetRiddlesToRender).toHaveBeenCalledWith(program.gates);
  });
});

// ---------------------------------------------------------------------------
// End-game state (nextRiddleIndex === -1)
// ---------------------------------------------------------------------------

describe("when the game is finished (nextRiddleIndex === -1)", () => {
  const confirmMock = vi.fn();

  beforeEach(() => {
    mockGetRiddlesToRender.mockReturnValue({
      riddlesToRender: riddles,
      nextRiddleIndex: -1,
    });
    // happy-dom doesn't implement window.confirm, so we inject our own mock
    vi.stubGlobal("confirm", confirmMock);
  });

  afterEach(() => {
    // Clean up the mock state and remove the global stub
    confirmMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('renders the "The End" heading', () => {
    render(
      <Program
        program={program}
        resetProgram={vi.fn()}
        clearActiveProgram={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "The End" }),
    ).toBeInTheDocument();
  });

  it("renders the action buttons", () => {
    render(
      <Program
        program={program}
        resetProgram={vi.fn()}
        clearActiveProgram={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Play program again" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select new program" }),
    ).toBeInTheDocument();
  });

  it('calls resetProgram when "Play program again" is clicked', async () => {
    const user = userEvent.setup();
    const resetProgram = vi.fn();

    render(
      <Program
        program={program}
        resetProgram={resetProgram}
        clearActiveProgram={vi.fn()}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Play program again" }),
    );

    expect(resetProgram).toHaveBeenCalledOnce();
  });

  it('calls resetProgram AND clearActiveProgram when "Select new program" is clicked and user confirms', async () => {
    const user = userEvent.setup();
    const resetProgram = vi.fn();
    const clearActiveProgram = vi.fn();

    // Simulate clicking "OK"
    confirmMock.mockReturnValue(true);

    render(
      <Program
        program={program}
        resetProgram={resetProgram}
        clearActiveProgram={clearActiveProgram}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Select new program" }),
    );

    expect(confirmMock).toHaveBeenCalledOnce();
    expect(resetProgram).toHaveBeenCalledOnce();
    expect(clearActiveProgram).toHaveBeenCalledOnce();
  });

  it('calls ONLY clearActiveProgram when "Select new program" is clicked and user cancels', async () => {
    const user = userEvent.setup();
    const resetProgram = vi.fn();
    const clearActiveProgram = vi.fn();

    // Simulate clicking "Cancel"
    confirmMock.mockReturnValue(false);

    render(
      <Program
        program={program}
        resetProgram={resetProgram}
        clearActiveProgram={clearActiveProgram}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Select new program" }),
    );

    expect(confirmMock).toHaveBeenCalledOnce();
    expect(resetProgram).not.toHaveBeenCalled();
    expect(clearActiveProgram).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// In-progress state
// ---------------------------------------------------------------------------

describe("when the game is in progress (nextRiddleIndex !== -1)", () => {
  it("does not render the end screen", () => {
    render(
      <Program
        program={program}
        resetProgram={vi.fn()}
        clearActiveProgram={vi.fn()}
      />,
    );
    expect(screen.queryByText("The End")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Play program again" }),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// useProgressionScroll integration
// ---------------------------------------------------------------------------

describe("useProgressionScroll", () => {
  it("is called with the nextRiddleIndex from getRiddlesToRender", () => {
    mockGetRiddlesToRender.mockReturnValue({
      riddlesToRender: riddles,
      nextRiddleIndex: 1,
    });
    render(
      <Program
        program={program}
        resetProgram={vi.fn()}
        clearActiveProgram={vi.fn()}
      />,
    );
    expect(useProgressionScroll).toHaveBeenCalledWith(1);
  });
});
