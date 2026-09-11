import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableScreen } from './TableScreen';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-003.3 (BRD UIR-064-068). The active league in ActiveLeagueProvider's
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
const MEMBERSHIPS = [{ leagueMembershipId: 'm1', leagueId: LEAGUE_ID, userId: 'u1', username: 'wkline', isAdministrator: true, leagueIconId: null, effectiveIconId: 'icon-1', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null }];
const FANTASY_TEAMS = [
  { fantasyTeamId: 'ft1', leagueMembershipId: 'm1', seasonId: 's1', username: 'wkline', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { fantasyTeamId: 'ft2', leagueMembershipId: 'm2', seasonId: 's1', username: 'cornerkick_kev', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
];

const CONFIGURATION = {
  leagueId: LEAGUE_ID,
  initialSquadSize: 25,
  weeklyRosterSize: 15,
  positionalMinimums: { gk: 1, def: 3, mid: 2, fwd: 1 },
  draftTimerSecondsByType: { initial: 300, secondary: 300, replacement: 300 },
  secondaryDraftSelectionsPerTeam: 5,
  secondaryDraftSchedulingOffsetDays: 1,
  gameweekRosterLockOffsetBeforeKickoffMinutes: 60,
  leaguePoints: { win: 3, draw: 1, loss: 0 },
  invitationExpirationDays: 7,
  replacementSelectionCap: null,
  gameweekReminderLeadTimeHours: 24,
  tieBreakRulesetVersion: 'v1',
  updatedAt: '2026-01-01T00:00:00Z',
  updatedByMembershipId: 'm1',
};

const STANDINGS = [
  { fantasyTeamId: 'ft2', leaguePoints: 22, played: 9, won: 7, drawn: 1, lost: 1, fantasyGoalsFor: 33, fantasyGoalsAgainst: 24, fantasyGoalDifference: 9, captainPointsTotal: 99, position: 1, asOfGameweekId: 'gw9' },
  { fantasyTeamId: 'ft1', leaguePoints: 21, played: 9, won: 6, drawn: 3, lost: 0, fantasyGoalsFor: 31, fantasyGoalsAgainst: 24, fantasyGoalDifference: 7, captainPointsTotal: 142, position: 2, asOfGameweekId: 'gw9' },
];

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function renderTableScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveLeagueProvider>
        <TableScreen />
      </ActiveLeagueProvider>
    </QueryClientProvider>,
  );
}

describe('TableScreen', () => {
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
        if (path === `/leagues/${LEAGUE_ID}/configuration`) return jsonResponse(CONFIGURATION);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/standings`) return jsonResponse(STANDINGS);

        throw new Error(`Unhandled request: ${path}`);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders every FantasyTeam with the full column set, identified by username (UIR-064, UIR-068)', async () => {
    renderTableScreen();
    expect(await screen.findByText('cornerkick_kev')).toBeInTheDocument();
    const myRow = screen.getByText('wkline').closest('tr')!;
    expect(within(myRow).getByText('21')).toBeInTheDocument(); // league points
    expect(within(myRow).getByText('142')).toBeInTheDocument(); // captain points
    expect(within(myRow).getByText('+7')).toBeInTheDocument(); // GD
  });

  it("highlights the viewer's own row (UIR-040, UIR-067)", async () => {
    renderTableScreen();
    const myRow = (await screen.findByText('wkline')).closest('tr')!;
    expect(myRow).toHaveStyle({ background: 'var(--turf-soft)' });
    const otherRow = screen.getByText('cornerkick_kev').closest('tr')!;
    expect(otherRow).not.toHaveStyle({ background: 'var(--turf-soft)' });
  });

  it("states the League's own points-per-result convention (UIR-066)", async () => {
    renderTableScreen();
    expect(await screen.findByText(/3 for a win, 1 for a draw/)).toBeInTheDocument();
  });

  it('discloses the full tie-break order in plain text (UIR-065)', async () => {
    renderTableScreen();
    expect(await screen.findByText(/Pts → GD → GF → H2H → Captain Pts → Season Prediction → Random/)).toBeInTheDocument();
  });
});
