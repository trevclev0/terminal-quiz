import type * as schema from "@shared/schema";
import { programs } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

export async function authorizeProgramMutation(
  db: DrizzleD1Database<typeof schema>,
  programId: string,
  userId: string,
): Promise<typeof programs.$inferSelect> {
  const program = await db.query.programs.findFirst({
    where: eq(programs.id, programId),
  });

  if (!program) {
    throw new Error("Program not found.");
  }

  // NULL authorId means unowned (system) content — not editable by anyone.
  if (program.authorId !== userId) {
    throw new Error("Unauthorized: You do not own this program.");
  }

  return program;
}
