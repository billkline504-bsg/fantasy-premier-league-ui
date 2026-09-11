import { useState, type FormEvent } from 'react';
import { useActiveLeague } from '../../state/useActiveLeague';
import { useCurrentUser } from '../../api/hooks/useIdentity';
import { useLeagueMemberships } from '../../api/hooks/useLeagueSeason';
import { useAuditLog } from '../../api/hooks/useAuditLog';
import { useCreateScoreOverride, useUndoScoreOverride } from '../../api/hooks/useScoreOverrides';
import type { AdministrativeAction, ScoreOverride } from '../../api/types';
import { ApiError } from '../../api/client';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { summarizeChange } from './auditFormat';

/**
 * Implements BRD UIR-135–144 (F-UI-004.3). Reached only through `RequireLeagueAdministrator`
 * (AppRoutes), same as Audit Log.
 *
 * **The most consequential finding in this whole client (API Consumption Specification v1.10
 * §2.3s)**: there is no `PlayerPerformance`-lookup endpoint anywhere in the 71-endpoint surface
 * — `playerPerformanceId` appears only inside `ScoreOverride`/`ScoreOverrideRequest` themselves.
 * That means this screen cannot offer a player+Gameweek picker or show "the current Official
 * FPL value" the way BRD UIR-136 depicts — there is nothing to look either up against. The form
 * below takes a raw `playerPerformanceId` an administrator must already have from some
 * out-of-band source, rather than a picker. Separately, there is no endpoint to *list* existing
 * `ScoreOverride` records at all (§2.3r) — the Active/Recently-Undone tables (UIR-139/141) are
 * reconstructed from Audit Log's own `ScoreOverride`/`ScoreOverrideUndo` entries instead, which
 * BRD UIR-143 already frames as "two views into overlapping, not independent, data."
 */
