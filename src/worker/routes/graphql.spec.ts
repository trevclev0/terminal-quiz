import { describe, expect, it } from "vitest";
import { authFailureStatus } from "./graphql";

describe("authFailureStatus", () => {
  it("maps a lone UNAUTHENTICATED error to 401", () => {
    expect(
      authFailureStatus({
        errors: [{ extensions: { code: "UNAUTHENTICATED" } }],
      }),
    ).toBe(401);
  });

  it("maps a lone FORBIDDEN error to 403", () => {
    expect(
      authFailureStatus({ errors: [{ extensions: { code: "FORBIDDEN" } }] }),
    ).toBe(403);
  });

  it("keeps 500 when an untagged error accompanies a tagged one", () => {
    expect(
      authFailureStatus({
        errors: [
          { extensions: { code: "UNAUTHENTICATED" } },
          { extensions: undefined },
        ],
      }),
    ).toBeNull();
  });

  it("keeps 500 when errors carry different auth codes", () => {
    expect(
      authFailureStatus({
        errors: [
          { extensions: { code: "UNAUTHENTICATED" } },
          { extensions: { code: "FORBIDDEN" } },
        ],
      }),
    ).toBeNull();
  });

  it("keeps 500 when no error is tagged", () => {
    expect(
      authFailureStatus({ errors: [{ extensions: undefined }] }),
    ).toBeNull();
  });

  it("returns null when there are no errors", () => {
    expect(authFailureStatus({})).toBeNull();
  });
});
