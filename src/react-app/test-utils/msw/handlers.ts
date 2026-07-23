import { graphql, HttpResponse } from "msw";
import {
  mockPrograms,
  mockProgression,
  mockRequestClueResponse,
  mockSubmitGuessResponse,
} from "./fixtures";

export const getProgramsHandler = graphql.query("GetPrograms", () =>
  HttpResponse.json({ data: { programs: mockPrograms() } }),
);

export const getProgramProgressionHandler = graphql.query(
  "GetProgramProgression",
  () =>
    HttpResponse.json({
      data: { getProgramProgression: mockProgression() },
    }),
);

export const getInProgressProgramHandler = graphql.query(
  "GetInProgressProgram",
  () => HttpResponse.json({ data: { getInProgressProgram: null } }),
);

export const submitGuessHandler = graphql.mutation("SubmitGuess", () =>
  HttpResponse.json({ data: { submitGuess: mockSubmitGuessResponse() } }),
);

export const requestClueHandler = graphql.mutation("RequestClue", () =>
  HttpResponse.json({ data: { requestClue: mockRequestClueResponse() } }),
);

export const resetSessionHandler = graphql.mutation("ResetSession", () =>
  HttpResponse.json({ data: { resetSession: true } }),
);

export const handlers = [
  getProgramsHandler,
  getProgramProgressionHandler,
  getInProgressProgramHandler,
  submitGuessHandler,
  requestClueHandler,
  resetSessionHandler,
];
