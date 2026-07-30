import {
  isAllowedPath,
  validateLoginSearch,
  validateReturnTo,
} from "@routes/login";
import { describe, expect, it } from "vitest";

describe("validateReturnTo", () => {
  it("returns path+search for same-origin URL", () => {
    expect(validateReturnTo("/programs/select")).toBe("/programs/select");
  });

  it("returns undefined for cross-origin URL", () => {
    expect(validateReturnTo("https://evil.com")).toBeUndefined();
  });

  it("returns undefined for protocol-relative URL", () => {
    expect(validateReturnTo("//evil.com")).toBeUndefined();
  });

  it("returns undefined for path containing backslash", () => {
    expect(validateReturnTo("/programs\\manage")).toBeUndefined();
  });

  it("returns undefined for path containing double slash", () => {
    expect(validateReturnTo("//path")).toBeUndefined();
  });

  it("preserves query string", () => {
    expect(validateReturnTo("/programs/select?foo=bar")).toBe(
      "/programs/select?foo=bar",
    );
  });
});

describe("isAllowedPath", () => {
  it("accepts /programs/select", () => {
    expect(isAllowedPath("/programs/select")).toBe(true);
  });

  it("accepts /", () => {
    expect(isAllowedPath("/")).toBe(true);
  });

  it("accepts /programs/manage prefix", () => {
    expect(isAllowedPath("/programs/manage/prog-1")).toBe(true);
  });

  it("accepts /programs/manage (no trailing slash)", () => {
    expect(isAllowedPath("/programs/manage")).toBe(true);
  });

  it("rejects non-allowed path", () => {
    expect(isAllowedPath("/secret")).toBe(false);
  });
});

describe("validateLoginSearch", () => {
  it("passes return_to when valid and allowed", () => {
    expect(validateLoginSearch({ return_to: "/programs/select" })).toEqual({
      return_to: "/programs/select",
    });
  });

  it("defaults when return_to is cross-origin", () => {
    expect(validateLoginSearch({ return_to: "https://evil.com" })).toEqual({
      return_to: undefined,
    });
  });

  it("defaults when return_to is protocol-relative", () => {
    expect(validateLoginSearch({ return_to: "//evil.com" })).toEqual({
      return_to: undefined,
    });
  });

  it("defaults when return_to contains backslash", () => {
    expect(validateLoginSearch({ return_to: "/programs\\manage" })).toEqual({
      return_to: undefined,
    });
  });

  it("accepts /programs/manage prefix", () => {
    expect(
      validateLoginSearch({ return_to: "/programs/manage/prog-1" }),
    ).toEqual({ return_to: "/programs/manage/prog-1" });
  });

  it("defaults when path is not in allowlist", () => {
    expect(validateLoginSearch({ return_to: "/secret" })).toEqual({
      return_to: undefined,
    });
  });

  it("preserves query string in return_to", () => {
    expect(
      validateLoginSearch({
        return_to: "/programs/select?foo=bar",
      }),
    ).toEqual({ return_to: "/programs/select?foo=bar" });
  });
});
