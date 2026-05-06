import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "..";
import type { GuessResponse } from "../services/gateService";

// Mock setup
const { mockProcessGateGuess, mockGetGateById } = vi.hoisted(() => ({
  mockProcessGateGuess: vi.fn(),
  mockGetGateById: vi.fn(),
}));

vi.mock("../services/gateService", () => ({
  processGateGuess: mockProcessGateGuess,
  getGateById: mockGetGateById,
}));

// Fixtures
const mockEnv = {
  Bindings: {
    DB: {
      prepare: vi.fn(),
    },
  },
};

function postGuess(gateId: string, guess: string): Promise<Response> {
  return Promise.resolve(
    app.request(
      `/api/gates/${gateId}/guess`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess }),
      },
      mockEnv,
    ),
  );
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/gates/:id", () => {
  it("returns 200 with gate data when found", async () => {
    mockGetGateById.mockResolvedValue({ id: "gate-1", label: "Gate 1" });

    const res = await app.request("/api/gates/gate-1", {}, mockEnv);
    expect(res.status).toBe(200);
  });

  it("returns 404 when gate not found", async () => {
    mockGetGateById.mockResolvedValue(null);

    const res = await app.request("/api/gates/nonexistent", {}, mockEnv);
    expect(res.status).toBe(404);
  });

  it("returns 500 on database error", async () => {
    mockGetGateById.mockRejectedValue(new Error("DB Down"));

    const res = await app.request("/api/gates/gate-1", {}, mockEnv);
    expect(res.status).toBe(500);
  });
});

describe("POST /api/gates/:id/guess", () => {
  describe("request validation", () => {
    it("returns 400 for empty guess", async () => {
      const res = await postGuess("gate-1", "");
      expect(res.status).toBe(400);
    });

    it("returns 400 when guess field is missing", async () => {
      const res = await app.request(
        "/api/gates/gate-1/guess",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
        mockEnv,
      );
      expect(res.status).toBe(400);
    });
  });

  describe("success responses", () => {
    it("returns 200 with correct response structure on correct guess", async () => {
      mockProcessGateGuess.mockResolvedValue({
        status: "correct",
        message: "Well done!",
        nextGateId: "gate-2",
      });

      const res = await postGuess("gate-1", "forty-two");

      expect(res.status).toBe(200);
      const body = (await res.json()) as GuessResponse;
      expect(body.status).toBe("correct");
      expect(body.message).toBe("Well done!");
    });

    it("returns 200 with correct response on incorrect guess", async () => {
      mockProcessGateGuess.mockResolvedValue({
        status: "incorrect",
        message: "Access Denied",
        clue: "",
      });

      const res = await postGuess("gate-1", "wrong");

      expect(res.status).toBe(200);
      const body = (await res.json()) as GuessResponse;
      expect(body.status).toBe("incorrect");
    });
  });

  describe("error responses", () => {
    it("returns 404 when service returns gate not found error", async () => {
      mockProcessGateGuess.mockResolvedValue({
        status: "error",
        message: "Gate not found",
        code: "NOT_FOUND",
      });

      const res = await postGuess("gate-1", "guess");

      expect(res.status).toBe(404);
    });

    it("returns 409 when service returns gate already solved error", async () => {
      mockProcessGateGuess.mockResolvedValue({
        status: "error",
        message: "Gate is already solved",
        code: "ALREADY_SOLVED",
      });

      const res = await postGuess("gate-1", "guess");

      expect(res.status).toBe(409);
    });

    it("returns 500 when service throws unexpectedly", async () => {
      mockProcessGateGuess.mockRejectedValue(new Error("Unexpected error"));

      const res = await postGuess("gate-1", "guess");

      expect(res.status).toBe(500);
    });
  });
});
