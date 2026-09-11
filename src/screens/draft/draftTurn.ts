import type { Draft } from '../../api/types';

/**
 * Resolves whose turn it currently is from `Draft.draftOrder` (round 1's fixed order per
 * BR-054/BR-056), `currentRound`, and `currentPickIndex`. The OpenAPI spec names these fields
 * but doesn't spell out their exact indexing semantics — this assumes `currentPickIndex` is
 * 0-based *within the current round* (not a global pick counter), and that even rounds use the
 * reverse of `draftOrder` (the snake pattern BRD UIR-100 describes). This is an inferred
 * convention, not a confirmed one — verify against the running API before relying on it for
 * anything beyond display, and revisit this comment if it turns out to be wrong.
 */
export function resolveOnClockFantasyTeamId(draft: Draft): string | undefined {
  if (draft.draftOrder.length === 0) return undefined;
  const isEvenRound = draft.currentRound % 2 === 0;
  const roundOrder = isEvenRound ? [...draft.draftOrder].reverse() : draft.draftOrder;
  return roundOrder[draft.currentPickIndex];
}

/** The full pick order for the *current* round only, in on-the-clock order (BRD UIR-100). */
export function resolveCurrentRoundOrder(draft: Draft): string[] {
  const isEvenRound = draft.currentRound % 2 === 0;
  return isEvenRound ? [...draft.draftOrder].reverse() : draft.draftOrder;
}
