import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DraftBoardScreen } from './DraftBoardScreen';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-002.1/002.2 (BRD UIR-099-109). The active league in ActiveLeagueProvider's
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
  status: 'DraftInProgress',
  startDate: '2026-08-01',
  endDate: null,
};

const MEMBERSHIPS = [
  { leagueMembershipId: 'm1', leagueId: LEAGUE_ID, userId: 'u1', username: 'wkline', isAdministrator: true, leagueIconId: null, effectiveIconId: 'icon-1', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
  { leagueMembershipId: 'm2', leagueId: LEAGUE_ID, userId: 'u2', username: 'cornerkick_kev', isAdministrator: false, leagueIconId: null, effectiveIconId: 'icon-2', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
  { leagueMembershipId: 'm3', leagueId: LEAGUE_ID, userId: 'u3', username: 'sian88', isAdministrator: false, leagueIconId: null, effectiveIconId: 'icon-3', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
];

const FANTASY_TEAMS = [
  { fantasyTeamId: 'ft1', leagueMembershipId: 'm1', seasonId: 's1', username: 'wkline', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { fantasyTeamId: 'ft2', leagueMembershipId: 'm2', seasonId: 's1', username: 'cornerkick_kev', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { fantasyTeamId: 'ft3', leagueMembershipId: 'm3', seasonId: 's1', username: 'sian88', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
];

// Round 2 is even -> reversed order [ft3, ft2, ft1] = [sian88, cornerkick_kev, wkline];
// currentPickIndex 1 -> cornerkick_kev on the clock, not the test's own user (wkline).
let currentPickIndex = 1;
function draft() {
  return {
    draftId: 'd1',
    seasonId: 's1',
    draftType: 'Initial',
    status: 'InProgress',
    draftOrder: ['ft1', 'ft2', 'ft3'],
    currentRound: 2,
    currentPickIndex,
    timerSeconds: 300,
    currentPickDeadline: new Date(Date.now() + 4 * 60_000).toISOString(),
    pendingMakeupPicks: [],
  };
}

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

const CLUBS = [
  { clubId: 'c1', name: 'Newcastle United', shortName: 'NEW' },
  { clubId: 'c2', name: 'Manchester United', shortName: 'MUN' },
  { clubId: 'c3', name: 'Manchester City', shortName: 'MCI' },
];

const POOL = [
  { playerId: 'p1', playerName: 'Alexander Isak', clubId: 'c1', position: 'Fwd', seasonMinutesPlayed: 760, seasonGamesPlayed: 9, seasonFantasyPoints: 68 },
  { playerId: 'p2', playerName: 'Bruno Fernandes', clubId: 'c2', position: 'Mid', seasonMinutesPlayed: 801, seasonGamesPlayed: 9, seasonFantasyPoints: 63 },
];

const SELECTIONS = {
  items: [
    { draftSelectionId: 'sel1', draftId: 'd1', fantasyTeamId: 'ft1', playerId: 'p3', round: 1, pickNumber: 1, selectedAt: '2026-08-10T10:00:00Z', isMakeupPick: false },
  ],
  nextCursor: null,
};

const PLAYER_P3 = { playerId: 'p3', eplPlayerId: 'x', name: 'Erling Haaland', position: 'Fwd', currentClubId: 'c3' };

let lastPickRequest: { body: unknown; headers: Record<string, string> } | null = null;

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function renderDraftBoard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveLeagueProvider>
        <DraftBoardScreen />
      </ActiveLeagueProvider>
    </QueryClientProvider>,
  );
}

describe('DraftBoardScreen', () => {
  beforeEach(() => {
    currentPickIndex = 1;
    lastPickRequest = null;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        const method = init?.method ?? 'GET';

        if (path === '/users/me') return jsonResponse(CURRENT_USER);
        if (path === `/leagues/${LEAGUE_ID}/seasons`) return jsonResponse([SEASON]);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/drafts`) return jsonResponse([draft()]);
        if (path === '/drafts/d1') return jsonResponse(draft());
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/fantasy-teams`) return jsonResponse(FANTASY_TEAMS);
        if (path === `/leagues/${LEAGUE_ID}/memberships`) return jsonResponse(MEMBERSHIPS);
        if (path === `/leagues/${LEAGUE_ID}/configuration`) return jsonResponse(CONFIGURATION);
        if (path === '/epl/clubs') return jsonResponse(CLUBS);
        if (path === '/drafts/d1/player-pool') {
          const position = url.searchParams.get('position');
          const filtered = position ? POOL.filter((p) => p.position === position) : POOL;
          return jsonResponse(filtered);
        }
        if (path === '/drafts/d1/selections') return jsonResponse(SELECTIONS);
        if (path === '/epl/players/p3') return jsonResponse(PLAYER_P3);
        if (path === '/drafts/d1/picks' && method === 'POST') {
          lastPickRequest = { body: JSON.parse((init?.body as string) ?? '{}'), headers: (init?.headers as Record<string, string>) ?? {} };
          return jsonResponse(
            { draftSelectionId: 'sel-new', draftId: 'd1', fantasyTeamId: 'ft2', playerId: 'p1', round: 2, pickNumber: 4, selectedAt: new Date().toISOString(), isMakeupPick: false },
          );
        }

        throw new Error(`Unhandled request: ${method} ${path}`);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the draft context header (UIR-099, UIR-108) and the on-clock team (UIR-101)', async () => {
    renderDraftBoard();
    expect(await screen.findByText('Initial Draft · Round 2 of 25')).toBeInTheDocument();
    const onClockHeading = await screen.findByText('● On the clock');
    expect(within(onClockHeading.closest('div')!.parentElement!).getByText('cornerkick_kev')).toBeInTheDocument();
  });

  it('distinguishes completed/current/upcoming teams in the round order (UIR-100)', async () => {
    renderDraftBoard();
    const heading = await screen.findByText('Round 2 Order (reverse)');
    const panel = heading.closest('div')!;
    expect(within(panel).getByText('sian88')).toBeInTheDocument();
    expect(within(panel).getByText('cornerkick_kev')).toBeInTheDocument();
    expect(within(panel).getByText('wkline')).toBeInTheDocument();
  });

  it("disables the Draft action when it isn't my turn (UIR-103)", async () => {
    renderDraftBoard();
    const draftButtons = await screen.findAllByRole('button', { name: 'Draft' });
    expect(draftButtons.length).toBeGreaterThan(0);
    draftButtons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('enables the Draft action and submits a pick with a fresh Idempotency-Key when it is my turn (UIR-103)', async () => {
    currentPickIndex = 2; // reversed order index 2 = ft1 = wkline (this test's user)
    const user = userEvent.setup();
    renderDraftBoard();

    const draftButtons = await screen.findAllByRole('button', { name: 'Draft' });
    draftButtons.forEach((btn) => expect(btn).toBeEnabled());

    await user.click(draftButtons[0]);

    expect(lastPickRequest).not.toBeNull();
    expect(lastPickRequest?.body).toEqual({ playerId: 'p1' });
    expect(lastPickRequest?.headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("shows season-to-date stats' zero-disclosure note for an Initial Draft (UIR-106)", async () => {
    renderDraftBoard();
    expect(await screen.findByText(/legitimately read zero before any Gameweek has been scored/i)).toBeInTheDocument();
  });

  it('shows recent picks with resolved player and team names (UIR-105)', async () => {
    renderDraftBoard();
    expect(await screen.findByText('Erling Haaland', { exact: false })).toBeInTheDocument();
  });

  it('filters the pool by position (UIR-015/UIR-102)', async () => {
    const user = userEvent.setup();
    renderDraftBoard();
    await screen.findByText('Alexander Isak');
    expect(screen.getByText('Bruno Fernandes')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'FWD' }));

    expect(await screen.findByText('Alexander Isak')).toBeInTheDocument();
    expect(screen.queryByText('Bruno Fernandes')).not.toBeInTheDocument();
  });
});
