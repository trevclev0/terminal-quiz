import type { ProgramWithGates } from "@shared/types";
import { createContext } from "react";

export type ProgramDataContext = {
  programs: ProgramWithGates[];
  activeProgram: ProgramWithGates | undefined;
  selectProgram: (name: string) => void;
  updateProgram: (program: ProgramWithGates) => void;
};

export const ProgramDataContext = createContext<ProgramDataContext | null>(
  null,
);
