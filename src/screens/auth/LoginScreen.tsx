import { useState, type FormEvent } from 'react';
import { useAuth } from '../../state/useAuth';
import { ApiError } from '../../api/client';

/**
 * Minimal, unstyled placeholder login form — Architecture v1.1 §7.1 explicitly assumes
 * exactly this exists so the client is buildable/testable now, without pretending a real
 * login screen was ever designed. BRD DEC-UI-007 defers the real one to a future BRD pass;
 * replace this component wholesale once that pass lands, rather than growing it in place.
 */
export function LoginScreen() {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(usernameOrEmail, password);
    } catch (err) {
      setError(err instanceof ApiError ? (err.problem.detail ?? err.message) : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 320, margin: '80px auto', padding: 24 }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Matchday Manager — Sign In</h1>
      <p style={{ fontSize: '0.8rem', color: 'var(--ink-dim)', marginBottom: 20 }}>
        Placeholder sign-in form (Architecture §7.1) — not a designed screen.
      </p>
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
    </div>
  );
}
