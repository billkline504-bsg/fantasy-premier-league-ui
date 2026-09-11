import { estimatePasswordStrength } from '../utils/passwordStrength';

const LEVEL_COLORS: Record<string, string> = {
  'very-weak': 'var(--live)',
  weak: 'var(--live)',
  fair: 'var(--gold)',
  good: 'var(--turf)',
  strong: 'var(--turf)',
};

/**
 * Implements BRD UIR-179 — used by both Register and Reset Password (Architecture v1.3 ADR-012)
 * so the two never drift into inconsistent strength policies. Updates continuously as the user
 * types; never renders a static "must contain a number/symbol" checklist (BR-285).
 */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, level, label } = estimatePasswordStrength(password);
  const color = LEVEL_COLORS[level] ?? 'var(--ink-dim)';

  return (
    <div aria-hidden={password.length === 0} style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i < score ? color : 'var(--line)',
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: '0.74rem', color: 'var(--ink-dim)', margin: '4px 0 0' }}>
        {password.length > 0 ? `${label} — ` : ''}minimum 12 characters
      </p>
    </div>
  );
}
