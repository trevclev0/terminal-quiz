import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { indexedDBMessagePackPersister, queryClient } from "@api/queryClient";
import ErrorBoundary from "@components/ErrorBoundary";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createRouter, RouterProvider } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingMinMs: 500,
  defaultPendingComponent: () => <h2 className="loading-screen">Loading...</h2>,
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
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: indexedDBMessagePackPersister }}
      >
        <RouterProvider router={router} />
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
