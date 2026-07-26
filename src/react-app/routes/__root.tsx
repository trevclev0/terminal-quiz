import CrtOverlay from "@components/CrtOverlay";
import NavBar from "@components/NavBar";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
});

export function RootComponent() {
  return (
    <>
      <CrtOverlay />
      <NavBar />
      <main>
        <Outlet />
      </main>
      {/* Automatically excludes itself from production bundles */}
      {/* TODO: Re-enable devtools in development once TanStack Router Devtools is updated */}
      {/* <TanStackRouterDevtools /> */}
    </>
  );
}
