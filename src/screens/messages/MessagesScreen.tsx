import { useState, type FormEvent } from 'react';
import { useActiveLeague } from '../../state/useActiveLeague';
import { useLeagueMemberships, useMyMembership } from '../../api/hooks/useLeagueSeason';
import { useLeagueMessages, usePublishLeagueMessage } from '../../api/hooks/useMessages';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';

/**
 * Implements BRD UIR-118–124 (F-UI-004.1). The composer is gated on `LeagueMembership.isAdministrator`
 * (BR-221/BR-222) rather than the route itself — unlike Audit Log/Score Corrections (`ADMIN_NAV_GROUP`),
 * Messages is reachable by every league member (`TRAILING_NAV_ITEMS`); only *publishing* is restricted.
 * `createLeagueMessage`'s own description confirms the body is output-encoded on render and never
 * interpreted as markup (BR-167) — this screen renders it as plain text with `white-space: pre-wrap`
 * to preserve line breaks (UIR-121), never `dangerouslySetInnerHTML`.
 */
export function MessagesScreen() {
  const { activeLeagueId } = useActiveLeague();
  const myMembership = useMyMembership(activeLeagueId);
  const memberships = useLeagueMemberships(activeLeagueId);
  const messages = useLeagueMessages(activeLeagueId);
  const publishMessage = usePublishLeagueMessage(activeLeagueId);

  const [draftBody, setDraftBody] = useState('');
  const [publishError, setPublishError] = useState<string | null>(null);
  const [newlyPublishedIds, setNewlyPublishedIds] = useState<Set<string>>(new Set());

  const isPending = myMembership.isPending || memberships.isPending || messages.isPending;
  if (isPending) return <LoadingState label="Loading Messages…" />;

  const error = myMembership.error ?? memberships.error ?? messages.error;
  if (error) return <ErrorState error={error} onRetry={() => messages.refetch()} />;

  const membershipsById = new Map(memberships.data.map((m) => [m.leagueMembershipId, m]));
  const feed = [...(messages.data ?? [])].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  async function handlePublish(e: FormEvent) {
    e.preventDefault();
    setPublishError(null);
    const body = draftBody.trim();
    if (!body) return;
    try {
      const published = await publishMessage.mutateAsync(body);
      setNewlyPublishedIds((prev) => new Set(prev).add(published.leagueMessageId));
      setDraftBody('');
    } catch {
      setPublishError('Could not publish your message — try again.');
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Messages</h1>

      {myMembership.data?.isAdministrator ? (
        <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>Publish an Announcement</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', marginBottom: 10 }}>
            Visible to every active member of this league.
          </p>
          <form onSubmit={handlePublish}>
            <textarea
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              maxLength={4000}
              rows={4}
              placeholder="Write an announcement for the league…"
              aria-label="Message body"
              style={{ width: '100%', resize: 'vertical', fontSize: '0.92rem', padding: 8 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="submit" disabled={publishMessage.isPending || draftBody.trim() === ''}>
                {publishMessage.isPending ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </form>
          {publishError && <ErrorState error={new Error(publishError)} onRetry={() => setPublishError(null)} />}
        </section>
      ) : (
        <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-dim)' }}>
            Only this league's Administrator can publish messages here.
          </p>
        </section>
      )}

      {feed.length === 0 ? (
        <EmptyState>No messages have been published in this league yet.</EmptyState>
      ) : (
        <div className="card">
          {feed.map((message, index) => {
            const author = membershipsById.get(message.authorMembershipId);
            const isNew = newlyPublishedIds.has(message.leagueMessageId);
            return (
              <div
                key={message.leagueMessageId}
                style={{
                  padding: '14px 20px',
                  borderTop: index === 0 ? 'none' : '1px solid var(--line)',
                  background: isNew ? 'var(--turf-soft)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                  <b>{author?.username ?? '—'}</b>
                  {author?.isAdministrator && <span className="scope-badge">League Administrator</span>}
                  {isNew && <span className="scope-badge league">New</span>}
                  <time style={{ marginLeft: 'auto', fontSize: '0.76rem', color: 'var(--ink-dim)' }}>
                    {new Date(message.publishedAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </time>
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', whiteSpace: 'pre-wrap' }}>{message.body}</p>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', marginTop: 14 }}>
        Messages are retained permanently, under the same historical-retention policy as the rest of this
        league's data (BR-223) — nothing published here is ever silently removed.
      </p>
    </div>
  );
}
