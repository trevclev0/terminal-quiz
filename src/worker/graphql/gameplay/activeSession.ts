import { gates, sessionProgress } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import type { AppGraphQLContext } from "./types";

export async function loadActiveSession(
  db: AppGraphQLContext["var"]["db"],
  sessionId: string,
  programId: string,
  gateId: string,
  desyncMessage: string,
): Promise<{
  progress: typeof sessionProgress.$inferSelect;
  activeGate: typeof gates.$inferSelect;
}> {
  const progress = await db.query.sessionProgress.findFirst({
    where: and(
      eq(sessionProgress.sessionId, sessionId),
      eq(sessionProgress.programId, programId),
    ),
  });

  if (!progress || progress.status === "completed") {
    throw new Error("Invalid state: Program already completed or not started.");
  }

  if (progress.currentGateId !== gateId) {
    throw new Error(desyncMessage);
  }

  const activeGate = await db.query.gates.findFirst({
    where: eq(gates.id, gateId),
  });

  if (!activeGate) {
    throw new Error(`Gate with ID ${gateId} not found.`);
  }

  return { progress, activeGate };
}
