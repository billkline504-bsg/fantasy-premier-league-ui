import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useRequestPasswordReset } from '../../api/hooks/usePasswordReset';
import { AuthLayout } from './AuthLayout';

/** Implements BRD UIR-183–184 (F-UI-001.7, request step). Reached only via `RequireAnonymous`. */
export function ForgotPasswordScreen() {
  const requestReset = useRequestPasswordReset();
  const [email, setEmail] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // UIR-184: the exact same confirmation shows whether or not this email actually matched an
    // account (BR-284's own unconditional-202 design) — there is nothing to branch on here.
    await requestReset.mutateAsync(email).catch(() => {});
    setHasSubmitted(true);
  }

  if (hasSubmitted) {
    return (
      <AuthLayout title="Check Your Email">
        <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
          If that email matches an account, a password reset link has been sent to it. The link is single-use and
          expires after a limited time.
        </p>
        <p style={{ fontSize: '0.82rem', marginTop: 18 }}>
          <Link to="/login">Back to Sign In</Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot Password">
      <p style={{ fontSize: '0.85rem', color: 'var(--ink-dim)', marginBottom: 16 }}>
        Enter the email on your account and we'll send you a link to reset your password.
      </p>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        <button type="submit" disabled={requestReset.isPending} style={{ width: '100%', padding: 10 }}>
          {requestReset.isPending ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
      <p style={{ fontSize: '0.82rem', marginTop: 18 }}>
        <Link to="/login">Back to Sign In</Link>
      </p>
    </AuthLayout>
  );
}
