import { programsQueryOptions } from "@api/queries/useProgramsQuery";
import ProgramSelector from "@components/ProgramSelector";
import { createFileRoute } from "@tanstack/react-router";

type SelectSearch = {
  programId?: string;
};

export const Route = createFileRoute("/select")({
  validateSearch: (search: Record<string, unknown>): SelectSearch => {
    return {
      programId: search.programId as string | undefined,
    };
  },
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(programsQueryOptions);
    return {};
  },
  component: ProgramSelector,
  pendingComponent: () => (
    <h2 className="loading-screen">Loading Programs...</h2>
  ),
});
