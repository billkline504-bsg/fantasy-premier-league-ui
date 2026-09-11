import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../state/useAuth';
import { PostAuthRedirect } from '../../components/PostAuthRedirect';
import { AuthLayout } from './AuthLayout';

/** Implements BRD UIR-173–177 (F-UI-001.5). Reached only via `RequireAnonymous` (AppRoutes). */
export function LoginScreen() {
  const { login } = useAuth();
  const location = useLocation();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSignedIn, setHasSignedIn] = useState(false);

  if (hasSignedIn) {
    const from = (location.state as { from?: string } | null)?.from;
    return <PostAuthRedirect fromState={from} />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(usernameOrEmail, password);
      setHasSignedIn(true);
    } catch {
      // UIR-174: one generic message regardless of which half of the credential was wrong,
      // so a visitor can't enumerate valid usernames/emails by trial and error.
      setError("That username/email or password isn't right.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Sign In">
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Username or email</span>
          <input
            type="text"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        {error && (
          <p role="alert" style={{ color: 'var(--live)', fontSize: '0.85rem', marginBottom: 12 }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: 10 }}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p style={{ fontSize: '0.82rem', marginTop: 18, display: 'flex', justifyContent: 'space-between' }}>
        <Link to="/register">Create an account</Link>
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
    </AuthLayout>
  );
}
