import type { LeagueConfiguration, NotificationChannel, NotificationEventType, NotificationPreference } from '../../api/types';

// Shared shape for the notification-preferences grid (BRD UIR-164–166). The backend only
// returns rows that have been explicitly set (05-api-specification §3) — this always expands
// to the full 3-event × 2-channel grid, defaulting missing rows to `enabled: false` per
// `NotificationPreference.enabled`'s own schema default, so the UI never has a "hole" where a
// toggle should be.

export interface NotificationEventConfig {
  eventType: NotificationEventType;
  label: string;
  description: (config: LeagueConfiguration | undefined) => string;
}

export const NOTIFICATION_EVENTS: NotificationEventConfig[] = [
  {
    eventType: 'GameweekReminder',
    label: 'Gameweek Reminder',
    description: (config) =>
      config
        ? `${config.gameweekReminderLeadTimeHours} hours before your roster lock — this League's configured lead time.`
        : "This League's own configured lead time before roster lock.",
  },
  {
    eventType: 'WeeklyScore',
    label: 'Weekly Score',
    description: () => 'Sent once your Gameweek score is finalized in this League.',
  },
  {
    eventType: 'WeeklyStandings',
    label: 'Weekly Standings',
    description: () => "Sent when this League's table updates, including your new position.",
  },
];

export const NOTIFICATION_CHANNELS: { channel: NotificationChannel; label: string }[] = [
  { channel: 'Email', label: 'Email' },
  { channel: 'Sms', label: 'Text (SMS)' },
];

export function buildFullPreferenceGrid(
  leagueMembershipId: string,
  fetched: NotificationPreference[] | undefined,
): NotificationPreference[] {
  return NOTIFICATION_EVENTS.flatMap((event) =>
    NOTIFICATION_CHANNELS.map(({ channel }) => {
      const existing = fetched?.find((p) => p.eventType === event.eventType && p.channel === channel);
      return existing ?? { leagueMembershipId, eventType: event.eventType, channel, enabled: false };
    }),
  );
}
