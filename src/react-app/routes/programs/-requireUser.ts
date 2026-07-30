import { meQueryOptions } from "@api/queries/useMeQuery";
import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";

export async function requireUser(queryClient: QueryClient, returnTo: string) {
  const user = await queryClient.fetchQuery(meQueryOptions);
  if (!user) {
    throw redirect({
      to: "/login",
      search: { return_to: returnTo },
    });
  }
  return user;
}
