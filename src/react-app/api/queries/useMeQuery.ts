import { queryOptions, useQuery } from "@tanstack/react-query";
import { graphqlFetch } from "../graphQlClient";

const ME_QUERY = `
  query Me {
    me {
      id
      email
      name
      image
    }
  }
`;

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
