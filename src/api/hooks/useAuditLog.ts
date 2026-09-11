import { useInfiniteQuery } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { AdministrativeActionPage, AdminActionType } from '../types';

// Query-hook module for the Administration controller area (Architecture v1.2 §6.3). Backs
// F-UI-004.2 (Audit Log) — the first screen in this client to actually exercise the cursor
// pagination contract (04-user-stories AC10, Architecture §11) with a real "Load more" UI,
// rather than fetching a single fixed-size first page the way Draft Board's Recent Picks does.

export interface AuditLogFilter {
  actionType?: AdminActionType;
  from?: string;
  to?: string;
  /** A real FantasyTeam id, or the `"__league_settings__"` sentinel (API Consumption Spec §2.3n-style note in getAuditLog's own description) for config-change rows with no owning team. */
  fantasyTeamId?: string;
}

export function useAuditLog(leagueId: string, filter: AuditLogFilter, pageSize = 50) {
  return useInfiniteQuery({
    queryKey: ['leagues', leagueId, 'audit', filter, pageSize] as const,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) =>
      (
        await apiRequest<AdministrativeActionPage>(`/leagues/${leagueId}/audit`, {
          query: {
            actionType: filter.actionType,
            from: filter.from,
            to: filter.to,
            fantasyTeamId: filter.fantasyTeamId,
            limit: pageSize,
            cursor: pageParam,
          },
        })
      ).data,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(leagueId),
  });
}
