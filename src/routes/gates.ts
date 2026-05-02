import { zValidator } from "@hono/zod-validator";
import { and, eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import * as schema from "../db/schema";
import type { Env } from "../entry";

const guessPayloadSchema = z.object({
  guess: z.string().min(1, "A guess cannot be empty"),
});

const gatesRouter = new Hono<Env>()
  .get("/:id", async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const gateId = c.req.param("id");

    try {
      const gate = await db.query.gates.findFirst({
        where: eq(schema.gates.id, gateId),
        columns: {
          id: true,
          label: true,
          question: true,
          isSolved: true,
          programId: true,
        },
      });

      if (!gate) {
        return c.json({ error: "Gate not found" }, 404);
      }

      return c.json(gate);
    } catch (error) {
      console.error("Failed to fetch gate:", error);
      return c.json({ error: "Failed to fetch gate" }, 500);
    }
  })
  .post("/:id/guess", zValidator("json", guessPayloadSchema), async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const gateId = c.req.param("id");

    const { guess } = c.req.valid("json");

    try {
      const gate = await db.query.gates.findFirst({
        where: eq(schema.gates.id, gateId),
      });

      if (!gate) return c.json({ error: "Gate not found" }, 404);
      if (gate.isSolved)
        return c.json({ error: "Gate is already solved" }, 400);

      const isCorrect =
        guess.trim().toLowerCase() === gate.correctAnswer.trim().toLowerCase();

      if (isCorrect) {
        await db
          .update(schema.gates)
          .set({ isSolved: true, solvedAt: new Date() })
          .where(eq(schema.gates.id, gateId));

        // Find the next sequential gate
        const nextGate = await db.query.gates.findFirst({
          where: and(
            eq(schema.gates.programId, gate.programId),
            eq(schema.gates.isSolved, false),
            gt(schema.gates.sequenceOrder, gate.sequenceOrder),
          ),
          orderBy: (gates, { asc }) => [asc(gates.sequenceOrder)],
        });

        return c.json({
          correct: true,
          successMessage: gate.successMessage,
          nextGateId: nextGate?.id || null, // null indicates the program is completely finished
        });
      } else {
        // Increment the attempt count
        const newAttemptCount = gate.attemptCount + 1;
        await db
          .update(schema.gates)
          .set({ attemptCount: newAttemptCount })
          .where(eq(schema.gates.id, gateId));

        let message = "";

        if (newAttemptCount >= gate.guidanceThreshold) {
          message =
            gate.guidancePrompt ||
            "Hint: The AI integration is pending, but keep trying!";
        }

        return c.json({
          correct: false,
          message,
        });
      }
    } catch (error) {
      console.error("Failed to process guess:", error);
      return c.json({ error: "Failed to process guess" }, 500);
    }
  });

export default gatesRouter;
