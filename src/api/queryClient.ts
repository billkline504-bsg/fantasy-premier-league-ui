import { QueryClient } from '@tanstack/react-query';

// Architecture v1.1 §2/§4.1: TanStack Query owns all server state. Per-screen refetchInterval
// overrides for live data (draft turn/timer, live EPL fixtures) are set on the individual
// query hooks that need them (§8) — this default stays conservative (no polling) so screens
// that don't need it aren't paying for it.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
