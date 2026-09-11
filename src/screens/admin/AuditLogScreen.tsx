import { useState } from 'react';
import { useActiveLeague } from '../../state/useActiveLeague';
import { useCurrentUser } from '../../api/hooks/useIdentity';
import { useCurrentSeason, useFantasyTeams, useLeagueMemberships } from '../../api/hooks/useLeagueSeason';
import { useAuditLog, type AuditLogFilter } from '../../api/hooks/useAuditLog';
import type { AdminActionType } from '../../api/types';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { AuditLogRow } from './AuditLogRow';
import { actionTypeLabel } from './auditFormat';

const ACTION_TYPES: AdminActionType[] = [
  'RosterCorrection',
  'ScoreOverride',
  'ScoreOverrideUndo',
  'ReplacementEligibilityGranted',
  'SeasonEndingInjuryDeclared',
  'DraftTimerExtended',
  'ConfigurationChanged',
  'Other',
];

const LEAGUE_SETTINGS_SCOPE = '__league_settings__';
const COLUMNS = ['Timestamp', 'Actor', 'Action Type', 'Target', 'Summary', 'Reason', ''];

/**
 * Implements BRD UIR-125–134 (F-UI-004.2). Reached only through `RequireLeagueAdministrator`
 * (AppRoutes) — access denial (UIR-125 AC1) is the route guard's job, not this screen's.
 * Note (v1.9 findings): `AdministrativeAction` carries no dedicated summary/target-team/player
 * fields, only untyped `beforeState`/`afterState` and a free-string `targetEntityType` — see
 * `auditFormat.ts` for how "Summary" and "Target" are derived without assuming an unconfirmed
 * schema. The team-scope filter below only offers the *current* Season's FantasyTeams, since
 * there is no season-independent way to list a league's teams across its whole history.
 */
export function AuditLogScreen() {
  const { activeLeagueId } = useActiveLeague();
  const currentUser = useCurrentUser();
  const season = useCurrentSeason(activeLeagueId);
  const fantasyTeams = useFantasyTeams(activeLeagueId, season.data?.seasonId);
  const memberships = useLeagueMemberships(activeLeagueId);

  const [actionType, setActionType] = useState<AdminActionType | undefined>(undefined);
  const [scope, setScope] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filter: AuditLogFilter = {
    actionType,
    fantasyTeamId: scope || undefined,
    from: fromDate ? `${fromDate}T00:00:00Z` : undefined,
    to: toDate ? `${toDate}T23:59:59Z` : undefined,
  };
  const auditLog = useAuditLog(activeLeagueId, filter);

  const isPending = currentUser.isPending || season.isPending || fantasyTeams.isPending || memberships.isPending || auditLog.isPending;
  if (isPending) return <LoadingState label="Loading Audit Log…" />;

  const error = currentUser.error ?? season.error ?? fantasyTeams.error ?? memberships.error ?? auditLog.error;
  if (error) return <ErrorState error={error} onRetry={() => auditLog.refetch()} />;

  const membershipsById = new Map(memberships.data.map((m) => [m.leagueMembershipId, m]));
  // getAuditLog's own description makes no ordering promise; sorted defensively client-side,
  // consistent with every other list screen in this client that treats order as unguaranteed.
  const actions = [...(auditLog.data?.pages.flatMap((page) => page.items) ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const hasSystemActorRow = actions.some((a) => a.actingMembershipId == null);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <h1 style={{ fontSize: '1.5rem' }}>Audit Log</h1>
        <span className="scope-badge league">League Administrator · {currentUser.data.username}</span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--ink-dim)', marginBottom: 18 }}>
        Visible only to this league's Administrator. Every correction, override, and system-generated eligibility
        grant that has ever touched competitive results is listed below, in reverse-chronological order. Nothing
        here can be edited or deleted.
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
        <div role="group" aria-label="Filter by action type" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" aria-pressed={actionType === undefined} onClick={() => setActionType(undefined)}>
            All
          </button>
          {ACTION_TYPES.map((type) => (
            <button key={type} type="button" aria-pressed={actionType === type} onClick={() => setActionType(type)}>
              {actionTypeLabel(type)}
            </button>
          ))}
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', color: 'var(--ink-dim)' }}>
          Team / Scope
          <select value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Filter by team or league settings">
            <option value="">All</option>
            <option value={LEAGUE_SETTINGS_SCOPE}>League Settings</option>
            {fantasyTeams.data.map((team) => (
              <option key={team.fantasyTeamId} value={team.fantasyTeamId}>
                {team.username}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', color: 'var(--ink-dim)' }}>
          From
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label="From date" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', color: 'var(--ink-dim)' }}>
          To
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} aria-label="To date" />
        </label>
      </div>

      {actions.length === 0 ? (
        <EmptyState>No administrative actions match these filters.</EmptyState>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr>
                {COLUMNS.map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 12px', color: 'var(--ink-dim)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <AuditLogRow key={action.actionId} action={action} membershipsById={membershipsById} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {auditLog.hasNextPage && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
          <button type="button" onClick={() => auditLog.fetchNextPage()} disabled={auditLog.isFetchingNextPage}>
            {auditLog.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}

      {hasSystemActorRow && (
        <p style={{ fontSize: '0.76rem', color: 'var(--ink-dim)', marginTop: 14 }}>
          "System" rows have no human actor — they're generated automatically (currently, only EPL-exit
          replacement-eligibility grants) rather than performed by an administrator.
        </p>
      )}
    </div>
  );
}
