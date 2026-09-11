import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useActiveLeague } from '../state/useActiveLeague';
import { usePostAuthDestination } from '../state/usePostAuthDestination';
import { LoadingState } from './LoadingState';

/**
 * Shared by every place BRD UIR-176/177 needs to resolve where an authenticated visitor
 * belongs: `RequireAnonymous` (an already-signed-in visitor hitting Login/Register/Forgot
 * Password), the root `/` redirect, and Login/Register's own on-success rendering — one
 * destination-resolution policy, not three independent ones.
 */
export function PostAuthRedirect({ fromState }: { fromState?: string }) {
  const { isPending, destination, leagueIdToActivate } = usePostAuthDestination(fromState);
  const { setActiveLeagueId } = useActiveLeague();

  useEffect(() => {
    if (leagueIdToActivate) setActiveLeagueId(leagueIdToActivate);
  }, [leagueIdToActivate, setActiveLeagueId]);

  if (isPending) return <LoadingState label="Finding your leagues…" />;
  if (!destination) return null;
  return <Navigate to={destination} replace />;
}
