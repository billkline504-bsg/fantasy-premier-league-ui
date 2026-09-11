import { useState } from 'react';
import { useActiveLeague } from '../../state/useActiveLeague';
import { useSeasons } from '../../api/hooks/useLeagueSeason';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { Tabs } from '../../components/Tabs';
import { FinalStandingsView } from './FinalStandingsView';
import { DraftHistoryView } from './DraftHistoryView';
import { GameweekRosterView } from './GameweekRosterView';

type DrillDown = 'standings' | 'draft' | 'roster';

/**
 * Implements BRD UIR-089–098 (F-UI-004.6). **UIR-098 partial gap**: there is no endpoint this
 * client can call to check any user's retirement status except its own (`/users/me`) — no
 * `GET /users/{userId}` exists, only `POST /admin/users/{userId}/reactivate`, which isn't a
 * safe or suitable way to probe status for display. So no "Retired" tag is shown anywhere in
 * History, even though the BRD calls for one. The *other* half of UIR-098 already holds by
 * construction, with no special-casing needed: every join here is by internal id
 * (`fantasyTeamId`/`leagueMembershipId`/`userId`), never by matching on a username string, so a
 * retired manager's historical record can never be confused with a different later user who
 * reuses that username (BR-012, BR-298) — it's just not visibly labeled "Retired."
 */
export function HistoryScreen() {
  const { activeLeagueId } = useActiveLeague();
  const seasons = useSeasons(activeLeagueId);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [drillDown, setDrillDown] = useState<DrillDown>('standings');

  if (seasons.isPending) return <LoadingState label="Loading History…" />;
  if (seasons.error) return <ErrorState error={seasons.error} onRetry={() => seasons.refetch()} />;

  const completed = [...seasons.data]
    .filter((s) => s.status === 'Completed')
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  const inProgress = seasons.data.filter((s) => s.status !== 'Completed');

  if (completed.length === 0) {
    return (
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>History</h1>
        <EmptyState>No season has completed in this league yet — History appears once one has.</EmptyState>
      </div>
    );
  }

  const seasonId = selectedSeasonId ?? completed[0].seasonId;
  const season = completed.find((s) => s.seasonId === seasonId) ?? completed[0];

  const seasonTabs = [
    ...completed.map((s) => ({ value: s.seasonId, label: `${s.eplSeasonIdentifier} · Completed` })),
    ...inProgress.map((s) => ({
      value: s.seasonId,
      label: s.eplSeasonIdentifier,
      disabledReason: 'This season is still in progress — its History entry appears once it completes.',
    })),
  ];

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>History</h1>

      <Tabs items={seasonTabs} activeValue={seasonId} onChange={setSelectedSeasonId} aria-label="Select season" />

      <div style={{ margin: '16px 0' }}>
        <Tabs<DrillDown>
          items={[
            { value: 'standings', label: 'Final Standings' },
            { value: 'draft', label: 'Draft History' },
            { value: 'roster', label: 'Gameweek Roster' },
          ]}
          activeValue={drillDown}
          onChange={setDrillDown}
          aria-label={`${season.eplSeasonIdentifier} drill-down`}
        />
      </div>

      {drillDown === 'standings' && <FinalStandingsView activeLeagueId={activeLeagueId} seasonId={season.seasonId} />}
      {drillDown === 'draft' && <DraftHistoryView activeLeagueId={activeLeagueId} seasonId={season.seasonId} />}
      {drillDown === 'roster' && <GameweekRosterView activeLeagueId={activeLeagueId} season={season} />}

      <p style={{ fontSize: '0.76rem', color: 'var(--ink-dim)', marginTop: 18 }}>
        Historical records here are joined by internal id, never by username — a manager who has since retired,
        or been replaced by a later user reusing their old username, can never be confused with someone else
        (BR-012, BR-298). This client has no way to check any user's retirement status to also show a "Retired"
        tag, though — no endpoint exposes that except for the caller's own account.
      </p>
    </div>
  );
}
