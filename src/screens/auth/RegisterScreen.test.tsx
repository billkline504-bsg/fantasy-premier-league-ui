import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterScreen } from './RegisterScreen';
import { AuthProvider } from '../../state/AuthProvider';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-001.6 (BRD UIR-178-182).

const AUTH_TOKEN_RESPONSE = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  expiresInSeconds: 900,
  user: { userId: 'u1', username: 'newuser', isSystemAdministrator: false },
};

const MY_LEAGUES = [{ leagueId: 'the-gaffers-league', name: 'The Gaffers League', description: '', status: 'Active', createdByMembershipId: 'm1', createdAt: '2026-01-01T00:00:00Z' }];

function jsonResponse(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderRegisterScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/register']}>
        <AuthProvider>
          <ActiveLeagueProvider>
            <Routes>
              <Route path="/register" element={<RegisterScreen />} />
              <Route path="/login" element={<div>Login Page</div>} />
              <Route path="/leagues/:leagueId/dashboard" element={<div>Dashboard Page</div>} />
              <Route path="/no-leagues" element={<div>No Leagues Page</div>} />
            </Routes>
          </ActiveLeagueProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const STRONG_PASSWORD = 'Tr0ub4dor&Zebra!';

describe('RegisterScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(usernameConflict: boolean) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        const method = init?.method ?? 'GET';

        if (path === '/auth/register' && method === 'POST') {
          return usernameConflict
            ? jsonResponse({ status: 409, detail: 'Username already taken by an active User.' }, 409)
            : jsonResponse(AUTH_TOKEN_RESPONSE, 201);
        }
        if (path === '/leagues' && method === 'GET') return jsonResponse(MY_LEAGUES);

        throw new Error(`Unhandled request: ${method} ${path}`);
      }),
    );
  }

  it('disables Create Account until the password meets the minimum length (UIR-179)', async () => {
    stubFetch(false);
    const user = userEvent.setup();
    renderRegisterScreen();

    await user.type(screen.getByLabelText('Username'), 'newuser');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.type(screen.getByLabelText('Confirm password'), 'short');

    expect(screen.getByRole('button', { name: 'Create Account' })).toBeDisabled();
    expect(screen.getByText(/minimum 12 characters/)).toBeInTheDocument();
  });

  it("shows a 'passwords don't match' error and disables submission", async () => {
    stubFetch(false);
    const user = userEvent.setup();
    renderRegisterScreen();

    await user.type(screen.getByLabelText('Username'), 'newuser');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), STRONG_PASSWORD);
    await user.type(screen.getByLabelText('Confirm password'), 'somethingelse12');

    expect(screen.getByText("Passwords don't match.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeDisabled();
  });

  it('shows an inline, recoverable username-conflict error without losing the typed value (UIR-180)', async () => {
    stubFetch(true);
    const user = userEvent.setup();
    renderRegisterScreen();

    await user.type(screen.getByLabelText('Username'), 'takenname');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), STRONG_PASSWORD);
    await user.type(screen.getByLabelText('Confirm password'), STRONG_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('That username is already taken.')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveValue('takenname');
  });

  it('signs the user in immediately on success, with no separate login step (UIR-181)', async () => {
    stubFetch(false);
    const user = userEvent.setup();
    renderRegisterScreen();

    await user.type(screen.getByLabelText('Username'), 'newuser');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), STRONG_PASSWORD);
    await user.type(screen.getByLabelText('Confirm password'), STRONG_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('links to Login for existing accounts (UIR-182)', () => {
    stubFetch(false);
    renderRegisterScreen();

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });
});
