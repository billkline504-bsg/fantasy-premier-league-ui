import { useQuery } from '@tanstack/react-query';
import { apiRequest, ApiError } from '../client';
import type { GameweekRoster, GameweekScore } from '../types';

/**
 * Query-hook module backing F-UI-004.6 (History)'s Gameweek Roster drill-down. Unlike Lineup's
 * `useGameweekRoster` (`useRoster.ts`), a 404 here is an expected, benign outcome — this
 * environment's seed data doesn't illustrate every team/Gameweek combination the underlying
 * model genuinely supports (BRD UIR-097, BR-174/178/179) — so both hooks below treat it as
 * `data: null` rather than surfacing it through `ErrorState`, the same pattern already
 * established for `useSeasonGoalPrediction`'s documented 404.
 */
export function useHistoricalGameweekRoster(fantasyTeamId: string | undefined, gameweekId: string | undefined) {
  return useQuery({
    queryKey: ['history', 'fantasy-teams', fantasyTeamId, 'gameweeks', gameweekId, 'roster'] as const,
    queryFn: async () => {
      try {
        return (await apiRequest<GameweekRoster>(`/fantasy-teams/${fantasyTeamId}/gameweeks/${gameweekId}/roster`)).data;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: Boolean(fantasyTeamId) && Boolean(gameweekId),
  });
}

export function useGameweekScore(fantasyTeamId: string | undefined, gameweekId: string | undefined) {
  return useQuery({
    queryKey: ['fantasy-teams', fantasyTeamId, 'gameweeks', gameweekId, 'score'] as const,
    queryFn: async () => {
      try {
        return (await apiRequest<GameweekScore>(`/fantasy-teams/${fantasyTeamId}/gameweeks/${gameweekId}/score`)).data;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: Boolean(fantasyTeamId) && Boolean(gameweekId),
  });
}
