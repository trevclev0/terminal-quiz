import { MAX_CLUES_PER_GATE } from "@shared/types";
import type { AppGraphQLContext } from "./types";

export type Visibility = "public" | "unlisted";

const VALID_VISIBILITY: ReadonlySet<Visibility> = new Set([
  "public",
  "unlisted",
]);

function assertRequiredText(value: string, fieldName: string): string {
  if (value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }
  return value.trim();
}

function assertGuidanceThreshold(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > MAX_CLUES_PER_GATE) {
    throw new Error(
      `guidanceThreshold must be an integer between 1 and ${MAX_CLUES_PER_GATE}.`,
    );
  }
}

function requireUser(user: AppGraphQLContext["var"]["user"]): string {
  if (!user?.id) {
    throw new Error("Unauthorized: Authentication required.");
  }
  return user.id;
}

function assertVisibility(value: string): asserts value is Visibility {
  if (!VALID_VISIBILITY.has(value as Visibility)) {
    throw new Error(
      `Invalid visibility "${value}". Must be "public" or "unlisted".`,
    );
  }
}

export {
  assertGuidanceThreshold,
  assertRequiredText,
  assertVisibility,
  requireUser,
};
