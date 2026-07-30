import { beforeEach, describe, expect, it, vi } from "vitest";
import { authMiddleware } from "./auth";

vi.mock("@worker-services/auth", () => ({
  getAuth: vi.fn(),
}));

import { getAuth } from "@worker-services/auth";

const mockGetAuth = vi.mocked(getAuth);

function createMockContext(
  envOverrides: Record<string, unknown> = {},
  headerOverrides: Record<string, string> = {},
) {
  const env = {
    ENVIRONMENT: "development",
    ...envOverrides,
  };

  const headers: Record<string, string> = {
    ...headerOverrides,
  };

  const setMock = vi.fn();

  return {
    env,
    req: {
      header: (name: string) => headers[name],
      raw: { headers: new Headers(headers) },
    },
    set: setMock,
  };
}

function createMockNext() {
  return vi.fn().mockResolvedValue(undefined);
}

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("bypass disabled (default)", () => {
    it("calls getSession and sets user from session", async () => {
      const mockSession = { user: { id: "user-1", name: "Test" } };
      mockGetAuth.mockReturnValue({
        api: { getSession: vi.fn().mockResolvedValue(mockSession) },
      } as unknown as ReturnType<typeof getAuth>);

      const c = createMockContext();
      const next = createMockNext();

      await authMiddleware(c as never, next);

      expect(mockGetAuth).toHaveBeenCalled();
      expect(c.set).toHaveBeenCalledWith("user", mockSession.user);
      expect(next).toHaveBeenCalled();
    });

    it("does not set user when session has no user", async () => {
      mockGetAuth.mockReturnValue({
        api: { getSession: vi.fn().mockResolvedValue({ user: null }) },
      } as unknown as ReturnType<typeof getAuth>);

      const c = createMockContext();
      const next = createMockNext();

      await authMiddleware(c as never, next);

      expect(c.set).not.toHaveBeenCalledWith("user", expect.anything());
      expect(next).toHaveBeenCalled();
    });

    it("continues when getSession throws", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockGetAuth.mockReturnValue({
        api: {
          getSession: vi.fn().mockRejectedValue(new Error("session error")),
        },
      } as unknown as ReturnType<typeof getAuth>);

      const c = createMockContext();
      const next = createMockNext();

      await authMiddleware(c as never, next);

      expect(console.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe("bypass enabled", () => {
    const bypassEnv = {
      ENVIRONMENT: "preview",
      AUTH_TEST_BYPASS_ENABLED: "true",
      AUTH_TEST_BYPASS_SECRET: "test-secret-123",
    };

    it("creates test user from headers when bypass enabled", async () => {
      const c = createMockContext(bypassEnv, {
        "x-auth-test-user-id": "test-user",
        "x-auth-test-user-secret": "test-secret-123",
      });
      const next = createMockNext();

      await authMiddleware(c as never, next);

      expect(c.set).toHaveBeenCalledWith("user", {
        id: "test-user",
        email: "test-user@test.example.com",
        name: "test-user",
        image: null,
      });
      expect(next).toHaveBeenCalled();
    });

    it("does not call getAuth when bypass succeeds", async () => {
      const c = createMockContext(bypassEnv, {
        "x-auth-test-user-id": "test-user",
        "x-auth-test-user-secret": "test-secret-123",
      });
      const next = createMockNext();

      await authMiddleware(c as never, next);

      expect(mockGetAuth).not.toHaveBeenCalled();
    });

    it("falls through to getSession when secret is wrong", async () => {
      mockGetAuth.mockReturnValue({
        api: { getSession: vi.fn().mockResolvedValue(null) },
      } as unknown as ReturnType<typeof getAuth>);

      const c = createMockContext(bypassEnv, {
        "x-auth-test-user-id": "test-user",
        "x-auth-test-user-secret": "wrong-secret",
      });
      const next = createMockNext();

      await authMiddleware(c as never, next);

      expect(mockGetAuth).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it("falls through to getSession when userId header is missing", async () => {
      mockGetAuth.mockReturnValue({
        api: { getSession: vi.fn().mockResolvedValue(null) },
      } as unknown as ReturnType<typeof getAuth>);

      const c = createMockContext(bypassEnv, {
        "x-auth-test-user-secret": "test-secret-123",
      });
      const next = createMockNext();

      await authMiddleware(c as never, next);

      expect(mockGetAuth).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it("falls through when ENVIRONMENT is production", async () => {
      mockGetAuth.mockReturnValue({
        api: { getSession: vi.fn().mockResolvedValue(null) },
      } as unknown as ReturnType<typeof getAuth>);

      const c = createMockContext(
        { ...bypassEnv, ENVIRONMENT: "production" },
        {
          "x-auth-test-user-id": "test-user",
          "x-auth-test-user-secret": "test-secret-123",
        },
      );
      const next = createMockNext();

      await authMiddleware(c as never, next);

      expect(mockGetAuth).toHaveBeenCalled();
      expect(c.set).not.toHaveBeenCalledWith(
        "user",
        expect.objectContaining({ id: "test-user" }),
      );
    });
  });
});
