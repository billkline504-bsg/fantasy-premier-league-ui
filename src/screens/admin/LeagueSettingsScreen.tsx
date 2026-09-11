import { useState } from 'react';
import { useActiveLeague } from '../../state/useActiveLeague';
import {
  useCurrentSeason,
  useLeague,
  useLeagueConfiguration,
  useSeasonConfiguration,
  useUpdateLeague,
  useUpdateLeagueConfiguration,
  useUpdateSeasonConfiguration,
} from '../../api/hooks/useLeagueSeason';
import type { League, LeagueConfiguration, LeagueStatus, SeasonConfiguration } from '../../api/types';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { ConfigField, NumberInput } from './ConfigField';

/**
 * Implements BRD UIR-196–201 (F-UI-001.10). Reached only through `RequireLeagueAdministrator`
 * (AppRoutes), same as Audit Log/Score Corrections. `tieBreakRulesetVersion` is deliberately
 * excluded from the editable fields below — it's an internal implementation identifier (ADR-008
 * "default ruleset identifier"), not a business-facing policy value; a free-text field for it
 * would let an administrator reference a non-existent ruleset version with no validation this
 * client could perform, unlike every genuinely business-facing `BR-291` parameter.
 */
export function LeagueSettingsScreen() {
  const { activeLeagueId } = useActiveLeague();
  const league = useLeague(activeLeagueId);
  const season = useCurrentSeason(activeLeagueId);
  const leagueConfig = useLeagueConfiguration(activeLeagueId);
  const seasonConfig = useSeasonConfiguration(activeLeagueId, season.data?.seasonId);

  const isPending = league.isPending || season.isPending || leagueConfig.isPending || seasonConfig.isPending;
  if (isPending) return <LoadingState label="Loading League Settings…" />;

  const error = league.error ?? season.error ?? leagueConfig.error ?? seasonConfig.error;
  if (error) return <ErrorState error={error} onRetry={() => league.refetch()} />;

  if (!league.data || !leagueConfig.data || !seasonConfig.data) {
    return <ErrorState error={new Error('No League, configuration, or Season found.')} />;
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>League Settings</h1>
      <LeagueDetailsSection leagueId={activeLeagueId} league={league.data} />
      <ConfigurationSection
        leagueId={activeLeagueId}
        seasonId={season.data?.seasonId}
        leagueConfig={leagueConfig.data}
        seasonConfig={seasonConfig.data}
      />
    </div>
  );
}

function LeagueDetailsSection({ leagueId, league }: { leagueId: string; league: League }) {
  const updateLeague = useUpdateLeague(leagueId);
  const [name, setName] = useState(league.name);
  const [description, setDescription] = useState(league.description);
  const [status, setStatus] = useState<LeagueStatus>(league.status);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  async function handleSave() {
    setConfirmation(null);
    await updateLeague.mutateAsync({ name, description, status });
    setConfirmation('League details saved.');
  }

  return (
    <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
      <h3 style={{ fontSize: '1.05rem', marginBottom: 12 }}>League Details</h3>
      <label style={{ display: 'block', marginBottom: 12 }}>
        <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Name</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} style={{ width: '100%', maxWidth: 400, padding: 8 }} />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={2}
          style={{ width: '100%', maxWidth: 400, padding: 8, resize: 'vertical' }}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value as LeagueStatus)}>
          <option value="Active">Active</option>
          <option value="Archived">Archived</option>
        </select>
      </label>
      <button type="button" onClick={handleSave} disabled={updateLeague.isPending}>
        {updateLeague.isPending ? 'Saving…' : 'Save League Details'}
      </button>
      {confirmation && <p style={{ fontSize: '0.82rem', color: 'var(--turf)', marginTop: 8 }}>{confirmation}</p>}
    </section>
  );
}

