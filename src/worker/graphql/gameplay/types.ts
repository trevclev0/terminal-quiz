import type { AppVariables } from "@worker-middleware/db";
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import type { Context } from "hono";

export type AppGraphQLContext = Context<AppVariables>;

export const MeType = new GraphQLObjectType({
  name: "Me",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    image: { type: GraphQLString },
  },
});

export const ProgramListItemType = new GraphQLObjectType({
  name: "ProgramListItem",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    visibility: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: GraphQLString },
  },
});

const ProgramManagementType = new GraphQLObjectType({
  name: "ProgramManagement",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    visibility: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: GraphQLString },
    createdAt: { type: new GraphQLNonNull(GraphQLFloat) },
  },
});

const GateManagementType = new GraphQLObjectType({
  name: "GateManagement",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    programId: { type: new GraphQLNonNull(GraphQLString) },
    sequenceOrder: { type: new GraphQLNonNull(GraphQLInt) },
    label: { type: new GraphQLNonNull(GraphQLString) },
    question: { type: new GraphQLNonNull(GraphQLString) },
    correctAnswer: { type: new GraphQLNonNull(GraphQLString) },
    successMessage: { type: new GraphQLNonNull(GraphQLString) },
    acceptanceThreshold: { type: new GraphQLNonNull(GraphQLFloat) },
    guidanceEnabled: { type: new GraphQLNonNull(GraphQLBoolean) },
    guidanceThreshold: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

const ActiveGateType = new GraphQLObjectType({
  name: "ActiveGate",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    label: { type: new GraphQLNonNull(GraphQLString) },
    question: { type: new GraphQLNonNull(GraphQLString) },
  },
});

export const CompletedGateType = new GraphQLObjectType({
  name: "CompletedGate",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    label: { type: new GraphQLNonNull(GraphQLString) },
    question: { type: new GraphQLNonNull(GraphQLString) },
    correctAnswer: { type: new GraphQLNonNull(GraphQLString) },
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
    canRequestClue: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
});

const RequestClueResultType = new GraphQLObjectType({
  name: "RequestClueResult",
  fields: {
    clueText: { type: GraphQLString },
    isClueLimitReached: { type: new GraphQLNonNull(GraphQLBoolean) },
    cluesRemaining: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

export {
  GateManagementType,
  ProgramManagementType,
  ProgressionPayloadType,
  RequestClueResultType,
  SubmitGuessPayloadType,
};
