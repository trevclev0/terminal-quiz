import { useCreateGateMutation } from "@api/mutations/useCreateGateMutation";
import { useDeleteGateMutation } from "@api/mutations/useDeleteGateMutation";
import { useReorderGatesMutation } from "@api/mutations/useReorderGatesMutation";
import { useUpdateGateMutation } from "@api/mutations/useUpdateGateMutation";
import { useUpdateProgramMutation } from "@api/mutations/useUpdateProgramMutation";
import { useMyProgramsQuery } from "@api/queries/useMyProgramsQuery";
import { useProgramGatesQuery } from "@api/queries/useProgramGatesQuery";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import ManageProgramEditor from "./ManageProgramEditor";

vi.mock("@api/queries/useMyProgramsQuery");
vi.mock("@api/queries/useProgramGatesQuery");
vi.mock("@api/mutations/useUpdateProgramMutation");
vi.mock("@api/mutations/useCreateGateMutation");
vi.mock("@api/mutations/useUpdateGateMutation");
vi.mock("@api/mutations/useDeleteGateMutation");
vi.mock("@api/mutations/useReorderGatesMutation");

const PROGRAM_ID = "prog-1";

const mockProgram = {
  id: PROGRAM_ID,
  name: "Test Program",
  visibility: "public",
  authorId: "user-1",
};

const mockGates = [
  {
    id: "gate-1",
    programId: PROGRAM_ID,
    sequenceOrder: 1,
    label: "Gate One",
    question: "First question?",
    correctAnswer: "answer-1",
    successMessage: "Correct!",
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidanceThreshold: 3,
  },
  {
    id: "gate-2",
    programId: PROGRAM_ID,
    sequenceOrder: 2,
    label: "Gate Two",
    question: "Second question?",
    correctAnswer: "answer-2",
    successMessage: "Nice!",
    acceptanceThreshold: 0.875,
    guidanceEnabled: true,
    guidanceThreshold: 3,
  },
];

function setupMocks(overrides: Record<string, unknown> = {}) {
  const mockUpdateProgram = { mutate: vi.fn(), isPending: false };
  const mockCreateGate = { mutate: vi.fn(), isPending: false };
  const mockUpdateGate = { mutate: vi.fn(), isPending: false };
  const mockDeleteGate = { mutate: vi.fn(), isPending: false };
  const mockReorderGates = { mutate: vi.fn(), isPending: false };

  (useMyProgramsQuery as Mock).mockReturnValue({
    data: [mockProgram],
    ...(overrides.programsQuery || {}),
  });
  (useProgramGatesQuery as Mock).mockReturnValue({
    data: mockGates,
    isLoading: false,
    ...(overrides.gatesQuery || {}),
  });
  (useUpdateProgramMutation as Mock).mockReturnValue({
    ...mockUpdateProgram,
    ...(overrides.updateProgram || {}),
  });
  (useCreateGateMutation as Mock).mockReturnValue({
    ...mockCreateGate,
    ...(overrides.createGate || {}),
  });
  (useUpdateGateMutation as Mock).mockReturnValue({
    ...mockUpdateGate,
    ...(overrides.updateGate || {}),
  });
  (useDeleteGateMutation as Mock).mockReturnValue({
    ...mockDeleteGate,
    ...(overrides.deleteGate || {}),
  });
  (useReorderGatesMutation as Mock).mockReturnValue({
    ...mockReorderGates,
    ...(overrides.reorderGates || {}),
  });

  return {
    mockUpdateProgram,
    mockCreateGate,
    mockUpdateGate,
    mockDeleteGate,
    mockReorderGates,
  };
}

