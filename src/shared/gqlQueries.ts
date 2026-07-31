/**
 * Single source of truth for all GraphQL query/mutation strings.
 *
 * Frontend hooks/api files and backend integration tests both import
 * from here. Never define query strings inline in consumer files.
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

export const PROGRAM_QUERY = `
  query Program($id: String!) {
    program(id: $id) {
      id
      name
    }
  }
`;

export const PROGRAM_GATES_QUERY = `
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

export const ME_QUERY = `
  query Me {
    me {
      id
      email
      name
      image
    }
  }
`;

export const CREATE_PROGRAM_MUTATION = `
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

export const UPDATE_PROGRAM_MUTATION = `
  mutation UpdateProgram($id: String!, $name: String, $visibility: String) {
    updateProgram(id: $id, name: $name, visibility: $visibility) {
      id
      name
      visibility
    }
  }
`;

export const DELETE_PROGRAM_MUTATION = `
  mutation DeleteProgram($id: String!) {
    deleteProgram(id: $id)
  }
`;

export const CREATE_GATE_MUTATION = `
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

export const UPDATE_GATE_MUTATION = `
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

export const DELETE_GATE_MUTATION = `
  mutation DeleteGate($id: String!) {
    deleteGate(id: $id)
  }
`;

export const REORDER_GATES_MUTATION = `
  mutation ReorderGates($programId: String!, $orderedGateIds: [String!]!) {
    reorderGates(programId: $programId, orderedGateIds: $orderedGateIds)
  }
`;
