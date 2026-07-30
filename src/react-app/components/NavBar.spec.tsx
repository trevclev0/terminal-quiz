import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NavBar from "./NavBar";

const mockSignOut = vi.fn();
const mockUseSession = vi.fn();

vi.mock("@api/authClient", () => ({
  authClient: {
    useSession: (...args: unknown[]) => mockUseSession(...args),
    signOut: (...args: unknown[]) => mockSignOut(...args),
  },
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("NavBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'Log in' link when logged out", () => {
    mockUseSession.mockReturnValue({ data: null });
    render(<NavBar />);

    expect(screen.getByText("Log in")).toBeInTheDocument();
    expect(screen.queryByText("My Programs")).not.toBeInTheDocument();
    expect(screen.queryByText("Log out")).not.toBeInTheDocument();
  });

  it("shows user name and nav links when logged in", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Alice" } },
    });
    render(<NavBar />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Programs")).toBeInTheDocument();
    expect(screen.getByText("My Programs")).toBeInTheDocument();
    expect(screen.getByText("Log out")).toBeInTheDocument();
    expect(screen.queryByText("Log in")).not.toBeInTheDocument();
  });

  it("calls signOut when Log out is clicked", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Alice" } },
    });
    render(<NavBar />);

    await userEvent.click(screen.getByText("Log out"));

    expect(mockSignOut).toHaveBeenCalled();
  });
});
