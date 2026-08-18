/**
 * CLI-only scaffold for `npx auth generate`
 *
 * Do NOT import from worker code. Runtime config lives in
 * src/worker/services/auth.ts.
 *
 * Regenerate schema after changing this file:
 *   npx auth generate --adapter drizzle --dialect sqlite --output src/shared/authSchema.ts --yes
 */

import { betterAuth } from "better-auth/minimal";

// Explicit annotation via the public import: betterAuth returns an
// options-parameterized Auth type that declaration emit cannot name portably
// (TS2883). ReturnType is constraint-resolved and not directly assignable, so
// the cast mirrors src/worker/services/auth.ts.
export const auth = betterAuth({
  user: {
    additionalFields: {
      is_admin: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
}) as unknown as ReturnType<typeof betterAuth>;
