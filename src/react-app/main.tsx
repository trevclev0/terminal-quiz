import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { queryClient } from "@api/queryClient";
import ErrorBoundary from "@components/ErrorBoundary";
import RouteErrorFallback from "@components/RouteErrorFallback";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingMinMs: 500,
  defaultPendingComponent: () => <h2 className="loading-screen">Loading...</h2>,
  defaultErrorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} />
  ),
  context: {
    queryClient,
  },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app-root") as HTMLElement;

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
