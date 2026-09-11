import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MembersScreen } from './MembersScreen';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-001.12 (BRD UIR-208-213). The active league in ActiveLeagueProvider's
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

const ADMIN_MEMBERSHIPS = [
  { leagueMembershipId: 'm1', leagueId: LEAGUE_ID, userId: 'u1', username: 'wkline', isAdministrator: true, leagueIconId: null, effectiveIconId: 'icon-1', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
  { leagueMembershipId: 'm2', leagueId: LEAGUE_ID, userId: 'u2', username: 'cornerkick_kev', isAdministrator: false, leagueIconId: null, effectiveIconId: 'icon-2', status: 'Active', joinedAt: '2026-01-02T00:00:00Z', leftAt: null },
];

const NON_ADMIN_MEMBERSHIPS = [
  { leagueMembershipId: 'm1', leagueId: LEAGUE_ID, userId: 'u1', username: 'wkline', isAdministrator: false, leagueIconId: null, effectiveIconId: 'icon-1', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
  { leagueMembershipId: 'm2', leagueId: LEAGUE_ID, userId: 'u2', username: 'cornerkick_kev', isAdministrator: true, leagueIconId: null, effectiveIconId: 'icon-2', status: 'Active', joinedAt: '2026-01-02T00:00:00Z', leftAt: null },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderMembersScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveLeagueProvider>
        <MembersScreen />
      </ActiveLeagueProvider>
    </QueryClientProvider>,
  );
}

describe('MembersScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(memberships: unknown[], leaveOutcome: 'success' | 'sole-admin-block' = 'success') {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        const method = init?.method ?? 'GET';

        if (path === '/users/me') return jsonResponse(CURRENT_USER);
        if (path === `/leagues/${LEAGUE_ID}/memberships` && method === 'GET') return jsonResponse(memberships);
        if (path.startsWith(`/leagues/${LEAGUE_ID}/memberships/`) && path.endsWith('/leave') && method === 'POST') {
          return leaveOutcome === 'success'
            ? jsonResponse(null, 204)
            : jsonResponse({ status: 409, detail: 'The sole League Administrator cannot leave without first transferring administration.' }, 409);
        }

        throw new Error(`Unhandled request: ${method} ${path}`);
      }),
    );
  }

  it('lists every member with username, Administrator badge, join date, and status, viewable without being the Administrator (UIR-208)', async () => {
    stubFetch(NON_ADMIN_MEMBERSHIPS);
    renderMembersScreen();

    expect(await screen.findByText('wkline')).toBeInTheDocument();
    expect(screen.getByText('cornerkick_kev')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBe(2);
  });

  it('shows Remove only for the Administrator, only on another member\'s row (UIR-209)', async () => {
    stubFetch(ADMIN_MEMBERSHIPS);
    renderMembersScreen();

    const kevRow = (await screen.findByText('cornerkick_kev')).closest('tr')!;
    expect(within(kevRow).getByRole('button', { name: 'Remove' })).toBeInTheDocument();

    const wklineRow = screen.getByText('wkline').closest('tr')!;
    expect(within(wklineRow).queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    expect(within(wklineRow).getByRole('button', { name: 'Leave League' })).toBeInTheDocument();
  });

  it('shows Leave League on every member\'s own row, including a non-Administrator\'s (UIR-210)', async () => {
    stubFetch(NON_ADMIN_MEMBERSHIPS);
    renderMembersScreen();

    const wklineRow = (await screen.findByText('wkline')).closest('tr')!;
    expect(within(wklineRow).getByRole('button', { name: 'Leave League' })).toBeInTheDocument();
    expect(within(wklineRow).queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it('states the sole-Administrator leave-block plainly when the backend rejects it (UIR-211)', async () => {
    stubFetch(ADMIN_MEMBERSHIPS, 'sole-admin-block');
    const user = userEvent.setup();
    renderMembersScreen();

    const wklineRow = (await screen.findByText('wkline')).closest('tr')!;
    await user.click(within(wklineRow).getByRole('button', { name: 'Leave League' }));

    expect(await screen.findByText(/there's currently no way to transfer that role/)).toBeInTheDocument();
  });
});
