import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HistoryScreen } from './HistoryScreen';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-004.6 (BRD UIR-089-098). The active league in ActiveLeagueProvider's
// placeholder data is 'the-gaffers-league'.

const LEAGUE_ID = 'the-gaffers-league';

const SEASONS = [
  { seasonId: 's2025', leagueId: LEAGUE_ID, eplSeasonIdentifier: '2025/26', status: 'Completed', startDate: '2025-08-01', endDate: '2026-05-31' },
  { seasonId: 's2024', leagueId: LEAGUE_ID, eplSeasonIdentifier: '2024/25', status: 'Completed', startDate: '2024-08-01', endDate: '2025-05-31' },
  { seasonId: 's2026', leagueId: LEAGUE_ID, eplSeasonIdentifier: '2026/27', status: 'InSeason', startDate: '2026-08-01', endDate: null },
];

const FANTASY_TEAMS_2025 = [
  { fantasyTeamId: 'ft1', leagueMembershipId: 'm1', seasonId: 's2025', username: 'wkline', status: 'Active', createdAt: '2025-08-01T00:00:00Z' },
  { fantasyTeamId: 'ft2', leagueMembershipId: 'm2', seasonId: 's2025', username: 'cornerkick_kev', status: 'Active', createdAt: '2025-08-01T00:00:00Z' },
];

const STANDINGS_2025 = [
  { fantasyTeamId: 'ft1', position: 1, played: 38, won: 20, drawn: 10, lost: 8, fantasyGoalsFor: 80, fantasyGoalsAgainst: 60, fantasyGoalDifference: 20, captainPointsTotal: 300, leaguePoints: 70 },
  { fantasyTeamId: 'ft2', position: 2, played: 38, won: 18, drawn: 8, lost: 12, fantasyGoalsFor: 75, fantasyGoalsAgainst: 65, fantasyGoalDifference: 10, captainPointsTotal: 280, leaguePoints: 62 },
];

const LEAGUE_CONFIGURATION = {
  leagueId: LEAGUE_ID,
  initialSquadSize: 25,
  weeklyRosterSize: 15,
  positionalMinimums: { gk: 1, def: 3, mid: 2, fwd: 1 },
  draftTimerSecondsByType: { initial: 300, secondary: 300, replacement: 300 },
  secondaryDraftSelectionsPerTeam: 5,
  secondaryDraftSchedulingOffsetDays: 1,
  gameweekRosterLockOffsetBeforeKickoffMinutes: 60,
  leaguePoints: { win: 3, draw: 1, loss: 0 },
  invitationExpirationDays: 10,
  replacementSelectionCap: null,
  gameweekReminderLeadTimeHours: 24,
  tieBreakRulesetVersion: 'v1',
  updatedAt: '2026-01-01T00:00:00Z',
};

const SEASON_CONFIGURATION_2025 = { ...LEAGUE_CONFIGURATION, seasonId: 's2025', invitationExpirationDays: 7, lockedFields: [] };

const DRAFTS_2025 = [{ draftId: 'd1', seasonId: 's2025', draftType: 'Initial', status: 'Completed', draftOrder: ['ft1', 'ft2'], currentRound: 1, currentPickIndex: 0, timerSeconds: 300 }];

const DRAFT_SELECTIONS_2025 = {
  items: [
    { draftSelectionId: 'sel1', draftId: 'd1', fantasyTeamId: 'ft1', playerId: 'p1', round: 1, pickNumber: 1, selectedAt: '2025-08-01T00:00:00Z', isMakeupPick: false },
    { draftSelectionId: 'sel2', draftId: 'd1', fantasyTeamId: 'ft2', playerId: 'p2', round: 1, pickNumber: 2, selectedAt: '2025-08-01T00:05:00Z', isMakeupPick: false },
    { draftSelectionId: 'sel3', draftId: 'd1', fantasyTeamId: 'ft1', playerId: 'p3', round: 2, pickNumber: 3, selectedAt: '2025-08-01T00:10:00Z', isMakeupPick: false },
  ],
  nextCursor: null,
};

