import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { FantasyTeam, League, LeagueConfiguration, LeagueMembership, LeagueStatus, Season, SeasonConfiguration } from '../types';
import { useCurrentUser } from './useIdentity';

// Query-hook module for the LeagueSeason controller area (Architecture v1.2 §6.3). Backs
// F-UI-001.2 (Profile: League Season Profile) among other features.

export function useMyLeagues() {
  return useQuery({
    queryKey: ['leagues'] as const,
    queryFn: async () => (await apiRequest<League[]>('/leagues')).data,
  });
}

/** Backs F-UI-001.9 (League Creation, BRD §8.21) — no `x-authorization` note on `createLeague` (BR-023: any authenticated user). */
export function useCreateLeague() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; description?: string }) =>
      (await apiRequest<League>('/leagues', { method: 'POST', body })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leagues'] }),
  });
}

/**
 * Backs F-UI-001.9's combined League+Season creation step (BRD UIR-191). Takes `leagueId` as a
 * mutation variable, not a hook parameter — League Creation only learns the new League's id
 * from `useCreateLeague`'s own result, one async step earlier in the same handler, so a
 * hook-level `leagueId` argument would close over a stale value from that render.
 */
export function useCreateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leagueId, eplSeasonIdentifier, startDate }: { leagueId: string; eplSeasonIdentifier: string; startDate: string }) =>
      (await apiRequest<Season>(`/leagues/${leagueId}/seasons`, { method: 'POST', body: { eplSeasonIdentifier, startDate } })).data,
    onSuccess: (season) => queryClient.invalidateQueries({ queryKey: ['leagues', season.leagueId, 'seasons'] }),
  });
}

export function useLeague(leagueId: string) {
  return useQuery({
    queryKey: ['leagues', leagueId] as const,
    queryFn: async () => (await apiRequest<League>(`/leagues/${leagueId}`)).data,
    enabled: Boolean(leagueId),
  });
}

/** Backs F-UI-001.10 (League Settings, BRD UIR-196) — League name/description/status editing. */
export function useUpdateLeague(leagueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name?: string; description?: string; status?: LeagueStatus }) =>
      (await apiRequest<League>(`/leagues/${leagueId}`, { method: 'PUT', body })).data,
    onSuccess: (league) => queryClient.setQueryData(['leagues', leagueId], league),
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

/**
 * Backs History's config-snapshot (BRD UIR-093, BR-296): a Season keeps the configuration
 * value that actually applied to it, which can differ from the League's present-day
 * `LeagueConfiguration` if an administrator has changed a default since — comparing this
 * against `useLeagueConfiguration`'s current value is how History flags a changed field.
 */
export function useSeasonConfiguration(leagueId: string, seasonId: string | undefined) {
  return useQuery({
    queryKey: ['leagues', leagueId, 'seasons', seasonId, 'configuration'] as const,
    queryFn: async () =>
      (await apiRequest<SeasonConfiguration>(`/leagues/${leagueId}/seasons/${seasonId}/configuration`)).data,
    enabled: Boolean(leagueId) && Boolean(seasonId),
  });
}

export function useLeagueConfiguration(leagueId: string) {
  return useQuery({
    queryKey: ['leagues', leagueId, 'configuration'] as const,
    queryFn: async () =>
      (await apiRequest<LeagueConfiguration>(`/leagues/${leagueId}/configuration`)).data,
    enabled: Boolean(leagueId),
  });
}

/**
 * Backs F-UI-001.10's "League Defaults" section (BRD UIR-197). Takes the *full*
 * `LeagueConfiguration` object (Architecture v1.4 ADR-015) — there is no partial-patch shape.
 */
export function useUpdateLeagueConfiguration(leagueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (configuration: LeagueConfiguration) =>
      (await apiRequest<LeagueConfiguration>(`/leagues/${leagueId}/configuration`, { method: 'PUT', body: configuration })).data,
    onSuccess: (configuration) => queryClient.setQueryData(['leagues', leagueId, 'configuration'], configuration),
  });
}

/**
 * Backs F-UI-001.10's "This Season's Configuration" section (BRD UIR-197). Also takes the full
 * `SeasonConfiguration` object; a `409` means one or more submitted fields are already locked
 * for this Season (BR-293) — the caller is expected to have already rendered those fields
 * read-only (UIR-199) using the same `lockedFields` array, so a real 409 here would indicate a
 * stale read, not a normal user action.
 */
export function useUpdateSeasonConfiguration(leagueId: string, seasonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (configuration: SeasonConfiguration) =>
      (
        await apiRequest<SeasonConfiguration>(`/leagues/${leagueId}/seasons/${seasonId}/configuration`, {
          method: 'PUT',
          body: configuration,
        })
      ).data,
    onSuccess: (configuration) =>
      queryClient.setQueryData(['leagues', leagueId, 'seasons', seasonId, 'configuration'], configuration),
  });
}

/**
 * Backs F-UI-001.12 (League Members, BRD §8.24) — doubles as both "a member leaves" and "an
 * Administrator removes another member" (`x-authorization`: caller owns `membershipId`, or is
 * the League Administrator). A `409` on the sole Administrator's own membership means the
 * backend's transfer-administration precondition (BR-025/BR-283) — which no endpoint
 * implements (BRD §12 item 13) — so this is surfaced as a plain, specific message (UIR-211),
 * not a generic error.
 */
export function useLeaveLeague(leagueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (membershipId: string) => {
      await apiRequest<void>(`/leagues/${leagueId}/memberships/${membershipId}/leave`, { method: 'POST' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: membershipsQueryKey(leagueId) }),
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
