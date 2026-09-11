import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScoreCorrectionsScreen } from './ScoreCorrectionsScreen';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-004.3 (BRD UIR-135-144). The active league in ActiveLeagueProvider's
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

const MEMBERSHIPS = [
  { leagueMembershipId: 'm1', leagueId: LEAGUE_ID, userId: 'u1', username: 'wkline', isAdministrator: true, leagueIconId: null, effectiveIconId: 'icon-1', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
];

const ACTIVE_OVERRIDE_ACTION = {
  actionId: 'a1',
  leagueId: LEAGUE_ID,
  actingMembershipId: 'm1',
  actionType: 'ScoreOverride',
  targetEntityType: 'PlayerPerformance',
  targetEntityId: 'pp1',
  beforeState: { goals: 1 },
  afterState: { goals: 3 },
  reason: 'Missed a goal in Official FPL data',
  createdAt: '2026-08-10T12:00:00Z',
};

const UNDONE_OVERRIDE_ACTION = {
  actionId: 'a2',
  leagueId: LEAGUE_ID,
  actingMembershipId: 'm1',
  actionType: 'ScoreOverride',
  targetEntityType: 'PlayerPerformance',
  targetEntityId: 'pp2',
  beforeState: { assists: 0 },
  afterState: { assists: 1 },
  reason: null,
  createdAt: '2026-08-05T12:00:00Z',
};

const UNDO_ACTION_FOR_PP2 = {
  actionId: 'a3',
  leagueId: LEAGUE_ID,
  actingMembershipId: 'm1',
  actionType: 'ScoreOverrideUndo',
  targetEntityType: 'PlayerPerformance',
  targetEntityId: 'pp2',
  beforeState: {},
  afterState: {},
  reason: null,
  createdAt: '2026-08-06T09:00:00Z',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderScoreCorrectionsScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveLeagueProvider>
        <ScoreCorrectionsScreen />
      </ActiveLeagueProvider>
    </QueryClientProvider>,
  );
}

