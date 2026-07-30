import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage";

const mockSignInSocial = vi.fn();

vi.mock("@api/authClient", () => ({
  authClient: {
    signIn: {
      social: (...args: unknown[]) => mockSignInSocial(...args),
    },
  },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders both social login buttons", () => {
    render(<LoginPage redirectTo="/programs/select" />);

    expect(
      screen.getByRole("button", { name: /continue with github/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
  });

  it("calls signIn.social with github when GitHub button is clicked", async () => {
    render(<LoginPage redirectTo="/programs/manage/new" />);

    await userEvent.click(
      screen.getByRole("button", { name: /continue with github/i }),
    );

    expect(mockSignInSocial).toHaveBeenCalledWith({
      provider: "github",
      callbackURL: "/programs/manage/new",
    });
  });

  it("calls signIn.social with google when Google button is clicked", async () => {
    render(<LoginPage redirectTo="/programs/manage/new" />);

    await userEvent.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    expect(mockSignInSocial).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/programs/manage/new",
    });
  });

  it("uses default redirect /programs/select when redirectTo omitted", async () => {
    render(<LoginPage />);

    await userEvent.click(
      screen.getByRole("button", { name: /continue with github/i }),
    );

    expect(mockSignInSocial).toHaveBeenCalledWith({
      provider: "github",
      callbackURL: "/programs/select",
    });
  });
});
