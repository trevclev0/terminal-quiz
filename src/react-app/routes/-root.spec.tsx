import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
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
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

vi.mock("@tanstack/react-router-devtools", () => ({
  TanStackRouterDevtools: () => <div data-testid="router-devtools" />,
}));

vi.mock("../hooks/useProgramsWithGates", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../hooks/useProgramsWithGates")>();

  return {
    ...actual,
    usePrograms: () => ({ data: [], isLoading: false, isError: false }),
  };
});

describe("Root Route", () => {
  it("should render the main outlet container", async () => {
    const router = createTestRouter("/");
    renderWithRouter(router);

    const mainElement = await screen.findByRole("main");
    expect(mainElement).toBeInTheDocument();
  });

  it("should render TanStackRouterDevtools", async () => {
    const router = createTestRouter("/");
    renderWithRouter(router);

    const devtools = await screen.findByTestId("router-devtools");
    expect(devtools).toBeInTheDocument();
  });

  it("should render layout structure correctly", async () => {
    const router = createTestRouter("/");
    renderWithRouter(router);

    // findAllByRole ensures we only have exactly 1 main tag
    const mainElements = await screen.findAllByRole("main");
    expect(mainElements.length).toBe(1);

    const devtools = await screen.findByTestId("router-devtools");
    expect(devtools).toBeInTheDocument();
  });
});
