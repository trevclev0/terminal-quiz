import { describe, expect, it, vi } from "vitest";
import type { ProgramWithGates } from "../db/types";
import programsRouter from "./programs";

const mockPrograms = [
  {
    id: "uuid-1",
    name: "Test Program 1",
    isSelected: true,
    selectedAt: null,
    completedAt: null,
    gates: [],
  },
  {
    id: "uuid-2",
    name: "Test Program 2",
    isSelected: false,
    selectedAt: null,
    completedAt: null,
    gates: [],
  },
];

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => ({
    query: {
      programs: {
        findMany: vi.fn().mockResolvedValue(mockPrograms),
      },
    },
  })),
}));

const mockEnv = { DB: {} };

describe("Programs Router (/api/programs)", () => {
  it("should return a 200 status and a list of programs", async () => {
    const res = await programsRouter.request("/", {}, mockEnv);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");

    const data = (await res.json()) as ProgramWithGates[];
    expect(data).toHaveLength(2);
    expect(data).toEqual(mockPrograms);
    expect(data[1].isSelected).toBe(false);
  });
});
