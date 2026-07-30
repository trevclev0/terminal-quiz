import {
  createTestRouter,
  handlers,
  mockGateManagement,
  mockMe,
  mockMyPrograms,
  renderWithRouter,
} from "@test-utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { graphql, HttpResponse } from "msw";
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

vi.mock("@components/LoginPage", () => ({
  default: () => <div>Login Page Mock</div>,
}));

const server = setupServer(
  graphql.query("Me", () => HttpResponse.json({ data: { me: mockMe() } })),
  graphql.query("MyPrograms", () =>
    HttpResponse.json({ data: { myPrograms: mockMyPrograms() } }),
  ),
  graphql.query("ProgramGates", () =>
    HttpResponse.json({
      data: {
        programGates: [mockGateManagement()],
      },
    }),
  ),
  ...handlers,
);

describe("Manage Routes Integration", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => {
    server.close();
    vi.restoreAllMocks();
  });

  it("renders program list on /programs/manage", async () => {
    const router = createTestRouter("/programs/manage");
    renderWithRouter(router);

    await waitFor(() =>
      expect(screen.getByText("My First Program")).toBeInTheDocument(),
    );

    expect(screen.getByText("Create Program")).toBeInTheDocument();
  });

  it("renders gate editor on /programs/manage/$programId", async () => {
    const router = createTestRouter("/programs/manage/program-1");
    renderWithRouter(router);

    await waitFor(() => {
      expect(screen.getByText(/Edit:/)).toBeInTheDocument();
    });

    expect(screen.getByText("Program Settings")).toBeInTheDocument();
    expect(screen.getByText(/Gates \(1\)/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByDisplayValue("Gate A")).toBeInTheDocument();
    });
  });

  it("navigates from list to editor and shows gates", async () => {
    const router = createTestRouter("/programs/manage");
    renderWithRouter(router);

    await waitFor(() =>
      expect(screen.getByText("My First Program")).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByText("My First Program"));

    await waitFor(() => {
      expect(screen.getByText(/Edit:/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Gate A")).toBeInTheDocument();
    });
  });

  it("shows empty state when program has no gates", async () => {
    server.use(
      graphql.query("ProgramGates", () =>
        HttpResponse.json({ data: { programGates: [] } }),
      ),
    );

    const router = createTestRouter("/programs/manage/program-1");
    renderWithRouter(router);

    expect(await screen.findByText(/No gates yet/)).toBeInTheDocument();
  });

  it("redirects to login when not authenticated", async () => {
    server.use(
      graphql.query("Me", () => HttpResponse.json({ data: { me: null } })),
    );

    const router = createTestRouter("/programs/manage");
    renderWithRouter(router);

    await waitFor(() => {
      expect(screen.getByText("Login Page Mock")).toBeInTheDocument();
    });

    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toEqual({
      return_to: "/programs/manage",
    });
  });

  it("redirects to login with correct return_to for editor route", async () => {
    server.use(
      graphql.query("Me", () => HttpResponse.json({ data: { me: null } })),
    );

    const router = createTestRouter("/programs/manage/program-1");
    renderWithRouter(router);

    await waitFor(() => {
      expect(screen.getByText("Login Page Mock")).toBeInTheDocument();
    });

    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toEqual({
      return_to: "/programs/manage/program-1",
    });
  });

  it("shows error state when myPrograms query fails", async () => {
    server.use(
      graphql.query("MyPrograms", () =>
        HttpResponse.json(
          { errors: [{ message: "Server error" }] },
          { status: 500 },
        ),
      ),
    );

    const router = createTestRouter("/programs/manage");
    renderWithRouter(router);

    await waitFor(() => {
      expect(screen.getByText("Failed to load programs.")).toBeInTheDocument();
    });
  });
});
