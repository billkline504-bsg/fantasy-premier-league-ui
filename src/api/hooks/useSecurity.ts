import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { CsrfStatus, RateLimitRule, SecurityEventPage } from '../types';

// Query-hook module for the platform-level Security & Abuse Protection screen (F-UI-004.4).
// All three operations are System-Administrator-only and league-independent (Architecture §5.4).

export function useRateLimitConfiguration() {
  return useQuery({
    queryKey: ['admin', 'security', 'rate-limits'] as const,
    queryFn: async () => (await apiRequest<RateLimitRule[]>('/admin/security/rate-limits')).data,
  });
}

/**
 * `getSecurityEvents` is cursor-paginated, but this screen only needs a "recent events" glance
 * (BRD UIR-149), unlike Audit Log's explicit "Load more" requirement — so this fetches a single
 * page and stops there, the same choice Draft Board's Recent Picks panel already makes for
 * `listDraftSelections`.
 */
export function useSecurityEvents() {
  return useQuery({
    queryKey: ['admin', 'security', 'events'] as const,
    queryFn: async () => (await apiRequest<SecurityEventPage>('/admin/security/events', { query: { limit: 50 } })).data,
  });
}

export function useCsrfStatus() {
  return useQuery({
    queryKey: ['admin', 'security', 'csrf-status'] as const,
    queryFn: async () => (await apiRequest<CsrfStatus>('/admin/security/csrf-status')).data,
  });
}
