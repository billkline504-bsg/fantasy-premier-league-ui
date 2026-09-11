import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../client';

// Query-hook module backing F-UI-001.7 (Forgot / Reset Password, BRD §8.19).

export function useRequestPasswordReset() {
  return useMutation({
    // 202 regardless of whether the email matched an account (BR-284) — the UI must show the
    // same confirmation either way (BRD UIR-184), so there is nothing to branch on here.
    mutationFn: async (email: string) => {
      await apiRequest<void>('/auth/password-reset/request', { method: 'POST', body: { email } });
    },
  });
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: async ({ resetToken, newPassword }: { resetToken: string; newPassword: string }) => {
      await apiRequest<void>('/auth/password-reset/confirm', {
        method: 'POST',
        body: { resetToken, newPassword },
      });
    },
  });
}
