import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';

/**
 * Implements BRD UIR-177's second sentence: an authenticated user with zero League memberships.
 * Also implements UIR-194 — reachable from here, not only the league switcher — since a
 * brand-new user shouldn't be limited to waiting for someone else's invitation.
 */
export function NoLeaguesScreen() {
  return (
    <AuthLayout title="No Leagues Yet">
      <p style={{ fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 16 }}>
        You're not a member of any league yet — ask a League Administrator to send you an invitation, or start
        your own.
      </p>
      <Link to="/leagues/new">
        <button type="button" style={{ width: '100%', padding: 10 }}>
          Create a League
        </button>
      </Link>
    </AuthLayout>
  );
}
