import { GraphQLNonNull, GraphQLString } from "graphql";
import { describe, expect, it } from "vitest";
import { CompletedGateType } from "./types";

describe("CompletedGateType", () => {
  it("defines the expected non-nullable fields", () => {
    const fields = CompletedGateType.getFields();

    expect(fields.id.type).toBeInstanceOf(GraphQLNonNull);
    expect(
      (fields.id.type as GraphQLNonNull<typeof GraphQLString>).ofType,
    ).toBe(GraphQLString);
    expect(fields.label.type).toBeInstanceOf(GraphQLNonNull);
    expect(fields.question.type).toBeInstanceOf(GraphQLNonNull);
    expect(fields.correctAnswer.type).toBeInstanceOf(GraphQLNonNull);
    expect(fields.successMessage.type).toBeInstanceOf(GraphQLNonNull);
  });

  it("does not define a custom resolver for correctAnswer", () => {
    expect(CompletedGateType.getFields().correctAnswer.resolve).toBeUndefined();
  });
});
