import type { Gameweek } from '../../api/types';
import { CountdownClock } from '../../components/CountdownClock';
import { useNow } from '../../utils/useNow';

// Implements BRD UIR-035 (Gameweek number, deadline message, live countdown) and UIR-042
// (visually more urgent as the deadline approaches).

const URGENT_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

export function ScorebugPanel({ gameweek }: { gameweek: Gameweek }) {
  const deadline = new Date(gameweek.rosterLockDeadline);
  const now = useNow(30_000);
  const isUrgent = deadline.getTime() - now <= URGENT_THRESHOLD_MS;

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        padding: '14px 22px',
        marginBottom: 22,
        borderLeft: `4px solid ${isUrgent ? 'var(--live)' : 'var(--gold)'}`,
      }}
    >
      <div style={{ textAlign: 'center', flex: 'none' }}>
        <div style={{ fontSize: '1.7rem', fontWeight: 700 }}>GW{gameweek.number}</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--ink-dim)', textTransform: 'uppercase' }}>Matchweek</div>
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', color: isUrgent ? 'var(--live)' : 'var(--ink-dim)', fontWeight: 700 }}>
          ● Deadline {isUrgent ? 'approaching' : 'ahead'}
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>Set your Gameweek {gameweek.number} lineup before kickoff</div>
      </div>
      <div
        style={{
          marginLeft: 'auto',
          padding: '8px 16px',
          borderRadius: 10,
          background: isUrgent ? 'var(--live-soft)' : 'var(--surface-2)',
          border: `1px solid ${isUrgent ? 'var(--live)' : 'var(--line-strong)'}`,
        }}
      >
        <div style={{ fontSize: '0.68rem', color: isUrgent ? 'var(--live)' : 'var(--ink-dim)', textTransform: 'uppercase' }}>
          Locks in
        </div>
        <div style={{ fontSize: '1.4rem' }}>
          <CountdownClock target={deadline} format="hms" />
        </div>
      </div>
    </div>
  );
}
