import {
  GET_IN_PROGRESS_PROGRAM_QUERY,
  GET_PROGRAM_PROGRESSION_QUERY,
  GET_PROGRAMS_QUERY,
  PROGRAM_QUERY,
  REQUEST_CLUE_MUTATION,
  RESET_SESSION_MUTATION,
  SUBMIT_GUESS_MUTATION,
} from "@shared/gqlQueries";
import { HttpResponse, http } from "msw";
import {
  mockProgram,
  mockPrograms,
  mockProgression,
  mockRequestClueResponse,
  mockSubmitGuessResponse,
} from "./fixtures";
import { gqlApi } from "./graphqlApi";

export const getProgramHandler = gqlApi.query(PROGRAM_QUERY, () =>
  HttpResponse.json({ data: { program: mockProgram() } }),
);

export const getProgramsHandler = gqlApi.query(GET_PROGRAMS_QUERY, () =>
  HttpResponse.json({ data: { programs: mockPrograms() } }),
);

export const getProgramProgressionHandler = gqlApi.query(
  GET_PROGRAM_PROGRESSION_QUERY,
  () =>
    HttpResponse.json({
      data: { getProgramProgression: mockProgression() },
    }),
);

export const getInProgressProgramHandler = gqlApi.query(
  GET_IN_PROGRESS_PROGRAM_QUERY,
  () => HttpResponse.json({ data: { getInProgressProgram: null } }),
);

export const submitGuessHandler = gqlApi.mutation(SUBMIT_GUESS_MUTATION, () =>
  HttpResponse.json({ data: { submitGuess: mockSubmitGuessResponse() } }),
);

export const requestClueHandler = gqlApi.mutation(REQUEST_CLUE_MUTATION, () =>
  HttpResponse.json({ data: { requestClue: mockRequestClueResponse() } }),
);

export const resetSessionHandler = gqlApi.mutation(RESET_SESSION_MUTATION, () =>
  HttpResponse.json({ data: { resetSession: true } }),
);

const getSessionHandler = http.get("/api/auth/get-session", () =>
  HttpResponse.json(null),
);

export const handlers = [
  getProgramHandler,
  getProgramsHandler,
  getProgramProgressionHandler,
  getInProgressProgramHandler,
  submitGuessHandler,
  requestClueHandler,
  resetSessionHandler,
  getSessionHandler,
];