function ConfigurationSection({
  leagueId,
  seasonId,
  leagueConfig,
  seasonConfig,
}: {
  leagueId: string;
  seasonId: string | undefined;
  leagueConfig: LeagueConfiguration;
  seasonConfig: SeasonConfiguration;
}) {
  const [leagueDraft, setLeagueDraft] = useState(leagueConfig);
  const [seasonDraft, setSeasonDraft] = useState(seasonConfig);
  const updateLeagueConfig = useUpdateLeagueConfiguration(leagueId);
  const updateSeasonConfig = useUpdateSeasonConfiguration(leagueId, seasonId ?? '');
  const [leagueConfirmation, setLeagueConfirmation] = useState<string | null>(null);
  const [seasonConfirmation, setSeasonConfirmation] = useState<string | null>(null);

  async function saveLeagueDefaults() {
    setLeagueConfirmation(null);
    const changed = diffConfig(leagueConfig, leagueDraft);
    const saved = await updateLeagueConfig.mutateAsync(leagueDraft);
    setLeagueDraft(saved);
    setLeagueConfirmation(changed.length > 0 ? `Changed: ${changed.join(', ')}.` : 'No fields changed.');
  }

  async function saveSeasonConfig() {
    setSeasonConfirmation(null);
    const changed = diffConfig(seasonConfig, seasonDraft);
    const saved = await updateSeasonConfig.mutateAsync(seasonDraft);
    setSeasonDraft(saved);
    setSeasonConfirmation(changed.length > 0 ? `Changed: ${changed.join(', ')}.` : 'No fields changed.');
  }

  return (
    <>
      <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>League Defaults</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', marginBottom: 10 }}>
          Only affects Seasons created afterward, or fields not yet locked on the current Season.
        </p>
        <ConfigFields config={leagueDraft} onChange={setLeagueDraft} lockedFields={[]} />
        <button type="button" onClick={saveLeagueDefaults} disabled={updateLeagueConfig.isPending} style={{ marginTop: 12 }}>
          {updateLeagueConfig.isPending ? 'Saving…' : 'Save League Defaults'}
        </button>
        {leagueConfirmation && <p style={{ fontSize: '0.82rem', color: 'var(--turf)', marginTop: 8 }}>{leagueConfirmation}</p>}
      </section>

      <section className="card" style={{ padding: '16px 20px' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>This Season's Configuration</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', marginBottom: 10 }}>
          Affects only the active Season — never the League's stored defaults or any other Season.
        </p>
        <ConfigFields config={seasonDraft} onChange={setSeasonDraft} lockedFields={seasonConfig.lockedFields ?? []} />
        <button type="button" onClick={saveSeasonConfig} disabled={updateSeasonConfig.isPending} style={{ marginTop: 12 }}>
          {updateSeasonConfig.isPending ? 'Saving…' : "Save Season's Configuration"}
        </button>
        {seasonConfirmation && <p style={{ fontSize: '0.82rem', color: 'var(--turf)', marginTop: 8 }}>{seasonConfirmation}</p>}
      </section>
    </>
  );
}

