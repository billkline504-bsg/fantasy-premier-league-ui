import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { League, LeagueConfiguration, LeagueMembership } from '../types';
import { useCurrentUser } from './useIdentity';

// Query-hook module for the LeagueSeason controller area (Architecture v1.2 §6.3). Backs
// F-UI-001.2 (Profile: League Season Profile) among other features.

export function useMyLeagues() {
  return useQuery({
    queryKey: ['leagues'] as const,
    queryFn: async () => (await apiRequest<League[]>('/leagues')).data,
  });
}

export function membershipsQueryKey(leagueId: string) {
  return ['leagues', leagueId, 'memberships'] as const;
}

export function useLeagueMemberships(leagueId: string) {
  return useQuery({
    queryKey: membershipsQueryKey(leagueId),
    queryFn: async () =>
      (await apiRequest<LeagueMembership[]>(`/leagues/${leagueId}/memberships`)).data,
    enabled: Boolean(leagueId),
  });
}

/**
 * There is no "get my own membership" endpoint (API Consumption Specification v1.1 §3) — the
 * only way to find it is to list every membership in the League and match on userId. Fine for
 * league-sized lists (a handful of teams); revisit if that ever stops being true.
 */
export function useMyMembership(leagueId: string) {
  const currentUser = useCurrentUser();
  const memberships = useLeagueMemberships(leagueId);
  const myMembership = memberships.data?.find((m) => m.userId === currentUser.data?.userId);
  return {
    data: myMembership,
    isPending: currentUser.isPending || memberships.isPending,
    error: currentUser.error ?? memberships.error,
  };
}

export function useLeagueConfiguration(leagueId: string) {
  return useQuery({
    queryKey: ['leagues', leagueId, 'configuration'] as const,
    queryFn: async () =>
      (await apiRequest<LeagueConfiguration>(`/leagues/${leagueId}/configuration`)).data,
    enabled: Boolean(leagueId),
  });
}

export function useSetLeagueIcon(leagueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ membershipId, profileIconId }: { membershipId: string; profileIconId: string }) =>
      (
        await apiRequest<LeagueMembership>(`/leagues/${leagueId}/memberships/${membershipId}/icon`, {
          method: 'PUT',
          body: { profileIconId },
        })
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: membershipsQueryKey(leagueId) }),
  });
}

export function useClearLeagueIcon(leagueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (membershipId: string) => {
      await apiRequest<void>(`/leagues/${leagueId}/memberships/${membershipId}/icon`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: membershipsQueryKey(leagueId) }),
  });
}
