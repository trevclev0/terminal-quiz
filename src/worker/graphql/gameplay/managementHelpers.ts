import type { AppGraphQLContext } from "./types";

function requireUser(user: AppGraphQLContext["var"]["user"]): string {
  if (!user?.id) {
    throw new Error("Unauthorized: Authentication required.");
  }
  return user.id;
}

/**
 * Drops fields whose value is undefined — what's left is exactly what an
 * update mutation was asked to change.
 */
function definedFields<T extends Record<string, unknown>>(
  fields: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export { definedFields, requireUser };
