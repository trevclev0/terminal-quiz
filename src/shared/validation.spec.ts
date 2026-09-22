import { describe, expect, it } from "vitest";
import { MAX_GUESS_LENGTH } from "./types";
import {
  acceptanceThresholdSchema,
  clampAcceptanceThreshold,
  clampGuidanceThreshold,
  createGateInputSchema,
  createProgramInputSchema,
  gateFieldsSchema,
  gateTextSchema,
  guessSchema,
  guidanceThresholdSchema,
  parseOrThrow,
  sequenceOrderSchema,
  updateGateInputSchema,
  updateProgramInputSchema,
  visibilitySchema,
} from "./validation";

function firstMessage(
  schema: { safeParse: (v: unknown) => unknown },
  value: unknown,
) {
  const result = schema.safeParse(value) as {
    success: boolean;
    error?: { issues: { message: string }[] };
  };
  return result.success ? null : result.error?.issues[0]?.message;
}

const VALID_GATE_TEXT = {
  label: "Gate",
  question: "Q?",
  correctAnswer: "A",
  successMessage: "OK",
};

describe("gate text", () => {
  it("trims each field", () => {
    expect(
      gateTextSchema.parse({ ...VALID_GATE_TEXT, label: "  Gate  " }).label,
    ).toBe("Gate");
  });

  it("names the blank or missing field in the message", () => {
    expect(
      firstMessage(gateTextSchema, { ...VALID_GATE_TEXT, question: "  " }),
    ).toBe("question is required.");
    expect(
      firstMessage(gateTextSchema, {
        ...VALID_GATE_TEXT,
        successMessage: undefined,
      }),
    ).toBe("successMessage is required.");
  });
});

describe("acceptanceThresholdSchema", () => {
  it("accepts the inclusive 0–1 range", () => {
    for (const value of [0, 0.875, 1]) {
      expect(acceptanceThresholdSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects values outside 0–1 and non-numbers", () => {
    for (const value of [-0.01, 1.01, Number.NaN, "0.5", null]) {
      expect(firstMessage(acceptanceThresholdSchema, value)).toBe(
        "acceptanceThreshold must be between 0 and 1.",
      );
    }
  });
});

describe("guidanceThresholdSchema", () => {
  it("accepts integers from 1 to MAX_CLUES_PER_GATE", () => {
    for (const value of [1, 2, 3]) {
      expect(guidanceThresholdSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects out-of-range and fractional values", () => {
    for (const value of [0, 4, 1.5]) {
      expect(firstMessage(guidanceThresholdSchema, value)).toBe(
        "guidanceThreshold must be an integer between 1 and 3.",
      );
    }
  });
});

describe("sequenceOrderSchema", () => {
  it("rejects zero, negatives, and fractions", () => {
    for (const value of [0, -1, 1.5]) {
      expect(firstMessage(sequenceOrderSchema, value)).toBe(
        "sequenceOrder must be a positive integer.",
      );
    }
  });
});

describe("visibilitySchema", () => {
  it("quotes the rejected value", () => {
    expect(firstMessage(visibilitySchema, "secret")).toBe(
      'Invalid visibility "secret". Must be "public" or "unlisted".',
    );
  });
});

describe("program input", () => {
  it("defaults visibility to public on create", () => {
    expect(createProgramInputSchema.parse({ name: "P" })).toEqual({
      name: "P",
      visibility: "public",
    });
  });

  it("never defaults visibility on update", () => {
    expect(updateProgramInputSchema.parse({ name: " P " })).toEqual({
      name: "P",
    });
  });
});

describe("gate input", () => {
  it("requires a sequenceOrder on create but not on update", () => {
    expect(firstMessage(createGateInputSchema, VALID_GATE_TEXT)).toBe(
      "sequenceOrder must be a positive integer.",
    );
    expect(updateGateInputSchema.parse({ label: "New" })).toEqual({
      label: "New",
    });
  });

  it("validates a complete editor draft", () => {
    const draft = {
      ...VALID_GATE_TEXT,
      acceptanceThreshold: 0.9,
      guidanceEnabled: true,
      guidanceThreshold: 2,
    };
    expect(gateFieldsSchema.safeParse(draft).success).toBe(true);
    expect(
      gateFieldsSchema.safeParse({ ...draft, acceptanceThreshold: 2 }).success,
    ).toBe(false);
  });
});

describe("guessSchema", () => {
  const schema = guessSchema("Invalid guess length.");

  it("parses to the trimmed guess", () => {
    expect(schema.parse("  red  ")).toBe("red");
  });

  it("rejects blank guesses and guesses over MAX_GUESS_LENGTH", () => {
    for (const value of ["", "   ", "x".repeat(MAX_GUESS_LENGTH + 1)]) {
      expect(firstMessage(schema, value)).toBe("Invalid guess length.");
    }
  });

  it("measures the limit after trimming", () => {
    const padded = ` ${"x".repeat(MAX_GUESS_LENGTH)} `;
    expect(schema.parse(padded)).toHaveLength(MAX_GUESS_LENGTH);
  });
});

describe("clamp helpers", () => {
  it("clamps acceptance into 0–1", () => {
    expect(clampAcceptanceThreshold(-1)).toBe(0);
    expect(clampAcceptanceThreshold(0.5)).toBe(0.5);
    expect(clampAcceptanceThreshold(7)).toBe(1);
  });

  it("clamps and rounds guidance into 1–3", () => {
    expect(clampGuidanceThreshold(0)).toBe(1);
    expect(clampGuidanceThreshold(2.4)).toBe(2);
    expect(clampGuidanceThreshold(9)).toBe(3);
  });
});

describe("parseOrThrow", () => {
  it("returns parsed output", () => {
    expect(parseOrThrow(visibilitySchema, "unlisted")).toBe("unlisted");
  });

  it("throws the first issue's message", () => {
    expect(() =>
      parseOrThrow(createProgramInputSchema, { name: " ", visibility: "x" }),
    ).toThrow('Invalid visibility "x". Must be "public" or "unlisted".');
  });
});
