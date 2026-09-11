import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuditLogScreen } from './AuditLogScreen';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-004.2 (BRD UIR-125-134). The active league in ActiveLeagueProvider's
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

const MEMBERSHIPS = [
  { leagueMembershipId: 'm1', leagueId: LEAGUE_ID, userId: 'u1', username: 'wkline', isAdministrator: true, leagueIconId: null, effectiveIconId: 'icon-1', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
  { leagueMembershipId: 'm2', leagueId: LEAGUE_ID, userId: 'u2', username: 'cornerkick_kev', isAdministrator: false, leagueIconId: null, effectiveIconId: 'icon-2', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
];

const SCORE_OVERRIDE_ACTION = {
  actionId: 'a1',
  leagueId: LEAGUE_ID,
  actingMembershipId: 'm1',
  actionType: 'ScoreOverride',
  targetEntityType: 'Player',
  targetEntityId: 'p1',
  beforeState: { points: 4 },
  afterState: { points: 6 },
  reason: 'Missed bonus points from Official FPL',
  createdAt: '2026-08-15T12:00:00Z',
};

const SYSTEM_ACTION = {
  actionId: 'a2',
  leagueId: LEAGUE_ID,
  actingMembershipId: null,
  actionType: 'ReplacementEligibilityGranted',
  targetEntityType: 'Player',
  targetEntityId: 'p2',
  beforeState: {},
  afterState: { replacementEligible: true },
  reason: null,
  createdAt: '2026-08-10T12:00:00Z',
};

const CONFIG_ACTION = {
  actionId: 'a3',
  leagueId: LEAGUE_ID,
  actingMembershipId: 'm1',
  actionType: 'ConfigurationChanged',
  targetEntityType: 'LeagueConfiguration',
  targetEntityId: 'cfg1',
  beforeState: { invitationExpirationDays: 3 },
  afterState: { invitationExpirationDays: 5 },
  reason: null,
  createdAt: '2026-08-01T00:00:00Z',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderAuditLogScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveLeagueProvider>
        <AuditLogScreen />
      </ActiveLeagueProvider>
    </QueryClientProvider>,
  );
}

describe('AuditLogScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(handler: (path: string, url: URL) => Response | undefined) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));

        if (path === '/users/me') return jsonResponse(CURRENT_USER);
        if (path === `/leagues/${LEAGUE_ID}/seasons`) return jsonResponse([SEASON]);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/fantasy-teams`) return jsonResponse(FANTASY_TEAMS);
        if (path === `/leagues/${LEAGUE_ID}/memberships`) return jsonResponse(MEMBERSHIPS);

        const custom = handler(path, url);
        if (custom) return custom;

        throw new Error(`Unhandled request: ${path}${url.search}`);
      }),
    );
  }

  it("states this data is Administrator-only, reverse-chronological, and immutable, with the acting admin's badge (UIR-019, UIR-125)", async () => {
    stubFetch((path) => {
      if (path === `/leagues/${LEAGUE_ID}/audit`) return jsonResponse({ items: [SCORE_OVERRIDE_ACTION], nextCursor: null });
    });
    renderAuditLogScreen();

    expect(await screen.findByText('League Administrator · wkline')).toBeInTheDocument();
    expect(screen.getByText(/reverse-chronological/)).toBeInTheDocument();
    expect(screen.getByText(/Nothing here can be edited or deleted/)).toBeInTheDocument();
  });

  it('shows the standard row shape: timestamp, actor, action-type badge, target, summary, reason placeholder (UIR-127, UIR-129)', async () => {
    stubFetch((path) => {
      if (path === `/leagues/${LEAGUE_ID}/audit`) return jsonResponse({ items: [SCORE_OVERRIDE_ACTION, SYSTEM_ACTION], nextCursor: null });
    });
    renderAuditLogScreen();

    const overrideRow = (await screen.findByText('wkline', { selector: 'td' })).closest('tr')!;
    expect(within(overrideRow).getByText('Score Override')).toBeInTheDocument();
    expect(within(overrideRow).getByText('points: 4 → 6')).toBeInTheDocument();
    expect(within(overrideRow).getByText('Missed bonus points from Official FPL')).toBeInTheDocument();

    const systemRow = screen.getByText('⚙ System').closest('tr')!;
    expect(within(systemRow).getByText('—')).toBeInTheDocument(); // no reason recorded
  });

  it('expands and collapses before/after detail (UIR-020, UIR-128)', async () => {
    stubFetch((path) => {
      if (path === `/leagues/${LEAGUE_ID}/audit`) return jsonResponse({ items: [SCORE_OVERRIDE_ACTION], nextCursor: null });
    });
    const user = userEvent.setup();
    renderAuditLogScreen();

    const toggle = await screen.findByRole('button', { name: 'Details' });
    await user.click(toggle);

    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
    expect(screen.getByText(/"points": 4/)).toBeInTheDocument();
    expect(screen.getByText(/"points": 6/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide' }));
    expect(screen.getByRole('button', { name: 'Details' })).toBeInTheDocument();
  });

  it('explains that "System" rows have no human actor (UIR-130, UIR-032)', async () => {
    stubFetch((path) => {
      if (path === `/leagues/${LEAGUE_ID}/audit`) return jsonResponse({ items: [SYSTEM_ACTION], nextCursor: null });
    });
    renderAuditLogScreen();

    expect(await screen.findByText('⚙ System')).toBeInTheDocument();
    expect(screen.getByText(/"System" rows have no human actor/)).toBeInTheDocument();
  });

  it('renders a league-settings change with the same row shape, Target = "League Settings" (UIR-131)', async () => {
    stubFetch((path) => {
      if (path === `/leagues/${LEAGUE_ID}/audit`) return jsonResponse({ items: [CONFIG_ACTION], nextCursor: null });
    });
    renderAuditLogScreen();

    const table = await screen.findByRole('table');
    expect(within(table).getByText('League Settings')).toBeInTheDocument();
    expect(within(table).getByText('invitationExpirationDays: 3 → 5')).toBeInTheDocument();
  });

  it('sends the selected action-type filter as a query parameter (UIR-126)', async () => {
    let lastActionTypeParam: string | null = null;
    stubFetch((path, url) => {
      if (path === `/leagues/${LEAGUE_ID}/audit`) {
        lastActionTypeParam = url.searchParams.get('actionType');
        return jsonResponse({ items: [], nextCursor: null });
      }
    });
    const user = userEvent.setup();
    renderAuditLogScreen();

    await screen.findByText('No administrative actions match these filters.');
    await user.click(screen.getByRole('button', { name: 'Score Override' }));

    expect(await screen.findByText('No administrative actions match these filters.')).toBeInTheDocument();
    expect(lastActionTypeParam).toBe('ScoreOverride');
  });

  it('sends the selected team scope as fantasyTeamId, including the league-settings sentinel (UIR-126)', async () => {
    let lastFantasyTeamIdParam: string | null = null;
    stubFetch((path, url) => {
      if (path === `/leagues/${LEAGUE_ID}/audit`) {
        lastFantasyTeamIdParam = url.searchParams.get('fantasyTeamId');
        return jsonResponse({ items: [], nextCursor: null });
      }
    });
    const user = userEvent.setup();
    renderAuditLogScreen();

    await screen.findByText('No administrative actions match these filters.');
    await user.selectOptions(screen.getByLabelText('Filter by team or league settings'), 'League Settings');

    expect(await screen.findByText('No administrative actions match these filters.')).toBeInTheDocument();
    expect(lastFantasyTeamIdParam).toBe('__league_settings__');
  });

  it('appends the next page of results when "Load more" is clicked', async () => {
    stubFetch((path, url) => {
      if (path === `/leagues/${LEAGUE_ID}/audit`) {
        if (url.searchParams.get('cursor') === 'cursor-2') {
          return jsonResponse({ items: [CONFIG_ACTION], nextCursor: null });
        }
        return jsonResponse({ items: [SCORE_OVERRIDE_ACTION], nextCursor: 'cursor-2' });
      }
    });
    const user = userEvent.setup();
    renderAuditLogScreen();

    const table = await screen.findByRole('table');
    expect(within(table).getByText('Score Override')).toBeInTheDocument();
    expect(within(table).queryByText('League Settings')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await within(table).findByText('League Settings')).toBeInTheDocument();
  });
});
