import { useProfileIcons } from '../../api/hooks/useIdentity';
import {
  useClearLeagueIcon,
  useLeagueConfiguration,
  useMyMembership,
  useSetLeagueIcon,
} from '../../api/hooks/useLeagueSeason';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../../api/hooks/useNotifications';
import type { League } from '../../api/types';
import { IconPicker } from '../../components/IconPicker';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { buildFullPreferenceGrid, NOTIFICATION_CHANNELS, NOTIFICATION_EVENTS } from './notificationGrid';

// Implements BRD UIR-157 (League Season Profile half), UIR-162–166. One instance per League
// the user belongs to (UIR-168 — rendered for every membership simultaneously, not scoped to
// whichever league is "active" in the top-bar switcher).

export function LeagueSeasonProfileCard({ league }: { league: League }) {
  const membership = useMyMembership(league.leagueId);
  const profileIcons = useProfileIcons();
  const configuration = useLeagueConfiguration(league.leagueId);
  const setLeagueIcon = useSetLeagueIcon(league.leagueId);
  const clearLeagueIcon = useClearLeagueIcon(league.leagueId);

  const membershipId = membership.data?.leagueMembershipId;
  const notificationPreferences = useNotificationPreferences(league.leagueId, membershipId);
  const updateNotificationPreferences = useUpdateNotificationPreferences(league.leagueId, membershipId);

  if (membership.isPending || profileIcons.isPending) {
    return (
      <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
        <LoadingState label={`Loading ${league.name}…`} />
      </section>
    );
  }
  if (membership.error || profileIcons.error || !membership.data) {
    return (
      <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
        <ErrorState error={membership.error ?? profileIcons.error} />
      </section>
    );
  }

  const currentMembership = membership.data;
  const hasOverride = currentMembership.leagueIconId !== null && currentMembership.leagueIconId !== undefined;
  const grid = buildFullPreferenceGrid(currentMembership.leagueMembershipId, notificationPreferences.data);

  function handleToggle(eventType: (typeof NOTIFICATION_EVENTS)[number]['eventType'], channel: 'Email' | 'Sms') {
    const next = grid.map((row) =>
      row.eventType === eventType && row.channel === channel ? { ...row, enabled: !row.enabled } : row,
    );
    updateNotificationPreferences.mutate(next);
  }

  return (
    <section className="card" style={{ marginBottom: 18 }}>
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <img
            src={
              profileIcons.data?.find((icon) => icon.profileIconId === currentMembership.effectiveIconId)
                ?.assetIdentifier
            }
            alt=""
            width={32}
            height={32}
            style={{ borderRadius: '50%' }}
          />
          <b>{league.name}</b>
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--ink-dim)' }}>
            {hasOverride ? (
              <>
                Custom icon set for this League ·{' '}
                <button
                  type="button"
                  onClick={() => clearLeagueIcon.mutate(currentMembership.leagueMembershipId)}
                  disabled={clearLeagueIcon.isPending}
                >
                  Use Default
                </button>
              </>
            ) : (
              'Using your default icon'
            )}
          </span>
        </div>

        <div style={{ padding: '14px 0' }}>
          <IconPicker
            icons={profileIcons.data ?? []}
            selectedIconId={currentMembership.leagueIconId}
            onSelect={(profileIconId) =>
              setLeagueIcon.mutate({ membershipId: currentMembership.leagueMembershipId, profileIconId })
            }
            isDisabled={setLeagueIcon.isPending}
            aria-label={`${league.name} icon override`}
          />
        </div>

        <h3
          style={{
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '.04em',
            color: 'var(--ink-dim)',
            margin: '16px 0 0',
          }}
        >
          Notifications for This League
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', margin: '2px 0 10px' }}>
          Configured independently for this League — changes here never affect any other League you're in (BR-338).
          Managed here, alongside this League's icon settings, rather than on a separate Notifications screen
          (BR-339).
        </p>

        {notificationPreferences.isPending && <LoadingState label="Loading notification preferences…" />}
        {notificationPreferences.error && <ErrorState error={notificationPreferences.error} />}

        {!notificationPreferences.isPending &&
          NOTIFICATION_EVENTS.map((event) => (
            <div key={event.eventType} style={{ padding: '12px 0', borderTop: '1px solid var(--line)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{event.label}</h4>
              <p style={{ fontSize: '0.83rem', color: 'var(--ink-dim)', margin: '2px 0 8px' }}>
                {event.description(configuration.data)}
              </p>
              <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
                {NOTIFICATION_CHANNELS.map(({ channel, label }) => {
                  const row = grid.find((r) => r.eventType === event.eventType && r.channel === channel);
                  return (
                    <label key={channel} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>
                        {label}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          aria-label={label}
                          checked={row?.enabled ?? false}
                          disabled={updateNotificationPreferences.isPending}
                          onChange={() => handleToggle(event.eventType, channel)}
                        />
                        <span style={{ fontSize: '0.82rem', color: row?.enabled ? 'var(--turf)' : 'var(--ink-muted)' }}>
                          {row?.enabled ? 'On' : 'Off'}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
