import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorizeProgramMutation } from "./authorizeProgram";

type MockDb = {
  query: {
    programs: { findFirst: ReturnType<typeof vi.fn> };
  };
};

function createMockDb(): MockDb {
  return {
    query: {
      programs: { findFirst: vi.fn() },
    },
  };
}

const USER_ID = "user-1";

describe("authorizeProgramMutation", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  it("returns program when authorId matches userId", async () => {
    const program = {
      id: "prog-1",
      name: "My Program",
      authorId: USER_ID,
      visibility: "public",
      createdAt: new Date(),
    };
    mockDb.query.programs.findFirst.mockResolvedValue(program);

    const result = await authorizeProgramMutation(
      mockDb as unknown as Parameters<typeof authorizeProgramMutation>[0],
      "prog-1",
      USER_ID,
    );

    expect(result).toEqual(program);
  });

  it("throws when program is not found", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(null);

    await expect(
      authorizeProgramMutation(
        mockDb as unknown as Parameters<typeof authorizeProgramMutation>[0],
        "prog-1",
        USER_ID,
      ),
    ).rejects.toThrow("Program not found.");
  });

  it("throws when authorId does not match userId", async () => {
    const program = {
      id: "prog-1",
      name: "Someone Else's Program",
      authorId: "user-2",
      visibility: "public",
      createdAt: new Date(),
    };
    mockDb.query.programs.findFirst.mockResolvedValue(program);

    await expect(
      authorizeProgramMutation(
        mockDb as unknown as Parameters<typeof authorizeProgramMutation>[0],
        "prog-1",
        USER_ID,
      ),
    ).rejects.toThrow("Unauthorized: You do not own this program.");
  });

  it("throws when authorId is null (unowned program)", async () => {
    const program = {
      id: "prog-1",
      name: "System Program",
      authorId: null,
      visibility: "public",
      createdAt: new Date(),
    };
    mockDb.query.programs.findFirst.mockResolvedValue(program);

    await expect(
      authorizeProgramMutation(
        mockDb as unknown as Parameters<typeof authorizeProgramMutation>[0],
        "prog-1",
        USER_ID,
      ),
    ).rejects.toThrow("Unauthorized: You do not own this program.");
  });
});
