import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod/mini";
import type { DbContext } from "../middleware/db";
import { getGateById, processGateGuess } from "../services/gateService";

const guessPayloadSchema = z.object({
  guess: z.string().check(z.minLength(1, "A guess cannot be empty")),
});

const gatesRouter = new Hono<DbContext>()
  .get("/:id", async (c) => {
    const db = c.get("db");
    const gateId = c.req.param("id");

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
  })
  .post("/:id/guess", zValidator("json", guessPayloadSchema), async (c) => {
    const db = c.get("db");
    const gateId = c.req.param("id");
    const { guess } = c.req.valid("json");

    const result = await processGateGuess(db, gateId, guess);

    if (result.status === "error") {
      let statusCode: ContentfulStatusCode = 400;
      if (result.code === "NOT_FOUND") statusCode = 404;
      if (result.code === "ALREADY_SOLVED") statusCode = 409;
      if (result.code === "INTERNAL_SERVER_ERROR") statusCode = 500;
      return c.json(result, statusCode);
    }

    return c.json(result, 200);
  });

export default gatesRouter;
