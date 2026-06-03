import type { Gate } from "@shared/types";
import type { GraphQLResolveInfo } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppGraphQLContext } from "./queries";
import { CompletedGateType } from "./types";

describe("CompletedGateType Resolvers", () => {
  let mockDb: unknown;
  let mockContext: AppGraphQLContext;
  let parentGate: Gate;

  beforeEach(() => {
    mockDb = {
      query: {
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

    parentGate = {
      id: "gate-1",
      programId: "prog-1",
      correctAnswer: "SecretAnswer",
      // These fields are required by the Gate type
      label: "Test Label",
      question: "Test Question",
      sequenceOrder: 1,
      successMessage: "Success!",
      isSolved: false,
      solvedAt: null,
      attemptCount: 0,
      acceptanceThreshold: 1,
    } as Gate;
  });

  describe("correctAnswer", () => {
    const resolveFn = CompletedGateType.getFields().correctAnswer.resolve;

    it("throws Unauthorized if sessionId is missing", async () => {
      // @ts-expect-error
      mockContext.get.mockImplementation((key: string) =>
        key === "db" ? mockDb : undefined,
      );

      if (!resolveFn) throw new Error("Resolver not defined");

      await expect(
        resolveFn(
          parentGate,
          {},
          mockContext,
          {} as unknown as GraphQLResolveInfo,
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    it("throws Forbidden if no session progress exists for the program", async () => {
      // @ts-expect-error
      mockDb.query.sessionProgress.findFirst.mockResolvedValue(undefined);

      if (!resolveFn) throw new Error("Resolver not defined");

      await expect(
        resolveFn(
          parentGate,
          {},
          mockContext,
          {} as unknown as GraphQLResolveInfo,
        ),
      ).rejects.toThrow(/Forbidden: No progress found/);
    });

    it("throws Forbidden if the specific gate ID is not in completedGateIds", async () => {
      // @ts-expect-error
      mockDb.query.sessionProgress.findFirst.mockResolvedValue({
        completedGateIds: JSON.stringify(["gate-2"]),
      });

      if (!resolveFn) throw new Error("Resolver not defined");

      await expect(
        resolveFn(
          parentGate,
          {},
          mockContext,
          {} as unknown as GraphQLResolveInfo,
        ),
      ).rejects.toThrow(/Forbidden: You have not completed this gate yet/);
    });

    it("returns the correct answer if the user has completed the gate", async () => {
      // @ts-expect-error
      mockDb.query.sessionProgress.findFirst.mockResolvedValue({
        completedGateIds: JSON.stringify(["gate-1", "gate-2"]),
      });

      if (!resolveFn) throw new Error("Resolver not defined");

      const result = await resolveFn(
        parentGate,
        {},
        mockContext,
        {} as unknown as GraphQLResolveInfo,
      );
      expect(result).toBe("SecretAnswer");
    });
  });
});
