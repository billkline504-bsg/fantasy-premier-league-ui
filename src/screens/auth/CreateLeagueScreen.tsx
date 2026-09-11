import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateLeague, useCreateSeason } from '../../api/hooks/useLeagueSeason';
import { useActiveLeague } from '../../state/useActiveLeague';
import { ApiError } from '../../api/client';
import { AuthLayout } from './AuthLayout';

/**
 * Implements BRD UIR-191–195 (F-UI-001.9). Lives alongside the auth/onboarding screens (and
 * reuses `AuthLayout`) even though it isn't itself an auth flow — like `NoLeaguesScreen`, it
 * renders outside the per-league application shell (Architecture v1.4 §5.7), since creating a
 * League isn't scoped to a League that exists yet.
 */
export function CreateLeagueScreen() {
  const navigate = useNavigate();
  const { setActiveLeagueId } = useActiveLeague();
  const createLeague = useCreateLeague();
  const createSeason = useCreateSeason();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eplSeasonIdentifier, setEplSeasonIdentifier] = useState('');
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLeagueName, setCreatedLeagueName] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const league = await createLeague.mutateAsync({ name, description: description || undefined });
      await createSeason.mutateAsync({ leagueId: league.leagueId, eplSeasonIdentifier, startDate });
      setActiveLeagueId(league.leagueId);
      setCreatedLeagueName(league.name);
      // UIR-193's confirmation shows briefly before UIR-195's redirect.
      setTimeout(() => navigate(`/leagues/${league.leagueId}/dashboard`, { replace: true }), 500);
    } catch (err) {
      setError(err instanceof ApiError ? (err.problem.detail ?? 'Could not create your league.') : 'Could not create your league.');
      setIsSubmitting(false);
    }
  }

  if (createdLeagueName) {
    return (
      <AuthLayout title="League Created">
        <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
          <b>{createdLeagueName}</b> is ready, and you're now its sole Administrator. Taking you there…
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create a League">
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>League name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required style={{ width: '100%', padding: 8 }} />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Description (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={2}
            style={{ width: '100%', padding: 8, resize: 'vertical' }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 4 }}>
          <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>EPL season (e.g. "2026/27")</span>
          <input
            type="text"
            value={eplSeasonIdentifier}
            onChange={(e) => setEplSeasonIdentifier(e.target.value)}
            placeholder="2026/27"
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        <p style={{ fontSize: '0.74rem', color: 'var(--ink-dim)', margin: '0 0 12px' }}>
          Type the season exactly — there's no list to choose from.
        </p>
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Season start date</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </label>
        {error && (
          <p role="alert" style={{ color: 'var(--live)', fontSize: '0.85rem', marginBottom: 12 }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: 10 }}>
          {isSubmitting ? 'Creating…' : 'Create League'}
        </button>
      </form>
    </AuthLayout>
  );
}
