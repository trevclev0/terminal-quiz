/**
 * Single source of truth for GraphQL query/mutation operations.
 *
 * The hand-written GraphQL operation strings below are the input for
 * graphql-codegen (typed-document-node), which validates them against
 * `graphql/schema.graphql` and emits fully typed `*Document` constants
 * (TypedDocumentNode) in `./generated/graphql.ts`.
 *
 * Those generated constants are re-exported here as the runtime API consumed
 * by hooks/api files and integration tests. Edit an operation string below,
 * then run `bun run gql:generate` and commit the regenerated output so the
 * exported documents stay in sync.
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

export const SUBMIT_GUESS_MUTATION_OPERATION =
  /* GraphQL */
  `
  mutation SubmitGuess($programId: String!, $gateId: String!, $guess: String!) {
    submitGuess(programId: $programId, gateId: $gateId, guess: $guess) {
      success
      message
      canRequestClue
      nextGate {
        id
        label
        question
      }
    }
  }
`;

export const REQUEST_CLUE_MUTATION_OPERATION =
  /* GraphQL */
  `
  mutation RequestClue($programId: String!, $gateId: String!, $currentGuess: String!) {
    requestClue(programId: $programId, gateId: $gateId, currentGuess: $currentGuess) {
      clueText
      isClueLimitReached
      cluesRemaining
      isRateLimited
      retryAfterMs
      isAiBudgetExhausted
    }
  }
`;

export const RESET_SESSION_MUTATION_OPERATION =
  /* GraphQL */
  `
  mutation ResetSession($programId: String!) {
    resetSession(programId: $programId)
  }
`;

export const GET_PROGRAMS_QUERY_OPERATION =
  /* GraphQL */
  `
  query GetPrograms {
    programs {
      id
      name
    }
  }
`;

export const GET_PROGRAM_PROGRESSION_QUERY_OPERATION =
  /* GraphQL */
  `
  query GetProgramProgression($programId: String!) {
    getProgramProgression(programId: $programId) {
      currentGate {
        id
        label
        question
      }
      completedGates {
        id
        label
        question
        correctAnswer
        successMessage
      }
      status
    }
  }
`;

export const GET_IN_PROGRESS_PROGRAM_QUERY_OPERATION =
  /* GraphQL */
  `
  query GetInProgressProgram {
    getInProgressProgram
  }
`;

export const PROGRAM_QUERY_OPERATION =
  /* GraphQL */
  `
  query Program($id: String!) {
    program(id: $id) {
      id
      name
    }
  }
`;

export const PROGRAM_GATES_QUERY_OPERATION =
  /* GraphQL */
  `
  query ProgramGates($programId: String!) {
    programGates(programId: $programId) {
      id
      programId
      sequenceOrder
      label
      question
      correctAnswer
      successMessage
      acceptanceThreshold
      guidanceEnabled
      guidanceThreshold
    }
  }
`;

export const MY_PROGRAMS_QUERY_OPERATION =
  /* GraphQL */
  `
  query MyPrograms {
    myPrograms {
      id
      name
      visibility
      authorId
    }
  }
`;

export const ME_QUERY_OPERATION =
  /* GraphQL */
  `
  query Me {
    me {
      id
      email
      name
      image
    }
  }
`;

export const CREATE_PROGRAM_MUTATION_OPERATION =
  /* GraphQL */
  `
  mutation CreateProgram($name: String!, $visibility: String) {
    createProgram(name: $name, visibility: $visibility) {
      id
      name
      visibility
      authorId
      createdAt
    }
  }
`;

export const UPDATE_PROGRAM_MUTATION_OPERATION =
  /* GraphQL */
  `
  mutation UpdateProgram($id: String!, $name: String, $visibility: String) {
    updateProgram(id: $id, name: $name, visibility: $visibility) {
      id
      name
      visibility
    }
  }
`;

export const DELETE_PROGRAM_MUTATION_OPERATION =
  /* GraphQL */
  `
  mutation DeleteProgram($id: String!) {
    deleteProgram(id: $id)
  }
`;

export const CREATE_GATE_MUTATION_OPERATION =
  /* GraphQL */
  `
  mutation CreateGate(
    $programId: String!
    $label: String!
    $question: String!
    $correctAnswer: String!
    $successMessage: String!
    $sequenceOrder: Int!
    $acceptanceThreshold: Float
    $guidanceEnabled: Boolean
    $guidanceThreshold: Int
  ) {
    createGate(
      programId: $programId
      label: $label
      question: $question
      correctAnswer: $correctAnswer
      successMessage: $successMessage
      sequenceOrder: $sequenceOrder
      acceptanceThreshold: $acceptanceThreshold
      guidanceEnabled: $guidanceEnabled
      guidanceThreshold: $guidanceThreshold
    ) {
      id
      programId
      label
      question
      sequenceOrder
    }
  }
`;

export const UPDATE_GATE_MUTATION_OPERATION =
  /* GraphQL */
  `
  mutation UpdateGate(
    $id: String!
    $label: String
    $question: String
    $correctAnswer: String
    $successMessage: String
    $sequenceOrder: Int
    $acceptanceThreshold: Float
    $guidanceEnabled: Boolean
    $guidanceThreshold: Int
  ) {
    updateGate(
      id: $id
      label: $label
      question: $question
      correctAnswer: $correctAnswer
      successMessage: $successMessage
      sequenceOrder: $sequenceOrder
      acceptanceThreshold: $acceptanceThreshold
      guidanceEnabled: $guidanceEnabled
      guidanceThreshold: $guidanceThreshold
    ) {
      id
      label
      sequenceOrder
    }
  }
`;

export const DELETE_GATE_MUTATION_OPERATION =
  /* GraphQL */
  `
  mutation DeleteGate($id: String!) {
    deleteGate(id: $id)
  }
`;

export const REORDER_GATES_MUTATION_OPERATION =
  /* GraphQL */
  `
  mutation ReorderGates($programId: String!, $orderedGateIds: [String!]!) {
    reorderGates(programId: $programId, orderedGateIds: $orderedGateIds)
  }
`;

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
