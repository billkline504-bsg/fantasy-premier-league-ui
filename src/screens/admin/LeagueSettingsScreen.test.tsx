import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LeagueSettingsScreen } from './LeagueSettingsScreen';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-001.10 (BRD UIR-196-201). The active league in ActiveLeagueProvider's
// placeholder data is 'the-gaffers-league'.

const LEAGUE_ID = 'the-gaffers-league';

const LEAGUE = { leagueId: LEAGUE_ID, name: 'The Gaffers League', description: 'A friendly league', status: 'Active', createdByMembershipId: 'm1', createdAt: '2026-01-01T00:00:00Z' };

const SEASONS = [{ seasonId: 's1', leagueId: LEAGUE_ID, eplSeasonIdentifier: '2026/27', status: 'InSeason', startDate: '2026-08-01', endDate: null }];

const LEAGUE_CONFIG = {
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
};

const SEASON_CONFIG = { ...LEAGUE_CONFIG, seasonId: 's1', invitationExpirationDays: 7, lockedFields: ['initialSquadSize'] };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderLeagueSettingsScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveLeagueProvider>
        <LeagueSettingsScreen />
      </ActiveLeagueProvider>
    </QueryClientProvider>,
  );
}

describe('LeagueSettingsScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch() {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        const method = init?.method ?? 'GET';

        if (path === `/leagues/${LEAGUE_ID}` && method === 'GET') return jsonResponse(LEAGUE);
        if (path === `/leagues/${LEAGUE_ID}` && method === 'PUT') {
          const body = JSON.parse((init?.body as string) ?? '{}');
          return jsonResponse({ ...LEAGUE, ...body });
        }
        if (path === `/leagues/${LEAGUE_ID}/seasons`) return jsonResponse(SEASONS);
        if (path === `/leagues/${LEAGUE_ID}/configuration` && method === 'GET') return jsonResponse(LEAGUE_CONFIG);
        if (path === `/leagues/${LEAGUE_ID}/configuration` && method === 'PUT') {
          const body = JSON.parse((init?.body as string) ?? '{}');
          return jsonResponse(body);
        }
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/configuration` && method === 'GET') return jsonResponse(SEASON_CONFIG);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/configuration` && method === 'PUT') {
          const body = JSON.parse((init?.body as string) ?? '{}');
          return jsonResponse(body);
        }

        throw new Error(`Unhandled request: ${method} ${path}`);
      }),
    );
  }

  it('edits League name, description, and status, pre-filled with current values (UIR-196)', async () => {
    stubFetch();
    renderLeagueSettingsScreen();

    expect(await screen.findByDisplayValue('The Gaffers League')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A friendly league')).toBeInTheDocument();
  });

  it('shows two clearly separated configuration sections (UIR-197)', async () => {
    stubFetch();
    renderLeagueSettingsScreen();

    expect(await screen.findByText('League Defaults')).toBeInTheDocument();
    expect(screen.getByText("This Season's Configuration")).toBeInTheDocument();
    expect(screen.getByText(/Only affects Seasons created afterward/)).toBeInTheDocument();
    expect(screen.getByText(/Affects only the active Season/)).toBeInTheDocument();
  });

  it("exposes every BR-291 parameter, not just History's six (UIR-198)", async () => {
    stubFetch();
    renderLeagueSettingsScreen();

    await screen.findByText('League Defaults');
    expect(screen.getAllByText('Replacement Selection Cap').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gameweek Reminder Lead Time (hours)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Secondary Draft Selections / Team').length).toBeGreaterThan(0);
  });

  it('renders a locked Season Configuration field as read-only with a Locked badge (UIR-199)', async () => {
    stubFetch();
    renderLeagueSettingsScreen();

    const seasonSection = (await screen.findByText("This Season's Configuration")).closest('section')!;
    const squadSizeRow = within(seasonSection).getByText('Squad Size').closest('div')!;
    expect(within(squadSizeRow).getByText('Locked')).toBeInTheDocument();
    expect(within(squadSizeRow).queryByRole('spinbutton')).not.toBeInTheDocument();

    const leagueSection = screen.getByText('League Defaults').closest('section')!;
    const leagueSquadSizeRow = within(leagueSection).getByText('Squad Size').closest('div')!;
    expect(within(leagueSquadSizeRow).getByRole('spinbutton')).toBeInTheDocument();
  });

  it('confirms which fields actually changed on save (UIR-200)', async () => {
    stubFetch();
    const user = userEvent.setup();
    renderLeagueSettingsScreen();

    const leagueSection = (await screen.findByText('League Defaults')).closest('section')!;
    const invitationInput = within(leagueSection).getByLabelText('Invitation Expiration Days');
    await user.clear(invitationInput);
    await user.type(invitationInput, '10');
    await user.click(within(leagueSection).getByRole('button', { name: 'Save League Defaults' }));

    expect(await within(leagueSection).findByText(/Changed: Invitation Expiration/)).toBeInTheDocument();
  });
});
