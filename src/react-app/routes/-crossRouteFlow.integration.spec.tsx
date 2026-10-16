import { mockCompletedGate, mockProgression } from "@test-utils";
import { gqlApi } from "@test-utils/msw/graphqlApi";
import {
  createTestRouter,
  renderWithRouter,
} from "@test-utils/reactRouterUtils";
import { stubReducedMotion } from "@test-utils/reducedMotion";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { ProgramProgression } from "../api/queries/useProgramProgressionQuery";

let progressionData: ProgramProgression = mockProgression();

const initialProgression: ProgramProgression = mockProgression();
const completedProgression: ProgramProgression = mockProgression({
  currentGate: null,
  completedGates: [mockCompletedGate()],
  totalGates: 1,
  status: "completed",
});

const getSessionHandler = http.get("/api/auth/get-session", () =>
  HttpResponse.json(null),
);

const server = setupServer(
  getSessionHandler,
  gqlApi.query("Program", () =>
    HttpResponse.json({
      data: { program: { id: "1", name: "Program 1" } },
    }),
  ),
  gqlApi.query("GetProgramProgression", () =>
    HttpResponse.json({ data: { getProgramProgression: progressionData } }),
  ),
  gqlApi.mutation("SubmitGuess", ({ variables }) => {
    if (variables.guess === "4") {
      progressionData = completedProgression;
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
    progressionData = initialProgression;
    return HttpResponse.json({ data: { resetSession: true } });
  }),
  gqlApi.query("GetPrograms", () =>
    HttpResponse.json({
      data: {
        programs: [
          { id: "1", name: "Program 1" },
          { id: "2", name: "Program 2" },
        ],
      },
    }),
  ),
  gqlApi.query("GetInProgressProgram", () =>
    HttpResponse.json({ data: { getInProgressProgram: null } }),
  ),
  gqlApi.mutation("RequestClue", () =>
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
  // The full route tree mounts CrtOverlay, whose boot sequence gates the
  // typed surfaces below it. These specs assert on routing, not on the
  // boot animation, so skip straight past it.
  beforeEach(() => stubReducedMotion());

  beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
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

    await screen.findByTestId("gate-question", { exact: false });

    const input = screen.getByLabelText("Gate 1 password input");
    await user.type(input, "4");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByTestId("the-end-heading")).toBeInTheDocument();
    });

    await screen.findByText("Play program again");

    await user.click(screen.getByText("Play program again"));

    await waitFor(() => {
      expect(screen.getByTestId("gate-question")).toHaveTextContent(
        "What is 2+2?",
      );
    });
  });
});
