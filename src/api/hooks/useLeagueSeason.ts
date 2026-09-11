import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { FantasyTeam, League, LeagueConfiguration, LeagueMembership, Season } from '../types';
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

/**
 * There is no way to ask the API "which Season is current" any more directly than this
 * (API Consumption Specification v1.2 §2.3d covers the EPL-season-identifier consequence of
 * the same underlying gap). Preference order: `InSeason` beats `DraftInProgress` beats
 * `Setup`; if none of those exist, falls back to the most recently started `Completed` one.
 */
function pickCurrentSeason(seasons: Season[]): Season | undefined {
  const byStatus = (status: Season['status']) => seasons.find((s) => s.status === status);
  return (
    byStatus('InSeason') ??
    byStatus('DraftInProgress') ??
    byStatus('Setup') ??
    [...seasons].sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
  );
}

export function useSeasons(leagueId: string) {
  return useQuery({
    queryKey: ['leagues', leagueId, 'seasons'] as const,
    queryFn: async () => (await apiRequest<Season[]>(`/leagues/${leagueId}/seasons`)).data,
    enabled: Boolean(leagueId),
  });
}

export function useCurrentSeason(leagueId: string) {
  const seasons = useSeasons(leagueId);
  return {
    data: seasons.data ? pickCurrentSeason(seasons.data) : undefined,
    isPending: seasons.isPending,
    error: seasons.error,
  };
}

export function useFantasyTeams(leagueId: string, seasonId: string | undefined) {
  return useQuery({
    queryKey: ['leagues', leagueId, 'seasons', seasonId, 'fantasy-teams'] as const,
    queryFn: async () =>
      (
        await apiRequest<FantasyTeam[]>(`/leagues/${leagueId}/seasons/${seasonId}/fantasy-teams`)
      ).data,
    enabled: Boolean(leagueId) && Boolean(seasonId),
  });
}

/**
 * There is no "get my own FantasyTeam" shortcut either — `FantasyTeam` has no `userId`, only
 * `leagueMembershipId`, so this joins through `useMyMembership` the same way that hook joins
 * through `useCurrentUser`. Also: `FantasyTeam` has no distinct "team name" field at all — only
 * `username` (API Consumption Specification v1.3 §2.3g) — every consumer of this hook renders
 * `.username` as the team's displayed identity, there is nothing else to show.
 */
export function useMyFantasyTeam(leagueId: string, seasonId: string | undefined) {
  const membership = useMyMembership(leagueId);
  const fantasyTeams = useFantasyTeams(leagueId, seasonId);
  const myTeam = fantasyTeams.data?.find((t) => t.leagueMembershipId === membership.data?.leagueMembershipId);
  return {
    data: myTeam,
    isPending: membership.isPending || fantasyTeams.isPending,
    error: membership.error ?? fantasyTeams.error,
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
