import type { selectGateSchema, selectProgramSchema } from "@shared/schema";
import type { z } from "zod";

export type Gate = z.infer<typeof selectGateSchema>;
export type Program = z.infer<typeof selectProgramSchema>;

export type ProgramWithGates = Program & { gates: Gate[] };
