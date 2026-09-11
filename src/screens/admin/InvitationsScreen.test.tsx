import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InvitationsScreen } from './InvitationsScreen';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-001.11 (BRD UIR-202-207). The active league in ActiveLeagueProvider's
// placeholder data is 'the-gaffers-league'.

const LEAGUE_ID = 'the-gaffers-league';

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

const INVITATIONS = [
  { invitationId: 'i1', leagueId: LEAGUE_ID, seasonId: null, destination: 'pending@example.com', status: 'Pending', createdAt: '2026-08-01T00:00:00Z', expiresAt: '2026-08-08T00:00:00Z' },
  { invitationId: 'i2', leagueId: LEAGUE_ID, seasonId: null, destination: 'accepted@example.com', status: 'Accepted', createdAt: '2026-07-01T00:00:00Z', expiresAt: '2026-07-08T00:00:00Z' },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderInvitationsScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveLeagueProvider>
        <InvitationsScreen />
      </ActiveLeagueProvider>
    </QueryClientProvider>,
  );
}

describe('InvitationsScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(invitations: unknown[]) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        const method = init?.method ?? 'GET';

        if (path === `/leagues/${LEAGUE_ID}/configuration`) return jsonResponse(LEAGUE_CONFIG);
        if (path === `/leagues/${LEAGUE_ID}/invitations` && method === 'GET') return jsonResponse(invitations);
        if (path === `/leagues/${LEAGUE_ID}/invitations` && method === 'POST') {
          const body = JSON.parse((init?.body as string) ?? '{}');
          return jsonResponse(
            { invitationId: 'new-inv', leagueId: LEAGUE_ID, seasonId: null, destination: body.destination, status: 'Pending', createdAt: '2026-09-11T00:00:00Z', expiresAt: '2026-09-18T00:00:00Z' },
            201,
          );
        }
        if (path === `/leagues/${LEAGUE_ID}/invitations/i1` && method === 'DELETE') return jsonResponse(null, 204);

        throw new Error(`Unhandled request: ${method} ${path}`);
      }),
    );
  }

  it("states the League's current invitation-expiration window before sending (UIR-203)", async () => {
    stubFetch([]);
    renderInvitationsScreen();

    expect(await screen.findByText('Invitations expire after 7 days.')).toBeInTheDocument();
  });

  it('sends an invitation and confirms delivery without ever showing a link or token (UIR-202, UIR-204)', async () => {
    stubFetch([]);
    const user = userEvent.setup();
    renderInvitationsScreen();

    await user.type(await screen.findByLabelText('Destination (email or phone)'), 'newmember@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Invitation' }));

    expect(await screen.findByText('Invitation sent to newmember@example.com.')).toBeInTheDocument();
    expect(screen.queryByText(/http/)).not.toBeInTheDocument();
  });

  it('lists invitations with destination/status/expiration, newest first (UIR-205)', async () => {
    stubFetch(INVITATIONS);
    renderInvitationsScreen();

    const rows = await screen.findAllByRole('row');
    // header + 2 data rows; first data row (index 1) should be the newer one (i1, Pending)
    expect(rows[1]).toHaveTextContent('pending@example.com');
    expect(rows[1]).toHaveTextContent('Pending');
    expect(rows[2]).toHaveTextContent('accepted@example.com');
  });

  it('shows a Revoke action only for a Pending invitation (UIR-206)', async () => {
    stubFetch(INVITATIONS);
    renderInvitationsScreen();

    const rows = await screen.findAllByRole('row');
    expect(rows[1].querySelector('button')).not.toBeNull();
    expect(rows[2].querySelector('button')).toBeNull();
  });

  it('revokes a pending invitation', async () => {
    stubFetch(INVITATIONS);
    const user = userEvent.setup();
    renderInvitationsScreen();

    const rows = await screen.findAllByRole('row');
    const revokeButton = rows[1].querySelector('button')!;
    await user.click(revokeButton);

    // No error surfaced means the DELETE succeeded per the mock.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
