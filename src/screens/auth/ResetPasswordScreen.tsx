import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useConfirmPasswordReset } from '../../api/hooks/usePasswordReset';
import { estimatePasswordStrength } from '../../utils/passwordStrength';
import { PasswordStrengthMeter } from '../../components/PasswordStrengthMeter';
import { AuthLayout } from './AuthLayout';

/** Implements BRD UIR-185–186 (F-UI-001.7, confirm step). Reached only via `RequireAnonymous`. */
export function ResetPasswordScreen() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  const confirmReset = useConfirmPasswordReset();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasSucceeded, setHasSucceeded] = useState(false);

  const { meetsMinimumLength, score } = estimatePasswordStrength(newPassword);
  const canSubmit = meetsMinimumLength && score > 0 && newPassword === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetToken) return;
    setError(null);
    try {
      await confirmReset.mutateAsync({ resetToken, newPassword });
      setHasSucceeded(true);
    } catch {
      // UIR-186: a plain statement the link no longer works, with a direct path to request a
      // new one — not a generic/unexplained error.
      setError('expired');
    }
  }

  if (!resetToken || error === 'expired') {
    return (
      <AuthLayout title="Reset Link No Longer Works">
        <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
          This password reset link is invalid, expired, or has already been used.
        </p>
        <p style={{ fontSize: '0.82rem', marginTop: 18 }}>
          <Link to="/forgot-password">Request a new reset link</Link>
        </p>
      </AuthLayout>
    );
  }

  if (hasSucceeded) {
    return (
      <AuthLayout title="Password Updated">
        <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>Your password has been changed. You can now sign in with it.</p>
        <p style={{ fontSize: '0.82rem', marginTop: 18 }}>
          <Link to="/login">Sign in</Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password">
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 4 }}>
          <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        <PasswordStrengthMeter password={newPassword} />
        <label style={{ display: 'block', margin: '16px 0' }}>
          <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        <button type="submit" disabled={confirmReset.isPending || !canSubmit} style={{ width: '100%', padding: 10 }}>
          {confirmReset.isPending ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
