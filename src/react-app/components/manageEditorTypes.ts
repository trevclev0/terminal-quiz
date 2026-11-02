export type GateForm = {
  label: string;
  question: string;
  correctAnswer: string;
  successMessage: string;
  acceptanceThreshold: number;
  guidanceEnabled: boolean;
  guidanceThreshold: number;
  /** Raw row values, untrimmed while editing; blank rows are invalid. */
  acceptedAnswers: string[];
};

export type NewGateForm = {
  label: string;
  question: string;
  correctAnswer: string;
  successMessage: string;
};
