import type { ReactNode } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../state/useAuth';
import { PostAuthRedirect } from '../components/PostAuthRedirect';

// Implements Architecture v1.3 §5.2. These are client-side UX gates only — the backend's own
// authorization policies (ActiveLeagueMember, LeagueAdministrator, SystemAdministrator; see
// API_ENDPOINTS.md) remain the actual authority. A user who bypasses these still gets a real
// 403 from the API, per BRD UIR-125/UIR-145's "denied access, not a silent 404" requirement.

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoringSession } = useAuth();
  const location = useLocation();
  if (isRestoringSession) return null; // avoid a login-screen flash while restoring a session
  if (!isAuthenticated) {
    // BRD UIR-177 / Architecture §5.6: carries the original destination through Login so a
    // successful sign-in returns here, rather than always landing on the Dashboard.
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  return <>{children}</>;
}

/**
 * The mirror image of `RequireAuth` — BRD UIR-176: an already-authenticated visitor hitting
 * Login, Register, or Forgot/Reset Password is redirected to their real destination (the same
 * resolution `PostAuthRedirect` already implements for post-login navigation) rather than
 * shown the form again.
 */
export function RequireAnonymous({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoringSession } = useAuth();
  const location = useLocation();
  if (isRestoringSession) return null;
  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from;
    return <PostAuthRedirect fromState={from} />;
  }
  return <>{children}</>;
}

export function RequireSystemAdministrator({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user?.isSystemAdministrator) return <Navigate to="/no-access" replace />;
  return <>{children}</>;
}

/**
 * TODO: this currently always allows access. Per-league Administrator status isn't available
 * yet — ActiveLeagueContext only holds a placeholder league list (see its own TODO), with no
 * membership/role data. Wire this to the real `LeagueMembership.isAdministrator` field (per
 * the API Consumption Specification's `listMemberships` mapping) once F-UI-000.2 lands, and
 * this stub becomes a real, deny-by-default check like RequireSystemAdministrator above.
 */
export function RequireLeagueAdministrator({ children }: { children: ReactNode }) {
  const { leagueId } = useParams();
  void leagueId; // will gate on this once real membership data exists
  return <>{children}</>;
}
