import type { Club, Fixture } from '../../api/types';

// Computes "next opponent" the same way BR-337/RosterPlayer.opponentClubId is described as
// being derived, but client-side and uniformly for every squad player (not just ones already
// confirmed in the server's roster) — needed because a player added to the roster locally,
// before submission, has no server-computed RosterPlayer entry yet to read this from.

export interface OpponentInfo {
  club: Club | undefined;
  isHome: boolean;
}

export function resolveOpponent(
  clubId: string,
  fixtures: Fixture[],
  clubsById: Map<string, Club>,
): OpponentInfo | null {
  const fixture = fixtures.find((f) => f.homeClubId === clubId || f.awayClubId === clubId);
  if (!fixture) return null; // BR-337: no fixture this Gameweek for this player's club.
  const isHome = fixture.homeClubId === clubId;
  const opponentClubId = isHome ? fixture.awayClubId : fixture.homeClubId;
  return { club: clubsById.get(opponentClubId), isHome };
}
