import type { Club, Fixture, Position, SquadPlayerView } from '../../api/types';
import { resolveOpponent } from './opponentLookup';

// Implements BRD UIR-046 (all 15 roster players grouped by position band), UIR-047/UIR-048
// (click a token to hand them the armband — no vice-captain, only current-roster players are
// eligible), UIR-052 (opponent context from the same fixture data EPL/Squad use). The small
// per-token remove control is this client's own addition, not depicted in the mock-up — see
// BRD v1.3 §12 item 13: the mock-up never wired up a way to actually change which 15 of the
// squad are in the roster, only captain selection, so this fills a gap the feature is
// non-functional without.

const BAND_ORDER: Position[] = ['Fwd', 'Mid', 'Def', 'Gk'];
const BAND_LABEL: Record<Position, string> = { Gk: 'Goalkeepers', Def: 'Defenders', Mid: 'Midfielders', Fwd: 'Forwards' };

export function PitchView({
  players,
  captainId,
  onSelectCaptain,
  onRemove,
  fixtures,
  clubsById,
  isReadOnly,
}: {
  players: SquadPlayerView[];
  captainId: string | null;
  onSelectCaptain: (playerId: string) => void;
  onRemove: (playerId: string) => void;
  fixtures: Fixture[];
  clubsById: Map<string, Club>;
  isReadOnly: boolean;
}) {
  return (
    <div className="card" style={{ padding: 16 }}>
      {BAND_ORDER.map((position) => {
        const band = players.filter((p) => p.position === position);
        if (band.length === 0) return null;
        return (
          <div key={position} style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 8 }}>
              {BAND_LABEL[position]}
            </h4>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {band.map((player) => {
                const opponent = resolveOpponent(player.clubId, fixtures, clubsById);
                const isCaptain = player.playerId === captainId;
                return (
                  <div key={player.playerId} style={{ textAlign: 'center', position: 'relative', width: 84 }}>
                    <button
                      type="button"
                      onClick={() => onSelectCaptain(player.playerId)}
                      disabled={isReadOnly}
                      aria-label={`Set ${player.playerName} as captain`}
                      title="Click to hand the armband"
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: '10px 10px 6px 6px',
                        border: isCaptain ? '2px solid var(--gold)' : '2px solid var(--line-strong)',
                        background: 'var(--surface-2)',
                        position: 'relative',
                      }}
                    >
                      {player.position.toUpperCase()}
                      {isCaptain && (
                        <span
                          style={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: 'var(--gold)',
                            color: 'var(--gold-ink)',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          C
                        </span>
                      )}
                    </button>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => onRemove(player.playerId)}
                        aria-label={`Remove ${player.playerName} from roster`}
                        title="Remove from roster"
                        style={{
                          position: 'absolute',
                          top: -8,
                          left: -8,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          fontSize: '0.65rem',
                          lineHeight: 1,
                          padding: 0,
                        }}
                      >
                        ✕
                      </button>
                    )}
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: 4 }}>{player.playerName}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--ink-dim)' }}>
                      {clubsById.get(player.clubId)?.shortName ?? '—'}
                      {opponent && (
                        <>
                          {' '}
                          <span style={{ color: 'var(--gold)' }}>
                            {opponent.isHome ? 'vs' : '@'} {opponent.club?.shortName ?? '—'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', margin: '4px 4px 0' }}>
        Click a player to hand them the armband. There is no vice-captain — if the captain
        doesn't play, the captain bonus is lost.
      </p>
    </div>
  );
}
