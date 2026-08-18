export const PROGRAM_KEYS = {
  all: ["programs"] as const,
  // Static "detail" discriminator keeps the dynamic id segment distinct from
  // the fixed "inProgress"/"progression" markers, so a key can never collide
  // with or prefix-match another shape.
  single: (id: string) => ["programs", "detail", id] as const,
  inProgress: () => ["programs", "inProgress"] as const,
  progression: (programId: string) =>
    ["programs", "progression", programId] as const,
};

export const MANAGEMENT_KEYS = {
  myPrograms: ["myPrograms"] as const,
  programGates: (programId: string) => ["programGates", programId] as const,
};
