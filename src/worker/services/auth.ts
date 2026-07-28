import * as authSchema from "@shared/authSchema";
import type { AppVariables } from "@worker-middleware/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import type { Context } from "hono";
import type { Env } from "..";

type AuthInstance = ReturnType<typeof betterAuth>;
let authInstance: AuthInstance | null = null;

function createAuth(c: Context<AppVariables>): AuthInstance {
  const {
    BETTER_AUTH_SECRET,
    BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    ENVIRONMENT,
  } = c.env as Env["Bindings"];

  const isProduction = ENVIRONMENT === "production";
  const authDb = drizzle(c.env.DB, { schema: authSchema });

  return betterAuth({
    database: drizzleAdapter(authDb, { provider: "sqlite" }),
    secret: BETTER_AUTH_SECRET ?? "",
    baseURL: BETTER_AUTH_URL ?? "http://localhost:5173",
    advanced: {
      useSecureCookies: isProduction,
      cookiePrefix: "terminal-quiz",
      defaultCookieAttributes: {
        httpOnly: true,
        secure: isProduction,
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
        clientId: GITHUB_CLIENT_ID ?? "",
        clientSecret: GITHUB_CLIENT_SECRET ?? "",
      },
      google: {
        clientId: GOOGLE_CLIENT_ID ?? "",
        clientSecret: GOOGLE_CLIENT_SECRET ?? "",
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
