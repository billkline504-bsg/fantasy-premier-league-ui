import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../state/useAuth';
import { useActiveLeague } from '../../state/useActiveLeague';
import { useAcceptInvitation } from '../../api/hooks/useInvitation';
import { LoadingState } from '../../components/LoadingState';
import { AuthLayout } from './AuthLayout';

/**
 * Implements BRD UIR-187–190 (F-UI-001.8). Unlike every other auth screen, this one carries
 * no guard of its own (AppRoutes) — it branches internally on `isAuthenticated` since it must
 * work for both an anonymous visitor (detour through Register/Login first, UIR-187) and an
 * already-authenticated one (accept immediately).
 */
export function AcceptInvitationScreen() {
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated, isRestoringSession } = useAuth();
  const { setActiveLeagueId } = useActiveLeague();
  const acceptInvitation = useAcceptInvitation();
  const [membershipLeagueId, setMembershipLeagueId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !token || hasAttempted.current) return;
    hasAttempted.current = true;
    acceptInvitation.mutate(token, {
      onSuccess: (membership) => {
        setActiveLeagueId(membership.leagueId);
        setMembershipLeagueId(membership.leagueId);
      },
      onError: () => setError(true),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  if (isRestoringSession) return <LoadingState label="Loading…" />;
  if (!token) return <Navigate to="/login" replace />;

  if (!isAuthenticated) {
    const from = `/invite/${token}`;
    return (
      <AuthLayout title="You've Been Invited">
        <p style={{ fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 18 }}>
          Accepting this invitation will add you to a league. Sign in or create an account to continue — you'll
          come right back here afterward.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/register" state={{ from }} style={{ flex: 1 }}>
            <button type="button" style={{ width: '100%', padding: 10 }}>
              Create an account
            </button>
          </Link>
          <Link to="/login" state={{ from }} style={{ flex: 1 }}>
            <button type="button" style={{ width: '100%', padding: 10 }}>
              Sign in
            </button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (membershipLeagueId) {
    return <Navigate to={`/leagues/${membershipLeagueId}/dashboard`} replace />;
  }

  if (error) {
    return (
      <AuthLayout title="Invitation No Longer Valid">
        <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
          This invitation is no longer valid — it may have expired, already been accepted, or been revoked.
        </p>
      </AuthLayout>
    );
  }

  return <LoadingState label="Accepting your invitation…" />;
}
