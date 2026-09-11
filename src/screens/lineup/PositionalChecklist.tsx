import type { PositionalMinimums, SquadPlayerView } from '../../api/types';

// Implements BRD UIR-045.

const ROWS: { key: keyof PositionalMinimums; label: string; matchesPosition: SquadPlayerView['position'] }[] = [
  { key: 'gk', label: 'Goalkeepers', matchesPosition: 'Gk' },
  { key: 'def', label: 'Defenders', matchesPosition: 'Def' },
  { key: 'mid', label: 'Midfielders', matchesPosition: 'Mid' },
  { key: 'fwd', label: 'Forwards', matchesPosition: 'Fwd' },
];

export function PositionalChecklist({
  selectedPlayers,
  minimums,
  totalRequired,
}: {
  selectedPlayers: SquadPlayerView[];
  minimums: PositionalMinimums;
  totalRequired: number;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
      {ROWS.map((row) => {
        const count = selectedPlayers.filter((p) => p.position === row.matchesPosition).length;
        const min = minimums[row.key];
        const satisfied = count >= min;
        return (
          <span
            key={row.key}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: '0.82rem',
              fontWeight: 700,
              background: satisfied ? 'var(--turf-soft)' : 'var(--surface-2)',
              color: satisfied ? 'var(--turf)' : 'var(--ink-muted)',
            }}
          >
            {satisfied ? '✓' : '○'} {row.label} {count} / min {min}
          </span>
        );
      })}
      <span
        style={{
          padding: '6px 12px',
          borderRadius: 999,
          fontSize: '0.82rem',
          fontWeight: 700,
          background: 'var(--surface-2)',
        }}
      >
        {selectedPlayers.length} / {totalRequired} selected
      </span>
    </div>
  );
}
