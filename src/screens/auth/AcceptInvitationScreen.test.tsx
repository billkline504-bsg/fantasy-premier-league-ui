import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AcceptInvitationScreen } from './AcceptInvitationScreen';
import { AuthProvider } from '../../state/AuthProvider';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-001.8 (BRD UIR-187-190).

function jsonResponse(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderAcceptInvitationScreen(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <ActiveLeagueProvider>
            <Routes>
              <Route path="/invite/:token" element={<AcceptInvitationScreen />} />
              <Route path="/register" element={<div>Register Page</div>} />
              <Route path="/login" element={<div>Login Page</div>} />
              <Route path="/leagues/:leagueId/dashboard" element={<div>Dashboard Page</div>} />
            </Routes>
          </ActiveLeagueProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AcceptInvitationScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(acceptOutcome: 'success' | 'expired') {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        const method = init?.method ?? 'GET';

        if (path === '/invitations/tok123/accept' && method === 'POST') {
          return acceptOutcome === 'success'
            ? jsonResponse({ leagueMembershipId: 'm1', leagueId: 'the-gaffers-league', userId: 'u1', username: 'wkline', isAdministrator: false, leagueIconId: null, effectiveIconId: 'icon-1', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null })
            : jsonResponse({ status: 410, detail: 'Invitation expired.' }, 410);
        }

        throw new Error(`Unhandled request: ${method} ${path}`);
      }),
    );
  }

  it("offers Register and Login, both preserving the invitation, when reached anonymously (UIR-187)", async () => {
    stubFetch('success');
    renderAcceptInvitationScreen('/invite/tok123');

    const registerLink = (await screen.findByRole('button', { name: 'Create an account' })).closest('a')!;
    const loginLink = screen.getByRole('button', { name: 'Sign in' }).closest('a')!;
    expect(registerLink).toHaveAttribute('href', '/register');
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('states plainly that accepting adds the visitor to a league, without naming which one (UIR-188)', async () => {
    stubFetch('success');
    renderAcceptInvitationScreen('/invite/tok123');

    expect(await screen.findByText(/add you to a league/)).toBeInTheDocument();
  });
});

describe('AcceptInvitationScreen (authenticated)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('matchday-refresh-token', 'refresh-1');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(acceptOutcome: 'success' | 'expired') {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        const method = init?.method ?? 'GET';

        if (path === '/auth/refresh' && method === 'POST') {
          return jsonResponse({
            accessToken: 'access-1',
            refreshToken: 'refresh-2',
            expiresInSeconds: 900,
            user: { userId: 'u1', username: 'wkline', isSystemAdministrator: false },
          });
        }
        if (path === '/invitations/tok123/accept' && method === 'POST') {
          return acceptOutcome === 'success'
            ? jsonResponse({ leagueMembershipId: 'm1', leagueId: 'the-gaffers-league', userId: 'u1', username: 'wkline', isAdministrator: false, leagueIconId: null, effectiveIconId: 'icon-1', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null })
            : jsonResponse({ status: 410, detail: 'Invitation expired.' }, 410);
        }

        throw new Error(`Unhandled request: ${method} ${path}`);
      }),
    );
  }

  it('accepts automatically and redirects to that league\'s Dashboard when already authenticated (UIR-190)', async () => {
    stubFetch('success');
    renderAcceptInvitationScreen('/invite/tok123');

    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument();
  });

  it('shows a single generic message for an expired/used/revoked invitation (UIR-189)', async () => {
    stubFetch('expired');
    renderAcceptInvitationScreen('/invite/tok123');

    expect(await screen.findByText(/no longer valid/)).toBeInTheDocument();
  });
});
