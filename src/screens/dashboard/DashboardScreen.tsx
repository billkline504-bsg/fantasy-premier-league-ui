import { useActiveLeague } from '../../state/useActiveLeague';
import { useCurrentSeason, useFantasyTeams, useMyFantasyTeam, useLeagueMemberships } from '../../api/hooks/useLeagueSeason';
import { useCurrentGameweek, useGameweekFixtures } from '../../api/hooks/useEpl';
import { useSchedule, useStandings } from '../../api/hooks/useCompetition';
import { useLeagueMessages } from '../../api/hooks/useMessages';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { ScorebugPanel } from './ScorebugPanel';
import { StatTiles } from './StatTiles';
import { NextFixtureCard } from './NextFixtureCard';
import { NewsFeed } from './NewsFeed';
import { CondensedStandings } from './CondensedStandings';

// Implements BRD UIR-035–042 (F-UI-003.1). UIR-041: entirely scoped to whichever league is
// currently active — every hook below is keyed on `activeLeagueId`/its current Season, so
// switching leagues (ActiveLeagueContext) re-renders this whole screen against fresh data.

export function DashboardScreen() {
  const { activeLeagueId } = useActiveLeague();
  const season = useCurrentSeason(activeLeagueId);
  const myFantasyTeam = useMyFantasyTeam(activeLeagueId, season.data?.seasonId);
  const currentGameweek = useCurrentGameweek(season.data?.eplSeasonIdentifier);
  const standings = useStandings(activeLeagueId, season.data?.seasonId);
  const fantasyTeams = useFantasyTeams(activeLeagueId, season.data?.seasonId);
  const memberships = useLeagueMemberships(activeLeagueId);
  const messages = useLeagueMessages(activeLeagueId);
  const schedule = useSchedule(activeLeagueId, season.data?.seasonId, currentGameweek.data?.gameweekId);
  const fixtures = useGameweekFixtures(currentGameweek.data?.gameweekId);

  const isPending =
    season.isPending ||
    myFantasyTeam.isPending ||
    currentGameweek.isPending ||
    standings.isPending ||
    fantasyTeams.isPending ||
    memberships.isPending;
  if (isPending) return <LoadingState label="Loading your dashboard…" />;

  const error =
    season.error ?? myFantasyTeam.error ?? currentGameweek.error ?? standings.error ?? fantasyTeams.error ?? memberships.error;
  if (error) return <ErrorState error={error} onRetry={() => standings.refetch()} />;

  if (!myFantasyTeam.data || !currentGameweek.data) {
    return <ErrorState error={new Error('No FantasyTeam or Gameweek found for this league.')} />;
  }

  const fantasyTeamsById = new Map(fantasyTeams.data.map((t) => [t.fantasyTeamId, t]));
  const membershipsById = new Map(memberships.data.map((m) => [m.leagueMembershipId, m]));
  const standingsByTeamId = new Map((standings.data ?? []).map((s) => [s.fantasyTeamId, s]));
  const myStanding = standingsByTeamId.get(myFantasyTeam.data.fantasyTeamId);

  const captainPointsRank =
    [...(standings.data ?? [])]
      .sort((a, b) => b.captainPointsTotal - a.captainPointsTotal)
      .findIndex((s) => s.fantasyTeamId === myFantasyTeam.data!.fantasyTeamId) + 1;

  const myMatch = schedule.data?.find(
    (m) => m.homeFantasyTeamId === myFantasyTeam.data!.fantasyTeamId || m.awayFantasyTeamId === myFantasyTeam.data!.fantasyTeamId,
  );
  const firstKickoffTime =
    fixtures.data && fixtures.data.length > 0
      ? new Date(Math.min(...fixtures.data.map((f) => new Date(f.kickoffTime).getTime())))
      : undefined;

  return (
    <div>
      <ScorebugPanel gameweek={currentGameweek.data} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 18, alignItems: 'start' }}>
        <div>
          {myStanding && (
            <StatTiles standing={myStanding} totalTeams={standings.data?.length ?? 0} captainPointsRank={captainPointsRank} />
          )}
          <NextFixtureCard
            match={myMatch}
            myFantasyTeamId={myFantasyTeam.data.fantasyTeamId}
            fantasyTeamsById={fantasyTeamsById}
            standingsByTeamId={standingsByTeamId}
            firstKickoffTime={firstKickoffTime}
            gameweekNumber={currentGameweek.data.number}
          />
          {messages.isPending && <LoadingState label="Loading league news…" />}
          {messages.error && <ErrorState error={messages.error} />}
          {messages.data && <NewsFeed messages={messages.data} membershipsById={membershipsById} />}
        </div>

        <CondensedStandings
          standings={standings.data ?? []}
          myFantasyTeamId={myFantasyTeam.data.fantasyTeamId}
          fantasyTeamsById={fantasyTeamsById}
          activeLeagueId={activeLeagueId}
        />
      </div>
    </div>
  );
}
