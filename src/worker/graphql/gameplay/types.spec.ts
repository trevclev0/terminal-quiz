import { GraphQLNonNull, GraphQLString } from "graphql";
import { describe, expect, it } from "vitest";
import { ActiveGateType, CompletedGateType } from "./types";

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

describe("player-facing gate types", () => {
  // Aliases are an authoring-only field: exposing them to a player would
  // hand out extra accepted answers (see GateManagement).
  it.each([
    ["ActiveGate", ActiveGateType],
    ["CompletedGate", CompletedGateType],
  ])("%s has no acceptedAnswers field", (_name, type) => {
    expect(Object.keys(type.getFields())).not.toContain("acceptedAnswers");
  });
});
