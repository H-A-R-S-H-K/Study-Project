import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query owns all server state (requests, offers, chats, profiles).
 * Redux is reserved for client/session state only. This separation avoids the
 * classic "everything in Redux" bloat and gives caching, retries and
 * background refetch for free.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});
