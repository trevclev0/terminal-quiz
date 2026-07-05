export const PROGRAM_KEYS = {
  all: ["programs"] as const,
  inProgress: () => ["programs", "inProgress"] as const,
  progression: (programId: string) =>
    ["programs", "progression", programId] as const,
};
