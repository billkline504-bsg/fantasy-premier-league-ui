// Route guards (routes/guards.tsx) redirect here instead of rendering a screen the user's
// role doesn't grant them — Architecture v1.1 §5.2 is explicit this must be a real "denied
// access" state, not a silent 404 (BRD UIR-125, UIR-145).
export function NoAccessScreen() {
  return (
    <section>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Access denied</h1>
      <p style={{ color: 'var(--ink-dim)', fontSize: '0.85rem' }}>
        Your account doesn't have access to that screen.
      </p>
    </section>
  );
}
