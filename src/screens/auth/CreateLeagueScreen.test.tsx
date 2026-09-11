import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CreateLeagueScreen } from './CreateLeagueScreen';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-001.9 (BRD UIR-191-195).

function jsonResponse(body: unknown, status = 201) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderCreateLeagueScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/leagues/new']}>
        <ActiveLeagueProvider>
          <Routes>
            <Route path="/leagues/new" element={<CreateLeagueScreen />} />
            <Route path="/leagues/:leagueId/dashboard" element={<div>Dashboard Page</div>} />
          </Routes>
        </ActiveLeagueProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CreateLeagueScreen', () => {
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

        if (path === '/leagues' && method === 'POST') {
          const body = JSON.parse((init?.body as string) ?? '{}');
          return jsonResponse({ leagueId: 'new-league-1', name: body.name, description: body.description ?? '', status: 'Active', createdByMembershipId: 'm1', createdAt: '2026-09-11T00:00:00Z' });
        }
        if (path === '/leagues/new-league-1/seasons' && method === 'POST') {
          const body = JSON.parse((init?.body as string) ?? '{}');
          return jsonResponse({ seasonId: 's1', leagueId: 'new-league-1', eplSeasonIdentifier: body.eplSeasonIdentifier, status: 'Setup', startDate: body.startDate, endDate: null });
        }

        throw new Error(`Unhandled request: ${method} ${path}`);
      }),
    );
  }

  it('collects League name, description, EPL season, and start date with no season picker (UIR-191, UIR-192)', async () => {
    stubFetch();
    renderCreateLeagueScreen();

    expect(screen.getByLabelText('League name')).toBeInTheDocument();
    expect(screen.getByLabelText('EPL season (e.g. "2026/27")')).toHaveAttribute('type', 'text');
    expect(screen.getByText("Type the season exactly — there's no list to choose from.")).toBeInTheDocument();
  });

  it('creates the League and its first Season, confirms Administrator status, then redirects to its Dashboard (UIR-193, UIR-195)', async () => {
    stubFetch();
    const user = userEvent.setup();
    renderCreateLeagueScreen();

    await user.type(screen.getByLabelText('League name'), 'The Gaffers League');
    await user.type(screen.getByLabelText('EPL season (e.g. "2026/27")'), '2026/27');
    await user.type(screen.getByLabelText('Season start date'), '2026-08-09');
    await user.click(screen.getByRole('button', { name: 'Create League' }));

    expect(await screen.findByText(/sole Administrator/)).toBeInTheDocument();
    expect(await screen.findByText('Dashboard Page', {}, { timeout: 2000 })).toBeInTheDocument();
  });
});
