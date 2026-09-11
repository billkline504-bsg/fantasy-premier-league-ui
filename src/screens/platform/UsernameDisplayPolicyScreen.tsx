import { useState } from 'react';

type Policy = 'attime' | 'current';

const EXAMPLE_USER = { attime: 'kevin_corner', current: 'cornerkick_kev' };

const PREVIEW_ROWS = [
  { context: '2025/26 Final Standings · 4th place · Set Piece Specialists' },
  { context: 'Secondary Draft History · Round 3, Pick 19 · selected Levi Colwill (CHE)' },
  { context: 'Head-to-Head Result · GW14, 2025/26 · Iron Wall FC 2–1 Set Piece Specialists' },
];

/**
 * Implements BRD UIR-152–156 (F-UI-004.5). Confirmed in the API Consumption Specification's
 * very first mapping pass (v1.0, F-UI-004.5 row) that no dedicated endpoint exists for this at
 * all — the resolved policy and its illustrative example are static/illustrative content by
 * design, not a data-driven view, the same way Architecture v1.0 §2 already assumed. Reached
 * only through `RequireSystemAdministrator` and the league-independent `/platform/username-policy`
 * route (AppRoutes) — never nested under `/leagues/:leagueId` (UIR-156), so it renders
 * identically with no active league at all, matching Security's own platform-level treatment.
 */
export function UsernameDisplayPolicyScreen() {
  const [policy, setPolicy] = useState<Policy>('attime');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-dim)', textTransform: 'uppercase' }}>
            Platform Setting · Resolved (BR-326)
          </div>
          <h1 style={{ fontSize: '1.5rem' }}>Historical Username Display</h1>
        </div>
        <span className="scope-badge">System Administrator only</span>
      </div>

      <section
        className="card"
        style={{ marginTop: 14, marginBottom: 18, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}
      >
        <span aria-hidden style={{ color: 'var(--turf)', fontSize: '1.2rem' }}>
          ⏱
        </span>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>
          <b>Resolved: historical records show the username active at the time of the event.</b> This closed what
          was an open BRD decision — the data model always supported either choice (BR-271, BR-278), since a{' '}
          <code>UserId</code>, never the username, is what history actually joins on. A <code>UsernameHistory</code>{' '}
          timeline per user now drives the resolution below; try the other option to see what was traded away.
        </p>
      </section>

      <div role="group" aria-label="Username display policy (comparison only)" style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <PolicyOption
          label="Username at time of event"
          description="Historical standings, drafts, and results show whatever username the user held when the record was created — like a sports record book. Resolved via the UsernameHistory timeline, not a snapshot copied onto every record."
          shipped
          isSelected={policy === 'attime'}
          onSelect={() => setPolicy('attime')}
        />
        <PolicyOption
          label="Current username"
          description="Historical records always resolve to the user's present-day username — simpler to implement, but old records would visually change every time someone renames. Not the option that shipped."
          shipped={false}
          isSelected={policy === 'current'}
          onSelect={() => setPolicy('current')}
        />
      </div>

      <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 10 }}>
          Live Preview · cornerkick_kev (was kevin_corner until Jan 2026)
        </h3>
        {PREVIEW_ROWS.map((row) => (
          <div
            key={row.context}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 12,
              padding: '10px 0',
              borderTop: '1px solid var(--line)',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--ink-dim)' }}>{row.context}</span>
            <b className="tabular">{EXAMPLE_USER[policy]}</b>
          </div>
        ))}
      </section>

      <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)' }}>
        This applies platform-wide, to every historical record, not just this example — and it never changes what's
        actually stored: <code>UserId</code> stays the join key regardless (BR-278). The toggle above is left in
        place for comparison, not because the choice is still open.
      </p>
    </div>
  );
}

function PolicyOption({
  label,
  description,
  shipped,
  isSelected,
  onSelect,
}: {
  label: string;
  description: string;
  shipped: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className="card"
      style={{
        flex: 1,
        textAlign: 'left',
        padding: '14px 16px',
        border: isSelected ? '1px solid var(--turf)' : '1px solid var(--line)',
        background: isSelected ? 'var(--turf-soft)' : 'var(--surface)',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <b style={{ fontSize: '0.92rem' }}>{label}</b>
        {shipped && (
          <span className="scope-badge league" style={{ marginLeft: 'auto' }}>
            Shipped
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink-dim)', lineHeight: 1.5 }}>{description}</p>
    </button>
  );
}
