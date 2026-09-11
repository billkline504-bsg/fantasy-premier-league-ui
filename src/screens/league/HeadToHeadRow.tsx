import type { FantasyTeam, HeadToHeadMatch } from '../../api/types';
import { ResultPill, type FixtureOutcome } from '../../components/ResultPill';

// Implements BRD UIR-071/UIR-072. Team identity is `username` (BRD DEC-UI-015).
//
// API Consumption Specification note: `HeadToHeadMatch` has no per-match kickoff-time field —
// unlike the mock-up's rows, which each showed a different time, there's nothing here to
// distinguish one H2H match's "kickoff" from another's within the same Gameweek (a H2H
// match's schedule is really just "whenever this Gameweek's real EPL fixtures happen"). Every
// upcoming row in a Gameweek therefore shows the same Gameweek-level first-kickoff time,
// computed from `getGameweekFixtures` — not a fabricated distinct time per match.

const RESULT_TO_OUTCOME: Record<string, FixtureOutcome> = { HomeWin: 'win', AwayWin: 'loss', Draw: 'draw' };

export function HeadToHeadRow({
  match,
  fantasyTeamsById,
  gameweekKickoffTime,
}: {
  match: HeadToHeadMatch;
  fantasyTeamsById: Map<string, FantasyTeam>;
  gameweekKickoffTime: Date | undefined;
}) {
  const home = fantasyTeamsById.get(match.homeFantasyTeamId)?.username ?? '—';
  const away = fantasyTeamsById.get(match.awayFantasyTeamId)?.username ?? '—';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
      <b style={{ flex: 1, textAlign: 'right' }}>{home}</b>
      {match.result ? (
        <>
          <span className="tabular" style={{ fontWeight: 700, padding: '4px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
            {match.homeScore}–{match.awayScore}
          </span>
          <b style={{ flex: 1 }}>{away}</b>
          <ResultPill outcome={RESULT_TO_OUTCOME[match.result]} label="FT" />
        </>
      ) : (
        <>
          <span
            style={{
              fontWeight: 700,
              padding: '4px 10px',
              border: '1px dashed var(--line-strong)',
              borderRadius: 8,
              color: 'var(--ink-muted)',
              fontSize: '0.82rem',
              whiteSpace: 'nowrap',
            }}
          >
            {gameweekKickoffTime
              ? gameweekKickoffTime.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })
              : 'TBD'}
          </span>
          <b style={{ flex: 1 }}>{away}</b>
        </>
      )}
    </div>
  );
}
