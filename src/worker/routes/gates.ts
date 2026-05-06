import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import type { DbContext } from "../middleware/db";
import { getGateById, processGateGuess } from "../services/gateService";

const guessPayloadSchema = z.object({
  guess: z.string().min(1, "A guess cannot be empty"),
});

const gatesRouter = new Hono<DbContext>()
  .get("/:id", async (c) => {
    const db = c.get("db");
    const gateId = c.req.param("id");

    try {
      const gate = await getGateById(db, gateId);

      if (!gate) {
        return c.json(
          {
            status: "error",
            message: "Gate not found",
            code: "NOT_FOUND",
          },
          404,
        );
      }
      return c.json(gate);
    } catch (error) {
      console.error("Failed to fetch gate:", error);
      return c.json(
        {
          status: "error",
          message: "Server Error",
          code: "INTERNAL_SERVER_ERROR",
        },
        500,
      );
    }
  })
  .post("/:id/guess", zValidator("json", guessPayloadSchema), async (c) => {
    const db = c.get("db");
    const gateId = c.req.param("id");
    const { guess } = c.req.valid("json");

    try {
      const result = await processGateGuess(db, gateId, guess);

      if (result.status === "error") {
        let statusCode: ContentfulStatusCode = 400;
        if (result.code === "NOT_FOUND") statusCode = 404;
        if (result.code === "ALREADY_SOLVED") statusCode = 409;
        return c.json(result, statusCode);
      }

      return c.json(result, 200);
    } catch (error) {
      console.error("Failed to process guess:", error);
      return c.json(
        {
          status: "error",
          message: "Server Error",
          code: "INTERNAL_SERVER_ERROR",
        },
        500,
      );
    }
  });

export default gatesRouter;
