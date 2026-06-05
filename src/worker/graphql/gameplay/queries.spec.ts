import { beforeEach, describe, expect, it, vi } from "vitest";
import { type AppGraphQLContext, getProgramProgression } from "./queries";

describe("Gameplay Queries: getProgramProgression", () => {
  let mockDb: unknown;
  let mockContext: AppGraphQLContext;

  beforeEach(() => {
    mockDb = {
      query: {
        gates: { findMany: vi.fn() },
        sessionProgress: { findFirst: vi.fn() },
      },
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
    mockDb.query.gates.findMany.mockResolvedValue([
      { id: "gate-1", sequenceOrder: 1 },
      { id: "gate-2", sequenceOrder: 2 },
    ]);

    // @ts-expect-error
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      completedGateIds: JSON.stringify(["gate-1"]),
      currentGateId: "gate-2",
      status: "in_progress",
    });

    if (!getProgramProgression.resolve) throw new Error("Resolver not defined");

    const result = await getProgramProgression.resolve(
      null,
      { programId: "prog-1" },
      mockContext,
    );

    expect(result.completedGates).toHaveLength(1);
    expect(result.completedGates[0].id).toBe("gate-1");
    expect(result.currentGate?.id).toBe("gate-2");
  });
});
