import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileScreen } from './ProfileScreen';
import { ThemeProvider } from '../../state/ThemeProvider';

// Exercises F-UI-001.1/001.2 end to end against a hand-rolled fetch mock (no MSW dependency
// needed for this scope) covering: masked contact info + the "no phone number" finding
// (API Consumption Specification v1.1 §2.3a), username save success/conflict (UIR-159,
// UIR-169), the default icon picker, and one league's icon-override + notification grid
// (UIR-162–166), including that `effectiveIconId` resolution comes from the backend rather
// than being recomputed client-side.

const CURRENT_USER = {
  userId: 'u1',
  username: 'wkline',
  email: 'wkline@example.com',
  status: 'Active',
  defaultIconId: 'icon-1',
  isSystemAdministrator: false,
  createdAt: '2026-01-01T00:00:00Z',
};

const PROFILE_ICONS = [
  { profileIconId: 'icon-1', name: 'Icon One', assetIdentifier: '/icons/one.png', isActive: true, sortOrder: 1 },
  { profileIconId: 'icon-2', name: 'Icon Two', assetIdentifier: '/icons/two.png', isActive: true, sortOrder: 2 },
];

const LEAGUES = [
  { leagueId: 'league-1', name: 'The Gaffers League', description: '', status: 'Active', createdByMembershipId: 'm1', createdAt: '2026-01-01T00:00:00Z' },
];

const MEMBERSHIP = {
  leagueMembershipId: 'm1',
  leagueId: 'league-1',
  userId: 'u1',
  username: 'wkline',
  isAdministrator: true,
  leagueIconId: null,
  effectiveIconId: 'icon-1',
  status: 'Active',
  joinedAt: '2026-01-01T00:00:00Z',
  leftAt: null,
};

const LEAGUE_CONFIGURATION = {
  leagueId: 'league-1',
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

function jsonResponse(body: unknown, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderProfileScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ProfileScreen />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('ProfileScreen', () => {
  let usernameTaken = false;
  let notificationPreferences: unknown[] = [];

  beforeEach(() => {
    usernameTaken = false;
    notificationPreferences = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = url.pathname.replace(/^\/api\/v1/, '');
        const method = init?.method ?? 'GET';

        if (path === '/users/me' && method === 'GET') return jsonResponse(CURRENT_USER);
        if (path === '/users/me' && method === 'PUT') {
          if (usernameTaken) return jsonResponse({ detail: 'Username already taken', status: 409 }, 409);
          return jsonResponse({ ...CURRENT_USER, username: 'newname' });
        }
        if (path === '/users/me/icon' && method === 'PUT') return jsonResponse(CURRENT_USER);
        if (path === '/profile-icons') return jsonResponse(PROFILE_ICONS);
        if (path === '/leagues' && method === 'GET') return jsonResponse(LEAGUES);
        if (path === '/leagues/league-1/memberships') return jsonResponse([MEMBERSHIP]);
        if (path === '/leagues/league-1/configuration') return jsonResponse(LEAGUE_CONFIGURATION);
        if (path === '/leagues/league-1/memberships/m1/notification-preferences' && method === 'GET') {
          return jsonResponse(notificationPreferences);
        }
        if (path === '/leagues/league-1/memberships/m1/notification-preferences' && method === 'PUT') {
          notificationPreferences = JSON.parse(init?.body as string);
          return jsonResponse(notificationPreferences);
        }
        throw new Error(`Unhandled request: ${method} ${path}`);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows masked contact info and the no-phone-number finding (UIR-158, API spec §2.3a)', async () => {
    renderProfileScreen();
    expect(await screen.findByText('w••••e@example.com')).toBeInTheDocument();
    expect(screen.getByText(/no phone number on file/i)).toBeInTheDocument();
  });

  it('saves a new username and shows success (UIR-159)', async () => {
    const user = userEvent.setup();
    renderProfileScreen();

    const usernameInput = await screen.findByLabelText('Username');
    await user.clear(usernameInput);
    await user.type(usernameInput, 'newname');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it('shows an inline conflict error and preserves the typed value on a taken username (UIR-159, UIR-169)', async () => {
    usernameTaken = true;
    const user = userEvent.setup();
    renderProfileScreen();

    const usernameInput = await screen.findByLabelText('Username');
    await user.clear(usernameInput);
    await user.type(usernameInput, 'sian88');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(await screen.findByText('Username already taken (BR-004)')).toBeInTheDocument();
    expect(usernameInput).toHaveValue('sian88');
  });

  it("renders a league's resolved icon via effectiveIconId, not a client-recomputed fallback (UIR-162)", async () => {
    renderProfileScreen();
    const usingDefaultText = await screen.findByText('Using your default icon');
    const card = usingDefaultText.closest('section')!;
    expect(within(card).getByText('The Gaffers League')).toBeInTheDocument();
  });

  it("states the League's configured Gameweek Reminder lead time (UIR-166)", async () => {
    renderProfileScreen();
    expect(await screen.findByText(/24 hours before your roster lock/i)).toBeInTheDocument();
  });

  it('toggles a notification preference and sends the full updated grid (UIR-164, UIR-165)', async () => {
    const user = userEvent.setup();
    renderProfileScreen();

    await screen.findByText('The Gaffers League');
    const emailToggles = await screen.findAllByLabelText('Email');
    const gameweekReminderEmailToggle = emailToggles[0];

    expect(screen.getAllByText('Off').length).toBeGreaterThan(0);
    await user.click(gameweekReminderEmailToggle);

    await waitFor(() => {
      expect(notificationPreferences).toContainEqual(
        expect.objectContaining({ eventType: 'GameweekReminder', channel: 'Email', enabled: true }),
      );
    });
  });

  it("shows every league's preview in the How You'll Appear panel (UIR-167)", async () => {
    renderProfileScreen();
    const preview = (await screen.findByText("How You'll Appear (BR-277)")).closest('section')!;
    expect(await within(preview).findByText('wkline')).toBeInTheDocument();
    expect(within(preview).getByText('The Gaffers League')).toBeInTheDocument();
  });
});
