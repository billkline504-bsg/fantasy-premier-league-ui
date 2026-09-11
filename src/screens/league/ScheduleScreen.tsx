import { useState } from 'react';
import { useActiveLeague } from '../../state/useActiveLeague';
import { useCurrentSeason, useFantasyTeams } from '../../api/hooks/useLeagueSeason';
import { useCurrentGameweek, useEplGameweeks, useGameweekFixtures } from '../../api/hooks/useEpl';
import { useSchedule } from '../../api/hooks/useCompetition';
import { Tabs } from '../../components/Tabs';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { HeadToHeadRow } from './HeadToHeadRow';
import type { FantasyTeam, HeadToHeadMatch } from '../../api/types';

// Implements BRD UIR-069–073 (F-UI-003.4). UIR-073 falls out for free: the whole season's
// schedule is fetched in one `getSchedule` call (no `gameweekId` filter), so every future
// Gameweek's fixtures are already loaded the moment a manager selects that tab — nothing is
// revealed only week-by-week.

function gameweekTabStatus(matches: HeadToHeadMatch[] | undefined, isCurrentGameweek: boolean): string {
  if (!matches || matches.length === 0) return 'Fixtures';
  const allResulted = matches.every((m) => m.result !== null);
  if (allResulted) return 'Results';
  return isCurrentGameweek ? 'Upcoming' : 'Fixtures';
}

export function ScheduleScreen() {
  const { activeLeagueId } = useActiveLeague();
  const season = useCurrentSeason(activeLeagueId);
  const gameweeks = useEplGameweeks(season.data?.eplSeasonIdentifier);
  const currentGameweek = useCurrentGameweek(season.data?.eplSeasonIdentifier);
  const schedule = useSchedule(activeLeagueId, season.data?.seasonId);
  const fantasyTeams = useFantasyTeams(activeLeagueId, season.data?.seasonId);

  const [selectedGameweekId, setSelectedGameweekId] = useState<string | undefined>(undefined);

  const isPending = season.isPending || gameweeks.isPending || currentGameweek.isPending || schedule.isPending || fantasyTeams.isPending;
  if (isPending) return <LoadingState label="Loading the schedule…" />;

  const error = season.error ?? gameweeks.error ?? currentGameweek.error ?? schedule.error ?? fantasyTeams.error;
  if (error) return <ErrorState error={error} onRetry={() => schedule.refetch()} />;

  if (!gameweeks.data || gameweeks.data.length === 0) {
    return <EmptyState>No Gameweeks found for this season.</EmptyState>;
  }

  const sortedGameweeks = [...gameweeks.data].sort((a, b) => a.number - b.number);
  const effectiveGameweekId = selectedGameweekId ?? currentGameweek.data?.gameweekId ?? sortedGameweeks[0].gameweekId;

  const matchesByGameweek = new Map<string, HeadToHeadMatch[]>();
  (schedule.data ?? []).forEach((match) => {
    const list = matchesByGameweek.get(match.gameweekId) ?? [];
    list.push(match);
    matchesByGameweek.set(match.gameweekId, list);
  });

  const fantasyTeamsById = new Map(fantasyTeams.data.map((t) => [t.fantasyTeamId, t]));
  const selectedMatches = matchesByGameweek.get(effectiveGameweekId) ?? [];

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Schedule &amp; Results</h1>

      <div style={{ marginBottom: 16 }}>
        <Tabs<string>
          aria-label="Gameweek"
          items={sortedGameweeks.map((gw) => ({
            value: gw.gameweekId,
            label: `GW${gw.number} · ${gameweekTabStatus(matchesByGameweek.get(gw.gameweekId), gw.gameweekId === currentGameweek.data?.gameweekId)}`,
          }))}
          activeValue={effectiveGameweekId}
          onChange={setSelectedGameweekId}
        />
      </div>

      {selectedMatches.length === 0 ? (
        <EmptyState>No fixtures scheduled for this Gameweek.</EmptyState>
      ) : (
        <GameweekFixtureList
          gameweekId={effectiveGameweekId}
          matches={selectedMatches}
          fantasyTeamsById={fantasyTeamsById}
        />
      )}
    </div>
  );
}

function GameweekFixtureList({
  gameweekId,
  matches,
  fantasyTeamsById,
}: {
  gameweekId: string;
  matches: HeadToHeadMatch[];
  fantasyTeamsById: Map<string, FantasyTeam>;
}) {
  const needsKickoffTime = matches.some((m) => !m.result);
  const fixtures = useGameweekFixtures(needsKickoffTime ? gameweekId : undefined);
  const gameweekKickoffTime =
    fixtures.data && fixtures.data.length > 0
      ? new Date(Math.min(...fixtures.data.map((f) => new Date(f.kickoffTime).getTime())))
      : undefined;

  return (
    <div className="card">
      {matches.map((match, index) => (
        <div key={match.matchId} style={{ borderTop: index === 0 ? 'none' : '1px solid var(--line)' }}>
          <HeadToHeadRow match={match} fantasyTeamsById={fantasyTeamsById} gameweekKickoffTime={gameweekKickoffTime} />
        </div>
      ))}
    </div>
  );
}
