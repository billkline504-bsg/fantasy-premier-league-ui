import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../state/useAuth';
import { ApiError } from '../../api/client';
import { estimatePasswordStrength } from '../../utils/passwordStrength';
import { PasswordStrengthMeter } from '../../components/PasswordStrengthMeter';
import { PostAuthRedirect } from '../../components/PostAuthRedirect';
import { AuthLayout } from './AuthLayout';

/** Implements BRD UIR-178–182 (F-UI-001.6). Reached only via `RequireAnonymous` (AppRoutes). */
export function RegisterScreen() {
  const { register } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);

  if (hasRegistered) {
    const from = (location.state as { from?: string } | null)?.from;
    return <PostAuthRedirect fromState={from} />;
  }

  const passwordsMatch = confirmPassword === '' || password === confirmPassword;
  const { meetsMinimumLength, score } = estimatePasswordStrength(password);
  const canSubmit = meetsMinimumLength && score > 0 && password === confirmPassword && username.trim() !== '' && email.trim() !== '';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUsernameError(null);
    setFormError(null);
    setIsSubmitting(true);
    try {
      await register(username, email, password);
      setHasRegistered(true);
    } catch (err) {
      // UIR-180: a username conflict is shown inline, next to the field, with the typed value
      // preserved — the same recoverable-inline pattern as Profile's username save (UIR-169).
      if (err instanceof ApiError && err.status === 409) {
        setUsernameError('That username is already taken.');
      } else {
        setFormError(err instanceof ApiError ? (err.problem.detail ?? 'Could not create your account.') : 'Could not create your account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create Account">
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameError(null);
            }}
            maxLength={24}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        {usernameError && (
          <span role="alert" style={{ display: 'block', color: 'var(--live)', fontSize: '0.8rem', margin: '-8px 0 8px' }}>
            {usernameError}
          </span>
        )}
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 4 }}>
          <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        <PasswordStrengthMeter password={password} />
        <label style={{ display: 'block', margin: '16px 0 8px' }}>
          <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Confirm password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        {!passwordsMatch && (
          <span role="alert" style={{ display: 'block', color: 'var(--live)', fontSize: '0.8rem', margin: '-4px 0 8px' }}>
            Passwords don't match.
          </span>
        )}
        {formError && (
          <p role="alert" style={{ color: 'var(--live)', fontSize: '0.85rem', marginBottom: 12 }}>
            {formError}
          </p>
        )}
        <button type="submit" disabled={isSubmitting || !canSubmit} style={{ width: '100%', padding: 10 }}>
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
      <p style={{ fontSize: '0.82rem', marginTop: 18 }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
