import { useState } from 'react';
import { useActiveLeague } from '../../state/useActiveLeague';
import {
  useClubsById,
  useCurrentEplSeasonIdentifier,
  useEplGameweeks,
  useGameweekFixtures,
} from '../../api/hooks/useEpl';
import { Tabs } from '../../components/Tabs';
import { FixtureRow } from '../../components/FixtureRow';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import type { Gameweek } from '../../api/types';

// Implements BRD UIR-078: matchweek-tabbed fixture list (UIR-022's tab pattern). Default tab
// selection approximates "the current Matchweek" from each Gameweek's rosterLockDeadline (the
// only timing field the API returns here) rather than fetching every Matchweek's fixtures just
// to find which one has a live match.
function pickDefaultGameweek(gameweeks: Gameweek[]): Gameweek | undefined {
  const now = Date.now();
  const started = gameweeks
    .filter((gw) => new Date(gw.rosterLockDeadline).getTime() <= now)
    .sort((a, b) => b.number - a.number);
  return started[0] ?? [...gameweeks].sort((a, b) => a.number - b.number)[0];
}

export function EplFixturesView() {
  const { activeLeagueId } = useActiveLeague();
  const season = useCurrentEplSeasonIdentifier(activeLeagueId);
  const gameweeks = useEplGameweeks(season.data);
  const clubsById = useClubsById();

  const [selectedGameweekId, setSelectedGameweekId] = useState<string | undefined>(undefined);
  const effectiveGameweekId = selectedGameweekId ?? pickDefaultGameweek(gameweeks.data ?? [])?.gameweekId;
  const fixtures = useGameweekFixtures(effectiveGameweekId);

  if (season.isPending || gameweeks.isPending || clubsById.isPending) {
    return <LoadingState label="Loading fixtures…" />;
  }
  if (season.error || gameweeks.error || clubsById.error) {
    return <ErrorState error={season.error ?? gameweeks.error ?? clubsById.error} onRetry={() => gameweeks.refetch()} />;
  }
  if (!gameweeks.data || gameweeks.data.length === 0) {
    return <EmptyState>No Matchweeks found for {season.data}.</EmptyState>;
  }

  const sortedGameweeks = [...gameweeks.data].sort((a, b) => a.number - b.number);

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <Tabs
          aria-label="Matchweek"
          items={sortedGameweeks.map((gw) => ({ value: gw.gameweekId, label: `MW${gw.number}` }))}
          activeValue={effectiveGameweekId ?? sortedGameweeks[0].gameweekId}
          onChange={setSelectedGameweekId}
        />
      </div>

      {fixtures.isPending && <LoadingState label="Loading this Matchweek's fixtures…" />}
      {fixtures.error && <ErrorState error={fixtures.error} onRetry={() => fixtures.refetch()} />}
      {fixtures.data && fixtures.data.length === 0 && <EmptyState>No fixtures for this Matchweek.</EmptyState>}
      {fixtures.data && fixtures.data.length > 0 && (
        <div className="card">
          {fixtures.data
            .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime())
            .map((fixture, index) => (
              <div key={fixture.fixtureId} style={{ borderTop: index === 0 ? 'none' : '1px solid var(--line)' }}>
                <FixtureRow
                  fixture={fixture}
                  homeClub={clubsById.data.get(fixture.homeClubId)}
                  awayClub={clubsById.data.get(fixture.awayClubId)}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
