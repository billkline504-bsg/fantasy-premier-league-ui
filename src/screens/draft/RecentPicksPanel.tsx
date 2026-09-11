import type { DraftSelection, FantasyTeam } from '../../api/types';
import { usePlayersByIds } from '../../api/hooks/useEpl';
import { LoadingState } from '../../components/LoadingState';

// Implements BRD UIR-105: pick number, team, player selected, most recent first.

export function RecentPicksPanel({
  selections,
  fantasyTeamsById,
}: {
  selections: DraftSelection[];
  fantasyTeamsById: Map<string, FantasyTeam>;
}) {
  const recent = [...selections].sort((a, b) => b.pickNumber - a.pickNumber).slice(0, 5);
  const players = usePlayersByIds(recent.map((s) => s.playerId));

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ fontSize: '0.95rem', marginBottom: 10 }}>Recent Picks</h3>
      {players.isPending && <LoadingState label="Loading recent picks…" />}
      {!players.isPending &&
        recent.map((selection) => {
          const player = players.data.get(selection.playerId);
          const team = fantasyTeamsById.get(selection.fantasyTeamId);
          return (
            <div
              key={selection.draftSelectionId}
              style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: '1px solid var(--line)' }}
            >
              <span className="tabular" style={{ color: 'var(--ink-dim)', width: '2.6em', flex: 'none' }}>
                {selection.pickNumber}
              </span>
              <div>
                <div>{team?.username ?? selection.fantasyTeamId}</div>
                <div style={{ color: 'var(--ink-dim)' }}>selected {player?.name ?? selection.playerId}</div>
              </div>
            </div>
          );
        })}
      {!players.isPending && recent.length === 0 && (
        <p style={{ color: 'var(--ink-dim)', fontSize: '0.85rem' }}>No picks yet.</p>
      )}
    </div>
  );
}
