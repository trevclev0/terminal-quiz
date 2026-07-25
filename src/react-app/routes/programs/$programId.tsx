import { programProgressionQueryOptions } from "@api/queries/useProgramProgressionQuery";
import { programsQueryOptions } from "@api/queries/useProgramsQuery";
import RouteErrorFallback from "@components/RouteErrorFallback";
import { createFileRoute } from "@tanstack/react-router";
import ProgramPlay from "../../components/ProgramPlay";

function PendingComponent() {
  return <h2 className="loading-screen">Loading Program...</h2>;
}

interface ErrorComponentProps {
  error: Error;
  reset: () => void;
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <RouteErrorFallback
      error={error}
      reset={reset}
      message="Failed to load program."
    />
  );
}

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
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});
