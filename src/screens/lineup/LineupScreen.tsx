import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveLeague } from '../../state/useActiveLeague';
import { useCurrentSeason, useMyFantasyTeam, useLeagueConfiguration } from '../../api/hooks/useLeagueSeason';
import { useCurrentGameweek, useGameweekFixtures, useClubsById } from '../../api/hooks/useEpl';
import { useSquad } from '../../api/hooks/useSquad';
import { useGameweekRoster, useSubmitGameweekRoster } from '../../api/hooks/useRoster';
import { ApiError } from '../../api/client';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { useNow } from '../../utils/useNow';
import { RosterLockBanner } from './RosterLockBanner';
import { FixtureStrip } from './FixtureStrip';
import { PositionalChecklist } from './PositionalChecklist';
import { PitchView } from './PitchView';
import { ReservesPanel } from './ReservesPanel';

// Implements BRD UIR-043–054 (F-UI-003.2). See PitchView.tsx's header comment for the
// add/remove-from-roster interaction this client adds beyond what the mock-up depicted
// (BRD v1.3 §12 item 13).

const ERROR_MESSAGES: Record<string, string> = {
  season_goal_prediction_required:
    'You need to submit a Season Goal Prediction before your first roster of the season (BR-299).',
  invalid_roster_composition: "This roster doesn't satisfy the positional minimums (BR-279).",
};