const SQUAD_FT1 = [
  { squadPlayerId: 'sp1', playerId: 'p1', playerName: 'Erling Haaland', clubId: 'c1', position: 'Fwd', acquisitionType: 'InitialDraft', acquiredAt: '2025-08-01T00:00:00Z', isCurrentlyOwned: true, onCurrentGameweekRoster: true, replacementEligibleAt: null, seasonMinutesPlayed: 3000, seasonGamesPlayed: 35, seasonFantasyPoints: 250 },
  { squadPlayerId: 'sp3', playerId: 'p3', playerName: 'Rodri', clubId: 'c1', position: 'Mid', acquisitionType: 'InitialDraft', acquiredAt: '2025-08-01T00:10:00Z', isCurrentlyOwned: true, onCurrentGameweekRoster: true, replacementEligibleAt: null, seasonMinutesPlayed: 2800, seasonGamesPlayed: 32, seasonFantasyPoints: 180 },
];

const SQUAD_FT2 = [
  { squadPlayerId: 'sp2', playerId: 'p2', playerName: 'Cole Palmer', clubId: 'c2', position: 'Mid', acquisitionType: 'InitialDraft', acquiredAt: '2025-08-01T00:05:00Z', isCurrentlyOwned: true, onCurrentGameweekRoster: true, replacementEligibleAt: null, seasonMinutesPlayed: 2900, seasonGamesPlayed: 34, seasonFantasyPoints: 210 },
];

const CLUBS = [
  { clubId: 'c1', name: 'Manchester City', shortName: 'MCI' },
  { clubId: 'c2', name: 'Chelsea', shortName: 'CHE' },
];

const GAMEWEEKS_2025 = [
  { gameweekId: 'gw1', eplSeasonIdentifier: '2025/26', number: 1, rosterLockDeadline: '2025-08-10T00:00:00Z' },
  { gameweekId: 'gw2', eplSeasonIdentifier: '2025/26', number: 2, rosterLockDeadline: '2025-08-17T00:00:00Z' },
];

const GAMEWEEK_ROSTER_FT1_GW1 = {
  gameweekRosterId: 'gr1',
  fantasyTeamId: 'ft1',
  gameweekId: 'gw1',
  status: 'Scored',
  submittedAt: '2025-08-09T00:00:00Z',
  lockedAt: '2025-08-10T00:00:00Z',
  captainPlayerId: 'p1',
  players: [
    { playerId: 'p1', isCaptain: true, selectionRole: 'StartingXI', opponentClubId: 'c2', opponentIsHome: true },
    { playerId: 'p3', isCaptain: false, selectionRole: 'StartingXI', opponentClubId: 'c2', opponentIsHome: true },
  ],
  gameweekFixtures: [],
};

const GAMEWEEK_SCORE_FT1_GW1 = {
  gameweekScoreId: 'gs1',
  fantasyTeamId: 'ft1',
  gameweekId: 'gw1',
  fantasyPoints: 65,
  captainPoints: 20,
  fantasyGoalsFor: 3,
  fantasyGoalsAgainst: 1,
  fantasyGoalDifference: 2,
  calculatedAt: '2025-08-11T00:00:00Z',
  recalculatedCount: 0,
};

const SCHEDULE_GW1 = [
  { matchId: 'm1', seasonId: 's2025', gameweekId: 'gw1', homeFantasyTeamId: 'ft1', awayFantasyTeamId: 'ft2', homeScore: 3, awayScore: 1, result: 'HomeWin', leaguePointsHome: 3, leaguePointsAway: 0 },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderHistoryScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveLeagueProvider>
        <HistoryScreen />
      </ActiveLeagueProvider>
    </QueryClientProvider>,
  );
}

