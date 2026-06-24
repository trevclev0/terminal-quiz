import { programProgressionQueryOptions } from "@api/queries/useProgramProgressionQuery";
import { programsQueryOptions } from "@api/queries/useProgramsQuery";
import { createFileRoute } from "@tanstack/react-router";
import ProgramPlay from "../../components/ProgramPlay";

export const Route = createFileRoute("/programs/$programId")({
  loader: async ({ context: { queryClient }, params }) => {
    await Promise.all([
      queryClient.ensureQueryData(
        programProgressionQueryOptions(params.programId),
      ),
      queryClient.ensureQueryData(programsQueryOptions),
    ]);
    return { programId: params.programId };
  },
  component: ProgramPlay,
  pendingComponent: () => (
    <h2 className="loading-screen">Loading Program...</h2>
  ),
});
