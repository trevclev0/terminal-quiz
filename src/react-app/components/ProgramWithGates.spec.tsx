import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import Program from "@components/ProgramWithGates";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@hooks/useProgressionScroll", () => ({
  default: vi.fn(),
}));

vi.mock("@utils/getGatesToRender", () => ({
  default: vi.fn(),
}));

vi.mock("@components/Gate", () => ({
  default: ({
    id,
    gate,
    onSolve,
  }: {
    id: string;
    gate: { label: string };
    onSolve: () => void;
  }) => (
    <div data-testid={id}>
      Gate: {gate.label}
      <button type="button" onClick={onSolve} data-testid={`solve-${id}`}>
        Solve
      </button>
    </div>
  ),
}));

import useProgressionScroll from "@hooks/useProgressionScroll";
import type { Gate, ProgramWithGates } from "@shared/types";
import {
  defaultNullishGateProps,
  defaultNullishProgramProps,
} from "@test-utils/testTypes";
import getGatesToRender from "@utils/getGatesToRender";

const mockGetGatesToRender = vi.mocked(getGatesToRender);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const gates: Gate[] = [
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
  gates: gates,
  ...defaultNullishProgramProps,
};

beforeEach(() => {
  vi.mocked(useProgressionScroll).mockImplementation(() => {});
  // By default return both gates with a next index
  mockGetGatesToRender.mockReturnValue({
    gatesToRender: gates,
    nextGateIndex: 1,
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
        updateProgram={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Test Adventure" }),
    ).toBeInTheDocument();
  });

  it("renders each gate returned by getGatesToRender", () => {
    render(
      <Program
        program={program}
        resetProgram={vi.fn()}
        clearActiveProgram={vi.fn()}
        updateProgram={vi.fn()}
      />,
    );
    expect(screen.getByTestId("gate-0")).toBeInTheDocument();
    expect(screen.getByTestId("gate-1")).toBeInTheDocument();
  });

  it("passes the correct id prop to each Gate", () => {
    render(
      <Program
        program={program}
        resetProgram={vi.fn()}
        clearActiveProgram={vi.fn()}
        updateProgram={vi.fn()}
      />,
    );
    expect(screen.getByText("Gate: Step 1")).toBeInTheDocument();
    expect(screen.getByText("Gate: Step 2")).toBeInTheDocument();
  });

  it("calls getGatesToRender with the program gates", () => {
    render(
      <Program
        program={program}
        resetProgram={vi.fn()}
        clearActiveProgram={vi.fn()}
        updateProgram={vi.fn()}
      />,
    );
    expect(mockGetGatesToRender).toHaveBeenCalledWith(program.gates);
  });
});

// ---------------------------------------------------------------------------
// Gate Solved State Updates
// ---------------------------------------------------------------------------

describe("onSolve callback mapping", () => {
  it("calls updateProgram with the correctly mapped solved gate", async () => {
    const user = userEvent.setup();
    const updateProgram = vi.fn();

    render(
      <Program
        program={program}
        resetProgram={vi.fn()}
        clearActiveProgram={vi.fn()}
        updateProgram={updateProgram}
      />,
    );

    // Click the mock solve button for Gate 2 (which is currently isSolved: false)
    await user.click(screen.getByTestId("solve-gate-1"));

    expect(updateProgram).toHaveBeenCalledOnce();

    const updatedProgram = updateProgram.mock.calls[0][0];

    // Verify the specific gate was updated to true
    const updatedGate = updatedProgram.gates.find(
      (g: Gate) => g.id === "570d3614-228e-4942-a52b-7ce7805eac46",
    );
    expect(updatedGate?.isSolved).toBe(true);

    // Verify the previously solved gate remained solved
    const existingGate = updatedProgram.gates.find(
      (g: Gate) => g.id === "10a4bca2-59fc-42da-bbac-79b43dc4f76e",
    );
    expect(existingGate?.isSolved).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// End-game state (nextGateIndex === -1)
// ---------------------------------------------------------------------------

describe("when the game is finished (nextGateIndex === -1)", () => {
  const confirmMock = vi.fn();

  beforeEach(() => {
    mockGetGatesToRender.mockReturnValue({
      gatesToRender: gates,
      nextGateIndex: -1,
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
        updateProgram={vi.fn()}
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
        updateProgram={vi.fn()}
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
        updateProgram={vi.fn()}
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
        updateProgram={vi.fn()}
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
        updateProgram={vi.fn()}
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

describe("when the game is in progress (nextGateIndex !== -1)", () => {
  it("does not render the end screen", () => {
    render(
      <Program
        program={program}
        resetProgram={vi.fn()}
        clearActiveProgram={vi.fn()}
        updateProgram={vi.fn()}
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
  it("is called with the nextGateIndex from getGatesToRender", () => {
    mockGetGatesToRender.mockReturnValue({
      gatesToRender: gates,
      nextGateIndex: 1,
    });
    render(
      <Program
        program={program}
        resetProgram={vi.fn()}
        clearActiveProgram={vi.fn()}
        updateProgram={vi.fn()}
      />,
    );
    expect(useProgressionScroll).toHaveBeenCalledWith(1);
  });
});
