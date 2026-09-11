// Implements BRD UIR-024: result-coded fixture rows (win/loss/draw/live), consistent
// wherever a fixture appears (Schedule, EPL Fixtures).

export type FixtureOutcome = 'win' | 'loss' | 'draw' | 'live';

const COLORS: Record<FixtureOutcome, { bg: string; fg: string }> = {
  win: { bg: 'var(--turf-soft)', fg: 'var(--turf)' },
  loss: { bg: 'var(--live-soft)', fg: 'var(--live)' },
  draw: { bg: 'rgba(238,193,90,.16)', fg: 'var(--gold)' },
  live: { bg: 'var(--live-soft)', fg: 'var(--live)' },
};

export interface ResultPillProps {
  outcome: FixtureOutcome;
  /** e.g. "FT", "63'" for a live match minute. */
  label: string;
}

export function ResultPill({ outcome, label }: ResultPillProps) {
  const { bg, fg } = COLORS[outcome];
  return (
    <span
      style={{
        display: 'inline-block',
        fontWeight: 700,
        fontSize: '0.68rem',
        letterSpacing: '.06em',
        padding: '3px 8px',
        borderRadius: 5,
        background: bg,
        color: fg,
      }}
    >
      {label}
    </span>
  );
}
