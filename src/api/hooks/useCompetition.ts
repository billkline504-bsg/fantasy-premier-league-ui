import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { HeadToHeadMatch, LeagueStanding } from '../types';

// Query-hook module for the Competition controller area (Architecture v1.2 §6.3). Backs
// F-UI-003.1 (Dashboard) and F-UI-003.3/003.4 (Table, Schedule) once those are built.

export function useStandings(leagueId: string, seasonId: string | undefined, asOfGameweekId?: string) {
  return useQuery({
    queryKey: ['leagues', leagueId, 'seasons', seasonId, 'standings', asOfGameweekId ?? null] as const,
    queryFn: async () =>
      (
        await apiRequest<LeagueStanding[]>(`/leagues/${leagueId}/seasons/${seasonId}/standings`, {
          query: { asOfGameweekId },
        })
      ).data,
    enabled: Boolean(leagueId) && Boolean(seasonId),
  });
}

export function useSchedule(leagueId: string, seasonId: string | undefined, gameweekId?: string) {
  return useQuery({
    queryKey: ['leagues', leagueId, 'seasons', seasonId, 'schedule', gameweekId ?? null] as const,
    queryFn: async () =>
      (
        await apiRequest<HeadToHeadMatch[]>(`/leagues/${leagueId}/seasons/${seasonId}/schedule`, {
          query: { gameweekId },
        })
      ).data,
    enabled: Boolean(leagueId) && Boolean(seasonId),
  });
}