describe("ManageProgramEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state", () => {
    setupMocks({
      gatesQuery: { data: undefined, isLoading: true },
      programsQuery: { data: [mockProgram] },
    });

    render(<ManageProgramEditor programId={PROGRAM_ID} />);
    expect(screen.getByText("Loading Editor...")).toBeInTheDocument();
  });

  it("renders gates with fields", () => {
    setupMocks();

    render(<ManageProgramEditor programId={PROGRAM_ID} />);

    expect(screen.getByText("Edit: Test Program")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Gate One")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Gate Two")).toBeInTheDocument();
    expect(screen.getByDisplayValue("First question?")).toBeInTheDocument();
    expect(screen.getByDisplayValue("answer-1")).toBeInTheDocument();
  });

  it("saves program metadata", async () => {
    const { mockUpdateProgram } = setupMocks();

    render(<ManageProgramEditor programId={PROGRAM_ID} />);

    const nameInput = screen.getByDisplayValue("Test Program");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Updated Program");

    const saveButtons = screen.getAllByText("Save");
    await userEvent.click(saveButtons[0]);

    expect(mockUpdateProgram.mutate).toHaveBeenCalledWith({
      id: PROGRAM_ID,
      name: "Updated Program",
      visibility: "public",
    });
  });

  it("saves a gate", async () => {
    const { mockUpdateGate } = setupMocks();

    render(<ManageProgramEditor programId={PROGRAM_ID} />);

    const labelInput = screen.getByDisplayValue("Gate One");
    await userEvent.clear(labelInput);
    await userEvent.type(labelInput, "Updated Gate");

    const saveGateButtons = screen.getAllByText("Save Gate");
    await userEvent.click(saveGateButtons[0]);

    expect(mockUpdateGate.mutate).toHaveBeenCalledWith(
      {
        id: "gate-1",
        label: "Updated Gate",
        question: "First question?",
        correctAnswer: "answer-1",
        successMessage: "Correct!",
        acceptanceThreshold: 0.875,
        guidanceEnabled: false,
        guidanceThreshold: 3,
      },
      expect.objectContaining({ onSettled: expect.any(Function) }),
    );
  });

  it("deletes a gate after confirm", async () => {
    const { mockDeleteGate } = setupMocks();
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );

    render(<ManageProgramEditor programId={PROGRAM_ID} />);

    const deleteButtons = screen.getAllByText("Delete Gate");
    await userEvent.click(deleteButtons[0]);

    expect(mockDeleteGate.mutate).toHaveBeenCalledWith({ id: "gate-1" });
  });

  it("reorders gates up", async () => {
    const { mockReorderGates } = setupMocks();

    render(<ManageProgramEditor programId={PROGRAM_ID} />);

    const upButtons = screen.getAllByLabelText("Move gate up");
    await userEvent.click(upButtons[1]);

    expect(mockReorderGates.mutate).toHaveBeenCalledWith({
      programId: PROGRAM_ID,
      orderedGateIds: ["gate-2", "gate-1"],
    });
  });

  it("reorders gates down", async () => {
    const { mockReorderGates } = setupMocks();

    render(<ManageProgramEditor programId={PROGRAM_ID} />);

    const downButtons = screen.getAllByLabelText("Move gate down");
    await userEvent.click(downButtons[0]);

    expect(mockReorderGates.mutate).toHaveBeenCalledWith({
      programId: PROGRAM_ID,
      orderedGateIds: ["gate-2", "gate-1"],
    });
  });

  it("disables reorder buttons while reorder mutation inflight", () => {
    setupMocks({
      reorderGates: { isPending: true },
    });

    render(<ManageProgramEditor programId={PROGRAM_ID} />);

    const upButtons = screen.getAllByLabelText("Move gate up");
    const downButtons = screen.getAllByLabelText("Move gate down");

    expect(upButtons[0]).toBeDisabled();
    expect(downButtons[0]).toBeDisabled();
    expect(upButtons[1]).toBeDisabled();
    expect(downButtons[1]).toBeDisabled();
  });

  it("adds a new gate", async () => {
    const { mockCreateGate } = setupMocks();

    render(<ManageProgramEditor programId={PROGRAM_ID} />);

    const addGateForm = screen.getByRole("form", { name: "Add Gate" });

    await userEvent.type(
      within(addGateForm).getByLabelText("Label"),
      "New Gate",
    );
    await userEvent.type(
      within(addGateForm).getByLabelText("Question"),
      "New question?",
    );
    await userEvent.type(
      within(addGateForm).getByLabelText("Correct Answer"),
      "new-answer",
    );
    await userEvent.type(
      within(addGateForm).getByLabelText("Success Message"),
      "Well done!",
    );

    await userEvent.click(
      within(addGateForm).getByRole("button", { name: "Add Gate" }),
    );

    expect(mockCreateGate.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        programId: PROGRAM_ID,
        label: "New Gate",
        correctAnswer: "new-answer",
        sequenceOrder: 3,
      }),
      expect.any(Object),
    );
  });

  it("shows program not found", () => {
    setupMocks({
      programsQuery: {
        data: [
          {
            id: "other-prog",
            name: "Other",
            visibility: "public",
            authorId: "user-1",
          },
        ],
      },
      gatesQuery: { data: [], isLoading: false },
    });

    render(<ManageProgramEditor programId={PROGRAM_ID} />);
    expect(screen.getByText("Program not found.")).toBeInTheDocument();
  });
});
