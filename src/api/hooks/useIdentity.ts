import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { ProfileIcon, UserSelfDto } from '../types';

// Query-hook module for the Identity controller area (Architecture v1.2 §6.3). Backs
// F-UI-001.1 (Profile: System Profile).

export const currentUserQueryKey = ['users', 'me'] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: async () => (await apiRequest<UserSelfDto>('/users/me')).data,
  });
}

export function useProfileIcons() {
  return useQuery({
    queryKey: ['profile-icons'] as const,
    queryFn: async () => (await apiRequest<ProfileIcon[]>('/profile-icons')).data,
    staleTime: Infinity, // BR-011 — a fixed, server-controlled catalog; no reason to refetch often.
  });
}

export function useUpdateUsername() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) =>
      (await apiRequest<UserSelfDto>('/users/me', { method: 'PUT', body: { username } })).data,
    onSuccess: (user) => queryClient.setQueryData(currentUserQueryKey, user),
  });
}

export function useUpdateDefaultIcon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profileIconId: string) =>
      (await apiRequest<UserSelfDto>('/users/me/icon', { method: 'PUT', body: { profileIconId } })).data,
    onSuccess: (user) => queryClient.setQueryData(currentUserQueryKey, user),
  });
}
