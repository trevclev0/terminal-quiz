const defaultNullishProgramProps = {
  selectedAt: null,
  completedAt: null,
  createdAt: new Date(),
};

const defaultNullishGateProps = {
  solvedAt: null,
  attemptCount: 0,
  guidanceEnabled: false,
  guidancePrompt: null,
  guidanceThreshold: 2,
  acceptanceThreshold: 0.875,
  programId: null,
  createdAt: new Date(),
};

export { defaultNullishGateProps, defaultNullishProgramProps };
