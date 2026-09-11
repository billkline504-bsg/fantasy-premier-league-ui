import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, ApiError } from '../client';
import type { SeasonGoalPrediction } from '../types';

// Query-hook module backing F-UI-003.5 (Season Predictions). `getSeasonGoalPrediction`
// documents 404 as "Not yet submitted" — a legitimate state, not an error condition — so every
// hook here treats it as `data: null` rather than surfacing it via `error`.

function predictionQueryKey(leagueId: string, seasonId: string | undefined, fantasyTeamId: string | undefined) {
  return ['leagues', leagueId, 'seasons', seasonId, 'fantasy-teams', fantasyTeamId, 'season-goal-prediction'] as const;
}

async function fetchPredictionOrNull(
  leagueId: string,
  seasonId: string | undefined,
  fantasyTeamId: string | undefined,
): Promise<SeasonGoalPrediction | null> {
  try {
    return (
      await apiRequest<SeasonGoalPrediction>(
        `/leagues/${leagueId}/seasons/${seasonId}/fantasy-teams/${fantasyTeamId}/season-goal-prediction`,
      )
    ).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export function useSeasonGoalPrediction(
  leagueId: string,
  seasonId: string | undefined,
  fantasyTeamId: string | undefined,
) {
  return useQuery({
    queryKey: predictionQueryKey(leagueId, seasonId, fantasyTeamId),
    queryFn: () => fetchPredictionOrNull(leagueId, seasonId, fantasyTeamId),
    enabled: Boolean(leagueId) && Boolean(seasonId) && Boolean(fantasyTeamId),
  });
}

/**
 * The endpoint is per-FantasyTeam only — there is no "list every team's prediction" endpoint —
 * so this fires one request per team via `useQueries`, the same pattern `usePlayersByIds` uses.
 * Fine for a league-sized team count; not meant for anything larger.
 */
export function useSeasonGoalPredictionsForTeams(
  leagueId: string,
  seasonId: string | undefined,
  fantasyTeamIds: string[],
) {
  const results = useQueries({
    queries: fantasyTeamIds.map((fantasyTeamId) => ({
      queryKey: predictionQueryKey(leagueId, seasonId, fantasyTeamId),
      queryFn: () => fetchPredictionOrNull(leagueId, seasonId, fantasyTeamId),
      enabled: Boolean(leagueId) && Boolean(seasonId),
    })),
  });
  const byTeamId = new Map<string, SeasonGoalPrediction | null>();
  results.forEach((r, i) => {
    if (!r.isPending) byTeamId.set(fantasyTeamIds[i], r.data ?? null);
  });
  return { data: byTeamId, isPending: results.some((r) => r.isPending) };
}

export function useSubmitSeasonGoalPrediction(
  leagueId: string,
  seasonId: string | undefined,
  fantasyTeamId: string | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (predictedEplGoals: number) =>
      (
        await apiRequest<SeasonGoalPrediction>(
          `/leagues/${leagueId}/seasons/${seasonId}/fantasy-teams/${fantasyTeamId}/season-goal-prediction`,
          { method: 'PUT', body: { predictedEplGoals } },
        )
      ).data,
    onSuccess: (prediction) => {
      queryClient.setQueryData(predictionQueryKey(leagueId, seasonId, fantasyTeamId), prediction);
    },
  });
}
