import { graphql } from "msw/graphql";

// msw 3 removed the unscoped graphql.query/mutation helpers. A "*" link
// matches the operation on any endpoint, as they did in msw 2.
export const gqlApi = graphql.link("*");
