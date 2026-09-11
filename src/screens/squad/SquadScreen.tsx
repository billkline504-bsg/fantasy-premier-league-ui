import { useState } from 'react';
import { useActiveLeague } from '../../state/useActiveLeague';
import { useCurrentSeason, useMyFantasyTeam } from '../../api/hooks/useLeagueSeason';
import { useReplacementOpportunities, useSquad } from '../../api/hooks/useSquad';
import { useClubsById } from '../../api/hooks/useEpl';
import { PlayerTable, type PlayerTableFilterState } from '../../components/PlayerTable';
import { AcquisitionBadge } from '../../components/AcquisitionBadge';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import type { AcquisitionType, SquadPlayerView } from '../../api/types';

// Implements BRD UIR-055–063 (F-UI-002.4).

const GRANT_REASON_LABEL: Record<string, string> = {
  EplExit: 'EPL transfer-out',
  SeasonEndingInjury: 'admin-declared season-ending injury',
};

export function SquadScreen() {
  const { activeLeagueId } = useActiveLeague();
  const season = useCurrentSeason(activeLeagueId);
  const myFantasyTeam = useMyFantasyTeam(activeLeagueId, season.data?.seasonId);
  const clubsById = useClubsById();
  const replacementOpportunities = useReplacementOpportunities(
    activeLeagueId,
    season.data?.seasonId,
    myFantasyTeam.data?.fantasyTeamId,
  );

  const [filter, setFilter] = useState<PlayerTableFilterState>({ position: 'all', search: '', sort: null });
  const squad = useSquad(activeLeagueId, season.data?.seasonId, myFantasyTeam.data?.fantasyTeamId, {
    position: filter.position === 'all' ? undefined : filter.position,
    search: filter.search,
    sort: filter.sort ?? undefined,
  });

  if (season.isPending || myFantasyTeam.isPending || squad.isPending || clubsById.isPending) {
    return <LoadingState label="Loading your squad…" />;
  }
  if (season.error || myFantasyTeam.error || squad.error || clubsById.error) {
    return <ErrorState error={season.error ?? myFantasyTeam.error ?? squad.error ?? clubsById.error} onRetry={() => squad.refetch()} />;
  }
  if (!myFantasyTeam.data) {
    return <ErrorState error={new Error("You don't have a FantasyTeam in this league's current Season.")} />;
  }

  // UIR-055's "Total Players"/summary counts are the *current* squad — `getSquad` also returns
  // released-player history (its own summary says so), which no current UIR surfaces on this
  // screen, so it's filtered out here rather than counted or listed.
  const currentSquad = (squad.data ?? []).filter((p) => p.isCurrentlyOwned);
  const inRosterCount = currentSquad.filter((p) => p.onCurrentGameweekRoster).length;
  const acquisitionCounts: Record<AcquisitionType, number> = { InitialDraft: 0, SecondaryDraft: 0, Replacement: 0 };
  currentSquad.forEach((p) => acquisitionCounts[p.acquisitionType]++);
  const replacementEligibleCount = currentSquad.filter((p) => p.replacementEligibleAt).length;

  const reasonBySourcePlayerId = new Map(
    (replacementOpportunities.data ?? []).map((o) => [o.sourcePlayerId, o.grantReason]),
  );

  const columns = [
    { key: 'playerName', label: 'Player', sortable: true, render: (row: SquadPlayerView) => row.playerName },
    { key: 'club', label: 'Club', render: (row: SquadPlayerView) => clubsById.data.get(row.clubId)?.shortName ?? '—' },
    { key: 'position', label: 'Pos', sortable: true, render: (row: SquadPlayerView) => row.position },
    { key: 'acquired', label: 'Acquired', render: (row: SquadPlayerView) => <AcquisitionBadge type={row.acquisitionType} /> },
    {
      key: 'seasonMinutesPlayed',
      label: 'Min',
      align: 'right' as const,
      sortable: true,
      render: (row: SquadPlayerView) => <span className="tabular">{row.seasonMinutesPlayed}</span>,
    },
    {
      key: 'seasonGamesPlayed',
      label: 'GP',
      align: 'right' as const,
      sortable: true,
      render: (row: SquadPlayerView) => <span className="tabular">{row.seasonGamesPlayed}</span>,
    },
    {
      key: 'seasonFantasyPoints',
      label: 'Pts',
      align: 'right' as const,
      sortable: true,
      render: (row: SquadPlayerView) => <span className="tabular">{row.seasonFantasyPoints}</span>,
    },
    {
      key: 'roster',
      label: 'GW Roster',
      render: (row: SquadPlayerView) =>
        row.onCurrentGameweekRoster ? (
          <span style={{ color: 'var(--turf)', fontWeight: 700 }}>✓ Starting</span>
        ) : (
          <span style={{ color: 'var(--ink-dim)' }}>–</span>
        ),
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (row: SquadPlayerView) => {
        if (!row.replacementEligibleAt) return <span style={{ color: 'var(--ink-dim)' }}>—</span>;
        const reason = reasonBySourcePlayerId.get(row.playerId);
        return (
          <span style={{ color: 'var(--live)', fontWeight: 700, fontSize: '0.78rem' }}>
            Replacement Eligible{reason ? ` — ${GRANT_REASON_LABEL[reason] ?? reason}` : ''}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Full Squad</h1>

      <div className="card" style={{ display: 'flex', gap: 26, flexWrap: 'wrap', padding: '16px 20px', marginBottom: 16 }}>
        <div>
          <b style={{ fontSize: '1.3rem', display: 'block' }}>{currentSquad.length}</b>
          <span style={{ fontSize: '0.68rem', color: 'var(--ink-dim)', textTransform: 'uppercase' }}>Total Players</span>
        </div>
        <div>
          <b style={{ fontSize: '1.3rem', display: 'block' }}>{inRosterCount}</b>
          <span style={{ fontSize: '0.68rem', color: 'var(--ink-dim)', textTransform: 'uppercase' }}>In GW Roster</span>
        </div>
        <div>
          <b style={{ fontSize: '1.3rem', display: 'block' }}>{acquisitionCounts.InitialDraft}</b>
          <AcquisitionBadge type="InitialDraft" />
        </div>
        <div>
          <b style={{ fontSize: '1.3rem', display: 'block' }}>{acquisitionCounts.SecondaryDraft}</b>
          <AcquisitionBadge type="SecondaryDraft" />
        </div>
        <div>
          <b style={{ fontSize: '1.3rem', display: 'block' }}>{acquisitionCounts.Replacement}</b>
          <AcquisitionBadge type="Replacement" />
        </div>
        <div>
          <b style={{ fontSize: '1.3rem', display: 'block' }}>{replacementEligibleCount}</b>
          <span style={{ fontSize: '0.68rem', color: 'var(--live)', textTransform: 'uppercase' }}>Replacement Eligible</span>
        </div>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', marginBottom: 12 }}>
        Min / GP / Pts are season-to-date figures — they legitimately read zero before any
        Gameweek has been scored yet.
      </p>

      <PlayerTable
        aria-label="squad"
        rows={currentSquad}
        columns={columns}
        getRowKey={(row) => row.squadPlayerId}
        filter={filter}
        onFilterChange={setFilter}
        emptyMessage="No players match this filter."
      />
    </div>
  );
}