export function LineupScreen() {
  const { activeLeagueId } = useActiveLeague();
  const season = useCurrentSeason(activeLeagueId);
  const myFantasyTeam = useMyFantasyTeam(activeLeagueId, season.data?.seasonId);
  const currentGameweek = useCurrentGameweek(season.data?.eplSeasonIdentifier);
  const configuration = useLeagueConfiguration(activeLeagueId);
  const clubsById = useClubsById();
  const fixtures = useGameweekFixtures(currentGameweek.data?.gameweekId);
  const squad = useSquad(activeLeagueId, season.data?.seasonId, myFantasyTeam.data?.fantasyTeamId, {});
  const rosterQuery = useGameweekRoster(myFantasyTeam.data?.fantasyTeamId, currentGameweek.data?.gameweekId);
  const submitRoster = useSubmitGameweekRoster(myFantasyTeam.data?.fantasyTeamId, currentGameweek.data?.gameweekId);
  const queryClient = useQueryClient();
  const now = useNow(30_000);

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[] | null>(null);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isPending =
    season.isPending ||
    myFantasyTeam.isPending ||
    currentGameweek.isPending ||
    configuration.isPending ||
    clubsById.isPending ||
    squad.isPending ||
    rosterQuery.isPending;
  if (isPending) return <LoadingState label="Loading your lineup…" />;

  const error =
    season.error ?? myFantasyTeam.error ?? currentGameweek.error ?? configuration.error ?? clubsById.error ?? squad.error ?? rosterQuery.error;
  if (error) return <ErrorState error={error} onRetry={() => rosterQuery.refetch()} />;

  if (!myFantasyTeam.data || !currentGameweek.data || !configuration.data || !squad.data || !rosterQuery.data) {
    return <ErrorState error={new Error('No FantasyTeam, Gameweek, or squad found for this league.')} />;
  }

  const currentSquad = squad.data.filter((p) => p.isCurrentlyOwned);
  const deadline = new Date(currentGameweek.data.rosterLockDeadline);
  const isLocked =
    rosterQuery.data.roster.status === 'Locked' || rosterQuery.data.roster.status === 'Scored' || deadline.getTime() <= now;

  // Deriving local edit state from the server's on-load, the same "adjust state once new data
  // arrives" render-time pattern used elsewhere in this codebase (e.g. Profile's username
  // seeding) rather than a useEffect — see that file's own comment for why.
  if (!hasInitialized) {
    setSelectedPlayerIds(currentSquad.filter((p) => p.onCurrentGameweekRoster).map((p) => p.playerId));
    setCaptainId(rosterQuery.data.roster.captainPlayerId);
    setHasInitialized(true);
  }

  const weeklyRosterSize = configuration.data.weeklyRosterSize;
  const selectedIds = selectedPlayerIds ?? [];
  const selectedPlayers = currentSquad.filter((p) => selectedIds.includes(p.playerId));
  const reserves = currentSquad.filter((p) => !selectedIds.includes(p.playerId));
  const minimumsSatisfied =
    selectedPlayers.filter((p) => p.position === 'Gk').length >= configuration.data.positionalMinimums.gk &&
    selectedPlayers.filter((p) => p.position === 'Def').length >= configuration.data.positionalMinimums.def &&
    selectedPlayers.filter((p) => p.position === 'Mid').length >= configuration.data.positionalMinimums.mid &&
    selectedPlayers.filter((p) => p.position === 'Fwd').length >= configuration.data.positionalMinimums.fwd;
  const canSubmit =
    !isLocked &&
    selectedIds.length === weeklyRosterSize &&
    minimumsSatisfied &&
    captainId !== null &&
    selectedIds.includes(captainId) &&
    !submitRoster.isPending;

  function resetFromServer() {
    setSelectedPlayerIds(currentSquad.filter((p) => p.onCurrentGameweekRoster).map((p) => p.playerId));
    setCaptainId(rosterQuery.data!.roster.captainPlayerId);
    setSubmitError(null);
  }

  async function handleSubmit() {
    setSubmitError(null);
    try {
      await submitRoster.mutateAsync({
        playerIds: selectedIds,
        captainPlayerId: captainId ?? undefined,
        ifMatch: rosterQuery.data!.etag,
      });
      queryClient.invalidateQueries({
        queryKey: ['leagues', activeLeagueId, 'seasons', season.data!.seasonId, 'fantasy-teams', myFantasyTeam.data!.fantasyTeamId, 'squad'],
      });
    } catch (err) {
      const code = err instanceof ApiError ? err.problem.errorCode : undefined;
      setSubmitError(
        (code && ERROR_MESSAGES[code]) ??
          (err instanceof ApiError && err.status === 409
            ? 'This roster changed since you last loaded it — reload and try again.'
            : 'Could not submit your roster — try again.'),
      );
    }
  }

  const replacementEligiblePlayers = currentSquad.filter((p) => p.replacementEligibleAt);

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--ink-dim)', textTransform: 'uppercase' }}>
          Squad of {currentSquad.length}
        </div>
        <h1 style={{ fontSize: '1.5rem' }}>Gameweek {currentGameweek.data.number} Roster</h1>
      </div>

      <RosterLockBanner deadline={deadline} />
      <FixtureStrip fixtures={fixtures.data ?? []} clubsById={clubsById.data} activeLeagueId={activeLeagueId} />

      {replacementEligiblePlayers.length > 0 && (
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', marginBottom: 14 }}>
          {replacementEligiblePlayers.map((p) => p.playerName).join(', ')}{' '}
          {replacementEligiblePlayers.length === 1 ? 'is' : 'are'} replacement-eligible — see Squad for details.
        </p>
      )}

      {isLocked && (
        <p style={{ fontSize: '0.82rem', color: 'var(--live)', marginBottom: 14 }}>
          The roster lock has passed for this Gameweek — no further changes are possible here.
        </p>
      )}

      <PositionalChecklist
        selectedPlayers={selectedPlayers}
        minimums={configuration.data.positionalMinimums}
        totalRequired={weeklyRosterSize}
      />

      {submitError && <ErrorState error={new Error(submitError)} onRetry={() => setSubmitError(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>
        <div>
          <PitchView
            players={selectedPlayers}
            captainId={captainId}
            onSelectCaptain={setCaptainId}
            onRemove={(playerId) => {
              setSelectedPlayerIds((prev) => (prev ? prev.filter((id) => id !== playerId) : prev));
              setCaptainId((prev) => (prev === playerId ? null : prev));
            }}
            fixtures={fixtures.data ?? []}
            clubsById={clubsById.data}
            isReadOnly={isLocked}
          />
        </div>

        <div>
          <ReservesPanel
            reserves={reserves}
            onAdd={(playerId) => setSelectedPlayerIds((prev) => (prev && prev.length < weeklyRosterSize ? [...prev, playerId] : prev))}
            isRosterFull={selectedIds.length >= weeklyRosterSize}
            isReadOnly={isLocked}
            fixtures={fixtures.data ?? []}
            clubsById={clubsById.data}
            activeLeagueId={activeLeagueId}
          />
          {!isLocked && (
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button type="button" disabled={!canSubmit} onClick={handleSubmit}>
                {submitRoster.isPending ? 'Submitting…' : 'Submit Roster'}
              </button>
              <button type="button" onClick={resetFromServer}>
                Reset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
