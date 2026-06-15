import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { routeTree } from "../routeTree.gen";

export function createTestRouter(initialUrl: string = "/") {
  const history = createMemoryHistory({
    initialEntries: [initialUrl],
  });

  const router = createRouter({
    routeTree,
    history,
    defaultPendingMinMs: 0, // Disable pending delays for faster tests
    context: {
      // Provide any required router context (e.g., auth, queryClient)
      queryClient: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    },
  });

  return router;
}

export function renderWithRouter(router: ReturnType<typeof createTestRouter>) {
  // Extract the exact queryClient instance that was injected into the router context
  const queryClient = router.options.context.queryClient as QueryClient;

  // Wrap the RouterProvider with the QueryClientProvider
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
