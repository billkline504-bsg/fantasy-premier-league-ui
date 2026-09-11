import type { ReactNode } from 'react';

// Implements Architecture v1.2 §10: a successful response with zero rows, distinct from
// LoadingState and ErrorState — never conflated with either.
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p style={{ color: 'var(--ink-dim)', fontSize: '0.85rem', fontStyle: 'italic' }}>{children}</p>
  );
}
