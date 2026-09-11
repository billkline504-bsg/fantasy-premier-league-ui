import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LineupScreen } from './LineupScreen';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-003.2 (BRD UIR-043-054). Configuration uses a deliberately tiny
// weeklyRosterSize (2) and zeroed positional minimums so the test squad can stay small while
// still exercising the real add/remove/submit logic against the actual configured size,
// rather than a hardcoded 15.

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
const FANTASY_TEAMS = [{ fantasyTeamId: 'ft1', leagueMembershipId: 'm1', seasonId: 's1', username: 'wkline', status: 'Active', createdAt: '2026-01-01T00:00:00Z' }];

const now = Date.now();
const GAMEWEEKS = [{ gameweekId: 'gw10', eplSeasonIdentifier: '2026/27', number: 10, rosterLockDeadline: new Date(now + 30 * 3600_000).toISOString() }];

const CONFIGURATION = {
  leagueId: LEAGUE_ID,
  initialSquadSize: 25,
  weeklyRosterSize: 2,
  positionalMinimums: { gk: 0, def: 0, mid: 0, fwd: 0 },
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
  { clubId: 'c1', name: 'Liverpool', shortName: 'LIV' },
  { clubId: 'c2', name: 'Everton', shortName: 'EVE' },
  { clubId: 'c3', name: 'Arsenal', shortName: 'ARS' },
  { clubId: 'c4', name: 'Sunderland', shortName: 'SUN' },
];

const FIXTURES_GW10 = [
  { fixtureId: 'f1', gameweekId: 'gw10', homeClubId: 'c1', awayClubId: 'c2', kickoffTime: new Date(now + 28 * 3600_000).toISOString(), status: 'Scheduled', homeGoals: null, awayGoals: null },
];

let squadFixture: unknown[] = [];
function makeSquad() {
  return [
    { squadPlayerId: 'sp1', playerId: 'p1', playerName: 'Alisson', clubId: 'c1', position: 'Gk', acquisitionType: 'InitialDraft', acquiredAt: '2026-08-01T00:00:00Z', isCurrentlyOwned: true, onCurrentGameweekRoster: true, replacementEligibleAt: null, seasonMinutesPlayed: 810, seasonGamesPlayed: 9, seasonFantasyPoints: 52 },
    { squadPlayerId: 'sp2', playerId: 'p2', playerName: 'Trent Alexander-Arnold', clubId: 'c1', position: 'Def', acquisitionType: 'InitialDraft', acquiredAt: '2026-08-01T00:00:00Z', isCurrentlyOwned: true, onCurrentGameweekRoster: true, replacementEligibleAt: null, seasonMinutesPlayed: 738, seasonGamesPlayed: 9, seasonFantasyPoints: 61 },
    { squadPlayerId: 'sp3', playerId: 'p3', playerName: 'Bench Guy', clubId: 'c2', position: 'Mid', acquisitionType: 'SecondaryDraft', acquiredAt: '2026-08-01T00:00:00Z', isCurrentlyOwned: true, onCurrentGameweekRoster: false, replacementEligibleAt: null, seasonMinutesPlayed: 200, seasonGamesPlayed: 3, seasonFantasyPoints: 10 },
    { squadPlayerId: 'sp4', playerId: 'p4', playerName: 'Injured Guy', clubId: 'c3', position: 'Fwd', acquisitionType: 'InitialDraft', acquiredAt: '2026-08-01T00:00:00Z', isCurrentlyOwned: true, onCurrentGameweekRoster: false, replacementEligibleAt: '2026-09-01T09:14:00Z', seasonMinutesPlayed: 360, seasonGamesPlayed: 5, seasonFantasyPoints: 22 },
  ];
}

let rosterStatus = 'Draft';
let lastSubmitRequest: { body: unknown; headers: Record<string, string> } | null = null;

function jsonResponse(body: unknown, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json', ...extraHeaders } });
}

function renderLineupScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ActiveLeagueProvider>
          <LineupScreen />
        </ActiveLeagueProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LineupScreen', () => {
  beforeEach(() => {
    rosterStatus = 'Draft';
    squadFixture = makeSquad();
    lastSubmitRequest = null;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        const method = init?.method ?? 'GET';

        if (path === '/users/me') return jsonResponse(CURRENT_USER);
        if (path === `/leagues/${LEAGUE_ID}/seasons`) return jsonResponse([SEASON]);
        if (path === `/leagues/${LEAGUE_ID}/memberships`) return jsonResponse(MEMBERSHIPS);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/fantasy-teams`) return jsonResponse(FANTASY_TEAMS);
        if (path === `/leagues/${LEAGUE_ID}/configuration`) return jsonResponse(CONFIGURATION);
        if (path === '/epl/clubs') return jsonResponse(CLUBS);
        if (path === '/epl/gameweeks' && url.searchParams.get('eplSeasonIdentifier') === '2026/27') return jsonResponse(GAMEWEEKS);
        if (path === '/epl/gameweeks/gw10/fixtures') return jsonResponse(FIXTURES_GW10);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/fantasy-teams/ft1/squad`) return jsonResponse(squadFixture);
        if (path === '/fantasy-teams/ft1/gameweeks/gw10/roster' && method === 'GET') {
          return jsonResponse(
            { gameweekRosterId: 'gr1', fantasyTeamId: 'ft1', gameweekId: 'gw10', status: rosterStatus, submittedAt: null, lockedAt: null, captainPlayerId: 'p1', players: [], gameweekFixtures: FIXTURES_GW10 },
            { ETag: '"etag-1"' },
          );
        }
        if (path === '/fantasy-teams/ft1/gameweeks/gw10/roster' && method === 'PUT') {
          lastSubmitRequest = { body: JSON.parse((init?.body as string) ?? '{}'), headers: (init?.headers as Record<string, string>) ?? {} };
          return jsonResponse({ gameweekRosterId: 'gr1', fantasyTeamId: 'ft1', gameweekId: 'gw10', status: 'Submitted', submittedAt: new Date().toISOString(), lockedAt: null, captainPlayerId: (JSON.parse((init?.body as string) ?? '{}')).captainPlayerId ?? null, players: [], gameweekFixtures: FIXTURES_GW10 });
        }

        throw new Error(`Unhandled request: ${method} ${path}`);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the squad-size header and the Gameweek roster title (UIR-053)', async () => {
    renderLineupScreen();
    expect(await screen.findByText('Squad of 4')).toBeInTheDocument();
    expect(screen.getByText('Gameweek 10 Roster')).toBeInTheDocument();
  });

  it('renders the current roster on the pitch with the captain marked (UIR-046, UIR-047)', async () => {
    renderLineupScreen();
    expect(await screen.findByText('Alisson')).toBeInTheDocument();
    expect(screen.getByText('Trent Alexander-Arnold')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('discloses a replacement-eligible squad player in context (UIR-054)', async () => {
    renderLineupScreen();
    expect(await screen.findByText(/Injured Guy is replacement-eligible/)).toBeInTheDocument();
  });

  it('removes, adds, re-captains, and submits a roster with a fresh Idempotency-Key and the captured ETag (UIR-050)', async () => {
    const user = userEvent.setup();
    renderLineupScreen();

    await screen.findByText('Alisson');
    // Remove the captain (Alisson) — this moves them to reserves (not off the squad
    // entirely) and should also clear the local captain selection.
    await user.click(screen.getByRole('button', { name: /remove alisson/i }));
    expect(screen.queryByRole('button', { name: /remove alisson/i })).not.toBeInTheDocument();
    const reservesHeading = await screen.findByText(/^Reserves in Squad/);
    const reservesPanel = reservesHeading.closest('div')!;
    expect(within(reservesPanel).getByText('Alisson')).toBeInTheDocument();

    // Roster now has 1 of 2 — add "Bench Guy" specifically (not whichever reserve row
    // happens to be first, since Alisson is now a reserve too).
    await user.click(within(reservesPanel).getByRole('button', { name: /add bench guy to roster/i }));

    await screen.findByText('Bench Guy');
    const submitButton = screen.getByRole('button', { name: /submit roster/i });
    expect(submitButton).toBeDisabled(); // no captain selected among the current 2

    await user.click(screen.getByRole('button', { name: /set bench guy as captain/i }));
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(lastSubmitRequest).not.toBeNull();
    expect(lastSubmitRequest?.body).toEqual({ playerIds: ['p2', 'p3'], captainPlayerId: 'p3' });
    expect(lastSubmitRequest?.headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/i);
    expect(lastSubmitRequest?.headers['If-Match']).toBe('"etag-1"');
  });

  it('renders read-only with no Submit/Reset/Add/Remove controls once the roster is Locked (UIR-051)', async () => {
    rosterStatus = 'Locked';
    renderLineupScreen();

    await screen.findByText('Alisson');
    expect(screen.getByText(/roster lock has passed/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /submit roster/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove alisson/i })).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: 'Add' })).toHaveLength(0);
  });
});
