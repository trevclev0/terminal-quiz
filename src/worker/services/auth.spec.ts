import { describe, expect, it } from "vitest";
import { stripAccountTokens } from "./auth";

describe("stripAccountTokens", () => {
  it("strips accessToken, refreshToken, and idToken", () => {
    const account = {
      id: "acc-1",
      provider: "github",
      providerAccountId: "12345",
      userId: "user-1",
      accessToken: "secret-access-token",
      refreshToken: "secret-refresh-token",
      idToken: "secret-id-token",
    };

    const result = stripAccountTokens(account);

    expect(result.accessToken).toBeUndefined();
    expect(result.refreshToken).toBeUndefined();
    expect(result.idToken).toBeUndefined();
  });

  it("preserves all other fields", () => {
    const account = {
      id: "acc-1",
      provider: "github",
      providerAccountId: "12345",
      userId: "user-1",
      accessToken: "secret-access-token",
      refreshToken: "secret-refresh-token",
      idToken: "secret-id-token",
    };

    const result = stripAccountTokens(account);

    expect(result.id).toBe("acc-1");
    expect(result.provider).toBe("github");
    expect(result.providerAccountId).toBe("12345");
    expect(result.userId).toBe("user-1");
  });

  it("handles account without token fields", () => {
    const account = {
      id: "acc-1",
      provider: "github",
      providerAccountId: "12345",
      userId: "user-1",
    };

    const result = stripAccountTokens(account);

    expect(result.id).toBe("acc-1");
    expect(result.provider).toBe("github");
    expect(result.accessToken).toBeUndefined();
    expect(result.refreshToken).toBeUndefined();
    expect(result.idToken).toBeUndefined();
  });

  it("does not mutate the original account object", () => {
    const account = {
      id: "acc-1",
      accessToken: "secret",
      refreshToken: "secret",
      idToken: "secret",
    };

    stripAccountTokens(account);

    expect(account.accessToken).toBe("secret");
    expect(account.refreshToken).toBe("secret");
    expect(account.idToken).toBe("secret");
  });
});
