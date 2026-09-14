import { programsQueryOptions } from "@api/queries/useProgramsQuery";
import LoadingScreen from "@components/LoadingScreen";
import ProgramSelector from "@components/ProgramSelector";
import RouteErrorFallback from "@components/RouteErrorFallback";
import {
  createFileRoute,
  type ErrorComponentProps,
} from "@tanstack/react-router";

function PendingComponent() {
  return <LoadingScreen message="Loading Programs..." />;
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

type SelectSearch = {
  programId?: string;
};

export const validateSelectSearch = (
  search: Record<string, unknown>,
): SelectSearch => {
  return {
    programId:
      typeof search.programId === "string" ? search.programId : undefined,
  };
};

export const Route = createFileRoute("/programs/select")({
  validateSearch: validateSelectSearch,
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(programsQueryOptions);
    return {};
  },
  component: ProgramSelector,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});
