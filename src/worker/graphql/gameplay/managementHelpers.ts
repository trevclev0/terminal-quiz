import type { AppGraphQLContext } from "./types";

export type Visibility = "public" | "unlisted";

const VALID_VISIBILITY: ReadonlySet<Visibility> = new Set([
  "public",
  "unlisted",
]);

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

export { assertVisibility, requireUser };
