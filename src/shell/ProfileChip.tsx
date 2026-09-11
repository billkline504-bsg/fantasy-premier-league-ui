import { useAuth } from '../state/useAuth';
import { useActiveLeague } from '../state/useActiveLeague';

// Implements BRD UIR-011: the current user's active-league identity at a glance, without
// navigating to Profile. Icon resolution (BR-006–BR-009) isn't wired up yet — see Profile's
// own TODO once F-UI-001.1/001.2 are built; this renders initials as a placeholder badge.

export function ProfileChip() {
  const { user } = useAuth();
  const { activeLeague } = useActiveLeague();

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        aria-hidden
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--turf-deep)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.75rem',
        }}
      >
        {initials}
      </span>
      <span style={{ lineHeight: 1.15 }}>
        <b style={{ display: 'block', fontSize: '0.92rem' }}>{user.username}</b>
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>{activeLeague?.name}</span>
      </span>
    </div>
  );
}
