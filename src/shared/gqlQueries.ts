/**
 * Canonical GraphQL query/mutation strings for integration tests.
 *
 * These duplicate frontend strings in `src/react-app/api/queries/*.ts`
 * and `src/react-app/api/mutations/*.ts` intentionally.
 * Integration tests use direct HTTP — no client import needed.
 * Keep both in sync when schema changes.
 *
 * `resetSession` has no frontend file — this is the canonical source.
 */

export const SUBMIT_GUESS_MUTATION = `
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

export const REQUEST_CLUE_MUTATION = `
  mutation RequestClue($programId: String!, $gateId: String!, $currentGuess: String!) {
    requestClue(programId: $programId, gateId: $gateId, currentGuess: $currentGuess) {
      clueText
      isClueLimitReached
      cluesRemaining
    }
  }
`;

export const RESET_SESSION_MUTATION = `
  mutation ResetSession($programId: String!) {
    resetSession(programId: $programId)
  }
`;

export const GET_PROGRAMS_QUERY = `
  query GetPrograms {
    programs {
      id
      name
    }
  }
`;

export const GET_PROGRAM_PROGRESSION_QUERY = `
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

export const GET_IN_PROGRESS_PROGRAM_QUERY = `
  query GetInProgressProgram {
    getInProgressProgram
  }
`;

export const MY_PROGRAMS_QUERY = `
  query MyPrograms {
    myPrograms {
      id
      name
      visibility
      authorId
    }
  }
`;
