import type * as schema from "@shared/schema";
import { programs } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { GraphQLError } from "graphql";

export async function authorizeProgramMutation(
  db: DrizzleD1Database<typeof schema>,
  programId: string,
  userId: string,
): Promise<typeof programs.$inferSelect> {
  const program = await db.query.programs.findFirst({
    where: eq(programs.id, programId),
  });

  if (!program) {
    throw new GraphQLError("Program not found.", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  // NULL authorId means unowned (system) content — not editable by anyone.
  if (program.authorId !== userId) {
    throw new GraphQLError("Unauthorized: You do not own this program.", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  return program;
}
