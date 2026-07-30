import { programProgressionQueryOptions } from "@api/queries/useProgramProgressionQuery";
import { programQueryOptions } from "@api/queries/useProgramQuery";
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
    const [program] = await Promise.all([
      queryClient.ensureQueryData(programQueryOptions(params.programId)),
      queryClient.ensureQueryData(
        programProgressionQueryOptions(params.programId),
      ),
    ]);

    if (!program) {
      throw new Error("Program not found.");
    }

    return { programId: params.programId };
  },
  component: ProgramPlay,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});
