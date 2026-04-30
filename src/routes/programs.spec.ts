import { describe, expect, it, vi } from "vitest";
import type { Program } from "../App.types";
import programsRouter from "./programs";

// Mock the generated JSON file
vi.mock("../../.generated/programs.json", () => ({
  default: [
    { name: "Test Program 1", active: true, riddles: [] },
    { name: "Test Program 2", active: false, riddles: [] },
  ],
}));

describe("Programs Router (/api/programs)", () => {
  it("should return a 200 status and a list of programs", async () => {
    const res = await programsRouter.request("/");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const data: Program[] = await res.json();
    expect(data).toHaveLength(2);
    expect(data).toEqual([
      { name: "Test Program 1", active: true, riddles: [] },
      { name: "Test Program 2", active: false, riddles: [] },
    ]);
    expect(data[1].active).toBe(false);
  });
});
