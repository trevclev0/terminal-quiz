import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import programs from "../../.generated/programs.json" with { type: "json" };

const app = new Hono().basePath("/api");

app.get("/programs", (c) => {
  return c.json(programs);
});

// Future endpoint placeholder for the AI hints
app.post("/hints", async (c) => {
  // const body = await c.req.json()
  // Proxy request to AI model goes here
  return c.json({ hint: "Think outside the box!" });
});

// Export the Hono app wrapped in Cloudflare Pages' handler
export const onRequest = handle(app);
