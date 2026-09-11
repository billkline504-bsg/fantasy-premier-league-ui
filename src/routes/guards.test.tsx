import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequireAnonymous, RequireAuth } from './guards';
import { AuthProvider } from '../state/AuthProvider';
import { ActiveLeagueProvider } from '../state/ActiveLeagueProvider';

// Exercises Architecture v1.3 §5.2/§5.6 (BRD UIR-176, UIR-177).

const MY_LEAGUES = [{ leagueId: 'the-gaffers-league', name: 'The Gaffers League', description: '', status: 'Active', createdByMembershipId: 'm1', createdAt: '2026-01-01T00:00:00Z' }];

function jsonResponse(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderGuardedRoutes(initialEntries: string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <ActiveLeagueProvider>
            <Routes>
              <Route
                path="/protected"
                element={
                  <RequireAuth>
                    <div>Protected Content</div>
                  </RequireAuth>
                }
              />
              <Route
                path="/login"
                element={
                  <RequireAnonymous>
                    <div>Login Form</div>
                  </RequireAnonymous>
                }
              />
              <Route path="/leagues/:leagueId/dashboard" element={<div>Dashboard Page</div>} />
              <Route path="/no-leagues" element={<div>No Leagues Page</div>} />
            </Routes>
          </ActiveLeagueProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('guards', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('unauthenticated', () => {
    beforeEach(() => {
      localStorage.clear();
      vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ status: 401 }, 401)));
    });

    it('redirects RequireAuth to /login carrying the original destination as state.from', async () => {
      renderGuardedRoutes(['/protected']);

      expect(await screen.findByText('Login Form')).toBeInTheDocument();
    });

    it('lets an anonymous visitor through RequireAnonymous', async () => {
      renderGuardedRoutes(['/login']);

      expect(await screen.findByText('Login Form')).toBeInTheDocument();
    });
  });

  describe('authenticated', () => {
    beforeEach(() => {
      localStorage.clear();
      localStorage.setItem('matchday-refresh-token', 'refresh-1');
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
          if (path === '/leagues' && method === 'GET') return jsonResponse(MY_LEAGUES);

          throw new Error(`Unhandled request: ${method} ${path}`);
        }),
      );
    });

    it('lets an authenticated visitor through RequireAuth', async () => {
      renderGuardedRoutes(['/protected']);

      expect(await screen.findByText('Protected Content')).toBeInTheDocument();
    });

    it("redirects an already-authenticated visitor away from RequireAnonymous (UIR-176)", async () => {
      renderGuardedRoutes(['/login']);

      expect(await screen.findByText('Dashboard Page')).toBeInTheDocument();
      expect(screen.queryByText('Login Form')).not.toBeInTheDocument();
    });
  });
});
