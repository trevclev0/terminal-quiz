import { meQueryOptions } from "@api/queries/useMeQuery";
import { myProgramsQueryOptions } from "@api/queries/useMyProgramsQuery";
import ManageProgramsList from "@components/ManageProgramsList";
import RouteErrorFallback from "@components/RouteErrorFallback";
import { createFileRoute, redirect } from "@tanstack/react-router";

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
    const user = await queryClient.fetchQuery(meQueryOptions);
    if (!user) {
      throw redirect({
        to: "/login",
        search: { return_to: "/programs/manage" },
      });
    }
    await queryClient.ensureQueryData(myProgramsQueryOptions);
    return {};
  },
  component: ManageProgramsList,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});
