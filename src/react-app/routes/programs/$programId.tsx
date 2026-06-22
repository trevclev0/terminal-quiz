import { programProgressionQueryOptions } from "@api/queries/useProgramProgressionQuery";
import { createFileRoute } from "@tanstack/react-router";
import ProgramPlay from "../../components/ProgramPlay";

export const Route = createFileRoute("/programs/$programId")({
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData(
      programProgressionQueryOptions(params.programId),
    );
    return { programId: params.programId };
  },
  component: ProgramPlay,
  pendingComponent: () => (
    <h2 className="loading-screen">Loading Program...</h2>
  ),
});
