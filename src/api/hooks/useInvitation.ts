import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { Invitation, InvitationChannel, LeagueMembership } from '../types';

// Query-hook module backing F-UI-001.8 (Accept League Invitation, BRD §8.20) and F-UI-001.11
// (Invitations — the sending/administering end, BRD §8.23).

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: async (token: string) =>
      (await apiRequest<LeagueMembership>(`/invitations/${encodeURIComponent(token)}/accept`, { method: 'POST' })).data,
  });
}

function invitationsQueryKey(leagueId: string) {
  return ['leagues', leagueId, 'invitations'] as const;
}

export function useLeagueInvitations(leagueId: string) {
  return useQuery({
    queryKey: invitationsQueryKey(leagueId),
    queryFn: async () => (await apiRequest<Invitation[]>(`/leagues/${leagueId}/invitations`)).data,
    enabled: Boolean(leagueId),
  });
}

export function useCreateInvitation(leagueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { destination: string; channel: InvitationChannel; seasonId?: string }) =>
      (await apiRequest<Invitation>(`/leagues/${leagueId}/invitations`, { method: 'POST', body })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invitationsQueryKey(leagueId) }),
  });
}

export function useRevokeInvitation(leagueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => {
      await apiRequest<void>(`/leagues/${leagueId}/invitations/${invitationId}`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invitationsQueryKey(leagueId) }),
  });
}
