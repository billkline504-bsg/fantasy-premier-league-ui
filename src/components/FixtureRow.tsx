import type { Club, Fixture } from '../api/types';
import { ClubBadge } from './ClubBadge';
import { ResultPill, type FixtureOutcome } from './ResultPill';

// Implements BRD UIR-024 (result-coded fixture rows) and the completed/live/upcoming states
// UIR-078 requires. `Fixture` has no live-match-minute field (API Consumption Specification
// v1.2 §2.3e) — a live fixture shows "Live" next to the current score, not a running clock.

export interface FixtureRowProps {
  fixture: Fixture;
  homeClub: Club | undefined;
  awayClub: Club | undefined;
}

export function FixtureRow({ fixture, homeClub, awayClub }: FixtureRowProps) {
  const homeName = homeClub?.shortName ?? '—';
  const awayName = awayClub?.shortName ?? '—';

  if (fixture.status === 'Completed') {
    const outcome: FixtureOutcome =
      (fixture.homeGoals ?? 0) > (fixture.awayGoals ?? 0)
        ? 'win'
        : (fixture.awayGoals ?? 0) > (fixture.homeGoals ?? 0)
          ? 'loss'
          : 'draw';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px' }}>
        <ClubBadge shortName={homeName} />
        <span className="tabular" style={{ fontWeight: 700 }}>
          {fixture.homeGoals}–{fixture.awayGoals}
        </span>
        <ClubBadge shortName={awayName} />
        <ResultPill outcome={outcome} label="FT" />
      </div>
    );
  }

  if (fixture.status === 'InProgress') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px' }}>
        <ClubBadge shortName={homeName} />
        <span className="tabular" style={{ fontWeight: 700 }}>
          {fixture.homeGoals}–{fixture.awayGoals}
        </span>
        <ClubBadge shortName={awayName} />
        <ResultPill outcome="live" label="Live" />
      </div>
    );
  }

  if (fixture.status === 'Postponed' || fixture.status === 'Abandoned') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px' }}>
        <ClubBadge shortName={homeName} />
        <span style={{ color: 'var(--ink-dim)' }}>v</span>
        <ClubBadge shortName={awayName} />
        <span style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', fontStyle: 'italic' }}>{fixture.status}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px' }}>
      <ClubBadge shortName={homeName} />
      <span style={{ color: 'var(--ink-dim)' }}>v</span>
      <ClubBadge shortName={awayName} />
      <time style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
        {new Date(fixture.kickoffTime).toLocaleString(undefined, {
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit',
        })}
      </time>
    </div>
  );
}
