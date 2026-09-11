// Implements Architecture v1.2 §10: a loading state every data-dependent screen region uses,
// rather than each screen inventing its own spinner/skeleton.
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <p role="status" style={{ color: 'var(--ink-dim)', fontSize: '0.85rem' }}>
      {label}
    </p>
  );
}
