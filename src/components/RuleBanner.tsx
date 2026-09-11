import type { ReactNode } from 'react';

// Implements BRD UIR-029: rule-explanation banners at the point of relevance (e.g., Makeup
// Picks' "no pick is ever lost" banner, Score Corrections' precedence banner).

export function RuleBanner({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '16px 20px',
        marginBottom: 20,
        background: 'var(--surface)',
        border: '1px solid var(--line-strong)',
        borderLeft: '4px solid var(--turf)',
        borderRadius: 12,
      }}
    >
      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>{children}</p>
    </div>
  );
}
