import { createContext } from 'react';

export interface LeagueSummary {
  leagueId: string;
  name: string;
}

export interface ActiveLeagueContextValue {
  leagues: LeagueSummary[];
  activeLeagueId: string;
  activeLeague: LeagueSummary | undefined;
  setActiveLeagueId: (leagueId: string) => void;
}

export const ActiveLeagueContext = createContext<ActiveLeagueContextValue | undefined>(undefined);
