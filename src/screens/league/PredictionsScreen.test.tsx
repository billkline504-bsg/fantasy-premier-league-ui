import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PredictionsScreen } from './PredictionsScreen';
import { ActiveLeagueProvider } from '../../state/ActiveLeagueProvider';

// Exercises F-UI-003.5 (BRD UIR-081-088). The active league in ActiveLeagueProvider's
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

const MEMBERSHIPS = [
  { leagueMembershipId: 'm1', leagueId: LEAGUE_ID, userId: 'u1', username: 'wkline', isAdministrator: true, leagueIconId: null, effectiveIconId: 'icon-1', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
  { leagueMembershipId: 'm2', leagueId: LEAGUE_ID, userId: 'u2', username: 'cornerkick_kev', isAdministrator: false, leagueIconId: null, effectiveIconId: 'icon-2', status: 'Active', joinedAt: '2026-01-01T00:00:00Z', leftAt: null },
];

const FANTASY_TEAMS = [
  { fantasyTeamId: 'ft1', leagueMembershipId: 'm1', seasonId: 's1', username: 'wkline', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { fantasyTeamId: 'ft2', leagueMembershipId: 'm2', seasonId: 's1', username: 'cornerkick_kev', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
];

const TABLE = [
  { clubId: 'c1', position: 1, played: 9, won: 7, drawn: 1, lost: 1, goalsFor: 18, goalsAgainst: 6, goalDifference: 12, points: 22 },
  { clubId: 'c2', position: 2, played: 9, won: 5, drawn: 2, lost: 2, goalsFor: 14, goalsAgainst: 9, goalDifference: 5, points: 17 },
];

const LOCKED_PREDICTION = {
  predictionId: 'pred1',
  seasonId: 's1',
  fantasyTeamId: 'ft1',
  predictedEplGoals: 1200,
  submittedAt: '2026-08-01T12:00:00Z',
  lockedAt: '2026-08-01T12:00:00Z',
  finalActualGoals: null,
  finalAbsoluteDifference: null,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function seasonFixture(status: string) {
  return { seasonId: 's1', leagueId: LEAGUE_ID, eplSeasonIdentifier: '2026/27', status, startDate: '2026-08-01', endDate: null };
}

function renderPredictionsScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveLeagueProvider>
        <PredictionsScreen />
      </ActiveLeagueProvider>
    </QueryClientProvider>,
  );
}

describe('PredictionsScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(handlers: {
    seasonStatus: string;
    myPrediction: unknown;
    otherPrediction?: unknown;
    onSubmit?: (body: { predictedEplGoals: number }) => void;
  }) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        const method = init?.method ?? 'GET';

        if (path === '/users/me') return jsonResponse(CURRENT_USER);
        if (path === `/leagues/${LEAGUE_ID}/seasons`) return jsonResponse([seasonFixture(handlers.seasonStatus)]);
        if (path === `/leagues/${LEAGUE_ID}/memberships`) return jsonResponse(MEMBERSHIPS);
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/fantasy-teams`) return jsonResponse(FANTASY_TEAMS);
        if (path === '/epl/seasons/2026/27/table') return jsonResponse(TABLE);

        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/fantasy-teams/ft1/season-goal-prediction` && method === 'GET') {
          return handlers.myPrediction ? jsonResponse(handlers.myPrediction) : jsonResponse({ status: 404, detail: 'Not yet submitted.' }, 404);
        }
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/fantasy-teams/ft1/season-goal-prediction` && method === 'PUT') {
          const body = JSON.parse((init?.body as string) ?? '{}');
          handlers.onSubmit?.(body);
          return jsonResponse({ ...LOCKED_PREDICTION, predictedEplGoals: body.predictedEplGoals });
        }
        if (path === `/leagues/${LEAGUE_ID}/seasons/s1/fantasy-teams/ft2/season-goal-prediction` && method === 'GET') {
          return handlers.otherPrediction ? jsonResponse(handlers.otherPrediction) : jsonResponse({ status: 404, detail: 'Not yet submitted.' }, 404);
        }

        throw new Error(`Unhandled request: ${method} ${path}`);
      }),
    );
  }

  it('shows the locked prediction, its lock date, and "TBD" for the final comparison (UIR-081, UIR-082)', async () => {
    stubFetch({ seasonStatus: 'InSeason', myPrediction: LOCKED_PREDICTION });
    renderPredictionsScreen();

    expect(await screen.findByText('1,200 goals')).toBeInTheDocument();
    expect(screen.getByText(/Locked August 1, 2026/)).toBeInTheDocument();
    expect(screen.getByText('32')).toBeInTheDocument(); // 18 + 14 goalsFor
    expect(screen.getByText('TBD')).toBeInTheDocument();
  });

  it('states the missed-submission consequence only once a prediction is already locked (UIR-087)', async () => {
    stubFetch({ seasonStatus: 'InSeason', myPrediction: LOCKED_PREDICTION });
    renderPredictionsScreen();

    expect(await screen.findByText(/blocked from submitting your first Gameweek roster/)).toBeInTheDocument();
  });

  it('offers a submission form when no prediction exists yet, and locks it in on submit', async () => {
    let submittedBody: { predictedEplGoals: number } | undefined;
    stubFetch({ seasonStatus: 'InSeason', myPrediction: null, onSubmit: (body) => (submittedBody = body) });
    const user = userEvent.setup();
    renderPredictionsScreen();

    const input = await screen.findByLabelText('Predicted total EPL goals this season');
    expect(screen.queryByText(/blocked from submitting your first Gameweek roster/)).not.toBeInTheDocument();

    await user.type(input, '1300');
    await user.click(screen.getByRole('button', { name: 'Lock In Prediction' }));

    expect(await screen.findByText('1,300 goals')).toBeInTheDocument();
    expect(submittedBody).toEqual({ predictedEplGoals: 1300 });
  });

  it("hides another manager's prediction until the season is Completed (UIR-083)", async () => {
    stubFetch({ seasonStatus: 'InSeason', myPrediction: LOCKED_PREDICTION });
    renderPredictionsScreen();

    expect(await screen.findByText('Hidden until season end')).toBeInTheDocument();
    expect(screen.getByText('cornerkick_kev')).toBeInTheDocument();
  });

  it('reveals every manager\'s prediction once the season has Completed (UIR-083)', async () => {
    const otherPrediction = { ...LOCKED_PREDICTION, predictionId: 'pred2', fantasyTeamId: 'ft2', predictedEplGoals: 1150 };
    stubFetch({ seasonStatus: 'Completed', myPrediction: LOCKED_PREDICTION, otherPrediction });
    renderPredictionsScreen();

    expect(await screen.findByText('1,150')).toBeInTheDocument();
    expect(screen.queryByText('Hidden until season end')).not.toBeInTheDocument();
  });

  it('explains the tie-break mechanics with a worked example and states its position in the order (UIR-084, UIR-085)', async () => {
    stubFetch({ seasonStatus: 'InSeason', myPrediction: LOCKED_PREDICTION });
    renderPredictionsScreen();

    expect(await screen.findByText(/Points, Goal Difference, Goals For, Head-to-Head, and Captain/)).toBeInTheDocument();
    expect(screen.getByText(/A wins the tie-break/)).toBeInTheDocument();
  });
});
