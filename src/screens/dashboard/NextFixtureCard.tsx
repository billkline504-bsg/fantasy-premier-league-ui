import type { FantasyTeam, HeadToHeadMatch, LeagueStanding } from '../../api/types';

// Implements BRD UIR-037: both sides' identity/manager/standing and the kickoff/roster-lock
// time. Team identity is `username` throughout — `FantasyTeam` has no separate name field
// (API Consumption Specification v1.3 §2.3g).

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

function Side({ team, standing }: { team: FantasyTeam | undefined; standing: LeagueStanding | undefined }) {
  return (
    <div style={{ textAlign: 'center', width: 150 }}>
      <b style={{ display: 'block' }}>{team?.username ?? '—'}</b>
      <span style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>
        {standing ? `${ordinal(standing.position)}` : ''}
      </span>
    </div>
  );
}

export function NextFixtureCard({
  match,
  myFantasyTeamId,
  fantasyTeamsById,
  standingsByTeamId,
  firstKickoffTime,
  gameweekNumber,
}: {
  match: HeadToHeadMatch | undefined;
  myFantasyTeamId: string;
  fantasyTeamsById: Map<string, FantasyTeam>;
  standingsByTeamId: Map<string, LeagueStanding>;
  firstKickoffTime: Date | undefined;
  gameweekNumber: number;
}) {
  if (!match) {
    return (
      <div className="card" style={{ padding: '18px 20px', marginBottom: 18 }}>
        <p style={{ margin: 0, color: 'var(--ink-dim)', fontSize: '0.85rem' }}>
          No Head-to-Head fixture found for you this Gameweek.
        </p>
      </div>
    );
  }

  const opponentId = match.homeFantasyTeamId === myFantasyTeamId ? match.awayFantasyTeamId : match.homeFantasyTeamId;

  return (
    <div className="card" style={{ padding: '18px 20px', marginBottom: 18 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--ink-dim)', marginBottom: 10, textTransform: 'uppercase' }}>
        Next Head-to-Head · GW{gameweekNumber}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <Side team={fantasyTeamsById.get(myFantasyTeamId)} standing={standingsByTeamId.get(myFantasyTeamId)} />
        <div style={{ color: 'var(--ink-dim)', fontWeight: 700 }}>VS</div>
        <Side team={fantasyTeamsById.get(opponentId)} standing={standingsByTeamId.get(opponentId)} />
      </div>
      {firstKickoffTime && (
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          First kick-off{' '}
          {firstKickoffTime.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}
