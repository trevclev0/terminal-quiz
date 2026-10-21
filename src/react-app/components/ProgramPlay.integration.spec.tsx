import {
  mockActiveGate,
  mockCompletedGate,
  mockProgression,
} from "@test-utils/msw/fixtures";
import { gqlApi } from "@test-utils/msw/graphqlApi";
import { createQueryWrapper } from "@test-utils/queryTestUtils";
import { stubReducedMotion } from "@test-utils/reducedMotion";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { ProgramProgression } from "../api/queries/useProgramProgressionQuery";
import ProgramPlay from "./ProgramPlay";

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));

vi.mock(import("@tanstack/react-router"), async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: vi.fn(() => mockNavigate) };
});

vi.mock("@routes/programs/$programId", () => ({
  Route: {
    useParams: vi.fn(() => ({ programId: "test-program-id" })),
    fullPath: "/programs/test-program-id",
  },
}));

let progressionData: ProgramProgression = mockProgression();
let progressionRequests = 0;

const server = setupServer(
  gqlApi.query("Program", () =>
    HttpResponse.json({
      data: { program: { id: "test-program-id", name: "Test Program" } },
    }),
  ),
  gqlApi.query("GetProgramProgression", () => {
    progressionRequests += 1;
    return HttpResponse.json({
      data: { getProgramProgression: progressionData },
    });
  }),
  gqlApi.mutation("SubmitGuess", ({ variables }) => {
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
            successMessage: "Correct! Two plus two is four.",
          }),
        ],
      });
      return HttpResponse.json({
        data: {
          submitGuess: {
            success: true,
            message: "ACCESS GRANTED.",
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
  gqlApi.mutation("ResetSession", () => {
    progressionData = mockProgression();
    return HttpResponse.json({ data: { resetSession: true } });
  }),
  gqlApi.query("GetPrograms", () =>
    HttpResponse.json({
      data: { programs: [{ id: "test-program-id", name: "Test Program" }] },
    }),
  ),
  gqlApi.query("GetInProgressProgram", () =>
    HttpResponse.json({ data: { getInProgressProgram: null } }),
  ),
  gqlApi.mutation("RequestClue", () =>
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
  // The End types at 120ms/char; these tests assert on the finished
  // screen, so they should not depend on that animation completing
  // inside a default findBy timeout.
  beforeEach(() => stubReducedMotion());

  beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
  afterEach(() => {
    server.resetHandlers();
    progressionData = mockProgression();
    progressionRequests = 0;
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

    expect(screen.getByTestId("gate-progress")).toHaveTextContent(
      "[..........] 0/3",
    );

    const input = screen.getByLabelText("Gate 1 password input");
    await user.type(input, "4");
    await user.keyboard("{Enter}");

    // The refetched progression advances the bar.
    await waitFor(() => {
      expect(screen.getByTestId("gate-progress")).toHaveTextContent(
        "[###.......] 1/3",
      );
    });

    // The gate's successMessage is revealed by CompletedGate, not by the
    // response line. Syncing on it here rather than on the response line,
    // which is transient: the mocked progression resolves in the same tick,
    // so ActiveGate has already unmounted by the time this runs.
    await waitFor(() => {
      expect(screen.getByTestId("success-message")).toHaveTextContent(
        "Correct! Two plus two is four.",
      );
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

  // Motion on, so the real flash and typewriter run: the flash holds the
  // success line, then the message types over it (#313).
  it("flashes ACCESS GRANTED, then types the success message", async () => {
    stubReducedMotion(false);
    // The mocked solve completes "gate-1", so start on that gate: the flash
    // is keyed to the id of the gate the guess was submitted for.
    progressionData = mockProgression({
      currentGate: mockActiveGate({ id: "gate-1" }),
    });
    const { wrapper } = createQueryWrapper();
    const user = userEvent.setup();

    render(<ProgramPlay />, { wrapper });

    const input = await screen.findByLabelText("Gate 1 password input");
    await user.type(input, "4");
    await user.keyboard("{Enter}");

    expect(await screen.findByTestId("success-message")).toHaveTextContent(
      "ACCESS GRANTED",
    );

    await waitFor(
      () => {
        expect(screen.getByTestId("success-message")).toHaveTextContent(
          "Correct! Two plus two is four.",
        );
      },
      { timeout: 4000 },
    );
    expect(screen.queryByText("ACCESS GRANTED")).not.toBeInTheDocument();
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
      expect(screen.getByTestId("clue-text")).toHaveTextContent(
        "Try thinking of 2+2",
      );
    });
  });

  it("disables clue button with countdown when request is rate limited", async () => {
    server.use(
      gqlApi.mutation("RequestClue", () =>
        HttpResponse.json({
          data: {
            requestClue: {
              clueText: null,
              isClueLimitReached: false,
              cluesRemaining: 3,
              isRateLimited: true,
              retryAfterMs: 30000,
            },
          },
        }),
      ),
    );

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

    const cooldownButton = await screen.findByRole("button", {
      name: /clue cooldown.*try again in/i,
    });
    expect(cooldownButton).toBeDisabled();
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
      totalGates: 1,
      status: "completed",
    });

    const { wrapper } = createQueryWrapper();
    const user = userEvent.setup();

    render(<ProgramPlay />, { wrapper });

    await screen.findByTestId("the-end-heading");
    await screen.findByText("Play program again");
    expect(screen.getByText("Select new program")).toBeInTheDocument();
    expect(screen.getByTestId("gate-progress")).toHaveTextContent(
      "[##########] 1/1",
    );

    await user.click(screen.getByText("Play program again"));

    await waitFor(() => {
      expect(screen.getByTestId("gate-question")).toHaveTextContent(
        "What is 2+2?",
      );
    });
  });

  // The server stamps the next run's clock on the first progression fetch
  // after a reset, so a refetch before the player leaves would count the
  // time away from the program.
  it("does not refetch progression when leaving after reset", async () => {
    progressionData = mockProgression({
      currentGate: null,
      completedGates: [mockCompletedGate({ id: "gate-1" })],
      totalGates: 1,
      status: "completed",
    });
    const requestsAtNavigate: number[] = [];
    mockNavigate.mockImplementation(() => {
      requestsAtNavigate.push(progressionRequests);
    });

    const { queryClient, wrapper } = createQueryWrapper();
    const user = userEvent.setup();

    render(<ProgramPlay />, { wrapper });

    await screen.findByText("Select new program");
    expect(progressionRequests).toBe(1);

    await user.click(screen.getByText("Select new program"));
    await user.click(screen.getByText("Reset Progress"));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1));
    expect(requestsAtNavigate).toEqual([1]);
    expect(progressionRequests).toBe(1);
    // Removed rather than only invalidated, so coming back cannot serve the
    // cached completed payload (a flash of The End) before refetching.
    await waitFor(() =>
      expect(
        queryClient.getQueryData([
          "programs",
          "progression",
          "test-program-id",
        ]),
      ).toBeUndefined(),
    );
  });

  it("refetches progression right after play-again reset", async () => {
    progressionData = mockProgression({
      currentGate: null,
      completedGates: [mockCompletedGate({ id: "gate-1" })],
      totalGates: 1,
      status: "completed",
    });

    const { wrapper } = createQueryWrapper();
    const user = userEvent.setup();

    render(<ProgramPlay />, { wrapper });

    await screen.findByText("Play program again");
    expect(progressionRequests).toBe(1);

    await user.click(screen.getByText("Play program again"));

    await screen.findByTestId("gate-question");
    expect(progressionRequests).toBe(2);
  });

  it("keeps the buttons disabled until the new run loads", async () => {
    progressionData = mockProgression({
      currentGate: null,
      completedGates: [mockCompletedGate({ id: "gate-1" })],
      totalGates: 1,
      status: "completed",
    });
    let releaseRefetch = () => {};
    const refetchHeld = new Promise<void>((resolve) => {
      releaseRefetch = resolve;
    });
    server.use(
      gqlApi.query("GetProgramProgression", async () => {
        progressionRequests += 1;
        if (progressionRequests > 1) await refetchHeld;
        return HttpResponse.json({
          data: { getProgramProgression: progressionData },
        });
      }),
    );

    const { wrapper } = createQueryWrapper();
    const user = userEvent.setup();

    render(<ProgramPlay />, { wrapper });

    await user.click(await screen.findByText("Play program again"));

    // The reset has resolved; only the refetch is still in flight.
    await waitFor(() => expect(progressionRequests).toBe(2));
    expect(screen.getByText("Restarting...")).toBeDisabled();
    expect(screen.getByText("Select new program")).toBeDisabled();

    releaseRefetch();
    await screen.findByTestId("gate-question");
  });
});
