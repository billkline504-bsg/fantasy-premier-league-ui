import { useActiveLeague } from '../../state/useActiveLeague';
import { useClubsById, useCurrentEplSeasonIdentifier, useEplTable } from '../../api/hooks/useEpl';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';

// Implements BRD UIR-076 (scoped to the current season only, see API Consumption
// Specification v1.2 §2.3d for why historical-season tabs aren't implemented) and UIR-077
// (source-of-truth + tie-break disclosure).

export function EplTableView() {
  const { activeLeagueId } = useActiveLeague();
  const season = useCurrentEplSeasonIdentifier(activeLeagueId);
  const table = useEplTable(season.data);
  const clubsById = useClubsById();

  if (season.isPending || table.isPending || clubsById.isPending) {
    return <LoadingState label="Loading the EPL table…" />;
  }
  if (season.error || table.error || clubsById.error) {
    return <ErrorState error={season.error ?? table.error ?? clubsById.error} onRetry={() => table.refetch()} />;
  }

  const standings = [...(table.data ?? [])].sort((a, b) => a.position - b.position);

  return (
    <div>
      <div style={{ marginBottom: 10, fontSize: '0.78rem', color: 'var(--ink-dim)' }}>
        {season.data} · through the most recently completed Matchweek
      </div>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              {['Pos', 'Club', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'].map((header) => (
                <th key={header} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--ink-dim)' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => {
              const club = clubsById.data.get(row.clubId);
              return (
                <tr key={row.clubId} style={{ borderTop: '1px solid var(--line)' }}>
                  <td className="tabular" style={{ padding: '9px 12px' }}>
                    {row.position}
                  </td>
                  <td style={{ padding: '9px 12px' }}>{club?.name ?? row.clubId}</td>
                  <td className="tabular" style={{ padding: '9px 12px' }}>{row.played}</td>
                  <td className="tabular" style={{ padding: '9px 12px' }}>{row.won}</td>
                  <td className="tabular" style={{ padding: '9px 12px' }}>{row.drawn}</td>
                  <td className="tabular" style={{ padding: '9px 12px' }}>{row.lost}</td>
                  <td className="tabular" style={{ padding: '9px 12px' }}>{row.goalsFor}</td>
                  <td className="tabular" style={{ padding: '9px 12px' }}>{row.goalsAgainst}</td>
                  <td
                    className="tabular"
                    style={{
                      padding: '9px 12px',
                      color: row.goalDifference >= 0 ? 'var(--turf)' : 'var(--live)',
                    }}
                  >
                    {row.goalDifference >= 0 ? '+' : ''}
                    {row.goalDifference}
                  </td>
                  <td className="tabular" style={{ padding: '9px 12px', fontWeight: 700 }}>
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', padding: '14px 20px 4px', fontSize: '0.76rem', color: 'var(--ink-dim)' }}>
          <span>
            <b style={{ color: 'var(--ink-muted)' }}>Source</b> Official EPL/FPL data, not editable by any Fantasy
            League Administrator (BR-334)
          </span>
          <span>
            <b style={{ color: 'var(--ink-muted)' }}>Tie-break</b> Pts → GD → GF → head-to-head
          </span>
        </div>
      </div>
    </div>
  );
}
