const defaultNullishProgramProps = {
  selectedAt: null,
  completedAt: null,
};

const defaultNullishGateProps = {
  solvedAt: null,
  attemptCount: 0,
  guidanceEnabled: false,
  guidancePrompt: null,
  guidanceThreshold: 2,
  acceptanceThreshold: 0.875,
  programId: null,
};

export { defaultNullishGateProps, defaultNullishProgramProps };
