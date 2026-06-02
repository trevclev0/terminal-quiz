import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";

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
