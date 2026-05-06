import type { z } from "zod";
import type { selectGateSchema, selectProgramSchema } from "./schema";

export type Gate = z.infer<typeof selectGateSchema>;
export type Program = z.infer<typeof selectProgramSchema>;

export type ProgramWithGates = Program & { gates: Gate[] };