describe('HistoryScreen', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        const method = init?.method ?? 'GET';

        if (path === `/leagues/${LEAGUE_ID}/seasons`) return jsonResponse(SEASONS);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s2025/fantasy-teams`) return jsonResponse(FANTASY_TEAMS_2025);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s2025/standings`) return jsonResponse(STANDINGS_2025);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s2025/configuration`) return jsonResponse(SEASON_CONFIGURATION_2025);
        if (path === `/leagues/${LEAGUE_ID}/configuration`) return jsonResponse(LEAGUE_CONFIGURATION);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s2025/drafts`) return jsonResponse(DRAFTS_2025);
        if (path === '/drafts/d1/selections') return jsonResponse(DRAFT_SELECTIONS_2025);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s2025/fantasy-teams/ft1/squad`) return jsonResponse(SQUAD_FT1);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s2025/fantasy-teams/ft2/squad`) return jsonResponse(SQUAD_FT2);
        if (path === '/epl/clubs') return jsonResponse(CLUBS);
        if (path === '/epl/gameweeks' && url.searchParams.get('eplSeasonIdentifier') === '2025/26') return jsonResponse(GAMEWEEKS_2025);
        if (path === '/fantasy-teams/ft1/gameweeks/gw1/roster' && method === 'GET') return jsonResponse(GAMEWEEK_ROSTER_FT1_GW1);
        if (path === '/fantasy-teams/ft1/gameweeks/gw1/score' && method === 'GET') return jsonResponse(GAMEWEEK_SCORE_FT1_GW1);
        if (path === '/fantasy-teams/ft2/gameweeks/gw2/roster' && method === 'GET') return jsonResponse({ status: 404 }, 404);
        if (path === '/fantasy-teams/ft2/gameweeks/gw2/score' && method === 'GET') return jsonResponse({ status: 404 }, 404);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s2025/schedule` && url.searchParams.get('gameweekId') === 'gw1') return jsonResponse(SCHEDULE_GW1);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s2025/schedule` && url.searchParams.get('gameweekId') === 'gw2') return jsonResponse([]);

        throw new Error(`Unhandled request: ${method} ${path}${url.search}`);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows completed seasons as selectable tabs and the in-progress season disabled with a tooltip (UIR-089)', async () => {
    renderHistoryScreen();

    const completedTab = await screen.findByRole('tab', { name: '2025/26 · Completed' });
    expect(completedTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '2024/25 · Completed' })).toBeInTheDocument();

    const inProgressTab = screen.getByRole('tab', { name: '2026/27' });
    expect(inProgressTab).toBeDisabled();
    expect(inProgressTab).toHaveAttribute('title', expect.stringContaining('still in progress'));
  });

  it('defaults to Final Standings with a champion banner and the full column set (UIR-090, UIR-091, UIR-092)', async () => {
    renderHistoryScreen();

    expect(await screen.findByText('Champion')).toBeInTheDocument();
    expect(screen.getAllByText('wkline').length).toBeGreaterThan(0);
    const table = screen.getAllByRole('table')[0];
    expect(within(table).getByText('cornerkick_kev')).toBeInTheDocument();
    expect(within(table).getByText('70')).toBeInTheDocument();
  });

  it("flags a configuration field that differs from the league's current setting (UIR-093)", async () => {
    renderHistoryScreen();

    expect(await screen.findByText('7 days')).toBeInTheDocument();
    expect(screen.getByText(/Differs from the current league setting \(10 days\)/)).toBeInTheDocument();
  });

  it("lists every pick in order for a selected team's Draft History, updating on team change (UIR-094, UIR-095)", async () => {
    const user = userEvent.setup();
    renderHistoryScreen();

    await user.click(await screen.findByRole('tab', { name: 'Draft History' }));

    expect(await screen.findByText('Erling Haaland')).toBeInTheDocument();
    expect(screen.getByText('Rodri')).toBeInTheDocument();
    expect(screen.getAllByText('MCI').length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByLabelText('Select team'), 'cornerkick_kev');

    expect(await screen.findByText('Cole Palmer')).toBeInTheDocument();
    expect(screen.queryByText('Erling Haaland')).not.toBeInTheDocument();
  });

  it("shows the Gameweek Roster's match result, fantasy points, captain, locked status, and full player list (UIR-096)", async () => {
    const user = userEvent.setup();
    renderHistoryScreen();

    await user.click(await screen.findByRole('tab', { name: 'Gameweek Roster' }));

    expect(await screen.findByText(/3–1 vs cornerkick_kev/)).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
    expect(screen.getAllByText('Erling Haaland').length).toBe(2); // captain summary stat + roster row
    expect(screen.getByText('Rodri')).toBeInTheDocument();
    const labels = screen.getAllByText('Yes');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('shows an explanatory placeholder for an un-illustrated team/Gameweek combination (UIR-097)', async () => {
    const user = userEvent.setup();
    renderHistoryScreen();

    await user.click(await screen.findByRole('tab', { name: 'Gameweek Roster' }));
    await screen.findByText(/3–1 vs cornerkick_kev/);

    await user.selectOptions(screen.getByLabelText('Select team'), 'cornerkick_kev');
    await user.selectOptions(screen.getByLabelText('Select Gameweek'), 'GW2');

    expect(await screen.findByText(/genuinely stored and queryable/)).toBeInTheDocument();
  });

  it('states historical records are joined by internal id, never username (UIR-098)', async () => {
    renderHistoryScreen();

    expect(await screen.findByText(/joined by internal id, never by username/)).toBeInTheDocument();
    expect(screen.getByText(/no way to check any user's retirement status/)).toBeInTheDocument();
  });
});
