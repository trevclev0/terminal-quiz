import { beforeEach, describe, expect, it, vi } from "vitest";
import { type AppGraphQLContext, getProgramProgression } from "./queries";

describe("Gameplay Queries: getProgramProgression", () => {
  let mockDb: unknown;
  let mockContext: AppGraphQLContext;

  beforeEach(() => {
    mockDb = {
      query: {
        gates: { findMany: vi.fn(), findFirst: vi.fn() },
        sessionProgress: { findFirst: vi.fn() },
      },
      insert: vi.fn(),
    } as unknown;

    mockContext = {
      get: vi.fn((key: string) => {
        if (key === "db") return mockDb;
        if (key === "sessionId") return "mock-session-123";
        return undefined;
      }),
    } as unknown as AppGraphQLContext;
  });

  it("throws an error if sessionId is missing", async () => {
    // @ts-expect-error - mock override
    mockContext.get.mockReturnValue(undefined);

    if (!getProgramProgression.resolve) throw new Error("Resolver not defined");

    await expect(
      getProgramProgression.resolve(null, { programId: "prog-1" }, mockContext),
    ).rejects.toThrow(/Unauthorized/);
  });

  it("fetches and returns the correct progression state", async () => {
    // @ts-expect-error
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      completedGateIds: JSON.stringify(["gate-1"]),
      currentGateId: "gate-2",
      status: "in_progress",
    });

    // @ts-expect-error
    mockDb.query.gates.findMany.mockResolvedValue([
      {
        id: "gate-1",
        label: "Gate 1",
        question: "Q1",
        correctAnswer: "answer-1",
        successMessage: "Nice!",
        sequenceOrder: 1,
      },
    ]);

    // @ts-expect-error
    mockDb.query.gates.findFirst.mockResolvedValue({
      id: "gate-2",
      label: "Gate 2",
      question: "Q2",
      sequenceOrder: 2,
    });

    if (!getProgramProgression.resolve) throw new Error("Resolver not defined");

    const result = await getProgramProgression.resolve(
      null,
      { programId: "prog-1" },
      mockContext,
    );

    expect(result.completedGates).toHaveLength(1);
    expect(result.completedGates[0].id).toBe("gate-1");
    expect(result.completedGates[0].correctAnswer).toBe("answer-1");
    expect(result.currentGate?.id).toBe("gate-2");
    expect(result.currentGate).not.toHaveProperty("correctAnswer");

    // @ts-expect-error
    expect(mockDb.query.gates.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.anything(),
        orderBy: expect.anything(),
      }),
    );
    // @ts-expect-error
    expect(mockDb.query.gates.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: { correctAnswer: false },
        where: expect.anything(),
      }),
    );
  });

  it("skips completed gate query when none are completed", async () => {
    // @ts-expect-error
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      completedGateIds: "[]",
      currentGateId: "gate-1",
      status: "in_progress",
    });

    // @ts-expect-error
    mockDb.query.gates.findFirst.mockResolvedValue({
      id: "gate-1",
      label: "Gate 1",
      question: "Q1",
      sequenceOrder: 1,
    });

    if (!getProgramProgression.resolve) throw new Error("Resolver not defined");

    const result = await getProgramProgression.resolve(
      null,
      { programId: "prog-1" },
      mockContext,
    );

    expect(result.completedGates).toEqual([]);
    // @ts-expect-error
    expect(mockDb.query.gates.findMany).not.toHaveBeenCalled();
  });
});
