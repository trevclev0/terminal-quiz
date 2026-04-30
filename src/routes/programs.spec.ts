import { describe, expect, it, vi } from "vitest";
import type { Program } from "../App.types";
import programsRouter from "./programs";

// Mock the generated JSON file
vi.mock("../../.generated/programs.json", () => ({
  default: [
    { name: "Test Program 1", active: true },
    { name: "Test Program 2", active: false },
  ],
}));

describe("Programs Router (/api/programs)", () => {
  it("should return a 200 status and a list of programs", async () => {
    const res = await programsRouter.request("/");

    expect(res.status).toBe(200);

    const data: Program[] = await res.json();
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("Test Program 1");
    expect(data[0].active).toBe(true);
    expect(data[1].name).toBe("Test Program 2");
    expect(data[1].active).toBe(false);
  });
});
