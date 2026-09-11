import type { Draft, FantasyTeam } from '../../api/types';
import { resolveCurrentRoundOrder } from './draftTurn';

// Implements BRD UIR-100: completed/current/upcoming distinguished, plus an explanation of how
// the snake order was derived and that it won't change even if later results reorder the table.

export function DraftOrderPanel({
  draft,
  fantasyTeamsById,
}: {
  draft: Draft;
  fantasyTeamsById: Map<string, FantasyTeam>;
}) {
  const roundOrder = resolveCurrentRoundOrder(draft);
  const isEvenRound = draft.currentRound % 2 === 0;

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ fontSize: '0.95rem', marginBottom: 10 }}>
        Round {draft.currentRound} Order ({isEvenRound ? 'reverse' : 'snake'})
      </h3>
      {roundOrder.map((fantasyTeamId, index) => {
        const team = fantasyTeamsById.get(fantasyTeamId);
        const isCurrent = index === draft.currentPickIndex;
        const isDone = index < draft.currentPickIndex;
        return (
          <div
            key={fantasyTeamId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 8px',
              borderRadius: 8,
              marginBottom: 4,
              opacity: isDone ? 0.5 : 1,
              background: isCurrent ? 'var(--gold)' : undefined,
              color: isCurrent ? 'var(--gold-ink)' : undefined,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                background: isCurrent ? 'var(--gold-ink)' : 'var(--surface-2)',
                color: isCurrent ? 'var(--gold)' : 'var(--ink-muted)',
              }}
            >
              {index + 1}
            </span>
            {team?.username ?? fantasyTeamId}
          </div>
        );
      })}
      <p style={{ fontSize: '0.74rem', color: 'var(--ink-dim)', marginTop: 10, lineHeight: 1.5 }}>
        Round 1 ran worst-to-first from the standings snapshot taken at the start of the draft; each
        subsequent round reverses. This order won't change even if later results reorder the table
        (BR-054, BR-056).
      </p>
    </div>
  );
}
