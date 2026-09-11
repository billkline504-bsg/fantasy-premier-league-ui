import { useState } from 'react';
import { useFantasyTeams } from '../../api/hooks/useLeagueSeason';
import { useDraftsForSeason, useDraftSelections } from '../../api/hooks/useDraft';
import { useSquad } from '../../api/hooks/useSquad';
import { useClubsById } from '../../api/hooks/useEpl';
import type { FantasyTeam } from '../../api/types';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';

/**
 * Implements BRD UIR-094/095 (Draft History drill-down). Player name/position/club are
 * resolved via that team's own `getSquad` response (`SquadPlayerView`), not a raw `Player`
 * lookup — the same cross-reference already established for Lineup/Squad, since every drafted
 * player becomes a squad entry and `getSquad` includes released/historical rows too, not only
 * currently-owned ones.
 */
export function DraftHistoryView({ activeLeagueId, seasonId }: { activeLeagueId: string; seasonId: string }) {
  const fantasyTeams = useFantasyTeams(activeLeagueId, seasonId);
  const drafts = useDraftsForSeason(activeLeagueId, seasonId);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const isPending = fantasyTeams.isPending || drafts.isPending;
  if (isPending) return <LoadingState label="Loading draft history…" />;

  const error = fantasyTeams.error ?? drafts.error;
  if (error) return <ErrorState error={error} onRetry={() => drafts.refetch()} />;

  const initialDraft = drafts.data.find((d) => d.draftType === 'Initial');
  const teamId = selectedTeamId ?? fantasyTeams.data[0]?.fantasyTeamId ?? null;

  if (!initialDraft || !teamId) {
    return (
      <EmptyState>
        No Initial Draft is recorded for this season — the underlying record is genuinely stored and queryable
        once one exists (BR-174, BR-178, BR-179).
      </EmptyState>
    );
  }

  return (
    <DraftHistoryTeamPicks
      activeLeagueId={activeLeagueId}
      seasonId={seasonId}
      draftId={initialDraft.draftId}
      fantasyTeams={fantasyTeams.data}
      selectedTeamId={teamId}
      onSelectTeam={setSelectedTeamId}
    />
  );
}

function DraftHistoryTeamPicks({
  activeLeagueId,
  seasonId,
  draftId,
  fantasyTeams,
  selectedTeamId,
  onSelectTeam,
}: {
  activeLeagueId: string;
  seasonId: string;
  draftId: string;
  fantasyTeams: FantasyTeam[];
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void;
}) {
  const selections = useDraftSelections(draftId, 200);
  const squad = useSquad(activeLeagueId, seasonId, selectedTeamId, {});
  const clubsById = useClubsById();

  const isPending = selections.isPending || squad.isPending || clubsById.isPending;
  if (isPending) return <LoadingState label="Loading picks…" />;

  const error = selections.error ?? squad.error ?? clubsById.error;
  if (error) return <ErrorState error={error} onRetry={() => selections.refetch()} />;

  const squadByPlayerId = new Map(squad.data.map((p) => [p.playerId, p]));
  const picks = selections.data.items
    .filter((s) => s.fantasyTeamId === selectedTeamId)
    .sort((a, b) => a.pickNumber - b.pickNumber);

  return (
    <div>
      <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', color: 'var(--ink-dim)', marginBottom: 14, maxWidth: 260 }}>
        Team
        <select value={selectedTeamId} onChange={(e) => onSelectTeam(e.target.value)} aria-label="Select team">
          {fantasyTeams.map((team) => (
            <option key={team.fantasyTeamId} value={team.fantasyTeamId}>
              {team.username}
            </option>
          ))}
        </select>
      </label>

      {picks.length === 0 ? (
        <EmptyState>
          No picks are recorded for this team in this season's Initial Draft — the underlying record is genuinely
          stored and queryable once one exists (BR-174, BR-178, BR-179).
        </EmptyState>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                {['Pick', 'Round', 'Player', 'Position', 'Club'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 14px', color: 'var(--ink-dim)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {picks.map((pick) => {
                const player = squadByPlayerId.get(pick.playerId);
                const club = player ? clubsById.data.get(player.clubId) : undefined;
                return (
                  <tr key={pick.draftSelectionId} style={{ borderTop: '1px solid var(--line)' }}>
                    <td className="tabular" style={{ padding: '9px 14px' }}>{pick.pickNumber}</td>
                    <td className="tabular" style={{ padding: '9px 14px' }}>{pick.round}</td>
                    <td style={{ padding: '9px 14px' }}>{player?.playerName ?? 'Unknown player'}</td>
                    <td style={{ padding: '9px 14px' }}>{player?.position ?? '—'}</td>
                    <td style={{ padding: '9px 14px' }}>{club?.shortName ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
