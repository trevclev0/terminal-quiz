import { graphql, HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  createTestRouter,
  renderWithRouter,
} from "../test-utils/reactRouterUtils";

const server = setupServer(
  http.get("/api/programs", () => {
    return HttpResponse.json([{ id: 1, name: "Test Program" }]);
  }),
  graphql.query("GetInProgressProgram", () => {
    return HttpResponse.json({
      data: { getInProgressProgram: null },
    });
  }),
  graphql.query("GetPrograms", () => {
    return HttpResponse.json({
      data: { programs: [{ id: "test-program-id", name: "Test Program" }] },
    });
  }),
  graphql.query("GetProgramProgression", () => {
    return HttpResponse.json({
      data: {
        getProgramProgression: {
          currentGate: null,
          completedGates: [],
          status: "completed",
        },
      },
    });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

vi.mock("@tanstack/react-router-devtools", () => ({
  TanStackRouterDevtools: () => <div data-testid="router-devtools" />,
}));

vi.mock("@hooks/useProgramsWithGates", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@hooks/useProgramsWithGates")>();

  return {
    ...actual,
    default: () => ({
      programs: [],
      activeProgram: null,
      error: null,
      isLoading: false,
      selectProgram: vi.fn(),
      updateProgram: vi.fn(),
      resetProgram: vi.fn(),
      clearActiveProgram: vi.fn(),
    }),
  };
});

describe("Root Route", () => {
  it("should redirect to /programs/select when no in-progress program", async () => {
    const router = createTestRouter("/");
    renderWithRouter(router);

    // Wait for redirect to complete
    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe("/programs/select");
    });
  });

  it("should redirect to /programs/:programId when in-progress program exists", async () => {
    server.use(
      graphql.query("GetInProgressProgram", () => {
        return HttpResponse.json({
          data: { getInProgressProgram: "test-program-id" },
        });
      }),
    );

    const router = createTestRouter("/");
    renderWithRouter(router);

    // Wait for redirect to complete
    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe("/programs/test-program-id");
    });
  });
});
