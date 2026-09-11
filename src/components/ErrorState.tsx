import { ApiError } from '../api/client';

// Implements Architecture v1.2 §10: renders the normalized ProblemDetails message plus a
// retry action and the correlationId (for support/bug-report purposes), for any screen region
// backed by a TanStack Query that errored.
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const detail = error instanceof ApiError ? error.problem.detail : null;
  const correlationId = error instanceof ApiError ? error.problem.correlationId : null;
  const message = detail ?? (error instanceof Error ? error.message : 'Something went wrong.');

  return (
    <div
      role="alert"
      style={{
        padding: '14px 18px',
        border: '1px solid var(--live)',
        background: 'var(--live-soft)',
        borderRadius: 10,
      }}
    >
      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink)' }}>{message}</p>
      {correlationId && (
        <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--ink-dim)' }}>
          Reference: <code>{correlationId}</code>
        </p>
      )}
      {onRetry && (
        <button type="button" onClick={onRetry} style={{ marginTop: 10 }}>
          Retry
        </button>
      )}
    </div>
  );
}
