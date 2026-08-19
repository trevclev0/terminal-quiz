import type { GetProgramProgressionQuery } from "../../../shared/generated/graphql";
import { GET_PROGRAM_PROGRESSION_QUERY } from "../../../shared/gqlQueries";
import { graphqlRequest } from "../graphQlClient";
import { PROGRAM_KEYS } from "../queryKeys";

export type ProgramProgression = NonNullable<
  GetProgramProgressionQuery["getProgramProgression"]
>;

export type ActiveGate = NonNullable<ProgramProgression["currentGate"]>;

export type CompletedGate = ProgramProgression["completedGates"][number];

const fetchProgramProgression = async (
  programId: string,
): Promise<ProgramProgression | null> => {
  const result = await graphqlRequest(GET_PROGRAM_PROGRESSION_QUERY, {
    programId,
  });
  return result.getProgramProgression;
};

export const programProgressionQueryOptions = (programId: string) => ({
  queryKey: PROGRAM_KEYS.progression(programId),
  queryFn: () => fetchProgramProgression(programId),
  staleTime: 1000 * 30, // 30 seconds
});
