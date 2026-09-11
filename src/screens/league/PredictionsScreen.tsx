import { useState, type FormEvent } from 'react';
import { useActiveLeague } from '../../state/useActiveLeague';
import { useCurrentSeason, useFantasyTeams, useMyFantasyTeam } from '../../api/hooks/useLeagueSeason';
import { useEplTable } from '../../api/hooks/useEpl';
import { useSeasonGoalPrediction, useSubmitSeasonGoalPrediction } from '../../api/hooks/usePrediction';
import { ApiError } from '../../api/client';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { LeaguePredictionsList } from './LeaguePredictionsList';

/**
 * Implements BRD UIR-081–088 (F-UI-003.5). Team identity throughout is `username` (BRD
 * DEC-UI-015). `SeasonGoalPrediction.lockedAt` records the moment the backend actually locked
 * the prediction, whether that was Season start under normal submission (BR-127/BR-128) or the
 * moment of submission itself under the late-submission fallback (BR-299) — this screen states
 * whichever really happened rather than assuming Season start every time.
 */
export function PredictionsScreen() {
  const { activeLeagueId } = useActiveLeague();
  const season = useCurrentSeason(activeLeagueId);
  const myFantasyTeam = useMyFantasyTeam(activeLeagueId, season.data?.seasonId);
  const fantasyTeams = useFantasyTeams(activeLeagueId, season.data?.seasonId);
  const eplTable = useEplTable(season.data?.eplSeasonIdentifier);
  const prediction = useSeasonGoalPrediction(activeLeagueId, season.data?.seasonId, myFantasyTeam.data?.fantasyTeamId);
  const submitPrediction = useSubmitSeasonGoalPrediction(
    activeLeagueId,
    season.data?.seasonId,
    myFantasyTeam.data?.fantasyTeamId,
  );

  const [draftGoals, setDraftGoals] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isPending =
    season.isPending || myFantasyTeam.isPending || fantasyTeams.isPending || eplTable.isPending || prediction.isPending;
  if (isPending) return <LoadingState label="Loading Season Predictions…" />;

  const error = season.error ?? myFantasyTeam.error ?? fantasyTeams.error ?? eplTable.error ?? prediction.error;
  if (error) return <ErrorState error={error} onRetry={() => prediction.refetch()} />;

  if (!myFantasyTeam.data) {
    return <ErrorState error={new Error('No FantasyTeam found for this league.')} />;
  }

  // UIR-082: "actual so far" is the only actual-goals figure this screen computes itself —
  // once the season ends, `finalActualGoals`/`finalAbsoluteDifference` on the prediction record
  // itself are the server-computed, authoritative figures (BR-130/BR-131), used below instead.
  const actualGoalsSoFar = (eplTable.data ?? []).reduce((sum, club) => sum + club.goalsFor, 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const parsed = Number(draftGoals);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setSubmitError('Enter a whole number of goals, 0 or more.');
      return;
    }
    try {
      await submitPrediction.mutateAsync(parsed);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError && err.status === 409
          ? 'Your prediction is already locked — reload the page to see it.'
          : 'Could not submit your prediction — try again.',
      );
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Season Predictions</h1>

      {prediction.data ? (
        <>
          <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h3 style={{ fontSize: '1.05rem' }}>Your Prediction</h3>
              <span className="scope-badge">Locked</span>
            </div>
            <p className="tabular" style={{ fontSize: '2rem', fontWeight: 700, margin: '10px 0 4px' }}>
              {prediction.data.predictedEplGoals.toLocaleString()} goals
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-dim)' }}>
              {`Locked ${new Date(prediction.data.lockedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })} — it cannot be changed now (BR-127, BR-128).`}
            </p>
          </section>

          <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: 10 }}>Actual vs. Predicted</h3>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <Stat label="Actual EPL Goals So Far" value={actualGoalsSoFar.toLocaleString()} />
              <Stat label="Your Prediction" value={prediction.data.predictedEplGoals.toLocaleString()} />
              <div>
                <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--ink-dim)', textTransform: 'uppercase' }}>
                  Final Comparison
                </span>
                {prediction.data.finalAbsoluteDifference != null ? (
                  <b className="tabular" style={{ fontSize: '1.3rem', color: 'var(--gold)' }}>
                    Off by {prediction.data.finalAbsoluteDifference.toLocaleString()}
                  </b>
                ) : (
                  <b style={{ fontSize: '1.3rem', color: 'var(--ink-dim)', fontStyle: 'italic' }}>TBD</b>
                )}
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', marginTop: 10 }}>
              The final comparison is only calculated once the season ends (BR-130, BR-131) — a partial-season
              comparison would be misleading, so this reads "TBD" until then.
            </p>
          </section>

          <TieBreakExplainer />

          <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-dim)' }}>
              Your prediction and its calculated difference are retained permanently, even after the tie-break
              resolves at season end (BR-135).
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-dim)', marginTop: 8 }}>
              If you hadn't submitted this before the season started, you'd have been blocked from submitting your
              first Gameweek roster until you did (BR-299).
            </p>
          </section>
        </>
      ) : (
        <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Submit Your Season Goal Prediction</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-dim)', margin: '6px 0 12px' }}>
            Predict the total number of goals scored across the entire EPL season. Once submitted, it locks
            immediately and cannot be changed (BR-127, BR-128, BR-299).
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="number"
              min={0}
              step={1}
              value={draftGoals}
              onChange={(e) => setDraftGoals(e.target.value)}
              aria-label="Predicted total EPL goals this season"
              style={{ width: 120 }}
            />
            <button type="submit" disabled={submitPrediction.isPending || draftGoals === ''}>
              {submitPrediction.isPending ? 'Submitting…' : 'Lock In Prediction'}
            </button>
          </form>
          {submitError && <ErrorState error={new Error(submitError)} onRetry={() => setSubmitError(null)} />}
        </section>
      )}

      <LeaguePredictionsList
        activeLeagueId={activeLeagueId}
        seasonId={season.data?.seasonId}
        seasonStatus={season.data?.status}
        fantasyTeams={fantasyTeams.data ?? []}
        myFantasyTeamId={myFantasyTeam.data.fantasyTeamId}
        myPrediction={prediction.data ?? null}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--ink-dim)', textTransform: 'uppercase' }}>
        {label}
      </span>
      <b className="tabular" style={{ fontSize: '1.3rem' }}>
        {value}
      </b>
    </div>
  );
}

function TieBreakExplainer() {
  return (
    <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
      <h3 style={{ fontSize: '1.05rem', marginBottom: 8 }}>How the Tie-Break Works</h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--ink-dim)' }}>
        If the League Table is still level after Points, Goal Difference, Goals For, Head-to-Head, and Captain
        Points, this is the last tie-breaker before a random draw (BR-131–BR-134): whoever predicted closest to the
        actual EPL season goal total wins. If two predictions are equally close, the one at or below the actual
        total wins over the one above it.
      </p>
      <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: 10 }}>
        <b>Example</b> — actual total: 1,234 goals. Team A predicted 1,233 (off by 1); Team B predicted 1,235 (also
        off by 1). Both are equally close, but A's prediction is at-or-below the actual total, so{' '}
        <b>A wins the tie-break</b>.
      </p>
    </section>
  );
}
