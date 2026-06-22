import { inProgressProgramQueryOptions } from "@api/queries/useInProgressProgramQuery";
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
});
