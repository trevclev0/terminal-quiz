import type { Program } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { programKeys } from "../queryKeys";

const GET_PROGRAMS_QUERY = `
  query GetPrograms($direction: OrderDirection!, $priority: Int!, $limit: Int) {
    programs {
      id
      name
      isSelected
      gates(
        orderBy: { sequenceOrder: { direction: $direction, priority: $priority } }
        limit: $limit
      ) {
        id
        question
      }
    }
  }
`;

const fetchPrograms = async (): Promise<Program[]> => {
  const rsp = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: GET_PROGRAMS_QUERY,
      variables: {
        direction: "asc",
        priority: 0,
        limit: 1,
      },
    }),
  });

  if (!rsp.ok) {
    throw new Error(`Failed to fetch programs: ${rsp.status}`);
  }

  const result = await rsp.json();

  if (result.errors) {
    throw new Error(`GraphQL Error: ${result.errors[0].message}`);
  }

  return result.data.programs;
};

export const useProgramsQuery = () => {
  return useQuery({
    queryKey: programKeys.all,
    queryFn: fetchPrograms,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};
