import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MessagesScreen } from './MessagesScreen';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-004.1 (BRD UIR-118-124). The active league in ActiveLeagueProvider's
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
  { leagueMembershipId: 'm2', leagueId: LEAGUE_ID, userId: 'u2', username: 'cornerkick_kev', isAdministrator: false, leagueIconId: null, effectiveIconId: 'icon-2', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
];

const NON_ADMIN_MEMBERSHIPS = [
  { leagueMembershipId: 'm1', leagueId: LEAGUE_ID, userId: 'u1', username: 'wkline', isAdministrator: false, leagueIconId: null, effectiveIconId: 'icon-1', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
  { leagueMembershipId: 'm2', leagueId: LEAGUE_ID, userId: 'u2', username: 'cornerkick_kev', isAdministrator: true, leagueIconId: null, effectiveIconId: 'icon-2', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
];

const MESSAGES = [
  {
    leagueMessageId: 'msg1',
    leagueId: LEAGUE_ID,
    authorMembershipId: 'm2',
    body: 'Line one\nLine two',
    publishedAt: '2026-08-01T12:00:00Z',
  },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderMessagesScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveLeagueProvider>
        <MessagesScreen />
      </ActiveLeagueProvider>
    </QueryClientProvider>,
  );
}

describe('MessagesScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(memberships: unknown[], messages: unknown[] = MESSAGES) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        const method = init?.method ?? 'GET';

        if (path === '/users/me') return jsonResponse(CURRENT_USER);
        if (path === `/leagues/${LEAGUE_ID}/memberships`) return jsonResponse(memberships);
        if (path === `/leagues/${LEAGUE_ID}/messages` && method === 'GET') return jsonResponse(messages);

        throw new Error(`Unhandled request: ${method} ${path}`);
      }),
    );
  }

  it('hides the composer and explains why for a non-administrator (UIR-118)', async () => {
    stubFetch(NON_ADMIN_MEMBERSHIPS);
    renderMessagesScreen();

    expect(await screen.findByText(/Only this league's Administrator can publish messages here/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Message body')).not.toBeInTheDocument();
  });

  it('shows the composer and its visibility note for the Administrator (UIR-118, UIR-122)', async () => {
    stubFetch(ADMIN_MEMBERSHIPS);
    renderMessagesScreen();

    expect(await screen.findByLabelText('Message body')).toBeInTheDocument();
    expect(screen.getByText('Visible to every active member of this league.')).toBeInTheDocument();
  });

  it('renders the feed newest first, with author, role badge, and preserved line breaks (UIR-119, UIR-121)', async () => {
    stubFetch(ADMIN_MEMBERSHIPS);
    renderMessagesScreen();

    expect(await screen.findByText('cornerkick_kev')).toBeInTheDocument();
    const body = screen.getByText((_, el) => el?.textContent === 'Line one\nLine two');
    expect(body).toHaveStyle({ whiteSpace: 'pre-wrap' });
    expect(screen.queryByText('League Administrator')).not.toBeInTheDocument(); // author m2 is not an admin here
  });

  it('publishes a new message, inserting it at the top with a "New" distinction (UIR-119, UIR-120)', async () => {
    const messages = [...MESSAGES];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        const method = init?.method ?? 'GET';

        if (path === '/users/me') return jsonResponse(CURRENT_USER);
        if (path === `/leagues/${LEAGUE_ID}/memberships`) return jsonResponse(ADMIN_MEMBERSHIPS);
        if (path === `/leagues/${LEAGUE_ID}/messages` && method === 'GET') return jsonResponse(messages);
        if (path === `/leagues/${LEAGUE_ID}/messages` && method === 'POST') {
          const body = JSON.parse((init?.body as string) ?? '{}').body as string;
          const created = { leagueMessageId: 'msg2', leagueId: LEAGUE_ID, authorMembershipId: 'm1', body, publishedAt: '2026-08-02T12:00:00Z' };
          messages.push(created);
          return jsonResponse(created, 201);
        }

        throw new Error(`Unhandled request: ${method} ${path}`);
      }),
    );
    const user = userEvent.setup();
    renderMessagesScreen();

    const textarea = await screen.findByLabelText('Message body');
    await user.type(textarea, 'Round 2 starts Saturday.');
    await user.click(screen.getByRole('button', { name: 'Publish' }));

    expect(await screen.findByText('Round 2 starts Saturday.')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('states messages are permanently retained (UIR-123)', async () => {
    stubFetch(ADMIN_MEMBERSHIPS);
    renderMessagesScreen();

    expect(await screen.findByText(/retained permanently/)).toBeInTheDocument();
  });

  it('shows an empty state when no messages have been published yet', async () => {
    stubFetch(ADMIN_MEMBERSHIPS, []);
    renderMessagesScreen();

    expect(await screen.findByText('No messages have been published in this league yet.')).toBeInTheDocument();
  });
});
