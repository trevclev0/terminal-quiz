import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatErrorResponse, logError } from "./errorHandler";

const parseLog = (spy: ReturnType<typeof vi.spyOn>) =>
  JSON.parse(String(spy.mock.calls[0][0]));

describe("errorHandler", () => {
  describe("logError", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Spy on console.error and suppress its output during tests
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("logs a structured JSON line with request details", () => {
      const error = new Error("Test error");
      logError(error, "GET", "/test-path");

      const log = parseLog(consoleErrorSpy);
      expect(log).toMatchObject({
        level: "error",
        method: "GET",
        path: "/test-path",
        message: "Test error",
      });
      expect(log.ts).toEqual(expect.any(String));
      expect(log.requestId).toBeUndefined();
    });

    it("includes the requestId when provided", () => {
      const error = new Error("Test error");
      logError(error, "GET", "/test-path", "req-123");

      const log = parseLog(consoleErrorSpy);
      expect(log.requestId).toBe("req-123");
    });

    it("logs the underlying D1 cause if present", () => {
      const cause = new Error("D1 connection failed");
      const error = new Error("Main error");
      error.cause = cause;

      logError(error, "POST", "/api/data");

      const log = parseLog(consoleErrorSpy);
      expect(log.message).toBe("Main error");
      expect(log.cause).toBe("D1 connection failed");
    });

    it("logs the error string when error has no message", () => {
      const error = new Error();
      logError(error, "GET", "/test");

      const log = parseLog(consoleErrorSpy);
      expect(log.message).toBe(String(error));
    });

    it("logs the cause string when cause has no message", () => {
      const cause = new Error();
      const error = new Error("Main error");
      error.cause = cause;

      logError(error, "POST", "/api/data");

      const log = parseLog(consoleErrorSpy);
      expect(log.cause).toBe(String(cause));
    });

    it("redacts tokens and query strings from the message", () => {
      const error = new Error(
        "upstream failed: https://api.example.com?token=abc123",
      );

      logError(error, "GET", "/api/graphql");

      const log = parseLog(consoleErrorSpy);
      expect(log.message).toContain("[REDACTED]");
      expect(log.message).not.toContain("abc123");
    });

    it("redacts secrets in nested causes", () => {
      const cause = new Error("upstream authorization: Bearer secret-token");
      const error = new Error("Main error");
      error.cause = cause;

      logError(error, "POST", "/api/data");

      const log = parseLog(consoleErrorSpy);
      expect(log.cause).toContain("[REDACTED]");
      expect(log.cause).not.toContain("secret-token");
    });
  });

  describe("formatErrorResponse", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("formats response for GraphQL paths", () => {
      const error = new Error("GraphQL went wrong");
      const response = formatErrorResponse(error, "/api/graphql");

      expect(response).toEqual({
        errors: [{ message: "Internal Server Error" }],
      });
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
    it("provides a default message for GraphQL paths if error has no message", () => {
      const error = new Error();
      const response = formatErrorResponse(error, "/api/graphql");

      expect(response).toEqual({
        errors: [{ message: "Internal Server Error" }],
      });
    });

    it("formats response for non-GraphQL paths", () => {
      const error = new Error("REST API error");
      const response = formatErrorResponse(error, "/api/users");

      expect(response).toEqual({
        status: "error",
        message: "Server Error",
        code: "INTERNAL_SERVER_ERROR",
      });
    });
  });
});
