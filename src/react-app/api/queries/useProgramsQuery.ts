import { api } from "@api/client";
import type { ProgramWithGates } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { programKeys } from "../queryKeys";

const fetchProgramsWithGates = async (): Promise<ProgramWithGates[]> => {
  const rsp = await api.programs.$get();

  if (!rsp.ok) {
    throw new Error(`Failed to fetch programs: ${rsp.status}`);
  }

  const data = await rsp.json();

  return data.map((p) => ({
    ...p,
    selectedAt: p.selectedAt ? new Date(p.selectedAt) : null,
    completedAt: p.completedAt ? new Date(p.completedAt) : null,
    createdAt: new Date(p.createdAt),
    gates: (p.gates ?? []).map((g) => ({
      ...g,
      solvedAt: g.solvedAt ? new Date(g.solvedAt) : null,
      createdAt: new Date(g.createdAt),
    })),
  }));
};

export const useProgramsWithGatesQuery = () => {
  return useQuery({
    queryKey: programKeys.allWithGates,
    queryFn: fetchProgramsWithGates,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};
