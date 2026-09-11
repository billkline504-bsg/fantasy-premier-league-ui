import { useEffect, useState } from 'react';

/**
 * A ticking "current time" value, refreshed on an interval. Exists so components/hooks that
 * need to compare against "now" (e.g. picking the current Gameweek, or a deadline-urgency
 * threshold) do so via state that changes predictably on a schedule, rather than calling
 * `Date.now()` directly during render — which oxlint's react(purity) rule (correctly) flags,
 * since an unguarded `Date.now()` read during render can produce different results on renders
 * React expects to be equivalent.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
