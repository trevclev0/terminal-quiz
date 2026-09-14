import { myProgramsQueryOptions } from "@api/queries/useMyProgramsQuery";
import { programGatesQueryOptions } from "@api/queries/useProgramGatesQuery";
import LoadingScreen from "@components/LoadingScreen";
import ManageProgramEditor from "@components/ManageProgramEditor";
import RouteErrorFallback from "@components/RouteErrorFallback";
import {
  createFileRoute,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { requireUser } from "./-requireUser";

function PendingComponent() {
  return <LoadingScreen message="Loading Editor..." />;
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
    await requireUser(queryClient, `/programs/manage/${params.programId}`);
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
