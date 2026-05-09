import { decode, encode } from "@msgpack/msgpack";
import { QueryClient } from "@tanstack/react-query";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

const CACHE_KEY = "rq-offline-cache";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // 24 hours
      gcTime: 1000 * 60 * 60 * 48, // 48 hours
      refetchOnWindowFocus: false,
    },
  },
});

export const indexedDBMessagePackPersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    const buffer = encode(client);
    await set(CACHE_KEY, buffer);
  },
  restoreClient: async () => {
    try {
      const buffer = await get<Uint8Array>(CACHE_KEY);
      if (!buffer) return undefined;

      return decode(buffer) as PersistedClient;
    } catch (error) {
      console.warn("Failed to decode cached data, starting fresh.", error);
      return undefined;
    }
  },
  removeClient: async () => {
    await del(CACHE_KEY);
  },
};
