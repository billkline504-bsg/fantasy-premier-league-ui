import { useSeasonGoalPredictionsForTeams } from '../../api/hooks/usePrediction';
import type { FantasyTeam, Season, SeasonGoalPrediction } from '../../api/types';
import { LoadingState } from '../../components/LoadingState';

/**
 * UIR-083: every other manager's prediction is intentionally concealed until Season end
 * (the "hidden until reveal condition" pattern, UIR-031) — `getSeasonGoalPrediction`'s own
 * authorization (`FantasyTeamOwnerOrActiveLeagueMember`) would technically let any league
 * member read any team's value at any time; this client both hides the value in the UI *and*
 * doesn't request other teams' predictions at all until `seasonStatus === 'Completed'`, so the
 * concealment isn't just a display choice layered on top of an already-fetched value.
 */
export function LeaguePredictionsList({
  activeLeagueId,
  seasonId,
  seasonStatus,
  fantasyTeams,
  myFantasyTeamId,
  myPrediction,
}: {
  activeLeagueId: string;
  seasonId: string | undefined;
  seasonStatus: Season['status'] | undefined;
  fantasyTeams: FantasyTeam[];
  myFantasyTeamId: string;
  myPrediction: SeasonGoalPrediction | null;
}) {
  const isRevealed = seasonStatus === 'Completed';
  const otherTeamIds = isRevealed
    ? fantasyTeams.filter((t) => t.fantasyTeamId !== myFantasyTeamId).map((t) => t.fantasyTeamId)
    : [];
  const otherPredictions = useSeasonGoalPredictionsForTeams(activeLeagueId, seasonId, otherTeamIds);

  return (
    <section className="card" style={{ padding: '16px 20px' }}>
      <h3 style={{ fontSize: '1.05rem', marginBottom: 10 }}>League Predictions</h3>
      {isRevealed && otherPredictions.isPending ? (
        <LoadingState label="Loading league predictions…" />
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--ink-dim)' }}>Team</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--ink-dim)' }}>Prediction</th>
            </tr>
          </thead>
          <tbody>
            {fantasyTeams.map((team) => {
              const isMe = team.fantasyTeamId === myFantasyTeamId;
              const teamPrediction = isMe ? myPrediction : (otherPredictions.data.get(team.fantasyTeamId) ?? null);
              return (
                <tr
                  key={team.fantasyTeamId}
                  style={{ borderTop: '1px solid var(--line)', background: isMe ? 'var(--turf-soft)' : undefined }}
                >
                  <td style={{ padding: '9px 10px' }}>{team.username}</td>
                  <td className="tabular" style={{ padding: '9px 10px' }}>
                    {isMe || isRevealed ? (
                      teamPrediction ? (
                        teamPrediction.predictedEplGoals.toLocaleString()
                      ) : (
                        <em style={{ color: 'var(--ink-dim)' }}>Not yet submitted</em>
                      )
                    ) : (
                      <span
                        style={{ color: 'var(--ink-dim)', fontStyle: 'italic' }}
                        title="Hidden until the season ends, to preserve the tie-break's anti-anchoring design (BR-131–BR-134)"
                      >
                        Hidden until season end
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
