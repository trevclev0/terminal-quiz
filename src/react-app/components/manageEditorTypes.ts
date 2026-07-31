export type GateForm = {
  label: string;
  question: string;
  correctAnswer: string;
  successMessage: string;
  acceptanceThreshold: number;
  guidanceEnabled: boolean;
  guidanceThreshold: number;
};

export type NewGateForm = {
  label: string;
  question: string;
  correctAnswer: string;
  successMessage: string;
};
