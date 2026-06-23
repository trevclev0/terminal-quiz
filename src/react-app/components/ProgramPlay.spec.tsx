import { createQueryWrapper } from "@test-utils/queryTestUtils";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

import useProgramPlay from "@hooks/useProgramPlay";

const mockUseProgramPlay = {
  guess: "",
  message: null,
  isShaking: false,
  changeHandler: vi.fn(),
  handleSubmit: vi.fn(),
};

vi.mocked(useProgramPlay).mockReturnValue(mockUseProgramPlay);

describe("ProgramPlay Component", () => {
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
    expect(screen.getByText("Gate 1")).toBeInTheDocument();
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
  });

  it("renders completed gates with details/summary pattern", async () => {
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

    await screen.findByText("Gate 1");
    const completedInput = screen.getAllByRole("textbox")[0];
    expect(completedInput).toHaveValue("✔ 4");
    expect(screen.getByText("Correct!")).toBeInTheDocument();
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

  it("applies shake class only to active gate when isShaking is true", async () => {
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

    await screen.findByText("Gate 1");
    const activeGate = screen.getByText("Gate 1").closest(".gate");
    expect(activeGate).toHaveClass("shake");
  });
});
