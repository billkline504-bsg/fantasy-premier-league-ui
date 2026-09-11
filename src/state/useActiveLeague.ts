import { useContext } from 'react';
import { ActiveLeagueContext, type ActiveLeagueContextValue } from './ActiveLeagueContext';

export function useActiveLeague(): ActiveLeagueContextValue {
  const ctx = useContext(ActiveLeagueContext);
  if (!ctx) throw new Error('useActiveLeague must be used within an ActiveLeagueProvider');
  return ctx;
}
