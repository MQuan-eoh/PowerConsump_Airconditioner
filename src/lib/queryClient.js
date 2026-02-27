import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes fresh data
      cacheTime: 30 * 60 * 1000, // 30 minutes keep in cache before garbage collection
      refetchOnWindowFocus: false, // Don't refetch on tab switch unless data is stale
      retry: 2, // Retry failed requests twice
    },
  },
});
