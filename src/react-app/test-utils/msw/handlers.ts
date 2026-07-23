import { graphql, HttpResponse } from "msw";
import {
  mockPrograms,
  mockProgression,
  mockRequestClueResponse,
  mockSubmitGuessResponse,
} from "./fixtures";

const ok = <T>(data: T) => HttpResponse.json({ data });

export const getProgramsHandler = graphql.query("GetPrograms", () =>
  ok({ programs: mockPrograms() }),
);

export const getProgramProgressionHandler = graphql.query(
  "GetProgramProgression",
  () => ok({ getProgramProgression: mockProgression() }),
);

export const getInProgressProgramHandler = graphql.query(
  "GetInProgressProgram",
  () => ok({ getInProgressProgram: null }),
);

export const submitGuessHandler = graphql.mutation("SubmitGuess", () =>
  ok({ submitGuess: mockSubmitGuessResponse() }),
);

export const requestClueHandler = graphql.mutation("RequestClue", () =>
  ok({ requestClue: mockRequestClueResponse() }),
);

export const resetSessionHandler = graphql.mutation("ResetSession", () =>
  ok({ resetSession: true }),
);

export const handlers = [
  getProgramsHandler,
  getProgramProgressionHandler,
  getInProgressProgramHandler,
  submitGuessHandler,
  requestClueHandler,
  resetSessionHandler,
];
