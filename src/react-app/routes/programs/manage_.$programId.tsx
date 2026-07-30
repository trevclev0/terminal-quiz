import { meQueryOptions } from "@api/queries/useMeQuery";
import { myProgramsQueryOptions } from "@api/queries/useMyProgramsQuery";
import { programGatesQueryOptions } from "@api/queries/useProgramGatesQuery";
import ManageProgramEditor from "@components/ManageProgramEditor";
import RouteErrorFallback from "@components/RouteErrorFallback";
import { createFileRoute, redirect } from "@tanstack/react-router";

function PendingComponent() {
  return <h2 className="loading-screen">Loading Editor...</h2>;
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
      message="Failed to load editor."
    />
  );
}

function EditorWrapper() {
  const { programId } = Route.useParams();
  return <ManageProgramEditor programId={programId} />;
}

export const Route = createFileRoute("/programs/manage_/$programId")({
  loader: async ({ context: { queryClient }, params }) => {
    const user = await queryClient.fetchQuery(meQueryOptions);
    if (!user) {
      throw redirect({
        to: "/login",
        search: { return_to: `/programs/manage/${params.programId}` },
      });
    }
    await queryClient.ensureQueryData(myProgramsQueryOptions);
    await queryClient.ensureQueryData(
      programGatesQueryOptions(params.programId),
    );
    return { programId: params.programId };
  },
  component: EditorWrapper,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});
