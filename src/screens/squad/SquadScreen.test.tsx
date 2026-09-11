import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SquadScreen } from './SquadScreen';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-002.4 (BRD UIR-055-063). The active league in ActiveLeagueProvider's
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

const SEASON = {
  seasonId: 's1',
  leagueId: LEAGUE_ID,
  eplSeasonIdentifier: '2026/27',
  status: 'InSeason',
  startDate: '2026-08-01',
  endDate: null,
};

const MEMBERSHIPS = [
  { leagueMembershipId: 'm1', leagueId: LEAGUE_ID, userId: 'u1', username: 'wkline', isAdministrator: true, leagueIconId: null, effectiveIconId: 'icon-1', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
];

const FANTASY_TEAMS = [
  { fantasyTeamId: 'ft1', leagueMembershipId: 'm1', seasonId: 's1', username: 'wkline', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
];

const CLUBS = [
  { clubId: 'c1', name: 'Liverpool', shortName: 'LIV' },
  { clubId: 'c2', name: 'Crystal Palace', shortName: 'CRY' },
];

const SQUAD = [
  { squadPlayerId: 'sp1', playerId: 'p1', playerName: 'Alisson', clubId: 'c1', position: 'Gk', acquisitionType: 'InitialDraft', acquiredAt: '2026-08-01T00:00:00Z', isCurrentlyOwned: true, onCurrentGameweekRoster: true, replacementEligibleAt: null, seasonMinutesPlayed: 810, seasonGamesPlayed: 9, seasonFantasyPoints: 52 },
  { squadPlayerId: 'sp2', playerId: 'p2', playerName: 'Jean-Philippe Mateta', clubId: 'c2', position: 'Fwd', acquisitionType: 'InitialDraft', acquiredAt: '2026-08-01T00:00:00Z', isCurrentlyOwned: true, onCurrentGameweekRoster: false, replacementEligibleAt: '2026-09-01T09:14:00Z', seasonMinutesPlayed: 360, seasonGamesPlayed: 5, seasonFantasyPoints: 22 },
  { squadPlayerId: 'sp3', playerId: 'p3', playerName: 'Old Released Guy', clubId: 'c1', position: 'Mid', acquisitionType: 'SecondaryDraft', acquiredAt: '2026-08-01T00:00:00Z', isCurrentlyOwned: false, onCurrentGameweekRoster: false, replacementEligibleAt: null, seasonMinutesPlayed: 100, seasonGamesPlayed: 2, seasonFantasyPoints: 5 },
];

const REPLACEMENT_OPPORTUNITIES = [
  { opportunityId: 'ro1', fantasyTeamId: 'ft1', sourcePlayerId: 'p2', grantedAt: '2026-09-01T09:14:00Z', grantReason: 'SeasonEndingInjury', spentAt: null },
];

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function renderSquadScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveLeagueProvider>
        <SquadScreen />
      </ActiveLeagueProvider>
    </QueryClientProvider>,
  );
}

describe('SquadScreen', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));

        if (path === '/users/me') return jsonResponse(CURRENT_USER);
        if (path === `/leagues/${LEAGUE_ID}/seasons`) return jsonResponse([SEASON]);
        if (path === `/leagues/${LEAGUE_ID}/memberships`) return jsonResponse(MEMBERSHIPS);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/fantasy-teams`) return jsonResponse(FANTASY_TEAMS);
        if (path === '/epl/clubs') return jsonResponse(CLUBS);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/fantasy-teams/ft1/squad`) {
          const position = url.searchParams.get('position');
          const filtered = position ? SQUAD.filter((p) => p.position === position) : SQUAD;
          return jsonResponse(filtered);
        }
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/fantasy-teams/ft1/replacement-opportunities`) {
          return jsonResponse(REPLACEMENT_OPPORTUNITIES);
        }

        throw new Error(`Unhandled request: ${path}`);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('summarizes only the currently-owned squad, excluding released-player history (UIR-055)', async () => {
    renderSquadScreen();
    expect(await screen.findByText('Alisson')).toBeInTheDocument();
    expect(screen.getByText('Jean-Philippe Mateta')).toBeInTheDocument();
    expect(screen.queryByText('Old Released Guy')).not.toBeInTheDocument();

    const totalLabel = screen.getByText('Total Players');
    expect(within(totalLabel.parentElement!).getByText('2')).toBeInTheDocument();
    const inRosterLabel = screen.getByText('In GW Roster');
    expect(within(inRosterLabel.parentElement!).getByText('1')).toBeInTheDocument();
  });

  it('shows the GW roster flag correctly per row (UIR-056)', async () => {
    renderSquadScreen();
    await screen.findByText('Alisson');
    const rows = screen.getAllByRole('row');
    const alissonRow = rows.find((r) => within(r).queryByText('Alisson'));
    const matetaRow = rows.find((r) => within(r).queryByText('Jean-Philippe Mateta'));
    expect(within(alissonRow!).getByText('✓ Starting')).toBeInTheDocument();
    expect(within(matetaRow!).getByText('–')).toBeInTheDocument();
  });

  it('states the specific replacement-eligibility reason via the opportunities cross-reference (UIR-062)', async () => {
    renderSquadScreen();
    expect(await screen.findByText(/Replacement Eligible — admin-declared season-ending injury/)).toBeInTheDocument();
  });

  it("shows the season-to-date zero-stats disclosure, matching Draft Board's (UIR-058)", async () => {
    renderSquadScreen();
    expect(await screen.findByText(/legitimately read zero before any Gameweek has been scored/i)).toBeInTheDocument();
  });

  it('tags each acquisition method with its own badge (UIR-017/UIR-061)', async () => {
    renderSquadScreen();
    await screen.findByText('Alisson');
    expect(screen.getAllByText('Initial Draft').length).toBeGreaterThan(0);
  });

  it('filters the squad by position (UIR-015/UIR-057)', async () => {
    const user = userEvent.setup();
    renderSquadScreen();
    await screen.findByText('Alisson');

    await user.click(screen.getByRole('button', { name: 'FWD' }));

    expect(await screen.findByText('Jean-Philippe Mateta')).toBeInTheDocument();
    expect(screen.queryByText('Alisson')).not.toBeInTheDocument();
  });
});
