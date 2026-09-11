import { useState, type FormEvent } from 'react';
import { useCurrentUser, useProfileIcons, useUpdateDefaultIcon, useUpdateUsername } from '../../api/hooks/useIdentity';
import { ApiError } from '../../api/client';
import { IconPicker } from '../../components/IconPicker';
import { ThemeSwitch } from '../../shell/ThemeSwitch';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { maskEmail } from '../../utils/maskEmail';

// Implements BRD UIR-157 (System Profile half), UIR-158–161, UIR-169, UIR-171. Deliberately
// usable with no league selected (UIR-171) — nothing here reads ActiveLeagueContext.

export function SystemProfileSection() {
  const currentUser = useCurrentUser();
  const profileIcons = useProfileIcons();
  const updateUsername = useUpdateUsername();
  const updateDefaultIcon = useUpdateDefaultIcon();

  const [usernameInput, setUsernameInput] = useState('');
  const [usernameMessage, setUsernameMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  // Seed the input from the loaded username the first time it arrives, without stomping
  // whatever the user has since typed. Deriving this during render (rather than in a
  // useEffect) is the pattern React's own docs recommend for "adjust state once new data
  // arrives" — oxlint's set-state-in-effect rule flags the useEffect version of this exact
  // case for the same reason.
  const [hasSeededUsername, setHasSeededUsername] = useState(false);
  if (currentUser.data && !hasSeededUsername) {
    setUsernameInput(currentUser.data.username);
    setHasSeededUsername(true);
  }

  async function handleUsernameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUsernameMessage(null);
    try {
      await updateUsername.mutateAsync(usernameInput.trim());
      setUsernameMessage({ kind: 'success', text: 'Saved' });
    } catch (err) {
      // UIR-159/BR-004: the only documented 409 cause on this endpoint is a taken username.
      const isConflict = err instanceof ApiError && err.status === 409;
      setUsernameMessage({
        kind: 'error',
        text: isConflict ? 'Username already taken (BR-004)' : 'Could not save username — try again.',
      });
      // UIR-169: leave the typed value in place so the user can correct and retry inline.
    }
  }

  if (currentUser.isPending) return <LoadingState label="Loading your profile…" />;
  if (currentUser.error) return <ErrorState error={currentUser.error} onRetry={() => currentUser.refetch()} />;

  const user = currentUser.data;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '6px 0 14px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem' }}>User System Profile</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-dim)', margin: '3px 0 0' }}>
            Applies everywhere you use Matchday Manager — not tied to any one League.
          </p>
        </div>
        <span className="scope-badge">Global</span>
      </div>

      <section className="card" style={{ marginBottom: 18, padding: '14px 20px', display: 'flex', gap: 32 }}>
        <div>
          <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--ink-dim)' }}>Email</span>
          <b>{maskEmail(user.email)}</b>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--ink-dim)' }}>Text (SMS)</span>
          {/* API Consumption Specification v1.1 §2.3a: no phone-number field exists on the
              backend today — this is not a rendering gap, there is genuinely nothing to show. */}
          <b style={{ color: 'var(--ink-dim)', fontWeight: 400, fontStyle: 'italic' }}>
            No phone number on file — not yet collected by the platform
          </b>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.76rem', color: 'var(--ink-dim)' }}>
          Not shown to League members (BR-015)
        </span>
      </section>

      <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Username</h3>
          <span className="scope-badge">Global</span>
        </div>
        <form onSubmit={handleUsernameSubmit} style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            maxLength={24}
            aria-label="Username"
          />
          <button type="submit" disabled={updateUsername.isPending}>
            {updateUsername.isPending ? 'Saving…' : 'Save'}
          </button>
          {usernameMessage && (
            <span
              role={usernameMessage.kind === 'error' ? 'alert' : 'status'}
              style={{ color: usernameMessage.kind === 'error' ? 'var(--live)' : 'var(--turf)', fontSize: '0.82rem' }}
            >
              {usernameMessage.text}
            </span>
          )}
        </form>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', marginTop: 10 }}>
          Must be unique among active users (BR-004, BR-266). Changing it never touches your underlying account
          identity or rewrites history — older standings and drafts keep showing the username you held at the time
          (BR-326).
        </p>
      </section>

      <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Default Profile Icon</h3>
          <span className="scope-badge">Global</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-dim)', margin: '6px 0 12px' }}>
          Shown in any League where you haven't set a League-specific icon (BR-006, BR-008). Icons come from this
          fixed catalog only — never an arbitrary upload (BR-011).
        </p>
        {profileIcons.isPending && <LoadingState label="Loading icon catalog…" />}
        {profileIcons.error && <ErrorState error={profileIcons.error} onRetry={() => profileIcons.refetch()} />}
        {profileIcons.data && (
          <IconPicker
            icons={profileIcons.data}
            selectedIconId={user.defaultIconId}
            onSelect={(profileIconId) => updateDefaultIcon.mutate(profileIconId)}
            isDisabled={updateDefaultIcon.isPending}
            aria-label="Default profile icon"
          />
        )}
      </section>

      <section className="card" style={{ marginBottom: 26, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Default Color Scheme</h3>
          <span className="scope-badge">Global</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-dim)', margin: '6px 0 12px' }}>
          The same choice as the switch in the top bar — changing it here or there keeps both in sync.
        </p>
        <ThemeSwitch />
      </section>
    </div>
  );
}
