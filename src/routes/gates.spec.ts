import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import gatesRouter from "./gates";

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(),
}));

const mockWhere = vi.fn();
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));
const mockFindFirst = vi.fn();

const mockDb = {
  query: {
    gates: {
      findFirst: mockFindFirst,
    },
  },
  update: mockUpdate,
};

type SuccessGuessResponse = {
  correct: true;
  successMessage: string;
  nextGateId: string | null;
};

type IncorrectGuessResponse = {
  correct: false;
  message: string;
};

type ErrorResponse = {
  error: string;
};

const createMockGate = (overrides = {}) => ({
  id: "gate-1",
  label: "First Gate",
  question: "What is 2 + 2?",
  correctAnswer: "four",
  successMessage: "You have opened the first gate.",
  isSolved: false,
  programId: "prog-1",
  sequenceOrder: 1,
  attemptCount: 0,
  guidanceThreshold: 2,
  guidancePrompt: "Think about the number after three.",
  ...overrides,
});

describe("Gates Router", () => {
  // A dummy D1 object to pass into Hono's environment
  const env = { DB: {} as D1Database };

  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Use vi.mocked() to access Vitest's typing, and cast mockDb
    vi.mocked(drizzle).mockReturnValue(
      mockDb as unknown as ReturnType<typeof drizzle>,
    );
  });

  afterEach(() => {
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
    }
  });

  describe("GET /:id", () => {
    it("should return 200 and the gate details if found", async () => {
      mockFindFirst.mockResolvedValueOnce(createMockGate());

      const res = await gatesRouter.request("/gate-1", {}, env);
      const data: { label: string } = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty("label", "First Gate");
      expect(mockFindFirst).toHaveBeenCalledTimes(1);
    });

    it("should return 404 if the gate does not exist", async () => {
      mockFindFirst.mockResolvedValueOnce(undefined);

      const res = await gatesRouter.request("/missing-gate", {}, env);
      const data: ErrorResponse = await res.json();

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: "Gate not found" });
    });

    it("should return 500 on database error", async () => {
      mockFindFirst.mockRejectedValueOnce(new Error("DB failure"));

      const res = await gatesRouter.request("/gate-1", {}, env);
      const data: ErrorResponse = await res.json();

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch gate" });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to fetch gate:",
        expect.any(Error),
      );
    });
  });

  describe("POST /:id/guess", () => {
    const makeRequest = (guessPayload: { guess: string }) => {
      return gatesRouter.request(
        "/gate-1/guess",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(guessPayload),
        },
        env,
      );
    };

    describe("Validation & State Checks", () => {
      it("should return 400 if guess payload is empty or invalid", async () => {
        const res = await makeRequest({ guess: "" });

        // Zod validation failure handled by Hono returns 400
        expect(res.status).toBe(400);
        // Drizzle shouldn't even be called
        expect(mockFindFirst).not.toHaveBeenCalled();
      });

      it("should return 404 if the gate is not found", async () => {
        mockFindFirst.mockResolvedValueOnce(undefined);

        const res = await makeRequest({ guess: "four" });
        expect(res.status).toBe(404);
      });

      it("should return 400 if the gate is already solved", async () => {
        mockFindFirst.mockResolvedValueOnce(createMockGate({ isSolved: true }));

        const res = await makeRequest({ guess: "four" });
        const data: ErrorResponse = await res.json();

        expect(res.status).toBe(400);
        expect(data).toEqual({ error: "Gate is already solved" });
        expect(mockUpdate).not.toHaveBeenCalled();
      });
    });

    describe("Correct Guesses", () => {
      it("should mark as solved and return the next gate ID", async () => {
        mockFindFirst
          // 1st call: fetch current gate
          .mockResolvedValueOnce(createMockGate())
          // 2nd call: fetch next gate
          .mockResolvedValueOnce({ id: "gate-2" });

        mockWhere.mockResolvedValueOnce(true); // Mock the update success

        const res = await makeRequest({ guess: " FOUR " }); // Testing case/trim insensitivity
        const data: SuccessGuessResponse = await res.json();

        expect(res.status).toBe(200);
        expect(data).toEqual({
          correct: true,
          successMessage: "You have opened the first gate.",
          nextGateId: "gate-2",
        });

        // Verify Drizzle update chain was called correctly
        expect(mockUpdate).toHaveBeenCalled();
        expect(mockSet).toHaveBeenCalledWith(
          expect.objectContaining({ isSolved: true }),
        );
      });

      it("should return nextGateId as null if it is the final gate in the program", async () => {
        mockFindFirst
          .mockResolvedValueOnce(createMockGate())
          .mockResolvedValueOnce(undefined); // No next gate found

        const res = await makeRequest({ guess: "four" });
        const data: SuccessGuessResponse = await res.json();

        expect(res.status).toBe(200);
        expect(data.nextGateId).toBeNull();
      });
    });

    describe("Incorrect Guesses", () => {
      it("should increment attempt count and return correct: false without a hint if below threshold", async () => {
        mockFindFirst.mockResolvedValueOnce(
          createMockGate({ attemptCount: 0 }),
        );

        const res = await makeRequest({ guess: "five" });
        const data: IncorrectGuessResponse = await res.json();

        expect(res.status).toBe(200);
        expect(data).toEqual({
          correct: false,
          message: "",
        });

        // Verify attempt count update
        expect(mockUpdate).toHaveBeenCalled();
        expect(mockSet).toHaveBeenCalledWith({ attemptCount: 1 });
      });

      it("should return the guidance prompt if the new attempt count hits the threshold", async () => {
        // Threshold is 2. Current attempts: 1. This wrong guess makes it 2.
        mockFindFirst.mockResolvedValueOnce(
          createMockGate({ attemptCount: 1 }),
        );

        const res = await makeRequest({ guess: "five" });
        const data: IncorrectGuessResponse = await res.json();

        expect(res.status).toBe(200);
        expect(data).toEqual({
          correct: false,
          message: "Think about the number after three.",
        });

        expect(mockSet).toHaveBeenCalledWith({ attemptCount: 2 });
      });

      it("should return a fallback AI hint message if guidance prompt is missing but threshold is met", async () => {
        mockFindFirst.mockResolvedValueOnce(
          createMockGate({ attemptCount: 1, guidancePrompt: null }),
        );

        const res = await makeRequest({ guess: "five" });
        const data: IncorrectGuessResponse = await res.json();

        expect(res.status).toBe(200);
        expect(data.message).toBe(
          "Hint: The AI integration is pending, but keep trying!",
        );
      });
    });

    describe("Error Handling", () => {
      it("should return 500 if database update fails", async () => {
        mockFindFirst.mockResolvedValueOnce(createMockGate());
        mockUpdate.mockImplementationOnce(() => {
          throw new Error("Update failed");
        });

        const res = await makeRequest({ guess: "four" });
        const data: ErrorResponse = await res.json();

        expect(res.status).toBe(500);
        expect(data).toEqual({ error: "Failed to process guess" });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to process guess:",
          expect.any(Error),
        );
      });
    });
  });
});
