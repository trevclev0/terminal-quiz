import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ErrorRouteComponent } from "@tanstack/react-router";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RouteErrorFallback from "./RouteErrorFallback";

afterEach(() => {
  vi.restoreAllMocks();
});

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

function buildRouter(
  overrides: {
    defaultErrorComponent?: ErrorRouteComponent;
    errorComponent?: ErrorRouteComponent;
    loaderError?: Error;
    loaderSucceedsOnRetry?: boolean;
  } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });

  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/test",
    loader: () => {
      throw overrides.loaderError ?? new Error("Loader failure");
    },
    component: () => <p>Route content</p>,
    errorComponent: overrides.errorComponent,
  });

  const routeTree = rootRoute.addChildren([testRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/test"] }),
    defaultErrorComponent: overrides.defaultErrorComponent,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    context: { queryClient },
  });

  return { router, queryClient };
}

describe("RouteErrorFallback integration", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("defaultErrorComponent (router-wide fallback)", () => {
    it("renders defaultErrorComponent when route has no per-route errorComponent", async () => {
      const { router } = buildRouter({
        defaultErrorComponent: ({ error, reset }) => (
          <RouteErrorFallback error={error} reset={reset} />
        ),
      });

      renderWithQuery(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
      });
    });
  });

  describe("per-route errorComponent", () => {
    it("renders custom message from per-route errorComponent", async () => {
      const { router } = buildRouter({
        errorComponent: ({ error, reset }) => (
          <RouteErrorFallback
            error={error}
            reset={reset}
            message="Custom route error."
          />
        ),
      });

      renderWithQuery(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Custom route error.")).toBeInTheDocument();
      });
    });
  });

  describe("retry button", () => {
    it("triggers the router error boundary reset callback", async () => {
      const user = userEvent.setup();
      let resetTriggered = false;

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      const rootRoute = createRootRoute({
        component: () => <Outlet />,
      });

      const failingRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/fail",
        loader: () => {
          throw new Error("Boom");
        },
        errorComponent: ({ error, reset }) => (
          <RouteErrorFallback
            error={error}
            reset={() => {
              resetTriggered = true;
              reset();
            }}
          />
        ),
      });

      const testRouter = createRouter({
        routeTree: rootRoute.addChildren([failingRoute]),
        history: createMemoryHistory({ initialEntries: ["/fail"] }),
        defaultPendingMs: 0,
        defaultPendingMinMs: 0,
        context: { queryClient },
      });

      renderWithQuery(<RouterProvider router={testRouter} />);

      await waitFor(() => {
        expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Retry" }));

      expect(resetTriggered).toBe(true);
    });
  });

  describe("DEV-only error details", () => {
    it("renders error.message in details block in DEV environment", async () => {
      const { router } = buildRouter({
        defaultErrorComponent: ({ error, reset }) => (
          <RouteErrorFallback error={error} reset={reset} />
        ),
      });

      renderWithQuery(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Error details")).toBeInTheDocument();
      });

      expect(screen.getByText("Loader failure")).toBeInTheDocument();
    });
  });
});
