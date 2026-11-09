import {
  buildHintCells,
  maxHintStep,
  unlockedHintStep,
} from "@worker-utils/mechanicalHint";
import { GraphQLNonNull, GraphQLString } from "graphql";
import { loadActiveSession } from "./activeSession";
import { trackEvent } from "./analytics";
import { type AppGraphQLContext, RequestHintResultType } from "./types";

// Letter-pattern hints (#363). No AI, no rate limit and no stored state:
// the step comes from the attempt count alone, so a repeat request returns
// the same hint and costs only the session read.
export const requestHint = {
  type: RequestHintResultType,
  args: {
    programId: { type: new GraphQLNonNull(GraphQLString) },
    gateId: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _: unknown,
    args: { programId: string; gateId: string },
    context: AppGraphQLContext,
  ) => {
    const sessionId = context.get("sessionId");
    if (!sessionId) throw new Error("Unauthorized: Missing Session ID");

    const { progress, activeGate } = await loadActiveSession(
      context.get("db"),
      sessionId,
      args.programId,
      args.gateId,
      "Desync: Hint requested for the wrong active gate.",
    );

    const step = unlockedHintStep({
      correctAnswer: activeGate.correctAnswer,
      guidanceEnabled: activeGate.guidanceEnabled,
      guidanceThreshold: activeGate.guidanceThreshold,
      attemptCount: progress.attemptCount,
    });

    // The outcome names the step only: the hint is part of the answer and
    // never goes to analytics.
    trackEvent(context, {
      name: "hint_requested",
      programId: args.programId,
      gateId: args.gateId,
      outcome: step > 0 ? `step_${step}` : "not_eligible",
      attemptCount: progress.attemptCount,
    });

    return {
      step,
      cells: step > 0 ? buildHintCells(activeGate.correctAnswer, step) : null,
      isFinalStep: step > 0 && step === maxHintStep(activeGate.correctAnswer),
    };
  },
};
