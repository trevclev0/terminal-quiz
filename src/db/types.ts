import type { InferSelectModel } from "drizzle-orm";
import type { gates, programs } from "../db/schema";

type Gate = InferSelectModel<typeof gates>;
type ProgramWithGates = InferSelectModel<typeof programs> & { gates: Gate[] };

export type { Gate, ProgramWithGates };
