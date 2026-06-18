import { programsQueryOptions } from "@api/queries/useProgramsQuery";
import ProgramSelector from "@components/ProgramSelector";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/select")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(programsQueryOptions);

    return {};
  },
  component: ProgramSelector,
  pendingComponent: () => (
    <h2 className="loading-screen">Loading Programs...</h2>
  ),
});
