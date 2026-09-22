import * as z from "zod/mini";
import { MAX_CLUES_PER_GATE, MAX_GUESS_LENGTH } from "./types";

/**
 * Input rules shared by the GraphQL resolvers and the authoring UI — one
 * definition per rule, so the two sides cannot drift apart.
 *
 * The resolvers are authoritative: they parse every mutation's input with
 * these schemas (`parseOrThrow`) before touching D1. The UI uses the same
 * schemas and bounds only for early feedback (clamping number inputs,
 * disabling Save while a draft is invalid). Error messages are the
 * user-facing GraphQL error text, so they read as sentences.
 *
 * Written against `zod/mini` because the authoring pages bundle these
 * schemas: its functional API tree-shakes to ~7 kB gzip where classic zod's
 * method chains cost ~25 kB. Constants the gameplay UI needs without the
 * schemas (MAX_GUESS_LENGTH, MAX_CLUES_PER_GATE) live in `./types`, which
 * keeps zod out of the gameplay bundle entirely.
 */

export const MIN_ACCEPTANCE_THRESHOLD = 0;
export const MAX_ACCEPTANCE_THRESHOLD = 1;
export const MIN_GUIDANCE_THRESHOLD = 1;
export const MAX_GUIDANCE_THRESHOLD = MAX_CLUES_PER_GATE;

export const VISIBILITIES = ["public", "unlisted"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

const ACCEPTANCE_THRESHOLD_ERROR = `acceptanceThreshold must be between ${MIN_ACCEPTANCE_THRESHOLD} and ${MAX_ACCEPTANCE_THRESHOLD}.`;
const GUIDANCE_THRESHOLD_ERROR = `guidanceThreshold must be an integer between ${MIN_GUIDANCE_THRESHOLD} and ${MAX_GUIDANCE_THRESHOLD}.`;
const SEQUENCE_ORDER_ERROR = "sequenceOrder must be a positive integer.";

/** Non-blank after trimming; parses to the trimmed value. */
function requiredText(field: string) {
  const error = `${field} is required.`;
  return z.string({ error }).check(z.trim(), z.minLength(1, error));
}

export const visibilitySchema = z.enum(VISIBILITIES, {
  error: (issue) =>
    `Invalid visibility "${String(issue.input)}". Must be "public" or "unlisted".`,
});

export const acceptanceThresholdSchema = z
  .number({ error: ACCEPTANCE_THRESHOLD_ERROR })
  .check(
    z.gte(MIN_ACCEPTANCE_THRESHOLD, ACCEPTANCE_THRESHOLD_ERROR),
    z.lte(MAX_ACCEPTANCE_THRESHOLD, ACCEPTANCE_THRESHOLD_ERROR),
  );

export const guidanceThresholdSchema = z
  .int({ error: GUIDANCE_THRESHOLD_ERROR })
  .check(
    z.gte(MIN_GUIDANCE_THRESHOLD, GUIDANCE_THRESHOLD_ERROR),
    z.lte(MAX_GUIDANCE_THRESHOLD, GUIDANCE_THRESHOLD_ERROR),
  );

export const sequenceOrderSchema = z
  .int({ error: SEQUENCE_ORDER_ERROR })
  .check(z.positive(SEQUENCE_ORDER_ERROR));

export const programNameSchema = requiredText("name");

export const createProgramInputSchema = z.object({
  visibility: z._default(visibilitySchema, "public"),
  name: programNameSchema,
});

// Spelled out rather than `z.partial(createProgramInputSchema)`: a partial
// still applies the "public" default, so a rename would silently reset
// visibility.
export const updateProgramInputSchema = z.object({
  visibility: z.optional(visibilitySchema),
  name: z.optional(programNameSchema),
});

/** The four text fields every gate needs — the Add Gate form's shape. */
export const gateTextSchema = z.object({
  label: requiredText("label"),
  question: requiredText("question"),
  correctAnswer: requiredText("correctAnswer"),
  successMessage: requiredText("successMessage"),
});

/** Everything a gate's author edits — the gate editor draft's shape. */
export const gateFieldsSchema = z.extend(gateTextSchema, {
  acceptanceThreshold: z.optional(acceptanceThresholdSchema),
  guidanceEnabled: z.optional(
    z.boolean({ error: "guidanceEnabled must be a boolean." }),
  ),
  guidanceThreshold: z.optional(guidanceThresholdSchema),
});

export const createGateInputSchema = z.extend(gateFieldsSchema, {
  sequenceOrder: sequenceOrderSchema,
});

export const updateGateInputSchema = z.partial(createGateInputSchema);

/**
 * A player's guess: non-blank and at most MAX_GUESS_LENGTH characters once
 * trimmed; parses to the trimmed guess. The message is the caller's, since
 * submitGuess and requestClue name the field differently.
 */
export function guessSchema(error: string) {
  return z
    .string({ error })
    .check(
      z.trim(),
      z.minLength(1, error),
      z.maxLength(MAX_GUESS_LENGTH, error),
    );
}

export function clampAcceptanceThreshold(value: number): number {
  return Math.min(
    MAX_ACCEPTANCE_THRESHOLD,
    Math.max(MIN_ACCEPTANCE_THRESHOLD, value),
  );
}

export function clampGuidanceThreshold(value: number): number {
  return Math.round(
    Math.min(MAX_GUIDANCE_THRESHOLD, Math.max(MIN_GUIDANCE_THRESHOLD, value)),
  );
}

/**
 * Parses `input` with `schema`, throwing the first issue's message on
 * failure. Resolvers call this so an invalid mutation fails with the same
 * sentence the UI would have shown.
 */
export function parseOrThrow<Schema extends z.ZodMiniType>(
  schema: Schema,
  input: unknown,
): z.output<Schema> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Invalid input.");
  }
  return result.data;
}
