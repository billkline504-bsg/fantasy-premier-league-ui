import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { NotificationPreference } from '../types';

// Query-hook module for the Notifications controller area (Architecture v1.2 §6.3). Backs
// F-UI-001.2 — BR-338/BR-339: preferences are keyed per LeagueMembership, not per User.

function notificationPreferencesQueryKey(leagueId: string, membershipId: string) {
  return ['leagues', leagueId, 'memberships', membershipId, 'notification-preferences'] as const;
}

export function useNotificationPreferences(leagueId: string, membershipId: string | undefined) {
  return useQuery({
    queryKey: notificationPreferencesQueryKey(leagueId, membershipId ?? ''),
    queryFn: async () =>
      (
        await apiRequest<NotificationPreference[]>(
          `/leagues/${leagueId}/memberships/${membershipId}/notification-preferences`,
        )
      ).data,
    enabled: Boolean(membershipId),
  });
}

/** The API replaces the whole preference set per call (05-api-specification §3) — callers pass the complete updated array, not a single changed row. */
export function useUpdateNotificationPreferences(leagueId: string, membershipId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: NotificationPreference[]) =>
      (
        await apiRequest<NotificationPreference[]>(
          `/leagues/${leagueId}/memberships/${membershipId}/notification-preferences`,
          { method: 'PUT', body: preferences },
        )
      ).data,
    onSuccess: (preferences) => {
      if (membershipId) {
        queryClient.setQueryData(notificationPreferencesQueryKey(leagueId, membershipId), preferences);
      }
    },
  });
}
