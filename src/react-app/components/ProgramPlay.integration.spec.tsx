import {
  mockActiveGate,
  mockCompletedGate,
  mockProgression,
} from "@test-utils/msw/fixtures";
import { createQueryWrapper } from "@test-utils/queryTestUtils";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { graphql, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { ProgramProgression } from "../api/queries/useProgramProgressionQuery";
import ProgramPlay from "./ProgramPlay";

vi.mock(import("@tanstack/react-router"), async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: vi.fn(() => vi.fn()) };
});

vi.mock("@routes/programs/$programId", () => ({
  Route: {
    useParams: vi.fn(() => ({ programId: "test-program-id" })),
    fullPath: "/programs/test-program-id",
  },
}));

let progressionData: ProgramProgression = mockProgression();

const server = setupServer(
  graphql.query("Program", () =>
    HttpResponse.json({
      data: { program: { id: "test-program-id", name: "Test Program" } },
    }),
  ),
  graphql.query("GetProgramProgression", () =>
    HttpResponse.json({ data: { getProgramProgression: progressionData } }),
  ),
  graphql.mutation("SubmitGuess", ({ variables }) => {
    if (variables.guess === "4") {
      progressionData = mockProgression({
        currentGate: mockActiveGate({
          id: "gate-2",
          label: "Gate 2",
          question: "What is 3+3?",
        }),
        completedGates: [
          mockCompletedGate({
            id: "gate-1",
            label: "Gate 1",
            correctAnswer: "4",
            successMessage: "Access Granted.",
          }),
        ],
      });
      return HttpResponse.json({
        data: {
          submitGuess: {
            success: true,
            message: "Access Granted.",
            canRequestClue: false,
            nextGate: null,
          },
        },
      });
    }
    return HttpResponse.json({
      data: {
        submitGuess: {
          success: false,
          message: "Access Denied.",
          canRequestClue: true,
          nextGate: null,
        },
      },
    });
  }),
  graphql.mutation("ResetSession", () => {
    progressionData = mockProgression();
    return HttpResponse.json({ data: { resetSession: true } });
  }),
  graphql.query("GetPrograms", () =>
    HttpResponse.json({
      data: { programs: [{ id: "test-program-id", name: "Test Program" }] },
    }),
  ),
  graphql.query("GetInProgressProgram", () =>
    HttpResponse.json({ data: { getInProgressProgram: null } }),
  ),
  graphql.mutation("RequestClue", () =>
    HttpResponse.json({
      data: {
        requestClue: {
          clueText: "Try thinking of 2+2",
          isClueLimitReached: false,
          cluesRemaining: 1,
        },
      },
    }),
  ),
);

describe("ProgramPlay Integration", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    progressionData = mockProgression();
  });
  afterAll(() => server.close());

  it("submits correct guess and shows completed gate with next gate", async () => {
    const { wrapper } = createQueryWrapper();
    const user = userEvent.setup();

    render(<ProgramPlay />, { wrapper });

    await screen.findByTestId("gate-question", { exact: false });

    await waitFor(() => {
      expect(screen.getByTestId("gate-question")).toHaveTextContent(
        "What is 2+2?",
      );
    });

    const input = screen.getByLabelText("Gate 1 password input");
    await user.type(input, "4");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Access Granted.")).toBeInTheDocument();
    });

    // Wait for success message typing to complete, then next gate question to start
    await waitFor(() => {
      expect(screen.getByText("Gate 1")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("gate-question")).toHaveTextContent(
        "What is 3+3?",
      );
    });
  });

  it("shows error message and clue button on wrong guess", async () => {
    const { wrapper } = createQueryWrapper();
    const user = userEvent.setup();

    render(<ProgramPlay />, { wrapper });

    await screen.findByTestId("gate-question", { exact: false });

    await waitFor(() => {
      expect(screen.getByTestId("gate-question")).toHaveTextContent(
        "What is 2+2?",
      );
    });

    const input = screen.getByLabelText("Gate 1 password input");
    await user.type(input, "wrong");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Access Denied.")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Get 1st Clue")).toBeInTheDocument();
    });
  });

  it("requests and displays a clue after wrong guess", async () => {
    const { wrapper } = createQueryWrapper();
    const user = userEvent.setup();

    render(<ProgramPlay />, { wrapper });

    await screen.findByTestId("gate-question", { exact: false });

    await waitFor(() => {
      expect(screen.getByTestId("gate-question")).toHaveTextContent(
        "What is 2+2?",
      );
    });

    const input = screen.getByLabelText("Gate 1 password input");
    await user.type(input, "wrong");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Get 1st Clue")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Get 1st Clue"));

    await waitFor(() => {
      expect(screen.getByText("Try thinking of 2+2")).toBeInTheDocument();
    });
  });

  it("renders The End screen when program is completed and supports play again", async () => {
    progressionData = mockProgression({
      currentGate: null,
      completedGates: [
        mockCompletedGate({
          id: "gate-1",
          label: "Gate 1",
          correctAnswer: "4",
        }),
      ],
      status: "completed",
    });

    const { wrapper } = createQueryWrapper();
    const user = userEvent.setup();

    render(<ProgramPlay />, { wrapper });

    await screen.findByText("The End");
    expect(screen.getByText("Play program again")).toBeInTheDocument();
    expect(screen.getByText("Select new program")).toBeInTheDocument();

    await user.click(screen.getByText("Play program again"));

    await waitFor(() => {
      expect(screen.getByTestId("gate-question")).toHaveTextContent(
        "What is 2+2?",
      );
    });
  });
});