describe('ScoreCorrectionsScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(overrides: unknown[], undos: unknown[]) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        const method = init?.method ?? 'GET';

        if (path === '/users/me') return jsonResponse(CURRENT_USER);
        if (path === `/leagues/${LEAGUE_ID}/memberships`) return jsonResponse(MEMBERSHIPS);
        if (path === `/leagues/${LEAGUE_ID}/audit` && url.searchParams.get('actionType') === 'ScoreOverride') {
          return jsonResponse({ items: overrides, nextCursor: null });
        }
        if (path === `/leagues/${LEAGUE_ID}/audit` && url.searchParams.get('actionType') === 'ScoreOverrideUndo') {
          return jsonResponse({ items: undos, nextCursor: null });
        }
        if (path === '/admin/score-overrides' && method === 'POST') {
          const body = JSON.parse((init?.body as string) ?? '{}');
          const created = {
            scoreOverrideId: 'so-new',
            playerPerformanceId: body.playerPerformanceId,
            administratorMembershipId: 'm1',
            originalValue: { goals: 2 },
            overrideValue: body.overrideValue,
            reason: body.reason ?? null,
            createdAt: '2026-08-20T10:00:00Z',
            undoneAt: null,
            isActive: true,
          };
          return jsonResponse(created, 201);
        }
        if (path === '/admin/score-overrides/pp1/undo' && method === 'POST') {
          undos.push({ ...UNDO_ACTION_FOR_PP2, actionId: 'a4', targetEntityId: 'pp1', createdAt: '2026-08-21T00:00:00Z' });
          return jsonResponse({
            scoreOverrideId: 'pp1',
            playerPerformanceId: 'pp1',
            administratorMembershipId: 'm1',
            originalValue: { goals: 1 },
            overrideValue: { goals: 3 },
            reason: 'Missed a goal in Official FPL data',
            createdAt: '2026-08-10T12:00:00Z',
            undoneAt: '2026-08-21T00:00:00Z',
            isActive: false,
          });
        }

        throw new Error(`Unhandled request: ${method} ${path}${url.search}`);
      }),
    );
  }

  it('states the three-tier authority order (UIR-135)', async () => {
    stubFetch([], []);
    renderScoreCorrectionsScreen();

    expect(await screen.findByText('Active Administrator Override')).toBeInTheDocument();
    expect(screen.getByText('Official FPL Data')).toBeInTheDocument();
    expect(screen.getByText('Application Calculation')).toBeInTheDocument();
  });

  it('discloses that official-data corrections apply automatically (UIR-138)', async () => {
    stubFetch([], []);
    renderScoreCorrectionsScreen();

    expect(await screen.findByText(/detected and applied automatically/)).toBeInTheDocument();
  });

  it('lists an active override with its change, reason, administrator, and an Undo action (UIR-139)', async () => {
    stubFetch([ACTIVE_OVERRIDE_ACTION], []);
    renderScoreCorrectionsScreen();

    const heading = await screen.findByText('Active Overrides');
    const section = heading.closest('section')!;
    expect(within(section).getByText('goals: 1 → 3')).toBeInTheDocument();
    expect(within(section).getByText('Missed a goal in Official FPL data')).toBeInTheDocument();
    expect(within(section).getByText('wkline')).toBeInTheDocument();
    expect(within(section).getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('lists a recently-undone override separately, with an em-dash reason placeholder (UIR-141, UIR-129)', async () => {
    stubFetch([UNDONE_OVERRIDE_ACTION], [UNDO_ACTION_FOR_PP2]);
    renderScoreCorrectionsScreen();

    const heading = await screen.findByText('Recently Undone');
    const section = heading.closest('section')!;
    expect(within(section).getByText('assists: 0 → 1')).toBeInTheDocument();
    expect(within(section).getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('Active Overrides')?.closest('section')).not.toBeNull();
  });

  it('applies an override and shows the live value-compare widget flagged "Manually Overridden" (UIR-136, UIR-137)', async () => {
    stubFetch([], []);
    const user = userEvent.setup();
    renderScoreCorrectionsScreen();

    await user.type(await screen.findByLabelText('PlayerPerformance ID'), 'pp3');
    await user.clear(screen.getByLabelText('Field'));
    await user.type(screen.getByLabelText('Field'), 'goals');
    await user.type(screen.getByLabelText('Value'), '5');
    await user.type(screen.getByLabelText('Reason (optional)'), 'Because');
    await user.click(screen.getByRole('button', { name: 'Apply Override' }));

    expect(await screen.findByText('Manually Overridden')).toBeInTheDocument();
    expect(screen.getByText('{"goals":2} → {"goals":5}')).toBeInTheDocument();
    expect(screen.getByText(/Applied by wkline at/)).toBeInTheDocument();
  });

  it('rejects submission with no PlayerPerformance id or value', async () => {
    stubFetch([], []);
    const user = userEvent.setup();
    renderScoreCorrectionsScreen();

    await screen.findByLabelText('PlayerPerformance ID');
    await user.click(screen.getByRole('button', { name: 'Apply Override' }));

    expect(await screen.findByText(/Enter a PlayerPerformance id/)).toBeInTheDocument();
  });

  it('moves an override from Active to Recently Undone after Undo is clicked (UIR-140, UIR-033)', async () => {
    const overrides = [ACTIVE_OVERRIDE_ACTION];
    const undos: unknown[] = [];
    stubFetch(overrides, undos);
    const user = userEvent.setup();
    renderScoreCorrectionsScreen();

    await screen.findByRole('button', { name: 'Undo' });
    expect(screen.getByText('No overrides have been undone in this league.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Undo' }));

    expect(await screen.findByText('No overrides are currently active in this league.')).toBeInTheDocument();
    const undoneHeading = screen.getByText('Recently Undone');
    expect(within(undoneHeading.closest('section')!).getByText('goals: 1 → 3')).toBeInTheDocument();
  });
});
