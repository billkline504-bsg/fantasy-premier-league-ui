import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getResponseHeader } from '../client';
import type { GameweekRoster } from '../types';

// Query-hook module backing F-UI-003.2 (Lineup). Implements Architecture v1.2 §6.5's
// idempotency/concurrency contract for this pair of endpoints.

function rosterQueryKey(fantasyTeamId: string | undefined, gameweekId: string | undefined) {
  return ['fantasy-teams', fantasyTeamId, 'gameweeks', gameweekId, 'roster'] as const;
}

export function useGameweekRoster(fantasyTeamId: string | undefined, gameweekId: string | undefined) {
  return useQuery({
    queryKey: rosterQueryKey(fantasyTeamId, gameweekId),
    queryFn: async () => {
      const { data, response } = await apiRequest<GameweekRoster>(
        `/fantasy-teams/${fantasyTeamId}/gameweeks/${gameweekId}/roster`,
      );
      // The ETag is only meaningful for the *next* submission against this exact roster read —
      // stored alongside the roster itself so a submit always uses the ETag from the most
      // recent successful GET, never a stale one from an earlier render.
      return { roster: data, etag: getResponseHeader(response, 'ETag') };
    },
    enabled: Boolean(fantasyTeamId) && Boolean(gameweekId),
  });
}

export interface SubmitRosterInput {
  playerIds: string[];
  captainPlayerId?: string;
  ifMatch: string | null;
}

export function useSubmitGameweekRoster(fantasyTeamId: string | undefined, gameweekId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ playerIds, captainPlayerId, ifMatch }: SubmitRosterInput) =>
      (
        await apiRequest<GameweekRoster>(`/fantasy-teams/${fantasyTeamId}/gameweeks/${gameweekId}/roster`, {
          method: 'PUT',
          body: { playerIds, captainPlayerId },
          // Architecture v1.2 §6.5: a fresh key per submit attempt, and the ETag from the last
          // successful GET for optimistic concurrency — a stale one means someone/something
          // (e.g. an administrator correction) changed the roster since we last read it.
          idempotencyKey: crypto.randomUUID(),
          ifMatch: ifMatch ?? undefined,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rosterQueryKey(fantasyTeamId, gameweekId) });
    },
  });
}
