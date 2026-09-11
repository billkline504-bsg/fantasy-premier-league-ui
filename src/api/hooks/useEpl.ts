import { useQueries, useQuery } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { Club, ClubStanding, Fixture, Gameweek, Player } from '../types';
import { useCurrentSeason } from './useLeagueSeason';
import { useNow } from '../../utils/useNow';

// Query-hook module for the Player & EPL Reference Data controller area (Architecture v1.2
// §6.3). Backs F-UI-001.3/001.4 (EPL Table & Fixtures).

export function useClubs() {
  return useQuery({
    queryKey: ['epl', 'clubs'] as const,
    queryFn: async () => (await apiRequest<Club[]>('/epl/clubs')).data,
    staleTime: Infinity, // reference data — clubs don't change mid-season.
  });
}

/** `Club` has no crest/color field (only clubId/name/shortName) — every consumer renders a plain text badge, not the mock-up's per-club hex colors. */
export function useClubsById() {
  const clubs = useClubs();
  const byId = new Map((clubs.data ?? []).map((club) => [club.clubId, club]));
  return { data: byId, isPending: clubs.isPending, error: clubs.error };
}

/**
 * There is no endpoint to discover which EPL seasons exist, or which one is "current"
 * (API Consumption Specification v1.2 §2.3d) — `eplSeasonIdentifier` only ever appears as an
 * input the caller must already know, or as a field on objects that presuppose it. This client
 * infers it from the active League's own current Season (`useCurrentSeason`, shared with
 * Draft/FantasyTeam lookups), on the reasoning that there is only one real Premier League
 * season running at a time, so the *value* this resolves to is genuinely league-independent
 * (BRD UIR-074) even though the *mechanism* consults one League's data to find it.
 */
export function useCurrentEplSeasonIdentifier(leagueId: string) {
  const season = useCurrentSeason(leagueId);
  return { data: season.data?.eplSeasonIdentifier, isPending: season.isPending, error: season.error };
}

export function useEplTable(eplSeasonIdentifier: string | undefined) {
  return useQuery({
    queryKey: ['epl', 'table', eplSeasonIdentifier] as const,
    queryFn: async () =>
      (await apiRequest<ClubStanding[]>(`/epl/seasons/${encodeURIComponent(eplSeasonIdentifier!)}/table`)).data,
    enabled: Boolean(eplSeasonIdentifier),
  });
}

export function useEplGameweeks(eplSeasonIdentifier: string | undefined) {
  return useQuery({
    queryKey: ['epl', 'gameweeks', eplSeasonIdentifier] as const,
    queryFn: async () =>
      (await apiRequest<Gameweek[]>('/epl/gameweeks', { query: { eplSeasonIdentifier } })).data,
    enabled: Boolean(eplSeasonIdentifier),
  });
}

/**
 * No endpoint says "this is the current Gameweek" either — same underlying gap as
 * `useCurrentSeason`/`useCurrentDraft` (API Consumption Specification, now its fourth instance),
 * inferred here as whichever Gameweek's roster-lock deadline hasn't passed yet, falling back to
 * the last one if the season has none left. Backs Dashboard's scorebug (BRD UIR-035).
 */
export function useCurrentGameweek(eplSeasonIdentifier: string | undefined) {
  const gameweeks = useEplGameweeks(eplSeasonIdentifier);
  const now = useNow(60_000);
  const sorted = [...(gameweeks.data ?? [])].sort((a, b) => a.number - b.number);
  const current = sorted.find((gw) => new Date(gw.rosterLockDeadline).getTime() > now) ?? sorted[sorted.length - 1];
  return { data: current, isPending: gameweeks.isPending, error: gameweeks.error };
}

/**
 * There's no batch "get players by id" endpoint, so this fires one `getPlayer` request per id
 * via `useQueries` — fine for the small counts this is actually used for (e.g. a handful of
 * recent draft picks), not meant for resolving a whole pool's worth of ids at once.
 */
export function usePlayersByIds(playerIds: string[]) {
  const results = useQueries({
    queries: playerIds.map((playerId) => ({
      queryKey: ['epl', 'players', playerId] as const,
      queryFn: async () => (await apiRequest<Player>(`/epl/players/${playerId}`)).data,
      staleTime: Infinity, // reference data
    })),
  });
  const byId = new Map<string, Player>();
  results.forEach((r) => {
    if (r.data) byId.set(r.data.playerId, r.data);
  });
  return { data: byId, isPending: results.some((r) => r.isPending) };
}

export function useGameweekFixtures(gameweekId: string | undefined) {
  return useQuery({
    queryKey: ['epl', 'gameweeks', gameweekId, 'fixtures'] as const,
    queryFn: async () => (await apiRequest<Fixture[]>(`/epl/gameweeks/${gameweekId}/fixtures`)).data,
    enabled: Boolean(gameweekId),
    // Architecture v1.2 §8: live fixtures need to stay current while the screen is open.
    // Re-checked every 30s regardless of whether anything is actually live yet, since the
    // (cheap) response is how we'd find out a fixture just kicked off.
    refetchInterval: 30_000,
  });
}
