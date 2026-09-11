import { useActiveLeague } from '../../state/useActiveLeague';
import { useCurrentSeason, useFantasyTeams, useLeagueConfiguration, useMyFantasyTeam } from '../../api/hooks/useLeagueSeason';
import { useStandings } from '../../api/hooks/useCompetition';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';

// Implements BRD UIR-064–068 (F-UI-003.3). Team identity throughout is `username` — no
// separate "team name" field exists (API Consumption Specification v1.3 §2.3g, BRD DEC-UI-015)
// — so UIR-068's "both the FantasyTeam name and the managing user's username" is satisfied by
// showing the one identity that actually exists, consistent with every other screen so far.

const COLUMNS = ['Pos', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Cap Pts', 'Pts'];

export function TableScreen() {
  const { activeLeagueId } = useActiveLeague();
  const season = useCurrentSeason(activeLeagueId);
  const standings = useStandings(activeLeagueId, season.data?.seasonId);
  const fantasyTeams = useFantasyTeams(activeLeagueId, season.data?.seasonId);
  const configuration = useLeagueConfiguration(activeLeagueId);
  const myFantasyTeam = useMyFantasyTeam(activeLeagueId, season.data?.seasonId);

  const isPending = season.isPending || standings.isPending || fantasyTeams.isPending || configuration.isPending || myFantasyTeam.isPending;
  if (isPending) return <LoadingState label="Loading the League Table…" />;

  const error = season.error ?? standings.error ?? fantasyTeams.error ?? configuration.error ?? myFantasyTeam.error;
  if (error) return <ErrorState error={error} onRetry={() => standings.refetch()} />;

  const fantasyTeamsById = new Map(fantasyTeams.data.map((t) => [t.fantasyTeamId, t]));
  const rows = [...(standings.data ?? [])].sort((a, b) => a.position - b.position);
  const { win, draw, loss } = configuration.data.leaguePoints;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>League Table</h1>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              {COLUMNS.map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--ink-dim)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isMe = row.fantasyTeamId === myFantasyTeam.data?.fantasyTeamId;
              return (
                <tr
                  key={row.fantasyTeamId}
                  style={{ borderTop: '1px solid var(--line)', background: isMe ? 'var(--turf-soft)' : undefined }}
                >
                  <td className="tabular" style={{ padding: '9px 14px' }}>{row.position}</td>
                  <td style={{ padding: '9px 14px' }}>{fantasyTeamsById.get(row.fantasyTeamId)?.username ?? '—'}</td>
                  <td className="tabular" style={{ padding: '9px 14px' }}>{row.played}</td>
                  <td className="tabular" style={{ padding: '9px 14px' }}>{row.won}</td>
                  <td className="tabular" style={{ padding: '9px 14px' }}>{row.drawn}</td>
                  <td className="tabular" style={{ padding: '9px 14px' }}>{row.lost}</td>
                  <td className="tabular" style={{ padding: '9px 14px' }}>{row.fantasyGoalsFor}</td>
                  <td className="tabular" style={{ padding: '9px 14px' }}>{row.fantasyGoalsAgainst}</td>
                  <td
                    className="tabular"
                    style={{ padding: '9px 14px', color: row.fantasyGoalDifference >= 0 ? 'var(--turf)' : 'var(--live)' }}
                  >
                    {row.fantasyGoalDifference >= 0 ? '+' : ''}
                    {row.fantasyGoalDifference}
                  </td>
                  <td className="tabular" style={{ padding: '9px 14px' }}>{row.captainPointsTotal}</td>
                  <td className="tabular" style={{ padding: '9px 14px', fontWeight: 700, color: 'var(--gold)' }}>
                    {row.leaguePoints}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', padding: '14px 20px 4px', fontSize: '0.76rem', color: 'var(--ink-dim)' }}>
          <span>
            <b style={{ color: 'var(--ink-muted)' }}>Pts</b> {win} for a win, {draw} for a draw{loss ? `, ${loss} for a loss` : ''}
          </span>
          <span>
            <b style={{ color: 'var(--ink-muted)' }}>Tie-break order</b> Pts → GD → GF → H2H → Captain Pts → Season Prediction → Random
          </span>
        </div>
      </div>
    </div>
  );
}
