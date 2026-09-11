import { useFantasyTeams, useLeagueConfiguration, useSeasonConfiguration } from '../../api/hooks/useLeagueSeason';
import { useStandings } from '../../api/hooks/useCompetition';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import type { LeagueConfiguration } from '../../api/types';

const COLUMNS = ['Pos', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Cap Pts', 'Pts'];

/** BRD UIR-093: label, and how to read each configuration field's value, for the snapshot table. */
const CONFIG_ROWS: { label: string; read: (c: LeagueConfiguration) => string }[] = [
  { label: 'Squad Size', read: (c) => String(c.initialSquadSize) },
  { label: 'Weekly Roster Size', read: (c) => String(c.weeklyRosterSize) },
  {
    label: 'Positional Minimums',
    read: (c) => `GK ${c.positionalMinimums.gk} · DEF ${c.positionalMinimums.def} · MID ${c.positionalMinimums.mid} · FWD ${c.positionalMinimums.fwd}`,
  },
  {
    label: 'Draft Timer',
    read: (c) =>
      `Initial ${c.draftTimerSecondsByType.initial}s · Secondary ${c.draftTimerSecondsByType.secondary}s · Replacement ${c.draftTimerSecondsByType.replacement}s`,
  },
  {
    label: 'Points per Result',
    read: (c) => `${c.leaguePoints.win} win · ${c.leaguePoints.draw} draw · ${c.leaguePoints.loss} loss`,
  },
  { label: 'Invitation Expiration Window', read: (c) => `${c.invitationExpirationDays} days` },
];

/** Implements BRD UIR-091–093 (Final Standings drill-down of F-UI-004.6). */
export function FinalStandingsView({ activeLeagueId, seasonId }: { activeLeagueId: string; seasonId: string }) {
  const standings = useStandings(activeLeagueId, seasonId);
  const fantasyTeams = useFantasyTeams(activeLeagueId, seasonId);
  const seasonConfiguration = useSeasonConfiguration(activeLeagueId, seasonId);
  const leagueConfiguration = useLeagueConfiguration(activeLeagueId);

  const isPending = standings.isPending || fantasyTeams.isPending || seasonConfiguration.isPending || leagueConfiguration.isPending;
  if (isPending) return <LoadingState label="Loading final standings…" />;

  const error = standings.error ?? fantasyTeams.error ?? seasonConfiguration.error ?? leagueConfiguration.error;
  if (error) return <ErrorState error={error} onRetry={() => standings.refetch()} />;

  const fantasyTeamsById = new Map(fantasyTeams.data.map((t) => [t.fantasyTeamId, t]));
  const rows = [...standings.data].sort((a, b) => a.position - b.position);
  const champion = rows.find((r) => r.position === 1);
  const championTeam = champion ? fantasyTeamsById.get(champion.fantasyTeamId) : undefined;

  return (
    <div>
      {championTeam && (
        <div
          className="card"
          style={{
            marginBottom: 18,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--gold-ink)',
            border: '1px solid var(--gold)',
          }}
        >
          <span aria-hidden style={{ fontSize: '1.6rem' }}>
            🏆
          </span>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--ink-dim)', textTransform: 'uppercase' }}>Champion</div>
            <b style={{ fontSize: '1.1rem' }}>{championTeam.username}</b>
          </div>
        </div>
      )}

      <div className="card" style={{ overflowX: 'auto', marginBottom: 18 }}>
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
            {rows.map((row) => (
              <tr key={row.fantasyTeamId} style={{ borderTop: '1px solid var(--line)' }}>
                <td className="tabular" style={{ padding: '9px 14px' }}>{row.position}</td>
                <td style={{ padding: '9px 14px' }}>{fantasyTeamsById.get(row.fantasyTeamId)?.username ?? '—'}</td>
                <td className="tabular" style={{ padding: '9px 14px' }}>{row.played}</td>
                <td className="tabular" style={{ padding: '9px 14px' }}>{row.won}</td>
                <td className="tabular" style={{ padding: '9px 14px' }}>{row.drawn}</td>
                <td className="tabular" style={{ padding: '9px 14px' }}>{row.lost}</td>
                <td className="tabular" style={{ padding: '9px 14px' }}>{row.fantasyGoalsFor}</td>
                <td className="tabular" style={{ padding: '9px 14px' }}>{row.fantasyGoalsAgainst}</td>
                <td className="tabular" style={{ padding: '9px 14px' }}>
                  {row.fantasyGoalDifference >= 0 ? '+' : ''}
                  {row.fantasyGoalDifference}
                </td>
                <td className="tabular" style={{ padding: '9px 14px' }}>{row.captainPointsTotal}</td>
                <td className="tabular" style={{ padding: '9px 14px', fontWeight: 700, color: 'var(--gold)' }}>
                  {row.leaguePoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: '16px 20px' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>Configuration as It Applied This Season</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', marginBottom: 12 }}>
          A season keeps the configuration value that actually applied to it (BR-296) — not necessarily the
          league's present-day setting.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <tbody>
            {CONFIG_ROWS.map(({ label, read }) => {
              const seasonValue = read(seasonConfiguration.data);
              const currentValue = read(leagueConfiguration.data);
              const hasChanged = seasonValue !== currentValue;
              return (
                <tr key={label} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '9px 14px', color: 'var(--ink-dim)' }}>{label}</td>
                  <td style={{ padding: '9px 14px' }}>{seasonValue}</td>
                  <td style={{ padding: '9px 14px' }}>
                    {hasChanged && (
                      <span style={{ color: 'var(--gold)', fontSize: '0.78rem' }}>
                        Differs from the current league setting ({currentValue}) — this season retains the value
                        that applied when it ran.
                      </span>
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
