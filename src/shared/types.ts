import type { gates, programs } from "@shared/schema";

export type Program = typeof programs.$inferSelect;
export type Gate = typeof gates.$inferSelect;

export type ProgramWithGates = Program & { gates: Gate[] };
