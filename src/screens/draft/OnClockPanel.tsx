import type { Draft, FantasyTeam } from '../../api/types';
import { CountdownClock } from '../../components/CountdownClock';
import { resolveOnClockFantasyTeamId } from './draftTurn';

// Implements BRD UIR-101: names the team, manager, pick number, and a live countdown to the
// pick timer's expiration; notes that an administrator may extend it (the actual extend
// control is out of scope for this pass — BRD §12 item 10 / API Consumption Specification
// §2.2 already flag that it still needs designing).
//
// UIR-216: while the draft is Paused, the countdown is replaced entirely by a static "Paused"
// indicator, never frozen at or still running against `currentPickDeadline` — `Draft` carries
// no field recording what the remaining time was at the moment of pause, so showing any
// specific value here would be a guess this client can't confirm (Architecture ADR-017).

export function OnClockPanel({
  draft,
  fantasyTeamsById,
}: {
  draft: Draft;
  fantasyTeamsById: Map<string, FantasyTeam>;
}) {
  const onClockTeamId = resolveOnClockFantasyTeamId(draft);
  const team = onClockTeamId ? fantasyTeamsById.get(onClockTeamId) : undefined;
  const isPaused = draft.status === 'Paused';
  // Inferred (see draftTurn.ts): overall pick number, assuming pickIndex resets each round.
  const pickNumber = (draft.currentRound - 1) * draft.draftOrder.length + draft.currentPickIndex + 1;

  return (
    <div className="card" style={{ padding: 18, textAlign: 'center', marginBottom: 16 }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--live)', fontWeight: 700 }}>● On the clock</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '6px 0 2px' }}>
        {team?.username ?? onClockTeamId ?? '—'}
      </div>
      {isPaused && <div style={{ fontSize: '2rem', color: 'var(--ink-muted)', fontWeight: 700 }}>Paused</div>}
      {!isPaused && draft.currentPickDeadline && (
        <div style={{ fontSize: '2rem', color: 'var(--gold)' }}>
          <CountdownClock target={new Date(draft.currentPickDeadline)} format="ms" />
        </div>
      )}
      <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
        Pick {pickNumber}
        {!isPaused && ' · An Administrator may extend the timer'}
      </div>
    </div>
  );
}
