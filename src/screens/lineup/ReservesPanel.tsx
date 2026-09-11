import { Link } from 'react-router-dom';
import type { Club, Fixture, SquadPlayerView } from '../../api/types';
import { resolveOpponent } from './opponentLookup';

// Implements BRD UIR-049. The "Add" button per row is this client's own addition (see
// PitchView.tsx's header comment / BRD v1.3 §12 item 13) — nothing in the mock-up wires up
// bringing a reserve into the roster.

const TRUNCATE_AT = 8;

export function ReservesPanel({
  reserves,
  onAdd,
  isRosterFull,
  isReadOnly,
  fixtures,
  clubsById,
  activeLeagueId,
}: {
  reserves: SquadPlayerView[];
  onAdd: (playerId: string) => void;
  isRosterFull: boolean;
  isReadOnly: boolean;
  fixtures: Fixture[];
  clubsById: Map<string, Club>;
  activeLeagueId: string;
}) {
  const visible = reserves.slice(0, TRUNCATE_AT);
  const hiddenCount = reserves.length - visible.length;

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ fontSize: '1rem', marginBottom: 10 }}>Reserves in Squad ({reserves.length})</h3>
      {visible.map((player) => {
        const opponent = resolveOpponent(player.clubId, fixtures, clubsById);
        return (
          <div
            key={player.playerId}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: '1px solid var(--line)' }}
          >
            <span
              style={{
                width: 30,
                height: 20,
                borderRadius: 5,
                background: 'var(--surface-2)',
                fontSize: '0.66rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
              }}
            >
              {player.position.toUpperCase()}
            </span>
            <div style={{ flex: 1 }}>
              <div>{player.playerName}</div>
              <small style={{ color: 'var(--ink-dim)' }}>
                {clubsById.get(player.clubId)?.shortName ?? '—'}
                {opponent && (
                  <>
                    {' · '}
                    <span style={{ color: 'var(--gold)' }}>
                      {opponent.isHome ? 'vs' : '@'} {opponent.club?.shortName ?? '—'}
                    </span>
                  </>
                )}
              </small>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => onAdd(player.playerId)}
                disabled={isRosterFull}
                aria-label={`Add ${player.playerName} to roster`}
              >
                Add
              </button>
            )}
          </div>
        );
      })}
      {hiddenCount > 0 && (
        <p style={{ fontSize: '0.76rem', padding: '10px 0 0' }}>
          +{hiddenCount} more ·{' '}
          <Link to={`/leagues/${activeLeagueId}/squad`} style={{ color: 'var(--turf)', fontWeight: 700 }}>
            view full squad →
          </Link>
        </p>
      )}
    </div>
  );
}
