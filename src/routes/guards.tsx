import type { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../state/useAuth';

// Implements Architecture v1.1 §5.2. These are client-side UX gates only — the backend's own
// authorization policies (ActiveLeagueMember, LeagueAdministrator, SystemAdministrator; see
// API_ENDPOINTS.md) remain the actual authority. A user who bypasses these still gets a real
// 403 from the API, per BRD UIR-125/UIR-145's "denied access, not a silent 404" requirement.

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoringSession } = useAuth();
  if (isRestoringSession) return null; // avoid a login-screen flash while restoring a session
  if (!isAuthenticated) return <Navigate to="/login" replace />;
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
