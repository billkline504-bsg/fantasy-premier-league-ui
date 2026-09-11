import type { ReactNode } from 'react';
import type { LeagueStanding } from '../../api/types';

// Implements BRD UIR-036: League Position, League Points (W-D-L), Fantasy Goal Difference
// (for/against), Captain Points (with tie-break rank).

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function Tile({ label, value, sub, color }: { label: string; value: ReactNode; sub: string; color?: string }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--ink-dim)', marginBottom: 8 }}>{label}</div>
      <div className="tabular" style={{ fontSize: '2rem', lineHeight: 1, color: color ?? 'var(--ink)' }}>
        {value}
      </div>
      <div style={{ marginTop: 6, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{sub}</div>
    </div>
  );
}

export function StatTiles({
  standing,
  totalTeams,
  captainPointsRank,
}: {
  standing: LeagueStanding;
  totalTeams: number;
  captainPointsRank: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
      <Tile
        label="League Position"
        value={ordinal(standing.position)}
        sub={`of ${totalTeams}`}
        color="var(--turf)"
      />
      <Tile
        label="League Points"
        value={standing.leaguePoints}
        sub={`${standing.won}W · ${standing.drawn}D · ${standing.lost}L`}
        color="var(--gold)"
      />
      <Tile
        label="Fantasy Goal Diff."
        value={standing.fantasyGoalDifference >= 0 ? `+${standing.fantasyGoalDifference}` : standing.fantasyGoalDifference}
        sub={`${standing.fantasyGoalsFor} for · ${standing.fantasyGoalsAgainst} against`}
      />
      <Tile
        label="Captain Points"
        value={standing.captainPointsTotal}
        sub={`Tie-break stat · rank ${ordinal(captainPointsRank)}`}
      />
    </div>
  );
}
