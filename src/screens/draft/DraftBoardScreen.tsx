import { useActiveLeague } from '../../state/useActiveLeague';
import { useCurrentSeason, useFantasyTeams, useMyFantasyTeam, useLeagueConfiguration } from '../../api/hooks/useLeagueSeason';
import { useCurrentDraft, useDraft, useDraftSelections } from '../../api/hooks/useDraft';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { DraftOrderPanel } from './DraftOrderPanel';
import { OnClockPanel } from './OnClockPanel';
import { RecentPicksPanel } from './RecentPicksPanel';
import { DraftPlayerPool } from './DraftPlayerPool';
import { resolveOnClockFantasyTeamId } from './draftTurn';

// Implements BRD UIR-099–109 (F-UI-002.1/F-UI-002.2).

const ROUND_TOTAL_FIELD = {
  Initial: 'initialSquadSize',
  Secondary: 'secondaryDraftSelectionsPerTeam',
  Replacement: null,
} as const;

export function DraftBoardScreen() {
  const { activeLeagueId } = useActiveLeague();
  const season = useCurrentSeason(activeLeagueId);
  const draft = useCurrentDraft(activeLeagueId, season.data?.seasonId);
  const draftState = useDraft(draft.data?.draftId);
  const fantasyTeams = useFantasyTeams(activeLeagueId, season.data?.seasonId);
  const myFantasyTeam = useMyFantasyTeam(activeLeagueId, season.data?.seasonId);
  const selections = useDraftSelections(draft.data?.draftId);
  const configuration = useLeagueConfiguration(activeLeagueId);

  if (season.isPending || draft.isPending || fantasyTeams.isPending) {
    return <LoadingState label="Loading the draft…" />;
  }
  if (season.error || draft.error || fantasyTeams.error) {
    return <ErrorState error={season.error ?? draft.error ?? fantasyTeams.error} />;
  }
  if (!draft.data) {
    return <EmptyState>No draft is currently scheduled or in progress for this league.</EmptyState>;
  }
  if (draftState.isPending || !draftState.data) return <LoadingState label="Loading draft state…" />;
  if (draftState.error) return <ErrorState error={draftState.error} onRetry={() => draftState.refetch()} />;

  const activeDraft = draftState.data;
  const fantasyTeamsById = new Map(fantasyTeams.data.map((t) => [t.fantasyTeamId, t]));
  const onClockTeamId = resolveOnClockFantasyTeamId(activeDraft);
  const isMyTurn = Boolean(myFantasyTeam.data && myFantasyTeam.data.fantasyTeamId === onClockTeamId);

  const roundTotalField = ROUND_TOTAL_FIELD[activeDraft.draftType];
  const totalRounds = roundTotalField ? configuration.data?.[roundTotalField] : undefined;

  if (activeDraft.status === 'Completed') {
    return (
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Draft Board</h1>
        <div className="card" style={{ padding: 20 }}>
          <p style={{ margin: 0 }}>
            The {activeDraft.draftType} Draft is complete — every FantasyTeam now holds its expected
            full squad (BR-052, BR-060, BR-197).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
          {activeDraft.draftType} Draft · Round {activeDraft.currentRound}
          {totalRounds ? ` of ${totalRounds}` : ''}
          {activeDraft.status === 'Paused' ? ' · Paused' : ''}
        </div>
        <h1 style={{ fontSize: '1.5rem' }}>Draft Board</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr 260px', gap: 18, alignItems: 'start' }}>
        <DraftOrderPanel draft={activeDraft} fantasyTeamsById={fantasyTeamsById} />

        <div>
          <OnClockPanel draft={activeDraft} fantasyTeamsById={fantasyTeamsById} />
          <DraftPlayerPool draft={activeDraft} isMyTurn={isMyTurn} />
        </div>

        {selections.isPending && <LoadingState label="Loading recent picks…" />}
        {selections.error && <ErrorState error={selections.error} />}
        {selections.data && (
          <RecentPicksPanel selections={selections.data.items} fantasyTeamsById={fantasyTeamsById} />
        )}
      </div>
    </div>
  );
}
