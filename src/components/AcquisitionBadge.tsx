import type { AcquisitionType } from '../api/types';

// Implements BRD UIR-017 (acquisition-method provenance, consistent wherever a player's
// acquisition method appears — Squad now, History later).

const LABELS: Record<AcquisitionType, string> = {
  InitialDraft: 'Initial Draft',
  SecondaryDraft: 'Secondary Draft',
  Replacement: 'Replacement',
};

const COLORS: Record<AcquisitionType, { bg: string; fg: string }> = {
  InitialDraft: { bg: 'var(--turf-soft)', fg: 'var(--turf)' },
  SecondaryDraft: { bg: 'rgba(238,193,90,.16)', fg: 'var(--gold)' },
  Replacement: { bg: 'var(--live-soft)', fg: 'var(--live)' },
};

export function AcquisitionBadge({ type }: { type: AcquisitionType }) {
  const { bg, fg } = COLORS[type];
  return (
    <span
      style={{
        display: 'inline-block',
        fontWeight: 700,
        fontSize: '0.68rem',
        letterSpacing: '.03em',
        padding: '3px 8px',
        borderRadius: 5,
        background: bg,
        color: fg,
        whiteSpace: 'nowrap',
      }}
    >
      {LABELS[type]}
    </span>
  );
}
