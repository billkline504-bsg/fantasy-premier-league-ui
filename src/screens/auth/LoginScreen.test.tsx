import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginScreen } from './LoginScreen';
import { AuthProvider } from '../../state/AuthProvider';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-001.5 (BRD UIR-173-177).

const AUTH_TOKEN_RESPONSE = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  expiresInSeconds: 900,
  user: { userId: 'u1', username: 'wkline', isSystemAdministrator: false },
};

const MY_LEAGUES = [{ leagueId: 'the-gaffers-league', name: 'The Gaffers League', description: '', status: 'Active', createdByMembershipId: 'm1', createdAt: '2026-01-01T00:00:00Z' }];

function jsonResponse(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderLoginScreen(initialEntries: { pathname: string; state?: unknown }[] = [{ pathname: '/login' }]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <ActiveLeagueProvider>
            <Routes>
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/register" element={<div>Register Page</div>} />
              <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
              <Route path="/leagues/:leagueId/dashboard" element={<div>Dashboard Page</div>} />
              <Route path="/no-leagues" element={<div>No Leagues Page</div>} />
              <Route path="/some-protected-page" element={<div>Protected Page</div>} />
            </Routes>
          </ActiveLeagueProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(loginResult: 'success' | 'failure') {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        const method = init?.method ?? 'GET';

        if (path === '/auth/login' && method === 'POST') {
          return loginResult === 'success' ? jsonResponse(AUTH_TOKEN_RESPONSE) : jsonResponse({ status: 401 }, 401);
        }
        if (path === '/leagues' && method === 'GET') return jsonResponse(MY_LEAGUES);

        throw new Error(`Unhandled request: ${method} ${path}`);
      }),
    );
  }

  it('shows one generic message on invalid credentials (UIR-174)', async () => {
    stubFetch('failure');
    const user = userEvent.setup();
    renderLoginScreen();

    await user.type(screen.getByLabelText('Username or email'), 'wkline');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("That username/email or password isn't right.");
  });

  it('links to Register and Forgot Password (UIR-175)', async () => {
    stubFetch('success');
    renderLoginScreen();

    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password');
  });

  it('returns to the original destination after a redirect-triggered login (UIR-177)', async () => {
    stubFetch('success');
    const user = userEvent.setup();
    renderLoginScreen([{ pathname: '/login', state: { from: '/some-protected-page' } }]);

    await user.type(screen.getByLabelText('Username or email'), 'wkline');
    await user.type(screen.getByLabelText('Password'), 'correctpassword');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Protected Page')).toBeInTheDocument();
  });

  it("lands on the most-recently-active league's Dashboard when reached directly (UIR-177)", async () => {
    stubFetch('success');
    const user = userEvent.setup();
    renderLoginScreen();

    await user.type(screen.getByLabelText('Username or email'), 'wkline');
    await user.type(screen.getByLabelText('Password'), 'correctpassword');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument();
  });
});
