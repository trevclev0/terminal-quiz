import * as authSchema from "@shared/authSchema";
import type { AppVariables } from "@worker-middleware/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import type { Context } from "hono";
import type { Env } from "..";

type AuthInstance = ReturnType<typeof betterAuth>;
let authInstance: AuthInstance | null = null;

function validateAuthBindings(bindings: Env["Bindings"]): void {
  const { ENVIRONMENT, BETTER_AUTH_SECRET, BETTER_AUTH_URL } = bindings;
  const isProd = ENVIRONMENT === "production";

  if (!BETTER_AUTH_SECRET) {
    throw new Error(
      "Missing required auth binding: BETTER_AUTH_SECRET. Set it in wrangler.jsonc vars or .dev.vars.",
    );
  }
  if (!BETTER_AUTH_URL) {
    throw new Error(
      "Missing required auth binding: BETTER_AUTH_URL. Set it in wrangler.jsonc vars or .dev.vars.",
    );
  }

  if (isProd) {
    const oauthKeys = [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GITHUB_CLIENT_ID",
      "GITHUB_CLIENT_SECRET",
    ] as const;
    for (const key of oauthKeys) {
      if (!bindings[key]) {
        throw new Error(
          `Missing required auth binding: ${key}. Set it via \`wrangler secret put ${key}\`.`,
        );
      }
    }

    if (BETTER_AUTH_SECRET.length < 32) {
      throw new Error(
        "BETTER_AUTH_SECRET must be at least 32 characters in production. Generate one with `npx auth secret` or `openssl rand -base64 32`.",
      );
    }
  }
}

function createAuth(c: Context<AppVariables>): AuthInstance {
  const env = c.env as Env["Bindings"];

  validateAuthBindings(env);

  const {
    BETTER_AUTH_SECRET,
    BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    ENVIRONMENT,
  } = env;

  // Default to secure cookies. Only allow insecure for explicit local dev.
  const useSecureCookies = ENVIRONMENT !== "development";
  const authDb = drizzle(c.env.DB, { schema: authSchema });

  return betterAuth({
    database: drizzleAdapter(authDb, { provider: "sqlite" }),
    secret: BETTER_AUTH_SECRET,
    baseURL: BETTER_AUTH_URL,
    advanced: {
      useSecureCookies,
      cookiePrefix: "terminal-quiz",
      defaultCookieAttributes: {
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: "lax",
      },
    },
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
        clientId: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
      },
      google: {
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
      },
    },
    databaseHooks: {
      account: {
        create: {
          before: async (account) => {
            return {
              data: {
                ...account,
                accessToken: undefined,
                refreshToken: undefined,
                idToken: undefined,
              },
            };
          },
        },
      },
    },
  }) as unknown as AuthInstance;
}

export function getAuth(c: Context<AppVariables>): AuthInstance {
  if (!authInstance) {
    authInstance = createAuth(c);
  }
  return authInstance;
}

export function clearAuthInstance(): void {
  authInstance = null;
}
