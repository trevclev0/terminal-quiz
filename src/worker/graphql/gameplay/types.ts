import type { Gate } from "@shared/types";
import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { hasUserCompletedGate } from "../../services/gateService";
import type { AppGraphQLContext } from "./queries";

const ActiveGateType = new GraphQLObjectType({
  name: "ActiveGate",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    label: { type: new GraphQLNonNull(GraphQLString) },
    question: { type: new GraphQLNonNull(GraphQLString) },
  },
});

const CompletedGateType = new GraphQLObjectType({
  name: "CompletedGate",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    label: { type: new GraphQLNonNull(GraphQLString) },
    question: { type: new GraphQLNonNull(GraphQLString) },
    correctAnswer: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: async (
        parent: Gate,
        _args: unknown,
        context: AppGraphQLContext,
      ) => {
        const db = context.get("db");
        const sessionId = context.get("sessionId");

        if (!sessionId) {
          throw new Error("Unauthorized: Missing session");
        }

        const hasCompleted = await hasUserCompletedGate(
          db,
          sessionId,
          parent.programId,
          parent.id,
        );

        if (!hasCompleted) {
          throw new Error("Forbidden: You have not completed this gate yet.");
        }

        return parent.correctAnswer;
      },
    },
    successMessage: { type: new GraphQLNonNull(GraphQLString) },
  },
});

const ProgressionPayloadType = new GraphQLObjectType({
  name: "ProgressionPayload",
  fields: {
    currentGate: { type: ActiveGateType }, // Nullable if program is completed
    completedGates: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(CompletedGateType)),
      ),
    },
    status: { type: new GraphQLNonNull(GraphQLString) },
  },
});

const SubmitGuessPayloadType = new GraphQLObjectType({
  name: "SubmitGuessPayload",
  fields: {
    success: { type: new GraphQLNonNull(GraphQLBoolean) },
    message: { type: GraphQLString }, // Dynamic hint or success text
    nextGate: { type: ActiveGateType }, // Nullable if completed
  },
});

export { ProgressionPayloadType, SubmitGuessPayloadType };
