import { useState } from 'react';
import type { Draft, DraftPlayerPoolEntry } from '../../api/types';
import { useDraftPlayerPool, useMakeDraftPick } from '../../api/hooks/useDraft';
import { useClubsById } from '../../api/hooks/useEpl';
import { PlayerTable, type PlayerTableFilterState } from '../../components/PlayerTable';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { ApiError } from '../../api/client';

// Implements BRD UIR-102, UIR-103, UIR-106, UIR-215 (Draft action disabled for everyone,
// including the on-clock team, while the draft is Paused — enforced client-side regardless of
// what the backend actually does, since it documents no paused-draft rejection at all).
//
// API Consumption Specification v1.3 §2.3g-adjacent note: `getDraftPlayerPool` returns only
// *undrafted* players (its own summary says "Remaining undrafted players") — there is no
// "owned" row with a status/owning-team column the way BRD UIR-102/UIR-104 describe, and no
// endpoint returns season-to-date stats for already-owned players either. This pool therefore
// shows available players only; UIR-104's "owned, dimmed, not removed" requirement isn't
// implementable against this API surface without a backend change (see the API Consumption
// Specification for the full finding) — faking "Owned" rows with zero stats would be actively
// misleading (indistinguishable from UIR-106's legitimate pre-season zeros).

export function DraftPlayerPool({ draft, isMyTurn }: { draft: Draft; isMyTurn: boolean }) {
  const [filter, setFilter] = useState<PlayerTableFilterState>({ position: 'all', search: '', sort: null });
  const pool = useDraftPlayerPool(draft.draftId, {
    position: filter.position === 'all' ? undefined : filter.position,
    search: filter.search,
    sort: filter.sort ?? undefined,
  });
  const clubsById = useClubsById();
  const makePick = useMakeDraftPick(draft.draftId);
  const [pickError, setPickError] = useState<string | null>(null);

  async function handleDraft(playerId: string) {
    setPickError(null);
    try {
      await makePick.mutateAsync(playerId);
    } catch (err) {
      // UIR-103/BR-035/BR-191: another team's concurrent pick can win the race for this player.
      setPickError(
        err instanceof ApiError && err.status === 409
          ? 'That player was just taken — the pool has refreshed.'
          : 'Could not submit that pick — try again.',
      );
    }
  }

  if (pool.isPending || clubsById.isPending) return <LoadingState label="Loading available players…" />;
  if (pool.error || clubsById.error) {
    return <ErrorState error={pool.error ?? clubsById.error} onRetry={() => pool.refetch()} />;
  }

  const columns = [
    { key: 'name', label: 'Player', sortable: true, render: (row: DraftPlayerPoolEntry) => row.playerName },
    {
      key: 'club',
      label: 'Club',
      render: (row: DraftPlayerPoolEntry) => clubsById.data.get(row.clubId)?.shortName ?? '—',
    },
    { key: 'position', label: 'Pos', sortable: true, render: (row: DraftPlayerPoolEntry) => row.position },
    {
      key: 'seasonMinutesPlayed',
      label: 'Min',
      align: 'right' as const,
      sortable: true,
      render: (row: DraftPlayerPoolEntry) => <span className="tabular">{row.seasonMinutesPlayed}</span>,
    },
    {
      key: 'seasonGamesPlayed',
      label: 'GP',
      align: 'right' as const,
      sortable: true,
      render: (row: DraftPlayerPoolEntry) => <span className="tabular">{row.seasonGamesPlayed}</span>,
    },
    {
      key: 'seasonFantasyPoints',
      label: 'Pts',
      align: 'right' as const,
      sortable: true,
      render: (row: DraftPlayerPoolEntry) => <span className="tabular">{row.seasonFantasyPoints}</span>,
    },
    {
      key: 'action',
      label: '',
      render: (row: DraftPlayerPoolEntry) => (
        <button
          type="button"
          disabled={!isMyTurn || makePick.isPending || draft.status === 'Paused'}
          onClick={() => handleDraft(row.playerId)}
        >
          Draft
        </button>
      ),
    },
  ];

  return (
    <div>
      {draft.draftType === 'Initial' && (
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', marginBottom: 10 }}>
          Min / GP / Pts are season-to-date figures — they legitimately read zero before any
          Gameweek has been scored yet.
        </p>
      )}
      {pickError && <ErrorState error={new Error(pickError)} onRetry={() => setPickError(null)} />}
      <PlayerTable
        aria-label="draft player pool"
        rows={pool.data ?? []}
        columns={columns}
        getRowKey={(row) => row.playerId}
        filter={filter}
        onFilterChange={setFilter}
        emptyMessage="No available players match this filter."
      />
    </div>
  );
}
