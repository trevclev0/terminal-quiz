import { useCreateProgramMutation } from "@api/mutations/useCreateProgramMutation";
import { useDeleteProgramMutation } from "@api/mutations/useDeleteProgramMutation";
import { useMyProgramsQuery } from "@api/queries/useMyProgramsQuery";
import { useNavigate } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import ManageProgramsList from "./ManageProgramsList";

vi.mock("@api/queries/useMyProgramsQuery");
vi.mock("@api/mutations/useCreateProgramMutation");
vi.mock("@api/mutations/useDeleteProgramMutation");

vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn(),
  Link: vi.fn(({ to, params, children, ...props }) => (
    <a href={to} data-params={JSON.stringify(params)} {...props}>
      {children}
    </a>
  )),
}));

describe("ManageProgramsList", () => {
  const mockNavigate = vi.fn();
  const mockCreateMutateAsync = vi.fn();
  const mockDeleteMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useNavigate as Mock).mockReturnValue(mockNavigate);
    (useMyProgramsQuery as Mock).mockReturnValue({
      data: [
        {
          id: "prog-1",
          name: "Program Alpha",
          visibility: "public",
          authorId: "user-1",
        },
        {
          id: "prog-2",
          name: "Program Beta",
          visibility: "unlisted",
          authorId: "user-1",
        },
      ],
      isLoading: false,
      error: null,
    });
    (useCreateProgramMutation as Mock).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
    });
    (useDeleteProgramMutation as Mock).mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    });
  });

  it("renders program list", () => {
    render(<ManageProgramsList />);
    expect(screen.getByText("Program Alpha")).toBeInTheDocument();
    expect(screen.getByText("Program Beta")).toBeInTheDocument();
    expect(screen.getByText("public")).toBeInTheDocument();
    expect(screen.getByText("unlisted")).toBeInTheDocument();
  });

  it("shows empty state when no programs", () => {
    (useMyProgramsQuery as Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    render(<ManageProgramsList />);
    expect(screen.getByText(/No programs yet/)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    (useMyProgramsQuery as Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    render(<ManageProgramsList />);
    expect(screen.getByText("Loading Programs...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    (useMyProgramsQuery as Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed"),
    });
    render(<ManageProgramsList />);
    expect(screen.getByText("Failed to load programs.")).toBeInTheDocument();
  });

  it("creates a program and navigates to editor", async () => {
    mockCreateMutateAsync.mockResolvedValue({
      id: "new-prog",
      name: "New Program",
      visibility: "public",
      authorId: "user-1",
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    render(<ManageProgramsList />);

    const input = screen.getByPlaceholderText("Program name");
    await userEvent.type(input, "New Program");

    const createButton = screen.getByText("Create Program");
    await userEvent.click(createButton);

    expect(mockCreateMutateAsync).toHaveBeenCalledWith({
      name: "New Program",
      visibility: "public",
    });
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/programs/manage/$programId",
      params: { programId: "new-prog" },
    });
  });

  it("calls delete mutation on confirm", async () => {
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );

    render(<ManageProgramsList />);

    const deleteButtons = screen.getAllByText("Delete");
    await userEvent.click(deleteButtons[0]);

    expect(mockDeleteMutate).toHaveBeenCalledWith({ id: "prog-1" });
  });

  it("does not call delete mutation when confirm is cancelled", async () => {
    vi.stubGlobal(
      "confirm",
      vi.fn(() => false),
    );

    render(<ManageProgramsList />);

    const deleteButtons = screen.getAllByText("Delete");
    await userEvent.click(deleteButtons[0]);

    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });

  it("shows error when create mutation fails", () => {
    (useCreateProgramMutation as Mock).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isError: true,
      isPending: false,
      error: new Error("Create error"),
    });

    render(<ManageProgramsList />);
    expect(
      screen.getByText("Failed to create: Create error"),
    ).toBeInTheDocument();
  });

  it("shows error when delete mutation fails", () => {
    (useDeleteProgramMutation as Mock).mockReturnValue({
      mutate: mockDeleteMutate,
      isError: true,
      isPending: false,
      error: new Error("Delete error"),
    });

    render(<ManageProgramsList />);
    expect(
      screen.getByText("Failed to delete: Delete error"),
    ).toBeInTheDocument();
  });

  it("renders copy link button for unlisted but not public programs", () => {
    render(<ManageProgramsList />);
    expect(screen.getAllByText("Copy Link")).toHaveLength(1);
  });
});
