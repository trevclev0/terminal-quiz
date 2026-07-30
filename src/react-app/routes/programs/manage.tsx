import { myProgramsQueryOptions } from "@api/queries/useMyProgramsQuery";
import ManageProgramsList from "@components/ManageProgramsList";
import RouteErrorFallback from "@components/RouteErrorFallback";
import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "./-requireUser";

function PendingComponent() {
  return <h2 className="loading-screen">Loading Programs...</h2>;
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
      message="Failed to load programs."
    />
  );
}

export const Route = createFileRoute("/programs/manage")({
  loader: async ({ context: { queryClient } }) => {
    await requireUser(queryClient, "/programs/manage");
    await queryClient.ensureQueryData(myProgramsQueryOptions);
    return {};
  },
  component: ManageProgramsList,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});
