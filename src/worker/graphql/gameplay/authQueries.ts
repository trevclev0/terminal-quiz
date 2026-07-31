import { type AppGraphQLContext, MeType } from "./types";

export const me = {
  type: MeType,
  resolve: (_: unknown, __: unknown, context: AppGraphQLContext) => {
    const user = context.get("user");
    if (!user) return null;
    return user;
  },
};
