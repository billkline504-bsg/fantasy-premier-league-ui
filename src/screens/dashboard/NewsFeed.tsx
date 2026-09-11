import type { LeagueMembership, LeagueMessage } from '../../api/types';

// Implements BRD UIR-038, scoped down from what it describes: `LeagueMessage` has no category
// field (Admin/Injury/Result) at all — only {leagueMessageId, leagueId, authorMembershipId,
// body, publishedAt} — and there is no separate "league activity/news" endpoint distinct from
// plain admin-authored messages. This renders the real League Messages feed, newest first,
// with the author's username and a relative timestamp, but without a category tag — see the
// API Consumption Specification for the full finding (there's nothing to tag it with).

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 0)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NewsFeed({
  messages,
  membershipsById,
}: {
  messages: LeagueMessage[];
  membershipsById: Map<string, LeagueMembership>;
}) {
  const recent = [...messages].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 3);

  if (recent.length === 0) {
    return (
      <div className="card" style={{ padding: '16px 20px' }}>
        <p style={{ margin: 0, color: 'var(--ink-dim)', fontSize: '0.85rem' }}>No recent league messages.</p>
      </div>
    );
  }

  return (
    <div className="card">
      {recent.map((message, index) => (
        <div
          key={message.leagueMessageId}
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'baseline',
            padding: '12px 20px',
            borderTop: index === 0 ? 'none' : '1px solid var(--line)',
          }}
        >
          <b style={{ flex: 'none' }}>{membershipsById.get(message.authorMembershipId)?.username ?? '—'}</b>
          <p style={{ margin: 0, fontSize: '0.92rem' }}>{message.body}</p>
          <time style={{ marginLeft: 'auto', flex: 'none', fontSize: '0.76rem', color: 'var(--ink-dim)' }}>
            {relativeTime(message.publishedAt)}
          </time>
        </div>
      ))}
    </div>
  );
}
