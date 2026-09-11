import { useMyLeagues } from '../api/hooks/useLeagueSeason';

/**
 * Implements BRD UIR-177: where a newly-authenticated (or already-authenticated) visitor lands.
 * `listMyLeagues` (the real `GET /leagues`) is used directly here rather than
 * `ActiveLeagueContext`, which still only holds a placeholder league list pending a broader,
 * separately-tracked rewiring (see that provider's own TODO) — this is the one place in the
 * app that needs to distinguish "genuinely zero leagues" from "some placeholder list," so it
 * reads the real membership data directly instead of waiting for that larger rewiring.
 */
export function usePostAuthDestination(fromState: string | undefined) {
  const myLeagues = useMyLeagues();

  if (fromState) {
    return { isPending: false, destination: fromState, leagueIdToActivate: null as string | null };
  }
  if (myLeagues.isPending) {
    return { isPending: true, destination: null as string | null, leagueIdToActivate: null as string | null };
  }
  if ((myLeagues.data ?? []).length === 0) {
    return { isPending: false, destination: '/no-leagues', leagueIdToActivate: null as string | null };
  }
  const leagueId = myLeagues.data[0].leagueId;
  return { isPending: false, destination: `/leagues/${leagueId}/dashboard`, leagueIdToActivate: leagueId };
}
