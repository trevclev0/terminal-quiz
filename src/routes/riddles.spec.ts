import { describe, expect, it } from "vitest";
import riddlesRouter from "./riddles";

describe("Riddles Router (/api/riddles)", () => {
  it("should return a 501 Not Implemented error", async () => {
    const res = await riddlesRouter.request("/");

    expect(res.status).toBe(501);

    const data = await res.json();
    expect(data).toEqual({ error: "Not implemented" });
  });
});
