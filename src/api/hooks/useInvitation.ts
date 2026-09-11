import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { LeagueMembership } from '../types';

// Query-hook module backing F-UI-001.8 (Accept League Invitation, BRD §8.20).

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: async (token: string) =>
      (await apiRequest<LeagueMembership>(`/invitations/${encodeURIComponent(token)}/accept`, { method: 'POST' })).data,
  });
}
