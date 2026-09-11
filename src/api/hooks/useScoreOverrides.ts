import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { ScoreOverride } from '../types';

/**
 * Query-hook module backing F-UI-004.3 (Score Corrections). There is no endpoint to list or
 * browse `ScoreOverride` records at all — `createScoreOverride`/`undoScoreOverride` each only
 * ever return the single record they just acted on (API Consumption Specification v1.10 §2.3r)
 * — so this module is mutations only. The Active/Recently-Undone tables this screen needs are
 * reconstructed from Audit Log entries instead (`useAuditLog`, filtered to `ScoreOverride`/
 * `ScoreOverrideUndo`), which is why both mutations below invalidate Audit Log's query key
 * rather than any override-specific one — that's the only place either table's data actually
 * lives.
 */

export interface CreateScoreOverrideInput {
  playerPerformanceId: string;
  overrideValue: Record<string, number>;
  reason?: string;
}

export function useCreateScoreOverride(leagueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateScoreOverrideInput) =>
      (await apiRequest<ScoreOverride>('/admin/score-overrides', { method: 'POST', body })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leagues', leagueId, 'audit'] }),
  });
}

export function useUndoScoreOverride(leagueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scoreOverrideId: string) =>
      (await apiRequest<ScoreOverride>(`/admin/score-overrides/${scoreOverrideId}/undo`, { method: 'POST' })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leagues', leagueId, 'audit'] }),
  });
}
