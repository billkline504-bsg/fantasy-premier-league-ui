import { useState } from 'react';
import type { AdministrativeAction, LeagueMembership } from '../../api/types';
import { actionTypeLabel, summarizeChange } from './auditFormat';

/**
 * `targetEntityType` is an unconstrained string (no enum in the spec) and `targetEntityId` is
 * just a bare id — there's no confirmed convention for resolving it to a friendlier label (a
 * player name, a team's username) the way this client can for, say, a Squad row. Shown as-is
 * (type + a truncated id, full id on hover) except for `ConfigurationChanged`, where UIR-131
 * explicitly dictates the literal "League Settings" label regardless of the raw field values.
 */
function targetLabel(action: AdministrativeAction): string {
  if (action.actionType === 'ConfigurationChanged') return 'League Settings';
  return `${action.targetEntityType}`;
}

export function AuditLogRow({
  action,
  membershipsById,
}: {
  action: AdministrativeAction;
  membershipsById: Map<string, LeagueMembership>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const actor = action.actingMembershipId ? membershipsById.get(action.actingMembershipId) : null;
  const isSystemActor = action.actingMembershipId == null;

  return (
    <>
      <tr style={{ borderTop: '1px solid var(--line)' }}>
        <td className="tabular" style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
          {new Date(action.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
        </td>
        <td style={{ padding: '9px 12px' }}>
          {isSystemActor ? (
            <span title="Automatically generated — no human actor (UIR-130)">⚙ System</span>
          ) : (
            (actor?.username ?? '—')
          )}
        </td>
        <td style={{ padding: '9px 12px' }}>
          <span className="scope-badge">{actionTypeLabel(action.actionType)}</span>
        </td>
        <td style={{ padding: '9px 12px' }} title={action.targetEntityId}>
          {targetLabel(action)}
        </td>
        <td style={{ padding: '9px 12px' }}>{summarizeChange(action.beforeState, action.afterState)}</td>
        <td style={{ padding: '9px 12px' }}>{action.reason ?? '—'}</td>
        <td style={{ padding: '9px 12px' }}>
          <button type="button" onClick={() => setIsExpanded((prev) => !prev)}>
            {isExpanded ? 'Hide' : 'Details'}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} style={{ padding: '4px 12px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--live-soft)', border: '1px solid var(--live)', borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 4 }}>
                  Before
                </div>
                <pre style={{ margin: 0, fontSize: '0.78rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(action.beforeState ?? {}, null, 2)}
                </pre>
              </div>
              <div style={{ background: 'var(--turf-soft)', border: '1px solid var(--turf)', borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 4 }}>
                  After
                </div>
                <pre style={{ margin: 0, fontSize: '0.78rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(action.afterState ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
