import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { Position, ReplacementOpportunity, SquadPlayerView } from '../types';

// Query-hook module backing F-UI-002.4 (Squad).

export interface SquadFilter {
  position?: Position;
  search?: string;
  sort?: string;
}

export function useSquad(
  leagueId: string,
  seasonId: string | undefined,
  fantasyTeamId: string | undefined,
  filter: SquadFilter,
) {
  return useQuery({
    queryKey: ['leagues', leagueId, 'seasons', seasonId, 'fantasy-teams', fantasyTeamId, 'squad', filter] as const,
    queryFn: async () =>
      (
        await apiRequest<SquadPlayerView[]>(
          `/leagues/${leagueId}/seasons/${seasonId}/fantasy-teams/${fantasyTeamId}/squad`,
          { query: { position: filter.position, search: filter.search || undefined, sort: filter.sort ?? undefined } },
        )
      ).data,
    enabled: Boolean(leagueId) && Boolean(seasonId) && Boolean(fantasyTeamId),
  });
}

/**
 * Per the endpoint's own summary, this lists *unspent* opportunities only — an already-spent
 * one (BR-063/BR-065's replacement pick already made) won't appear here even though the
 * original squad row's `replacementEligibleAt` timestamp is presumably still set as a
 * historical fact. Used to look up the *specific* grant reason (EPL exit vs. season-ending
 * injury, BRD UIR-062) by matching `sourcePlayerId`; a spent opportunity just falls back to a
 * generic eligibility label rather than a wrong or fabricated reason.
 */
export function useReplacementOpportunities(
  leagueId: string,
  seasonId: string | undefined,
  fantasyTeamId: string | undefined,
) {
  return useQuery({
    queryKey: ['leagues', leagueId, 'seasons', seasonId, 'fantasy-teams', fantasyTeamId, 'replacement-opportunities'] as const,
    queryFn: async () =>
      (
        await apiRequest<ReplacementOpportunity[]>(
          `/leagues/${leagueId}/seasons/${seasonId}/fantasy-teams/${fantasyTeamId}/replacement-opportunities`,
        )
      ).data,
    enabled: Boolean(leagueId) && Boolean(seasonId) && Boolean(fantasyTeamId),
  });
}
