// src/routes/gates.test.ts

import { afterEach } from "node:test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import gatesRouter from "./gates";

// ---------------------------------------------------------------------------
// Types — mirror what Drizzle returns for the gates table.
// Verify these fields and nullability against your actual schema inference.
// ---------------------------------------------------------------------------

type GateRow = {
  id: string;
  label: string;
  question: string;
  isSolved: boolean;
  programId: string;
  correctAnswer: string;
  successMessage: string;
  sequenceOrder: number;
  attemptCount: number;
  guidanceThreshold: number;
  guidancePrompt: string | null;
  solvedAt: Date | null;
};

type GatePublicResponse = Pick<
  GateRow,
  "id" | "label" | "question" | "isSolved" | "programId"
>;

type GuessCorrectResponse = {
  correct: true;
  successMessage: string;
  nextGateId: string | null;
};

type GuessIncorrectResponse = {
  correct: false;
  message: string;
};

type ErrorResponse = { error: string };

// ---------------------------------------------------------------------------
// Hoisted mocks
//
// vi.hoisted runs before vi.mock factories, making these references safe to
// use inside the factory below.
//
// The update chain needs special attention: Drizzle's builder is both
// awaitable on its own AND exposes .returning(). We satisfy both by returning
// a Promise instance with returning grafted on as an own property.
// ---------------------------------------------------------------------------

const { mockFindFirst, mockReturning, mockSet, mockUpdate } = vi.hoisted(() => {
  const mockReturning = vi.fn<() => Promise<Array<{ id: string }>>>();

  const mockWhere = vi.fn(() =>
    Object.assign(Promise.resolve(undefined), {
      returning: mockReturning,
    }),
  );

  const mockSet = vi.fn(() => ({ where: mockWhere }));
  const mockUpdate = vi.fn(() => ({ set: mockSet }));
  const mockFindFirst = vi.fn<() => Promise<GateRow | undefined>>();

  return { mockFindFirst, mockReturning, mockSet, mockUpdate, mockWhere };
});

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => ({
    query: {
      gates: { findFirst: mockFindFirst },
    },
    update: mockUpdate,
  })),
}));

// ---------------------------------------------------------------------------
// Fixtures & helpers
// ---------------------------------------------------------------------------

/** DB value is irrelevant — drizzle() is mocked and ignores it. */
const mockEnv = { DB: {} };

const baseGate: GateRow = {
  id: "gate-1",
  label: "Gate One",
  question: "What is the answer?",
  isSolved: false,
  programId: "program-1",
  correctAnswer: "forty-two",
  successMessage: "Well done!",
  sequenceOrder: 1,
  attemptCount: 0,
  guidanceThreshold: 3,
  guidancePrompt: "Try thinking about it differently.",
  solvedAt: null,
};