function ConfigFields({
  config,
  onChange,
  lockedFields,
}: {
  config: LeagueConfiguration;
  onChange: (config: LeagueConfiguration) => void;
  lockedFields: string[];
}) {
  const isLocked = (key: string) => lockedFields.includes(key);

  return (
    <div>
      <ConfigField label="Squad Size" locked={isLocked('initialSquadSize')}>
        <NumberInput
          value={config.initialSquadSize}
          onChange={(v) => onChange({ ...config, initialSquadSize: v })}
          disabled={isLocked('initialSquadSize')}
          aria-label="Squad Size"
        />
      </ConfigField>
      <ConfigField label="Weekly Roster Size" locked={isLocked('weeklyRosterSize')}>
        <NumberInput
          value={config.weeklyRosterSize}
          onChange={(v) => onChange({ ...config, weeklyRosterSize: v })}
          disabled={isLocked('weeklyRosterSize')}
          aria-label="Weekly Roster Size"
        />
      </ConfigField>
      <ConfigField label="Positional Minimums" locked={isLocked('positionalMinimums')}>
        {(['gk', 'def', 'mid', 'fwd'] as const).map((pos) => (
          <label key={pos} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}>
            {pos.toUpperCase()}
            <NumberInput
              value={config.positionalMinimums[pos]}
              onChange={(v) => onChange({ ...config, positionalMinimums: { ...config.positionalMinimums, [pos]: v } })}
              disabled={isLocked('positionalMinimums')}
              width={56}
              aria-label={`Positional minimum: ${pos.toUpperCase()}`}
            />
          </label>
        ))}
      </ConfigField>
      <ConfigField label="Draft Pick Timer (seconds)" locked={isLocked('draftTimerSecondsByType')}>
        {(['initial', 'secondary', 'replacement'] as const).map((type) => (
          <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}>
            {type}
            <NumberInput
              value={config.draftTimerSecondsByType[type]}
              onChange={(v) => onChange({ ...config, draftTimerSecondsByType: { ...config.draftTimerSecondsByType, [type]: v } })}
              disabled={isLocked('draftTimerSecondsByType')}
              width={70}
              min={1}
              aria-label={`Draft timer: ${type}`}
            />
          </label>
        ))}
      </ConfigField>
      <ConfigField label="Secondary Draft Selections / Team" locked={isLocked('secondaryDraftSelectionsPerTeam')}>
        <NumberInput
          value={config.secondaryDraftSelectionsPerTeam}
          onChange={(v) => onChange({ ...config, secondaryDraftSelectionsPerTeam: v })}
          disabled={isLocked('secondaryDraftSelectionsPerTeam')}
          aria-label="Secondary Draft Selections per Team"
        />
      </ConfigField>
      <ConfigField label="Secondary Draft Scheduling Offset (days)" locked={isLocked('secondaryDraftSchedulingOffsetDays')}>
        <NumberInput
          value={config.secondaryDraftSchedulingOffsetDays}
          onChange={(v) => onChange({ ...config, secondaryDraftSchedulingOffsetDays: v })}
          disabled={isLocked('secondaryDraftSchedulingOffsetDays')}
          aria-label="Secondary Draft Scheduling Offset"
        />
      </ConfigField>
      <ConfigField label="Gameweek Roster Lock Offset (minutes)" locked={isLocked('gameweekRosterLockOffsetBeforeKickoffMinutes')}>
        <NumberInput
          value={config.gameweekRosterLockOffsetBeforeKickoffMinutes}
          onChange={(v) => onChange({ ...config, gameweekRosterLockOffsetBeforeKickoffMinutes: v })}
          disabled={isLocked('gameweekRosterLockOffsetBeforeKickoffMinutes')}
          aria-label="Gameweek Roster Lock Offset"
        />
      </ConfigField>
      <ConfigField label="Points per Result" locked={isLocked('leaguePoints')}>
        {(['win', 'draw', 'loss'] as const).map((outcome) => (
          <label key={outcome} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}>
            {outcome}
            <NumberInput
              value={config.leaguePoints[outcome]}
              onChange={(v) => onChange({ ...config, leaguePoints: { ...config.leaguePoints, [outcome]: v } })}
              disabled={isLocked('leaguePoints')}
              width={56}
              aria-label={`Points for a ${outcome}`}
            />
          </label>
        ))}
      </ConfigField>
      <ConfigField label="Invitation Expiration (days)" locked={isLocked('invitationExpirationDays')}>
        <NumberInput
          value={config.invitationExpirationDays}
          onChange={(v) => onChange({ ...config, invitationExpirationDays: v })}
          disabled={isLocked('invitationExpirationDays')}
          min={1}
          aria-label="Invitation Expiration Days"
        />
      </ConfigField>
      <ConfigField label="Replacement Selection Cap" locked={isLocked('replacementSelectionCap')}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
          <input
            type="checkbox"
            checked={config.replacementSelectionCap === null}
            disabled={isLocked('replacementSelectionCap')}
            onChange={(e) => onChange({ ...config, replacementSelectionCap: e.target.checked ? null : 0 })}
          />
          Uncapped
        </label>
        {config.replacementSelectionCap !== null && (
          <NumberInput
            value={config.replacementSelectionCap}
            onChange={(v) => onChange({ ...config, replacementSelectionCap: v })}
            disabled={isLocked('replacementSelectionCap')}
            aria-label="Replacement Selection Cap"
          />
        )}
      </ConfigField>
      <ConfigField label="Gameweek Reminder Lead Time (hours)" locked={isLocked('gameweekReminderLeadTimeHours')}>
        <NumberInput
          value={config.gameweekReminderLeadTimeHours}
          onChange={(v) => onChange({ ...config, gameweekReminderLeadTimeHours: v })}
          disabled={isLocked('gameweekReminderLeadTimeHours')}
          aria-label="Gameweek Reminder Lead Time"
        />
      </ConfigField>
    </div>
  );
}

const CONFIG_FIELD_LABELS: Record<string, string> = {
  initialSquadSize: 'Squad Size',
  weeklyRosterSize: 'Weekly Roster Size',
  positionalMinimums: 'Positional Minimums',
  draftTimerSecondsByType: 'Draft Pick Timer',
  secondaryDraftSelectionsPerTeam: 'Secondary Draft Selections per Team',
  secondaryDraftSchedulingOffsetDays: 'Secondary Draft Scheduling Offset',
  gameweekRosterLockOffsetBeforeKickoffMinutes: 'Gameweek Roster Lock Offset',
  leaguePoints: 'Points per Result',
  invitationExpirationDays: 'Invitation Expiration',
  replacementSelectionCap: 'Replacement Selection Cap',
  gameweekReminderLeadTimeHours: 'Gameweek Reminder Lead Time',
};

function diffConfig(before: LeagueConfiguration, after: LeagueConfiguration): string[] {
  return Object.keys(CONFIG_FIELD_LABELS).filter(
    (key) => JSON.stringify(before[key as keyof LeagueConfiguration]) !== JSON.stringify(after[key as keyof LeagueConfiguration]),
  ).map((key) => CONFIG_FIELD_LABELS[key]);
}
