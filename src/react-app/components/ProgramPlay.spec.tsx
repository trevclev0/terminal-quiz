import { createQueryWrapper } from "@test-utils/queryTestUtils";
import { render, screen } from "@testing-library/react";
import { graphql, HttpResponse } from "msw";
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
import ProgramPlay from "./ProgramPlay";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock("../routes/programs/$programId", () => ({
  Route: {
    useParams: vi.fn(() => ({ programId: "test-program-id" })),
    fullPath: "/programs/test-program-id",
  },
}));

vi.mock("@hooks/useProgramPlay", () => ({
  default: vi.fn(),
}));

vi.mock("@components/ActiveGate", () => ({
  default: vi.fn(() => null),
}));

vi.mock("@components/CompletedGate", () => ({
  default: vi.fn(() => null),
}));

import ActiveGate from "@components/ActiveGate";
import CompletedGate from "@components/CompletedGate";
import useProgramPlay from "@hooks/useProgramPlay";

const mockUseProgramPlay = {
  guess: "",
  message: null,
  isShaking: false,
  isPending: false,
  changeHandler: vi.fn(),
  handleSubmit: vi.fn(),
  canRequestClue: false,
  clues: [],
  handleRequestClue: vi.fn(),
  requestClueMutation: {
    mutate: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
    variables: undefined,
    isError: false,
    isSuccess: false,
    failureCount: 0,
    failureReason: null,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    status: "idle" as const,
    isIdle: true,
    context: undefined,
    isPaused: false,
    submittedAt: 0,
  },
};

vi.mocked(useProgramPlay).mockReturnValue(mockUseProgramPlay);

const mockPrograms = [{ id: "test-program-id", name: "Test Program" }];

const mockProgression = {
  currentGate: {
    id: "gate-1",
    label: "Gate 1",
    question: "What is 2+2?",
  },
  completedGates: [],
  status: "in_progress",
};

const server = setupServer(
  graphql.query("GetPrograms", () => {
    return HttpResponse.json({
      data: { programs: mockPrograms },
    });
  }),
  graphql.query("GetProgramProgression", () => {
    return HttpResponse.json({
      data: { getProgramProgression: mockProgression },
    });
  }),
);

describe("ProgramPlay Component", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProgramPlay).mockReturnValue(mockUseProgramPlay);
  });

  it("renders loading state when data is loading", () => {
    const { queryClient, wrapper } = createQueryWrapper();

    queryClient.setQueryData(["programs"], []);

    render(<ProgramPlay />, { wrapper });

    expect(screen.getByText("Loading Program...")).toBeInTheDocument();
  });

  it("renders current gate when data is loaded", async () => {
    const { queryClient, wrapper } = createQueryWrapper();

    queryClient.setQueryData(["programs"], mockPrograms);
    queryClient.setQueryData(
      ["programs", "progression", "test-program-id"],
      mockProgression,
    );

    render(<ProgramPlay />, { wrapper });

    await screen.findByText("Test Program");
    const activeGateCall = vi.mocked(ActiveGate).mock.calls[0];
    expect(activeGateCall).toBeDefined();
    expect(activeGateCall[0]).toMatchObject({
      id: "gate-0",
      gate: mockProgression.currentGate,
      guess: "",
      message: null,
      isShaking: false,
      isPending: false,
    });
  });

  it("renders completed gates", async () => {
    const progressionWithCompleted = {
      currentGate: {
        id: "gate-2",
        label: "Gate 2",
        question: "What is 3+3?",
      },
      completedGates: [
        {
          id: "gate-1",
          label: "Gate 1",
          question: "What is 2+2?",
          correctAnswer: "4",
          successMessage: "Correct!",
        },
      ],
      status: "in_progress",
    };

    const { queryClient, wrapper } = createQueryWrapper();

    queryClient.setQueryData(["programs"], mockPrograms);
    queryClient.setQueryData(
      ["programs", "progression", "test-program-id"],
      progressionWithCompleted,
    );

    render(<ProgramPlay />, { wrapper });

    await screen.findByText("Test Program");
    const completedGateCall = vi.mocked(CompletedGate).mock.calls[0];
    expect(completedGateCall).toBeDefined();
    expect(completedGateCall[0]).toMatchObject({
      id: "gate-0",
      gate: progressionWithCompleted.completedGates[0],
    });
  });

  it("renders end state when program is completed", async () => {
    const completedProgression = {
      currentGate: null,
      completedGates: [
        {
          id: "gate-1",
          label: "Gate 1",
          question: "What is 2+2?",
          correctAnswer: "4",
          successMessage: "Correct!",
        },
      ],
      status: "completed",
    };

    const { queryClient, wrapper } = createQueryWrapper();

    queryClient.setQueryData(["programs"], mockPrograms);
    queryClient.setQueryData(
      ["programs", "progression", "test-program-id"],
      completedProgression,
    );

    render(<ProgramPlay />, { wrapper });

    await screen.findByText("The End");
    expect(screen.getByText("Select new program")).toBeInTheDocument();
    expect(
      screen.getByTitle("Restarting isn't available yet"),
    ).toBeInTheDocument();
  });

  it("displays program name from cache", async () => {
    const { queryClient, wrapper } = createQueryWrapper();

    queryClient.setQueryData(["programs"], mockPrograms);
    queryClient.setQueryData(
      ["programs", "progression", "test-program-id"],
      mockProgression,
    );

    render(<ProgramPlay />, { wrapper });

    await screen.findByText("Test Program");
    expect(
      screen.queryByText("Program: test-program-id"),
    ).not.toBeInTheDocument();
  });

  it("falls back to programId when name not found in cache", async () => {
    const { queryClient, wrapper } = createQueryWrapper();

    queryClient.setQueryData(["programs"], []);
    queryClient.setQueryData(
      ["programs", "progression", "test-program-id"],
      mockProgression,
    );

    render(<ProgramPlay />, { wrapper });

    await screen.findByText("test-program-id");
  });

  it("passes isShaking prop to ActiveGate correctly", async () => {
    vi.mocked(useProgramPlay).mockReturnValue({
      ...mockUseProgramPlay,
      isShaking: true,
    });

    const { queryClient, wrapper } = createQueryWrapper();

    queryClient.setQueryData(["programs"], mockPrograms);
    queryClient.setQueryData(
      ["programs", "progression", "test-program-id"],
      mockProgression,
    );

    render(<ProgramPlay />, { wrapper });

    await screen.findByText("Test Program");
    const activeGateCall = vi.mocked(ActiveGate).mock.calls[0];
    expect(activeGateCall).toBeDefined();
    expect(activeGateCall[0]).toMatchObject({
      isShaking: true,
    });
  });
});
