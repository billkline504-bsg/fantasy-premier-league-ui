import { useState } from 'react';
import { useActiveLeague } from '../../state/useActiveLeague';
import { useLeagueMemberships, useMyMembership, useLeaveLeague } from '../../api/hooks/useLeagueSeason';
import { ApiError } from '../../api/client';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';

/**
 * Implements BRD UIR-208–213 (F-UI-001.12). Reachable by every member (Architecture v1.4 §5.7)
 * — only the Remove action is conditionally admin-gated, the same pattern Messages' composer
 * already establishes for an otherwise-open screen.
 */
export function MembersScreen() {
  const { activeLeagueId } = useActiveLeague();
  const memberships = useLeagueMemberships(activeLeagueId);
  const myMembership = useMyMembership(activeLeagueId);
  const leaveLeague = useLeaveLeague(activeLeagueId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingMembershipId, setPendingMembershipId] = useState<string | null>(null);

  const isPending = memberships.isPending || myMembership.isPending;
  if (isPending) return <LoadingState label="Loading Members…" />;

  const error = memberships.error ?? myMembership.error;
  if (error) return <ErrorState error={error} onRetry={() => memberships.refetch()} />;

  const isAdministrator = Boolean(myMembership.data?.isAdministrator);
  const sorted = [...memberships.data].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));

  async function handleLeaveOrRemove(membershipId: string) {
    setActionError(null);
    setPendingMembershipId(membershipId);
    try {
      await leaveLeague.mutateAsync(membershipId);
    } catch (err) {
      // UIR-211: the sole Administrator's own Leave attempt fails with a 409 because the
      // backend has no way to transfer that role first (BR-025/BR-283) — no such mechanism
      // exists anywhere in the API (BRD §12 item 13), so this is stated plainly rather than
      // shown as a generic error.
      if (err instanceof ApiError && err.status === 409 && membershipId === myMembership.data?.leagueMembershipId) {
        setActionError("You're this league's only Administrator, and there's currently no way to transfer that role, so you can't leave yet.");
      } else {
        setActionError(err instanceof ApiError ? (err.problem.detail ?? 'Could not complete this action.') : 'Could not complete this action.');
      }
    } finally {
      setPendingMembershipId(null);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Members</h1>

      {actionError && <ErrorState error={new Error(actionError)} onRetry={() => setActionError(null)} />}

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              {['Username', 'Role', 'Joined', 'Status', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '9px 14px', color: 'var(--ink-dim)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((member) => {
              const isSelf = member.leagueMembershipId === myMembership.data?.leagueMembershipId;
              const isBusy = leaveLeague.isPending && pendingMembershipId === member.leagueMembershipId;
              return (
                <tr key={member.leagueMembershipId} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '9px 14px' }}>{member.username}</td>
                  <td style={{ padding: '9px 14px' }}>
                    {member.isAdministrator && <span className="scope-badge">Administrator</span>}
                  </td>
                  <td className="tabular" style={{ padding: '9px 14px' }}>{new Date(member.joinedAt).toLocaleDateString()}</td>
                  <td style={{ padding: '9px 14px' }}>{member.status}</td>
                  <td style={{ padding: '9px 14px' }}>
                    {member.status === 'Active' && (
                      <>
                        {isSelf && (
                          <button type="button" onClick={() => handleLeaveOrRemove(member.leagueMembershipId)} disabled={isBusy}>
                            {isBusy ? 'Leaving…' : 'Leave League'}
                          </button>
                        )}
                        {!isSelf && isAdministrator && (
                          <button type="button" onClick={() => handleLeaveOrRemove(member.leagueMembershipId)} disabled={isBusy}>
                            {isBusy ? 'Removing…' : 'Remove'}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
