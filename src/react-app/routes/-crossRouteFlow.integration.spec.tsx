import { mockCompletedGate, mockProgression } from "@test-utils";
import {
  createTestRouter,
  renderWithRouter,
} from "@test-utils/reactRouterUtils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { graphql, HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { ProgramProgression } from "../api/queries/useProgramProgressionQuery";

let progressionData: ProgramProgression = mockProgression();

const initialProgression: ProgramProgression = mockProgression();
const completedProgression: ProgramProgression = mockProgression({
  currentGate: null,
  completedGates: [mockCompletedGate()],
  status: "completed",
});

const getSessionHandler = http.get("/api/auth/get-session", () =>
  HttpResponse.json(null),
);

const server = setupServer(
  getSessionHandler,
  graphql.query("Program", () =>
    HttpResponse.json({
      data: { program: { id: "1", name: "Program 1" } },
    }),
  ),
  graphql.query("GetProgramProgression", () =>
    HttpResponse.json({ data: { getProgramProgression: progressionData } }),
  ),
  graphql.mutation("SubmitGuess", ({ variables }) => {
    if (variables.guess === "4") {
      progressionData = completedProgression;
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
    progressionData = initialProgression;
    return HttpResponse.json({ data: { resetSession: true } });
  }),
  graphql.query("GetPrograms", () =>
    HttpResponse.json({
      data: {
        programs: [
          { id: "1", name: "Program 1" },
          { id: "2", name: "Program 2" },
        ],
      },
    }),
  ),
  graphql.query("GetInProgressProgram", () =>
    HttpResponse.json({ data: { getInProgressProgram: null } }),
  ),
  graphql.mutation("RequestClue", () =>
    HttpResponse.json({
      data: {
        requestClue: {
          clueText: "A clue",
          isClueLimitReached: false,
          cluesRemaining: 1,
        },
      },
    }),
  ),
);

describe("Cross-Route Flow", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    progressionData = mockProgression();
  });
  afterAll(() => server.close());

  it("navigates from program select through completion and reset", async () => {
    const router = createTestRouter("/programs/select");
    renderWithRouter(router);
    const user = userEvent.setup();

    await screen.findByText("Program 1");

    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.click(screen.getByText("Start Program"));

    await screen.findByText("What is 2+2?");

    const input = screen.getByLabelText("Gate 1 password input");
    await user.type(input, "4");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("The End")).toBeInTheDocument();
    });

    expect(screen.getByText("Play program again")).toBeInTheDocument();

    await user.click(screen.getByText("Play program again"));

    await waitFor(() => {
      expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
    });
  });
});
