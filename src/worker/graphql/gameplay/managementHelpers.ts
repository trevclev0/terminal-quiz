import type { AppGraphQLContext } from "./types";

const VALID_VISIBILITY = new Set(["public", "unlisted"]);

function requireUser(user: AppGraphQLContext["var"]["user"]): string {
  if (!user?.id) {
    throw new Error("Unauthorized: Authentication required.");
  }
  return user.id;
}

function assertVisibility(value: string): void {
  if (!VALID_VISIBILITY.has(value)) {
    throw new Error(
      `Invalid visibility "${value}". Must be "public" or "unlisted".`,
    );
  }
}

export { assertVisibility, requireUser };
