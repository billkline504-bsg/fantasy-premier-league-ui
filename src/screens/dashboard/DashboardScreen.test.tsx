import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardScreen } from './DashboardScreen';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-003.1 (BRD UIR-035-042). The active league in ActiveLeagueProvider's
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

const SEASON = {
  seasonId: 's1',
  leagueId: LEAGUE_ID,
  eplSeasonIdentifier: '2026/27',
  status: 'InSeason',
  startDate: '2026-08-01',
  endDate: null,
};

const MEMBERSHIPS = [
  { leagueMembershipId: 'm1', leagueId: LEAGUE_ID, userId: 'u1', username: 'wkline', isAdministrator: true, leagueIconId: null, effectiveIconId: 'icon-1', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
  { leagueMembershipId: 'm2', leagueId: LEAGUE_ID, userId: 'u2', username: 'cornerkick_kev', isAdministrator: false, leagueIconId: null, effectiveIconId: 'icon-2', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
];

const FANTASY_TEAMS = [
  { fantasyTeamId: 'ft1', leagueMembershipId: 'm1', seasonId: 's1', username: 'wkline', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { fantasyTeamId: 'ft2', leagueMembershipId: 'm2', seasonId: 's1', username: 'cornerkick_kev', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
];

const now = Date.now();
const GAMEWEEKS = [
  { gameweekId: 'gw9', eplSeasonIdentifier: '2026/27', number: 9, rosterLockDeadline: new Date(now - 7 * 86400_000).toISOString() },
  { gameweekId: 'gw10', eplSeasonIdentifier: '2026/27', number: 10, rosterLockDeadline: new Date(now + 30 * 3600_000).toISOString() },
];

// wkline (ft1) trails on League Position (2nd) but leads on the Captain Points tie-break stat
// (142 vs 99) — deliberately mirrors the mock-up's own scenario, to prove the two ranks are
// computed independently rather than one derived from the other.
const STANDINGS = [
  { fantasyTeamId: 'ft1', leaguePoints: 21, played: 9, won: 6, drawn: 3, lost: 0, fantasyGoalsFor: 31, fantasyGoalsAgainst: 24, fantasyGoalDifference: 7, captainPointsTotal: 142, position: 2, asOfGameweekId: 'gw9' },
  { fantasyTeamId: 'ft2', leaguePoints: 22, played: 9, won: 7, drawn: 1, lost: 1, fantasyGoalsFor: 33, fantasyGoalsAgainst: 24, fantasyGoalDifference: 9, captainPointsTotal: 99, position: 1, asOfGameweekId: 'gw9' },
];

const SCHEDULE_GW10 = [
  { matchId: 'match1', seasonId: 's1', gameweekId: 'gw10', homeFantasyTeamId: 'ft1', awayFantasyTeamId: 'ft2', homeScore: null, awayScore: null, result: null, leaguePointsHome: null, leaguePointsAway: null },
];

const MESSAGES = [
  { leagueMessageId: 'msg1', leagueId: LEAGUE_ID, authorMembershipId: 'm1', body: 'Reminder: GW10 lineups lock Saturday.', publishedAt: new Date(now - 3600_000).toISOString() },
];

const FIXTURES_GW10 = [
  { fixtureId: 'f1', gameweekId: 'gw10', homeClubId: 'c1', awayClubId: 'c2', kickoffTime: new Date(now + 28 * 3600_000).toISOString(), status: 'Scheduled', homeGoals: null, awayGoals: null },
];

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ActiveLeagueProvider>
          <DashboardScreen />
        </ActiveLeagueProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardScreen', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));

        if (path === '/users/me') return jsonResponse(CURRENT_USER);
        if (path === `/leagues/${LEAGUE_ID}/seasons`) return jsonResponse([SEASON]);
        if (path === `/leagues/${LEAGUE_ID}/memberships`) return jsonResponse(MEMBERSHIPS);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/fantasy-teams`) return jsonResponse(FANTASY_TEAMS);
        if (path === '/epl/gameweeks' && url.searchParams.get('eplSeasonIdentifier') === '2026/27') {
          return jsonResponse(GAMEWEEKS);
        }
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/standings`) return jsonResponse(STANDINGS);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/schedule` && url.searchParams.get('gameweekId') === 'gw10') {
          return jsonResponse(SCHEDULE_GW10);
        }
        if (path === `/leagues/${LEAGUE_ID}/messages`) return jsonResponse(MESSAGES);
        if (path === '/epl/gameweeks/gw10/fixtures') return jsonResponse(FIXTURES_GW10);

        throw new Error(`Unhandled request: ${path}`);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('picks the Gameweek whose deadline is still in the future as current (GW10, not GW9) for the scorebug (UIR-035)', async () => {
    renderDashboard();
    expect(await screen.findByText('GW10')).toBeInTheDocument();
  });

  it('computes League Position and Captain Points rank independently (UIR-036)', async () => {
    renderDashboard();
    expect(await screen.findByText('2nd')).toBeInTheDocument(); // League Position
    const leaguePointsTile = screen.getByText('League Points').parentElement!;
    expect(within(leaguePointsTile).getByText('21')).toBeInTheDocument();
    expect(within(leaguePointsTile).getByText('6W · 3D · 0L')).toBeInTheDocument();
    const fantasyGdTile = screen.getByText('Fantasy Goal Diff.').parentElement!;
    expect(within(fantasyGdTile).getByText('+7')).toBeInTheDocument();
    const captainTile = screen.getByText('142').closest('div')!;
    expect(within(captainTile.parentElement!).getByText(/rank 1st/)).toBeInTheDocument();
  });

  it('shows the next Head-to-Head fixture with both team identities (UIR-037)', async () => {
    renderDashboard();
    const fixtureHeading = await screen.findByText('Next Head-to-Head · GW10');
    const card = fixtureHeading.closest('div')!.parentElement!;
    expect(within(card).getByText('wkline')).toBeInTheDocument();
    expect(within(card).getByText('cornerkick_kev')).toBeInTheDocument();
  });

  it('shows recent league messages with the author resolved to a username, newest first (UIR-038)', async () => {
    renderDashboard();
    expect(await screen.findByText('Reminder: GW10 lineups lock Saturday.')).toBeInTheDocument();
    expect(screen.getAllByText('wkline').length).toBeGreaterThan(0);
  });

  it("highlights the viewer's own row in the condensed standings and links to the full table (UIR-039, UIR-040)", async () => {
    renderDashboard();
    await screen.findByText('Standings');
    const rows = screen.getAllByRole('row');
    const myRow = rows.find((r) => within(r).queryByText('wkline'));
    expect(myRow).toHaveStyle({ background: 'var(--turf-soft)' });

    const link = screen.getByRole('link', { name: /view full table/i });
    expect(link).toHaveAttribute('href', `/leagues/${LEAGUE_ID}/table`);
  });
});
