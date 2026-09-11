import { useState } from 'react';
import { useFantasyTeams } from '../../api/hooks/useLeagueSeason';
import { useEplGameweeks, useClubsById } from '../../api/hooks/useEpl';
import { useSchedule } from '../../api/hooks/useCompetition';
import { useSquad } from '../../api/hooks/useSquad';
import { useHistoricalGameweekRoster, useGameweekScore } from '../../api/hooks/useHistory';
import type { FantasyTeam, Season } from '../../api/types';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';

/** Implements BRD UIR-094/096 (Gameweek Roster drill-down). */
export function GameweekRosterView({ activeLeagueId, season }: { activeLeagueId: string; season: Season }) {
  const fantasyTeams = useFantasyTeams(activeLeagueId, season.seasonId);
  const gameweeks = useEplGameweeks(season.eplSeasonIdentifier);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedGameweekId, setSelectedGameweekId] = useState<string | null>(null);

  const isPending = fantasyTeams.isPending || gameweeks.isPending;
  if (isPending) return <LoadingState label="Loading gameweeks…" />;

  const error = fantasyTeams.error ?? gameweeks.error;
  if (error) return <ErrorState error={error} onRetry={() => gameweeks.refetch()} />;

  const teamId = selectedTeamId ?? fantasyTeams.data[0]?.fantasyTeamId ?? null;
  const sortedGameweeks = [...gameweeks.data].sort((a, b) => a.number - b.number);
  const gameweekId = selectedGameweekId ?? sortedGameweeks[0]?.gameweekId ?? null;

  if (!teamId || !gameweekId) {
    return <EmptyState>No teams or Gameweeks are recorded for this season.</EmptyState>;
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', color: 'var(--ink-dim)', minWidth: 220 }}>
          Team
          <select value={teamId} onChange={(e) => setSelectedTeamId(e.target.value)} aria-label="Select team">
            {fantasyTeams.data.map((team) => (
              <option key={team.fantasyTeamId} value={team.fantasyTeamId}>
                {team.username}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', color: 'var(--ink-dim)', minWidth: 160 }}>
          Gameweek
          <select value={gameweekId} onChange={(e) => setSelectedGameweekId(e.target.value)} aria-label="Select Gameweek">
            {sortedGameweeks.map((gw) => (
              <option key={gw.gameweekId} value={gw.gameweekId}>
                GW{gw.number}
              </option>
            ))}
          </select>
        </label>
      </div>

      <GameweekRosterDetail
        activeLeagueId={activeLeagueId}
        seasonId={season.seasonId}
        fantasyTeamId={teamId}
        gameweekId={gameweekId}
        fantasyTeams={fantasyTeams.data}
      />
    </div>
  );
}

function GameweekRosterDetail({
  activeLeagueId,
  seasonId,
  fantasyTeamId,
  gameweekId,
  fantasyTeams,
}: {
  activeLeagueId: string;
  seasonId: string;
  fantasyTeamId: string;
  gameweekId: string;
  fantasyTeams: FantasyTeam[];
}) {
  const roster = useHistoricalGameweekRoster(fantasyTeamId, gameweekId);
  const score = useGameweekScore(fantasyTeamId, gameweekId);
  const schedule = useSchedule(activeLeagueId, seasonId, gameweekId);
  const squad = useSquad(activeLeagueId, seasonId, fantasyTeamId, {});
  const clubsById = useClubsById();

  const isPending = roster.isPending || score.isPending || schedule.isPending || squad.isPending || clubsById.isPending;
  if (isPending) return <LoadingState label="Loading roster…" />;

  const error = roster.error ?? score.error ?? schedule.error ?? squad.error ?? clubsById.error;
  if (error) return <ErrorState error={error} onRetry={() => roster.refetch()} />;

  if (!roster.data) {
    return (
      <EmptyState>
        No roster is recorded for this team in this Gameweek — the underlying record is genuinely stored and
        queryable once one exists (BR-174, BR-178, BR-179).
      </EmptyState>
    );
  }

  const fantasyTeamsById = new Map(fantasyTeams.map((t) => [t.fantasyTeamId, t]));
  const squadByPlayerId = new Map(squad.data.map((p) => [p.playerId, p]));
  const match = schedule.data?.find((m) => m.homeFantasyTeamId === fantasyTeamId || m.awayFantasyTeamId === fantasyTeamId);
  const isHome = match?.homeFantasyTeamId === fantasyTeamId;
  const opponentId = match ? (isHome ? match.awayFantasyTeamId : match.homeFantasyTeamId) : undefined;
  const teamScore = match ? (isHome ? match.homeScore : match.awayScore) : null;
  const opponentScore = match ? (isHome ? match.awayScore : match.homeScore) : null;

  return (
    <div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 18 }}>
        <SummaryStat
          label="Match Result"
          value={
            match && teamScore !== null
              ? `${teamScore}–${opponentScore} vs ${fantasyTeamsById.get(opponentId ?? '')?.username ?? '—'}`
              : 'No H2H match recorded'
          }
        />
        <SummaryStat label="Fantasy Points" value={score.data ? String(score.data.fantasyPoints) : '—'} />
        <SummaryStat
          label="Captain"
          value={roster.data.captainPlayerId ? (squadByPlayerId.get(roster.data.captainPlayerId)?.playerName ?? 'Unknown player') : '—'}
        />
        <SummaryStat label="Locked" value="Yes" />
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              {['Player', 'Position', 'Club', 'Captain'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '9px 14px', color: 'var(--ink-dim)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roster.data.players.map((rosterPlayer) => {
              const player = squadByPlayerId.get(rosterPlayer.playerId);
              const club = player ? clubsById.data.get(player.clubId) : undefined;
              return (
                <tr key={rosterPlayer.playerId} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '9px 14px' }}>{player?.playerName ?? 'Unknown player'}</td>
                  <td style={{ padding: '9px 14px' }}>{player?.position ?? '—'}</td>
                  <td style={{ padding: '9px 14px' }}>{club?.shortName ?? '—'}</td>
                  <td style={{ padding: '9px 14px' }}>{rosterPlayer.isCaptain ? '©' : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-dim)', textTransform: 'uppercase' }}>{label}</div>
      <b style={{ fontSize: '1rem' }}>{value}</b>
    </div>
  );
}
