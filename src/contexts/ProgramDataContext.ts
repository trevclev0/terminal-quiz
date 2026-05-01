import { createContext } from "react";
import type { ProgramWithGates } from "../db/types";

export type ProgramDataContext = {
  programs: ProgramWithGates[];
  activeProgram: ProgramWithGates | undefined;
  selectProgram: (name: string) => void;
  updateActiveProgram: (program: ProgramWithGates) => void;
};

export const ProgramDataContext = createContext<ProgramDataContext | null>(
  null,
);
