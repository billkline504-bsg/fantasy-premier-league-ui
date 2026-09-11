import { useState, type FormEvent } from 'react';
import { useActiveLeague } from '../../state/useActiveLeague';
import { useLeagueConfiguration } from '../../api/hooks/useLeagueSeason';
import { useCreateInvitation, useLeagueInvitations, useRevokeInvitation } from '../../api/hooks/useInvitation';
import type { InvitationChannel } from '../../api/types';
import { ApiError } from '../../api/client';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';

/**
 * Implements BRD UIR-202–207 (F-UI-001.11). Reached only through `RequireLeagueAdministrator`.
 * The `Invitation` schema returned by `listInvitations`/`createInvitation` carries no `channel`
 * field at all — only `CreateInvitationRequest` (the send-side request body) does — so the
 * list below cannot show which channel a past invitation was sent through; the column simply
 * isn't there rather than guessed or left blank.
 */
export function InvitationsScreen() {
  const { activeLeagueId } = useActiveLeague();
  const leagueConfig = useLeagueConfiguration(activeLeagueId);
  const invitations = useLeagueInvitations(activeLeagueId);
  const createInvitation = useCreateInvitation(activeLeagueId);
  const revokeInvitation = useRevokeInvitation(activeLeagueId);

  const [destination, setDestination] = useState('');
  const [channel, setChannel] = useState<InvitationChannel>('Email');
  const [formError, setFormError] = useState<string | null>(null);
  const [sentConfirmation, setSentConfirmation] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const isPending = leagueConfig.isPending || invitations.isPending;
  if (isPending) return <LoadingState label="Loading Invitations…" />;

  const error = leagueConfig.error ?? invitations.error;
  if (error) return <ErrorState error={error} onRetry={() => invitations.refetch()} />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSentConfirmation(null);
    try {
      const invitation = await createInvitation.mutateAsync({ destination, channel });
      setSentConfirmation(`Invitation sent to ${invitation.destination}.`);
      setDestination('');
    } catch (err) {
      setFormError(err instanceof ApiError ? (err.problem.detail ?? 'Could not send this invitation.') : 'Could not send this invitation.');
    }
  }

  async function handleRevoke(invitationId: string) {
    setRevokeError(null);
    try {
      await revokeInvitation.mutateAsync(invitationId);
    } catch (err) {
      setRevokeError(err instanceof ApiError ? (err.problem.detail ?? 'Could not revoke this invitation.') : 'Could not revoke this invitation.');
    }
  }

  const sorted = [...(invitations.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Invitations</h1>

      <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>Send an Invitation</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', marginBottom: 12 }}>
          Invitations expire after {leagueConfig.data.invitationExpirationDays} days.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', color: 'var(--ink-dim)', minWidth: 240 }}>
            Destination (email or phone)
            <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} required style={{ padding: 8 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', color: 'var(--ink-dim)' }}>
            Channel
            <select value={channel} onChange={(e) => setChannel(e.target.value as InvitationChannel)}>
              <option value="Email">Email</option>
              <option value="Sms">Text (SMS)</option>
            </select>
          </label>
          <button type="submit" disabled={createInvitation.isPending}>
            {createInvitation.isPending ? 'Sending…' : 'Send Invitation'}
          </button>
        </form>
        {formError && <ErrorState error={new Error(formError)} onRetry={() => setFormError(null)} />}
        {sentConfirmation && <p style={{ fontSize: '0.82rem', color: 'var(--turf)', marginTop: 10 }}>{sentConfirmation}</p>}
      </section>

      {revokeError && <ErrorState error={new Error(revokeError)} onRetry={() => setRevokeError(null)} />}

      {sorted.length === 0 ? (
        <EmptyState>No invitations have been sent for this league yet.</EmptyState>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                {['Destination', 'Status', 'Expires', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 14px', color: 'var(--ink-dim)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((invitation) => (
                <tr key={invitation.invitationId} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '9px 14px' }}>{invitation.destination}</td>
                  <td style={{ padding: '9px 14px' }}>{invitation.status}</td>
                  <td className="tabular" style={{ padding: '9px 14px' }}>
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    {invitation.status === 'Pending' && (
                      <button type="button" onClick={() => handleRevoke(invitation.invitationId)} disabled={revokeInvitation.isPending}>
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
