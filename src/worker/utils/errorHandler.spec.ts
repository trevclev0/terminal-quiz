import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type D1Error, formatErrorResponse, logError } from "./errorHandler";

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

    it("logs the error message and request details", () => {
      const error = new Error("Test error");
      logError(error, "GET", "/test-path");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Error on GET /test-path]:",
        "Test error",
      );
    });

    it("logs the underlying D1 cause if present", () => {
      const cause = new Error("D1 connection failed") as Error & D1Error;
      const error = new Error("Main error");
      error.cause = cause;

      logError(error, "POST", "/api/data");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Error on POST /api/data]:",
        "Main error",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Underlying D1 Cause:",
        "D1 connection failed",
      );
    });
  });

  describe("formatErrorResponse", () => {
    it("formats response for GraphQL paths", () => {
      const error = new Error("GraphQL went wrong");
      const response = formatErrorResponse(error, "/api/graphql");

      expect(response).toEqual({
        errors: [{ message: "GraphQL went wrong" }],
      });
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
