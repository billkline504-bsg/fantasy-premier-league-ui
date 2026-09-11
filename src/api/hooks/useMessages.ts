import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { LeagueMessage } from '../types';

// Query-hook module backing F-UI-004.1 (Messages) and Dashboard's news feed (F-UI-003.1).

function messagesQueryKey(leagueId: string) {
  return ['leagues', leagueId, 'messages'] as const;
}

export function useLeagueMessages(leagueId: string) {
  return useQuery({
    queryKey: messagesQueryKey(leagueId),
    queryFn: async () => (await apiRequest<LeagueMessage[]>(`/leagues/${leagueId}/messages`)).data,
    enabled: Boolean(leagueId),
  });
}

export function usePublishLeagueMessage(leagueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) =>
      (await apiRequest<LeagueMessage>(`/leagues/${leagueId}/messages`, { method: 'POST', body: { body } })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messagesQueryKey(leagueId) }),
  });
}
