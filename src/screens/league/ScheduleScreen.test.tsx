import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScheduleScreen } from './ScheduleScreen';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-003.4 (BRD UIR-069-073). The active league in ActiveLeagueProvider's
// placeholder data is 'the-gaffers-league'.

const LEAGUE_ID = 'the-gaffers-league';

const CURRENT_USER = {
  userId: 'u1',
  username: 'wkline',
  email: 'wkline@example.com',
  status: 'Active',
  defaultIconId: 'icon-1',
  isSystemAdministrator: false,
  createdAt: '2026-01-01T00:00:00Z',
};

const SEASON = { seasonId: 's1', leagueId: LEAGUE_ID, eplSeasonIdentifier: '2026/27', status: 'InSeason', startDate: '2026-08-01', endDate: null };
const FANTASY_TEAMS = [
  { fantasyTeamId: 'ft1', leagueMembershipId: 'm1', seasonId: 's1', username: 'wkline', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { fantasyTeamId: 'ft2', leagueMembershipId: 'm2', seasonId: 's1', username: 'cornerkick_kev', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
];

const now = Date.now();
const GAMEWEEKS = [
  { gameweekId: 'gw9', eplSeasonIdentifier: '2026/27', number: 9, rosterLockDeadline: new Date(now - 7 * 86400_000).toISOString() },
  { gameweekId: 'gw10', eplSeasonIdentifier: '2026/27', number: 10, rosterLockDeadline: new Date(now + 30 * 3600_000).toISOString() },
  { gameweekId: 'gw11', eplSeasonIdentifier: '2026/27', number: 11, rosterLockDeadline: new Date(now + 7 * 86400_000).toISOString() },
];

const SCHEDULE = [
  { matchId: 'm1', seasonId: 's1', gameweekId: 'gw9', homeFantasyTeamId: 'ft1', awayFantasyTeamId: 'ft2', homeScore: 2, awayScore: 2, result: 'Draw', leaguePointsHome: 1, leaguePointsAway: 1 },
  { matchId: 'm2', seasonId: 's1', gameweekId: 'gw10', homeFantasyTeamId: 'ft1', awayFantasyTeamId: 'ft2', homeScore: null, awayScore: null, result: null, leaguePointsHome: null, leaguePointsAway: null },
  { matchId: 'm3', seasonId: 's1', gameweekId: 'gw11', homeFantasyTeamId: 'ft2', awayFantasyTeamId: 'ft1', homeScore: null, awayScore: null, result: null, leaguePointsHome: null, leaguePointsAway: null },
];

const FIXTURES_GW10 = [
  { fixtureId: 'f1', gameweekId: 'gw10', homeClubId: 'c1', awayClubId: 'c2', kickoffTime: new Date(now + 28 * 3600_000).toISOString(), status: 'Scheduled', homeGoals: null, awayGoals: null },
];
const FIXTURES_GW11 = [
  { fixtureId: 'f2', gameweekId: 'gw11', homeClubId: 'c1', awayClubId: 'c2', kickoffTime: new Date(now + 6 * 86400_000).toISOString(), status: 'Scheduled', homeGoals: null, awayGoals: null },
];

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function renderScheduleScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveLeagueProvider>
        <ScheduleScreen />
      </ActiveLeagueProvider>
    </QueryClientProvider>,
  );
}

describe('ScheduleScreen', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));

        if (path === '/users/me') return jsonResponse(CURRENT_USER);
        if (path === `/leagues/${LEAGUE_ID}/seasons`) return jsonResponse([SEASON]);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/fantasy-teams`) return jsonResponse(FANTASY_TEAMS);
        if (path === '/epl/gameweeks' && url.searchParams.get('eplSeasonIdentifier') === '2026/27') return jsonResponse(GAMEWEEKS);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/schedule` && !url.searchParams.get('gameweekId')) return jsonResponse(SCHEDULE);
        if (path === '/epl/gameweeks/gw10/fixtures') return jsonResponse(FIXTURES_GW10);
        if (path === '/epl/gameweeks/gw11/fixtures') return jsonResponse(FIXTURES_GW11);

        throw new Error(`Unhandled request: ${path}`);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pre-selects the current Gameweek and labels it "Upcoming" (UIR-069, UIR-070)', async () => {
    renderScheduleScreen();
    const tab = await screen.findByRole('tab', { name: 'GW10 · Upcoming' });
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'GW9 · Results' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'GW11 · Fixtures' })).toHaveAttribute('aria-selected', 'false');
  });

  it('result-codes a completed Gameweek with both team identities and the final score (UIR-071)', async () => {
    const user = userEvent.setup();
    renderScheduleScreen();
    await user.click(await screen.findByRole('tab', { name: 'GW9 · Results' }));

    expect(await screen.findByText('wkline')).toBeInTheDocument();
    expect(screen.getByText('cornerkick_kev')).toBeInTheDocument();
    expect(screen.getByText('2–2')).toBeInTheDocument();
    expect(screen.getByText('FT')).toBeInTheDocument();
  });

  it('shows a kickoff time (not a score) for an unresolved Gameweek (UIR-072)', async () => {
    renderScheduleScreen();
    await screen.findByText('wkline');
    expect(screen.queryByText('FT')).not.toBeInTheDocument();
    expect(await screen.findByText(/[A-Za-z]{3}\s\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it("reaches a future Gameweek's fixtures immediately, already loaded (UIR-073)", async () => {
    const user = userEvent.setup();
    renderScheduleScreen();
    await user.click(await screen.findByRole('tab', { name: 'GW11 · Fixtures' }));

    expect(await screen.findByText('cornerkick_kev')).toBeInTheDocument();
    expect(screen.getAllByText('wkline').length).toBeGreaterThan(0);
  });
});
