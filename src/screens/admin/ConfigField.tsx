import type { ReactNode } from 'react';

/**
 * One row of League/Season configuration editing (BRD UIR-197–199). A locked Season field
 * renders using the same read-only "Locked" badge treatment already established for other
 * locked/historical data in this client (e.g. Season Predictions' locked prediction), rather
 * than merely a disabled input with no explanation.
 */
export function ConfigField({
  label,
  locked,
  children,
}: {
  label: string;
  locked?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--line)' }}>
      <span style={{ flex: '0 0 220px', fontSize: '0.85rem' }}>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>
      {locked && <span className="scope-badge" style={{ marginLeft: 'auto' }}>Locked</span>}
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  disabled,
  width = 90,
  min = 0,
  'aria-label': ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  width?: number;
  min?: number;
  'aria-label': string;
}) {
  if (disabled) {
    return (
      <span className="tabular" style={{ width, display: 'inline-block' }}>
        {value}
      </span>
    );
  }
  return (
    <input
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={ariaLabel}
      style={{ width, padding: 6 }}
    />
  );
}
