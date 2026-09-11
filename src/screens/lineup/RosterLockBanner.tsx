import { CountdownClock } from '../../components/CountdownClock';

// Implements BRD UIR-043.

export function RosterLockBanner({ deadline }: { deadline: Date }) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 20px',
        marginBottom: 20,
        borderLeft: '4px solid var(--gold)',
      }}
    >
      <h3 style={{ fontSize: '1.05rem' }}>
        Roster locks {deadline.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
      </h3>
      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--ink-dim)', textTransform: 'uppercase' }}>Locks in</div>
        <div style={{ fontSize: '1.2rem' }}>
          <CountdownClock target={deadline} format="hms" />
        </div>
      </div>
    </div>
  );
}
