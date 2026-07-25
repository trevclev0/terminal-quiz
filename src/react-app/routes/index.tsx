import { inProgressProgramQueryOptions } from "@api/queries/useInProgressProgramQuery";
import RouteErrorFallback from "@components/RouteErrorFallback";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: async ({ context: { queryClient } }) => {
    const inProgressProgramId = await queryClient.fetchQuery(
      inProgressProgramQueryOptions,
    );

    if (inProgressProgramId) {
      throw redirect({
        to: "/programs/$programId",
        params: { programId: inProgressProgramId },
      });
    }

    throw redirect({
      to: "/programs/select",
    });
  },
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback
      error={error}
      reset={reset}
      message="Failed to load in-progress program."
    />
  ),
});