function postGuess(gateId: string, guess: string): Promise<Response> {
  return Promise.resolve(
    gatesRouter.request(
      `http://localhost/${gateId}/guess`,
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

// ---------------------------------------------------------------------------
// GET /:id
// ---------------------------------------------------------------------------

describe("GET /:id", () => {
  it("returns the gate when found", async () => {
    mockFindFirst.mockResolvedValueOnce(baseGate);

    const res = await gatesRouter.request(
      "http://localhost/gate-1",
      {},
      mockEnv,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as GatePublicResponse;
    expect(body).toMatchObject({
      id: "gate-1",
      label: "Gate One",
      question: "What is the answer?",
      isSolved: false,
      programId: "program-1",
    });
  });

  it("returns 404 when the gate does not exist", async () => {
    mockFindFirst.mockResolvedValueOnce(undefined);

    const res = await gatesRouter.request(
      "http://localhost/nonexistent",
      {},
      mockEnv,
    );

    expect(res.status).toBe(404);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error).toBe("Gate not found");
  });

  it("returns 500 when the database throws", async () => {
    mockFindFirst.mockRejectedValueOnce(new Error("DB failure"));

    const res = await gatesRouter.request(
      "http://localhost/gate-1",
      {},
      mockEnv,
    );

    expect(res.status).toBe(500);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error).toBe("Failed to fetch gate");
  });
});

// ---------------------------------------------------------------------------
// POST /:id/guess
// ---------------------------------------------------------------------------

describe("POST /:id/guess", () => {
  beforeEach(() => {
    // Default: the optimistic update finds and marks one row. Individual tests
    // that need different behaviour override with mockResolvedValueOnce.
    mockReturning.mockResolvedValue([{ id: "gate-1" }]);
  });

  // --- Zod validation ---

  describe("request validation", () => {
    it("returns 400 when guess is an empty string", async () => {
      const res = await postGuess("gate-1", "");
      expect(res.status).toBe(400);
    });

    it("returns 400 when the guess field is absent", async () => {
      const res = await gatesRouter.request(
        "http://localhost/gate-1/guess",
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

  // --- Gate state guards ---

  it("returns 404 when the gate does not exist", async () => {
    mockFindFirst.mockResolvedValueOnce(undefined);

    const res = await postGuess("nonexistent", "forty-two");

    expect(res.status).toBe(404);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error).toBe("Gate not found");
  });

  it("returns 400 when the gate is already solved", async () => {
    mockFindFirst.mockResolvedValueOnce({ ...baseGate, isSolved: true });

    const res = await postGuess("gate-1", "forty-two");

    expect(res.status).toBe(400);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error).toBe("Gate is already solved");
  });

  // --- Correct guess ---

  describe("correct guess", () => {
    it("returns correct:true, successMessage, and the next gate's id", async () => {
      const nextGate: GateRow = { ...baseGate, id: "gate-2", sequenceOrder: 2 };
      mockFindFirst
        .mockResolvedValueOnce(baseGate) // initial gate lookup
        .mockResolvedValueOnce(nextGate); // next-gate lookup

      const res = await postGuess("gate-1", "forty-two");

      expect(res.status).toBe(200);
      const body = (await res.json()) as GuessCorrectResponse;
      expect(body.correct).toBe(true);
      expect(body.successMessage).toBe("Well done!");
      expect(body.nextGateId).toBe("gate-2");
    });

    it("returns nextGateId:null when no subsequent gate exists (program complete)", async () => {
      mockFindFirst
        .mockResolvedValueOnce(baseGate)
        .mockResolvedValueOnce(undefined);

      const res = await postGuess("gate-1", "forty-two");

      expect(res.status).toBe(200);
      const body = (await res.json()) as GuessCorrectResponse;
      expect(body.nextGateId).toBeNull();
    });

    it("matches answers case-insensitively", async () => {
      mockFindFirst
        .mockResolvedValueOnce(baseGate)
        .mockResolvedValueOnce(undefined);

      const res = await postGuess("gate-1", "FORTY-TWO");

      const body = (await res.json()) as GuessCorrectResponse;
      expect(body.correct).toBe(true);
    });

    it("trims whitespace from the guess before comparing", async () => {
      mockFindFirst
        .mockResolvedValueOnce(baseGate)
        .mockResolvedValueOnce(undefined);

      const res = await postGuess("gate-1", "  forty-two  ");

      const body = (await res.json()) as GuessCorrectResponse;
      expect(body.correct).toBe(true);
    });

    it("returns 400 when the optimistic update returns no rows (concurrent solve race condition)", async () => {
      mockFindFirst.mockResolvedValueOnce(baseGate);
      mockReturning.mockResolvedValueOnce([]); // a concurrent request already solved it

      const res = await postGuess("gate-1", "forty-two");

      expect(res.status).toBe(400);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toBe("Gate is already solved");
    });
  });

  // --- Incorrect guess ---

  describe("incorrect guess", () => {
    it("returns correct:false with an empty message when below the guidance threshold", async () => {
      // attemptCount 0 → increments to 1; threshold is 3 → no guidance yet
      mockFindFirst.mockResolvedValueOnce(baseGate);

      const res = await postGuess("gate-1", "wrong-answer");

      expect(res.status).toBe(200);
      const body = (await res.json()) as GuessIncorrectResponse;
      expect(body.correct).toBe(false);
      expect(body.message).toBe("");
    });

    it("returns the guidancePrompt when attempt count reaches the threshold", async () => {
      // attemptCount 2 → increments to 3; threshold is 3 → show guidance
      mockFindFirst.mockResolvedValueOnce({
        ...baseGate,
        attemptCount: 2,
        guidanceThreshold: 3,
      });

      const res = await postGuess("gate-1", "wrong-answer");

      expect(res.status).toBe(200);
      const body = (await res.json()) as GuessIncorrectResponse;
      expect(body.correct).toBe(false);
      expect(body.message).toBe("Try thinking about it differently.");
    });

    it("returns the guidancePrompt when attempt count exceeds the threshold", async () => {
      mockFindFirst.mockResolvedValueOnce({
        ...baseGate,
        attemptCount: 10,
        guidanceThreshold: 3,
      });

      const res = await postGuess("gate-1", "wrong-answer");

      const body = (await res.json()) as GuessIncorrectResponse;
      expect(body.message).toBe("Try thinking about it differently.");
    });

    it("returns the default hint when the threshold is met but guidancePrompt is null", async () => {
      mockFindFirst.mockResolvedValueOnce({
        ...baseGate,
        attemptCount: 2,
        guidanceThreshold: 3,
        guidancePrompt: null,
      });

      const res = await postGuess("gate-1", "wrong-answer");

      const body = (await res.json()) as GuessIncorrectResponse;
      expect(body.message).toBe(
        "Hint: The AI integration is pending, but keep trying!",
      );
    });

    it("calls db.update to increment the attempt count", async () => {
      mockFindFirst.mockResolvedValueOnce(baseGate);

      await postGuess("gate-1", "wrong-answer");

      expect(mockUpdate).toHaveBeenCalledOnce();
      // Correct-guess path would call it twice (solve + next-gate); wrong-guess only once
      expect(mockSet).toHaveBeenCalledOnce();
    });
  });

  it("returns 500 when the database throws during guess processing", async () => {
    mockFindFirst.mockRejectedValueOnce(new Error("DB failure"));

    const res = await postGuess("gate-1", "forty-two");

    expect(res.status).toBe(500);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error).toBe("Failed to process guess");
  });
});
