import { Link } from 'react-router-dom';
import type { Club, Fixture } from '../../api/types';

// Implements BRD UIR-044.

export function FixtureStrip({
  fixtures,
  clubsById,
  activeLeagueId,
}: {
  fixtures: Fixture[];
  clubsById: Map<string, Club>;
  activeLeagueId: string;
}) {
  const sorted = [...fixtures].sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime());

  return (
    <div className="card" style={{ padding: '14px 16px', marginBottom: 16 }}>
      <h3 style={{ fontSize: '0.86rem', display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span>Gameweek EPL Schedule</span>
        <Link to={`/leagues/${activeLeagueId}/epl`} style={{ color: 'var(--turf)', fontSize: '0.74rem' }}>
          full fixtures & table →
        </Link>
      </h3>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }}>
        {sorted.map((fixture) => (
          <div
            key={fixture.fixtureId}
            style={{
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 12px',
              border: '1px solid var(--line)',
              borderRadius: 9,
              background: 'var(--surface-2)',
              fontSize: '0.78rem',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{clubsById.get(fixture.homeClubId)?.shortName ?? '—'}</span>
            <span style={{ color: 'var(--ink-dim)', fontSize: '0.68rem' }}>v</span>
            <span>{clubsById.get(fixture.awayClubId)?.shortName ?? '—'}</span>
            <span style={{ color: 'var(--ink-muted)', fontSize: '0.7rem', marginLeft: 2 }}>
              {new Date(fixture.kickoffTime).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
