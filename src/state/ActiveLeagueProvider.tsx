import { useMemo, useState, type ReactNode } from 'react';
import { ActiveLeagueContext, type LeagueSummary } from './ActiveLeagueContext';

// Implements BRD UIR-002 (league switcher) and Architecture v1.1 §4.2's "active league" slot.
//
// TODO: once F-UI-000.2 (API client foundation) wires up a real session, replace
// `PLACEHOLDER_LEAGUES` with `useLeagues()` (GET /api/v1/leagues, per the API Consumption
// Specification's F-UI-001.2 mapping) and drop this stub entirely. Kept here for now so
// every league-scoped screen and the shell nav have something real to read from.

const PLACEHOLDER_LEAGUES: LeagueSummary[] = [
  { leagueId: 'the-gaffers-league', name: 'The Gaffers League' },
  { leagueId: 'the-wednesday-night-league', name: 'The Wednesday Night League' },
];

const STORAGE_KEY = 'matchday-active-league';

function readStoredLeagueId(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && PLACEHOLDER_LEAGUES.some((l) => l.leagueId === stored)) return stored;
  } catch {
    // ignore
  }
  return PLACEHOLDER_LEAGUES[0].leagueId;
}

export function ActiveLeagueProvider({ children }: { children: ReactNode }) {
  const [activeLeagueId, setActiveLeagueIdState] = useState<string>(() => readStoredLeagueId());

  function setActiveLeagueId(leagueId: string) {
    setActiveLeagueIdState(leagueId);
    try {
      window.localStorage.setItem(STORAGE_KEY, leagueId);
    } catch {
      // Non-fatal — the in-memory selection for this session still applies.
    }
  }

  const activeLeague = useMemo(
    () => PLACEHOLDER_LEAGUES.find((l) => l.leagueId === activeLeagueId),
    [activeLeagueId],
  );

  return (
    <ActiveLeagueContext.Provider
      value={{ leagues: PLACEHOLDER_LEAGUES, activeLeagueId, activeLeague, setActiveLeagueId }}
    >
      {children}
    </ActiveLeagueContext.Provider>
  );
}
