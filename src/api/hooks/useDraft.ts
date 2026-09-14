import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { Draft, DraftPlayerPoolEntry, DraftSelectionPage, Position } from '../types';

// Query-hook module for the Draft controller area (Architecture v1.2 §6.3). Backs
// F-UI-002.1/002.2 (Draft Board).

export function useDraftsForSeason(leagueId: string, seasonId: string | undefined) {
  return useQuery({
    queryKey: ['leagues', leagueId, 'seasons', seasonId, 'drafts'] as const,
    queryFn: async () =>
      (await apiRequest<Draft[]>(`/leagues/${leagueId}/seasons/${seasonId}/drafts`)).data,
    enabled: Boolean(leagueId) && Boolean(seasonId),
  });
}

/**
 * There is no "current draft" endpoint, and `Draft` carries no timestamp to sort by, so — like
 * `useCurrentSeason` — this is a heuristic: prefer whichever draft is actually `InProgress` or
 * `Paused` (someone needs to see it right now), else the next `Scheduled` one, else the last
 * `Completed` one in the array (assumed creation order) so Draft Board still has something
 * sensible to show and can render its "complete" state (BRD UIR-109) rather than nothing.
 */
export function useCurrentDraft(leagueId: string, seasonId: string | undefined) {
  const drafts = useDraftsForSeason(leagueId, seasonId);
  const list = drafts.data ?? [];
  const current =
    list.find((d) => d.status === 'InProgress') ??
    list.find((d) => d.status === 'Paused') ??
    list.find((d) => d.status === 'Scheduled') ??
    [...list].reverse().find((d) => d.status === 'Completed');
  return { data: current, isPending: drafts.isPending, error: drafts.error };
}

export function draftQueryKey(draftId: string | undefined) {
  return ['drafts', draftId] as const;
}

export function useDraft(draftId: string | undefined) {
  return useQuery({
    queryKey: draftQueryKey(draftId),
    queryFn: async () => (await apiRequest<Draft>(`/drafts/${draftId}`)).data,
    enabled: Boolean(draftId),
    // Architecture v1.2 §8: turn/timer state is time-boxed and actively misleading if stale —
    // polled every 3-5s while a draft is open, regardless of status (cheap, and status itself
    // can change between polls, e.g. Scheduled -> InProgress).
    refetchInterval: 4_000,
  });
}

export interface DraftPoolFilter {
  position?: Position;
  search?: string;
  sort?: string;
}

export function useDraftPlayerPool(draftId: string | undefined, filter: DraftPoolFilter) {
  return useQuery({
    queryKey: ['drafts', draftId, 'player-pool', filter] as const,
    queryFn: async () =>
      (
        await apiRequest<DraftPlayerPoolEntry[]>(`/drafts/${draftId}/player-pool`, {
          query: { position: filter.position, search: filter.search || undefined, sort: filter.sort ?? undefined },
        })
      ).data,
    enabled: Boolean(draftId),
  });
}

/**
 * `listDraftSelections` isn't filterable by team server-side — History's Draft History view
 * (BRD UIR-094/095) fetches the whole draft's picks and filters/sorts client-side, so it needs
 * a fuller single page than Draft Board's Recent Picks panel does. A season's full squad size
 * across every team (e.g. 25 × a double-digit team count) could in principle exceed even the
 * documented 200-row max in a very large league — no "Load more" is built here, matching the
 * same scope choice already made for Score Corrections/Security's single-page consumptions.
 */
export function useDraftSelections(draftId: string | undefined, pageSize = 50) {
  return useQuery({
    queryKey: ['drafts', draftId, 'selections', pageSize] as const,
    queryFn: async () =>
      (await apiRequest<DraftSelectionPage>(`/drafts/${draftId}/selections`, { query: { limit: pageSize } })).data,
    enabled: Boolean(draftId),
  });
}

/**
 * `pauseDraft`/`resumeDraft` (BRD UIR-217): League-Administrator-only, no request body, return
 * the full `Draft` object with no documented error responses. Both invalidate the same draft
 * query the 3-5s poll (above) already holds, so a pause/resume this client itself triggers
 * reflects immediately rather than waiting for the next poll tick.
 */
export function usePauseDraft(draftId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await apiRequest<Draft>(`/drafts/${draftId}/pause`, { method: 'POST' })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: draftQueryKey(draftId) }),
  });
}

export function useResumeDraft(draftId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await apiRequest<Draft>(`/drafts/${draftId}/resume`, { method: 'POST' })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: draftQueryKey(draftId) }),
  });
}

export function useMakeDraftPick(draftId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (playerId: string) =>
      (
        await apiRequest(`/drafts/${draftId}/picks`, {
          method: 'POST',
          body: { playerId },
          // Architecture v1.2 §6.5 / API Consumption Specification §5: a fresh key per pick
          // attempt, not reused across retries of what the user perceives as the same click.
          idempotencyKey: crypto.randomUUID(),
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: draftQueryKey(draftId) });
      queryClient.invalidateQueries({ queryKey: ['drafts', draftId, 'player-pool'] });
      queryClient.invalidateQueries({ queryKey: ['drafts', draftId, 'selections'] });
    },
  });
}
