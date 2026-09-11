import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { Club, ClubStanding, Fixture, Gameweek, Season } from '../types';

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
 * infers it from the active League's own Seasons (which real-world EPL season a League's
 * current Season is tied to), on the reasoning that there is only one real Premier League
 * season running at a time, so the *value* this resolves to is genuinely league-independent
 * (BRD UIR-074) even though the *mechanism* consults one League's data to find it.
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

export function useCurrentEplSeasonIdentifier(leagueId: string) {
  const seasons = useQuery({
    queryKey: ['leagues', leagueId, 'seasons'] as const,
    queryFn: async () => (await apiRequest<Season[]>(`/leagues/${leagueId}/seasons`)).data,
    enabled: Boolean(leagueId),
  });
  const current = seasons.data ? pickCurrentSeason(seasons.data) : undefined;
  return { data: current?.eplSeasonIdentifier, isPending: seasons.isPending, error: seasons.error };
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
