import { Link } from 'react-router-dom';
import type { FantasyTeam, LeagueStanding } from '../../api/types';

// Implements BRD UIR-039 (condensed standings, own row highlighted, link to full table) and
// UIR-040 (own-row highlighting convention).

export function CondensedStandings({
  standings,
  myFantasyTeamId,
  fantasyTeamsById,
  activeLeagueId,
}: {
  standings: LeagueStanding[];
  myFantasyTeamId: string;
  fantasyTeamsById: Map<string, FantasyTeam>;
  activeLeagueId: string;
}) {
  const top = [...standings].sort((a, b) => a.position - b.position).slice(0, 5);

  return (
    <div className="card">
      <div style={{ padding: '14px 20px 0' }}>
        <h2 style={{ fontSize: '1.15rem' }}>Standings</h2>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginTop: 8 }}>
        <thead>
          <tr>
            {['#', 'Team', 'P', 'Pts', 'GD'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 20px', color: 'var(--ink-dim)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {top.map((row) => {
            const isMe = row.fantasyTeamId === myFantasyTeamId;
            return (
              <tr
                key={row.fantasyTeamId}
                style={{ borderTop: '1px solid var(--line)', background: isMe ? 'var(--turf-soft)' : undefined }}
              >
                <td style={{ padding: '8px 20px' }}>{row.position}</td>
                <td style={{ padding: '8px 20px' }}>{fantasyTeamsById.get(row.fantasyTeamId)?.username ?? '—'}</td>
                <td className="tabular" style={{ padding: '8px 20px' }}>{row.played}</td>
                <td className="tabular" style={{ padding: '8px 20px' }}>{row.leaguePoints}</td>
                <td
                  className="tabular"
                  style={{ padding: '8px 20px', color: row.fantasyGoalDifference >= 0 ? 'var(--turf)' : 'var(--live)' }}
                >
                  {row.fantasyGoalDifference >= 0 ? '+' : ''}
                  {row.fantasyGoalDifference}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ padding: '10px 20px 16px' }}>
        <Link to={`/leagues/${activeLeagueId}/table`} style={{ color: 'var(--turf)', fontWeight: 700, fontSize: '0.85rem' }}>
          View full table →
        </Link>
      </div>
    </div>
  );
}
