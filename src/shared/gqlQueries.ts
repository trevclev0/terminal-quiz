/**
 * Single source of truth for GraphQL query/mutation documents.
 *
 * The hand-written operation strings live in `./graphqlOperations.ts` and
 * feed graphql-codegen (typed-document-node), which validates them against
 * `graphql/schema.graphql` and emits fully typed `*Document` constants
 * (TypedDocumentNode) in `./generated/graphql.ts`.
 *
 * The generated constants are re-exported here as the runtime API consumed
 * by hooks/api files and integration tests. Edit an operation string in
 * `./graphqlOperations.ts`, then run `bun run gql:generate` and commit the
 * regenerated output so the exported documents stay in sync.
 */

import {
  CreateGateDocument,
  CreateProgramDocument,
  DeleteGateDocument,
  DeleteProgramDocument,
  GetInProgressProgramDocument,
  GetProgramProgressionDocument,
  GetProgramsDocument,
  MeDocument,
  MyProgramsDocument,
  ProgramDocument,
  ProgramGatesDocument,
  ReorderGatesDocument,
  RequestClueDocument,
  ResetSessionDocument,
  SubmitGuessDocument,
  UpdateGateDocument,
  UpdateProgramDocument,
} from "./generated/graphql";

export const SUBMIT_GUESS_MUTATION = SubmitGuessDocument;
export const REQUEST_CLUE_MUTATION = RequestClueDocument;
export const RESET_SESSION_MUTATION = ResetSessionDocument;
export const GET_PROGRAMS_QUERY = GetProgramsDocument;
export const GET_PROGRAM_PROGRESSION_QUERY = GetProgramProgressionDocument;
export const GET_IN_PROGRESS_PROGRAM_QUERY = GetInProgressProgramDocument;
export const PROGRAM_QUERY = ProgramDocument;
export const PROGRAM_GATES_QUERY = ProgramGatesDocument;
export const MY_PROGRAMS_QUERY = MyProgramsDocument;
export const ME_QUERY = MeDocument;
export const CREATE_PROGRAM_MUTATION = CreateProgramDocument;
export const UPDATE_PROGRAM_MUTATION = UpdateProgramDocument;
export const DELETE_PROGRAM_MUTATION = DeleteProgramDocument;
export const CREATE_GATE_MUTATION = CreateGateDocument;
export const UPDATE_GATE_MUTATION = UpdateGateDocument;
export const DELETE_GATE_MUTATION = DeleteGateDocument;
export const REORDER_GATES_MUTATION = ReorderGatesDocument;
