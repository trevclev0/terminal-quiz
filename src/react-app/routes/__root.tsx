import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
});

export function RootComponent() {
  return (
    <>
      <main>
        <Outlet />
      </main>
      {/* Automatically excludes itself from production bundles */}
      <TanStackRouterDevtools />
    </>
  );
}
