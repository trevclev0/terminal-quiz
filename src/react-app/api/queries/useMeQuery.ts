import { queryOptions, useQuery } from "@tanstack/react-query";
import { ME_QUERY } from "../../../shared/gqlQueries";
import { graphqlFetch } from "../graphQlClient";

export type Me = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
};

const fetchMe = async (): Promise<Me | null> => {
  const data = await graphqlFetch<{ me: Me | null }>(ME_QUERY);
  return data.me;
};

export const meQueryOptions = queryOptions({
  queryKey: ["me"],
  queryFn: fetchMe,
  staleTime: 1000 * 60 * 5,
  retry: false,
});

export const useMeQuery = () => {
  return useQuery(meQueryOptions);
};