export function ScoreCorrectionsScreen() {
  const { activeLeagueId } = useActiveLeague();
  const currentUser = useCurrentUser();
  const memberships = useLeagueMemberships(activeLeagueId);
  // A page of 200 (the documented max) rather than Audit Log's default 50 — this
  // reconstructed view isn't meant to be a deep historical browse; an override older than the
  // 200 most recent of its type won't appear here (a real, if narrow, limitation — see the
  // full history on the Audit Log screen itself, which does paginate).
  const overrideActions = useAuditLog(activeLeagueId, { actionType: 'ScoreOverride' }, 200);
  const undoActions = useAuditLog(activeLeagueId, { actionType: 'ScoreOverrideUndo' }, 200);

  const createOverride = useCreateScoreOverride(activeLeagueId);
  const undoOverride = useUndoScoreOverride(activeLeagueId);

  const [playerPerformanceId, setPlayerPerformanceId] = useState('');
  const [fieldName, setFieldName] = useState('goals');
  const [fieldValue, setFieldValue] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState<ScoreOverride | null>(null);
  const [undoError, setUndoError] = useState<string | null>(null);

  const isPending = currentUser.isPending || memberships.isPending || overrideActions.isPending || undoActions.isPending;
  if (isPending) return <LoadingState label="Loading Score Corrections…" />;

  const error = currentUser.error ?? memberships.error ?? overrideActions.error ?? undoActions.error;
  if (error) return <ErrorState error={error} onRetry={() => overrideActions.refetch()} />;

  const membershipsById = new Map(memberships.data.map((m) => [m.leagueMembershipId, m]));
  const overrides = overrideActions.data?.pages[0]?.items ?? [];
  const undos = undoActions.data?.pages[0]?.items ?? [];
  const undoByTargetId = new Map(undos.map((u) => [u.targetEntityId, u]));

  const active = [...overrides]
    .filter((o) => !undoByTargetId.has(o.targetEntityId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const undone = [...overrides]
    .filter((o) => undoByTargetId.has(o.targetEntityId))
    .map((o) => ({ override: o, undo: undoByTargetId.get(o.targetEntityId)! }))
    .sort((a, b) => b.undo.createdAt.localeCompare(a.undo.createdAt));

  function actorName(action: AdministrativeAction): string {
    return action.actingMembershipId ? (membershipsById.get(action.actingMembershipId)?.username ?? '—') : '—';
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const numericValue = Number(fieldValue);
    if (!playerPerformanceId.trim() || !fieldName.trim() || !Number.isFinite(numericValue)) {
      setFormError('Enter a PlayerPerformance id, a field name, and a numeric value.');
      return;
    }
    try {
      const created = await createOverride.mutateAsync({
        playerPerformanceId: playerPerformanceId.trim(),
        overrideValue: { [fieldName.trim()]: numericValue },
        reason: reason.trim() || undefined,
      });
      setLastSubmitted(created);
      setPlayerPerformanceId('');
      setFieldValue('');
      setReason('');
    } catch {
      setFormError('Could not apply this override — check the PlayerPerformance id and try again.');
    }
  }

  async function handleUndo(scoreOverrideId: string) {
    setUndoError(null);
    try {
      await undoOverride.mutateAsync(scoreOverrideId);
    } catch (err) {
      setUndoError(
        err instanceof ApiError ? (err.problem.detail ?? 'Could not undo this override.') : 'Could not undo this override.',
      );
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Score Corrections</h1>

      <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 10 }}>Authority Order</h3>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>
            <b>Active Administrator Override</b> — wins every time, until undone.
          </li>
          <li>
            <b>Official FPL Data</b> — authoritative whenever no override is active.
          </li>
          <li>
            <b>Application Calculation</b> — the fallback of last resort.
          </li>
        </ol>
      </section>

      <section
        className="card"
        style={{ marginBottom: 18, padding: '16px 20px', borderColor: 'var(--live)', background: 'var(--live-soft)' }}
      >
        <p style={{ margin: 0, fontSize: '0.82rem' }}>
          There is no endpoint in this platform's API to look up a player's Gameweek statistic record (a
          "PlayerPerformance") by player and Gameweek, or to see its current Official FPL value. Because of that,
          this form cannot offer a player/Gameweek picker or a before-you-submit value comparison the way the
          original design intended — it takes the PlayerPerformance id directly, which you must already have from
          another source.
        </p>
      </section>

      <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>Apply an Override</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', marginBottom: 12 }}>
          Official-data corrections are detected and applied automatically. Use this form only for cases needing a
          human to step in before the next sync, or where the official data itself is disputed.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', color: 'var(--ink-dim)' }}>
            PlayerPerformance ID
            <input
              type="text"
              value={playerPerformanceId}
              onChange={(e) => setPlayerPerformanceId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              style={{ minWidth: 260 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', color: 'var(--ink-dim)' }}>
            Field
            <input type="text" value={fieldName} onChange={(e) => setFieldName(e.target.value)} style={{ width: 120 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', color: 'var(--ink-dim)' }}>
            Value
            <input type="number" value={fieldValue} onChange={(e) => setFieldValue(e.target.value)} style={{ width: 100 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', color: 'var(--ink-dim)', flex: 1, minWidth: 200 }}>
            Reason (optional)
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <button type="submit" disabled={createOverride.isPending}>
            {createOverride.isPending ? 'Applying…' : 'Apply Override'}
          </button>
        </form>
        {formError && <ErrorState error={new Error(formError)} onRetry={() => setFormError(null)} />}

        {lastSubmitted && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--turf)',
              background: 'var(--turf-soft)',
            }}
          >
            <span className="scope-badge league" style={{ marginBottom: 6, display: 'inline-flex' }}>
              Manually Overridden
            </span>
            <p style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>
              {JSON.stringify(lastSubmitted.originalValue ?? {})} → {JSON.stringify(lastSubmitted.overrideValue ?? {})}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: 'var(--ink-dim)' }}>
              Applied by {currentUser.data.username} at{' '}
              {new Date(lastSubmitted.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        )}
      </section>

      <section style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 10 }}>Active Overrides</h3>
        {undoError && <ErrorState error={new Error(undoError)} onRetry={() => setUndoError(null)} />}
        {active.length === 0 ? (
          <EmptyState>No overrides are currently active in this league.</EmptyState>
        ) : (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr>
                  {['PlayerPerformance', 'Change', 'Reason', 'Administrator', 'Applied At', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '9px 12px', color: 'var(--ink-dim)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.map((action) => (
                  <tr key={action.actionId} style={{ borderTop: '1px solid var(--line)' }}>
                    <td className="tabular" style={{ padding: '9px 12px' }} title={action.targetEntityId}>
                      {action.targetEntityId.slice(0, 8)}…
                    </td>
                    <td style={{ padding: '9px 12px' }}>{summarizeChange(action.beforeState, action.afterState)}</td>
                    <td style={{ padding: '9px 12px' }}>{action.reason ?? '—'}</td>
                    <td style={{ padding: '9px 12px' }}>{actorName(action)}</td>
                    <td className="tabular" style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                      {new Date(action.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      <button type="button" onClick={() => handleUndo(action.targetEntityId)} disabled={undoOverride.isPending}>
                        Undo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 10 }}>Recently Undone</h3>
        {undone.length === 0 ? (
          <EmptyState>No overrides have been undone in this league.</EmptyState>
        ) : (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr>
                  {['PlayerPerformance', 'Overridden To', 'Reason', 'Applied At', 'Undone At', 'Undone By'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '9px 12px', color: 'var(--ink-dim)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {undone.map(({ override, undo }) => (
                  <tr key={override.actionId} style={{ borderTop: '1px solid var(--line)' }}>
                    <td className="tabular" style={{ padding: '9px 12px' }} title={override.targetEntityId}>
                      {override.targetEntityId.slice(0, 8)}…
                    </td>
                    <td style={{ padding: '9px 12px' }}>{summarizeChange(override.beforeState, override.afterState)}</td>
                    <td style={{ padding: '9px 12px' }}>{override.reason ?? '—'}</td>
                    <td className="tabular" style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                      {new Date(override.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="tabular" style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                      {new Date(undo.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '9px 12px' }}>{actorName(undo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: '0.76rem', color: 'var(--ink-dim)', padding: '10px 14px 4px' }}>
              Official FPL data (or the application's own calculation, absent that) is now authoritative for each
              of these values.
            </p>
          </div>
        )}
      </section>

      <p style={{ fontSize: '0.76rem', color: 'var(--ink-dim)', marginTop: 18 }}>
        Every override and undo performed here also appears on this league's Audit Log — the two screens are two
        views into the same underlying history, not independent records.
      </p>
    </div>
  );
}
