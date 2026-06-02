import * as schema from "@shared/schema";
import { sessionProgress } from "@shared/schema";
import { and, eq, gt, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

type GuessErrorCodes = "NOT_FOUND" | "ALREADY_SOLVED" | "INTERNAL_SERVER_ERROR";

export type GuessResponse =
  | { status: "correct"; message: string; nextGateId: string | null }
  | { status: "incorrect"; message: string; clue: string | null }
  | { status: "error"; message: string; code: GuessErrorCodes };

export async function getGateById(
  db: DrizzleD1Database<typeof schema>,
  gateId: string,
) {
  return db.query.gates.findFirst({
    where: eq(schema.gates.id, gateId),
    columns: {
      id: true,
      label: true,
      question: true,
      isSolved: true,
      programId: true,
    },
  });
}

export async function processGateGuess(
  db: DrizzleD1Database<typeof schema>,
  gateId: string,
  guess: string,
): Promise<GuessResponse> {
  const gate = await db.query.gates.findFirst({
    where: eq(schema.gates.id, gateId),
  });

  if (!gate) {
    return { status: "error", message: "Gate not found", code: "NOT_FOUND" };
  }

  if (gate.isSolved) {
    return {
      status: "error",
      message: "Gate is already solved",
      code: "ALREADY_SOLVED",
    };
  }

  const isCorrect =
    guess.trim().toLowerCase() === gate.correctAnswer.trim().toLowerCase();

  if (isCorrect) {
    const result = await db
      .update(schema.gates)
      .set({ isSolved: true, solvedAt: new Date() })
      .where(and(eq(schema.gates.id, gateId), eq(schema.gates.isSolved, false)))
      .returning({ id: schema.gates.id });

    if (result.length === 0) {
      return {
        status: "error",
        code: "ALREADY_SOLVED",
        message: "Gate is already solved",
      };
    }

    await db
      .update(schema.gameState)
      .set({ lastUpdated: new Date() })
      .where(eq(schema.gameState.id, 1));

    const nextGate = await db.query.gates.findFirst({
      where: and(
        eq(schema.gates.programId, gate.programId),
        eq(schema.gates.isSolved, false),
        gt(schema.gates.sequenceOrder, gate.sequenceOrder),
      ),
      orderBy: (gates, { asc }) => [asc(gates.sequenceOrder)],
    });

    return {
      status: "correct",
      message: gate.successMessage,
      nextGateId: nextGate?.id ?? null,
    };
  } else {
    const updateResult = await db
      .update(schema.gates)
      .set({ attemptCount: sql`${schema.gates.attemptCount} + 1` })
      .where(eq(schema.gates.id, gateId))
      .returning({ attemptCount: schema.gates.attemptCount });
    const newAttemptCount =
      updateResult[0]?.attemptCount ?? gate.attemptCount + 1;

    let clue = "";
    if (gate.guidanceEnabled && newAttemptCount >= gate.guidanceThreshold) {
      clue =
        gate.guidancePrompt ||
        "Hint: The AI integration is pending, but keep trying!";
    }

    return { status: "incorrect", message: "Access Denied", clue };
  }
}

export async function hasUserCompletedGate(
  db: DrizzleD1Database<typeof schema>,
  sessionId: string,
  programId: string,
  gateId: string,
): Promise<boolean> {
  const progress = await db.query.sessionProgress.findFirst({
    where: and(
      eq(sessionProgress.sessionId, sessionId),
      eq(sessionProgress.programId, programId),
    ),
  });

  if (!progress) return false;

  const completedIds: string[] = JSON.parse(progress.completedGateIds || "[]");
  return completedIds.includes(gateId);
}
