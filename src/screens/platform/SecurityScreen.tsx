import { useRateLimitConfiguration, useSecurityEvents, useCsrfStatus } from '../../api/hooks/useSecurity';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';

/**
 * Implements BRD UIR-145–151 (F-UI-004.4). Reached only through `RequireSystemAdministrator`
 * and the league-independent `/platform/security` route (AppRoutes) — never nested under
 * `/leagues/:leagueId`, so it renders identically with no active league at all (UIR-151).
 *
 * The three auth-posture tiles (UIR-146) are largely **static content**, not read from any
 * endpoint — there is no "get auth configuration" operation anywhere in the API. "Bearer JWT"
 * and the 15-minute/30-day lifetimes are the platform's actual, already-documented values
 * (Architecture v1.2 §7.2, and confirmed again in the vendored mock-up's own Security screen),
 * the same authority this client's own auth session design already relies on — not a fabricated
 * placeholder. The "Cookie-Based Flows" tile is the one exception: it reads live from
 * `CsrfStatus.cookieAuthenticationEnabled`.
 *
 * The Rate Limiting table and Recent Rate-Limit Events feed surface a real schema gap (API
 * Consumption Specification v1.11 §2.3t/§2.3u): `RateLimitRule` has no `scope` or active-status
 * field, and `SecurityEvent.eventType` has only one enum value (`RateLimitBlocked`, no
 * Login/Password-Reset/General-API breakdown) — both columns/tags UIR-148/149 call for are
 * marked as not exposed by this API rather than guessed from endpoint-string patterns.
 */
export function SecurityScreen() {
  const rateLimits = useRateLimitConfiguration();
  const events = useSecurityEvents();
  const csrfStatus = useCsrfStatus();

  const isPending = rateLimits.isPending || events.isPending || csrfStatus.isPending;
  if (isPending) return <LoadingState label="Loading Security & Abuse Protection…" />;

  const error = rateLimits.error ?? events.error ?? csrfStatus.error;
  if (error) return <ErrorState error={error} onRetry={() => rateLimits.refetch()} />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <h1 style={{ fontSize: '1.5rem' }}>Security & Abuse Protection</h1>
        <span className="scope-badge">System Administrator only</span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--ink-dim)', marginBottom: 18 }}>
        This sits above every league — the platform-level System Administrator role (BR-300) is separate from,
        and not exposed through, any per-league Administrator screen like Audit Log.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
        <StatTile label="Auth Method" value="Bearer JWT" sub="Short-lived access token + rotating refresh token" />
        <StatTile label="Access Token Lifetime" value="15 min" sub="Refresh token: 30 days" />
        <StatTile
          label="Cookie-Based Flows"
          value={csrfStatus.data.cookieAuthenticationEnabled ? 'In use' : 'Not in use'}
          sub="API is bearer-token only today"
        />
      </div>

      <section className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 10 }}>CSRF Protection (BR-168)</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', lineHeight: 1.6, margin: '0 0 12px' }}>
          Every state-changing request (draft picks, roster submissions, league messages, admin corrections)
          requires a bearer token in the <code>Authorization</code> header. Browsers never attach that header
          automatically on a cross-site request — the mechanism classic CSRF depends on — so the current API
          isn't exposed to it.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span className="scope-badge league">
            Current API · {csrfStatus.data.cookieAuthenticationEnabled ? 'Exposed to CSRF' : 'Not Exposed'}
          </span>
          <span className="scope-badge">
            Cookie-Flow Middleware · {csrfStatus.data.csrfMiddlewareActive ? 'Active' : 'Implemented, Standing By'}
          </span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-dim)', margin: '12px 0 0' }}>
          If a cookie-based session flow is ever added, anti-CSRF tokens and <code>SameSite</code> cookie
          attributes activate automatically for that flow — not bolted on after the fact.
        </p>
      </section>

      <section style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 10 }}>Rate Limiting (BR-169)</h3>
        {rateLimits.data.length === 0 ? (
          <EmptyState>No rate limits are currently configured.</EmptyState>
        ) : (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr>
                  {['Endpoint', 'Limit', 'Window', 'Scope', 'Status'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '9px 12px', color: 'var(--ink-dim)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rateLimits.data.map((rule) => (
                  <tr key={rule.endpointPattern} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                      {rule.endpointPattern}
                    </td>
                    <td className="tabular" style={{ padding: '9px 12px' }}>{rule.maxRequests} requests</td>
                    <td className="tabular" style={{ padding: '9px 12px' }}>{formatWindow(rule.windowSeconds)}</td>
                    <td style={{ padding: '9px 12px', color: 'var(--ink-dim)', fontStyle: 'italic' }}>
                      Not exposed by this endpoint
                    </td>
                    <td style={{ padding: '9px 12px', color: 'var(--ink-dim)', fontStyle: 'italic' }}>
                      Not exposed by this endpoint
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 10 }}>Recent Rate-Limit Events</h3>
        {events.data.items.length === 0 ? (
          <EmptyState>No rate-limit events have been recorded recently.</EmptyState>
        ) : (
          <div className="card">
            {events.data.items.map((event, index) => (
              <div
                key={event.securityEventId}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'baseline',
                  padding: '12px 20px',
                  borderTop: index === 0 ? 'none' : '1px solid var(--line)',
                }}
              >
                <span className="scope-badge" style={{ flex: 'none' }}>
                  {event.endpoint}
                </span>
                <p style={{ margin: 0, fontSize: '0.86rem' }}>
                  <span style={{ color: 'var(--ink-dim)' }}>{event.scope}</span> — {event.detail}
                </p>
                <time style={{ marginLeft: 'auto', flex: 'none', fontSize: '0.76rem', color: 'var(--ink-dim)' }}>
                  {relativeTime(event.occurredAt)}
                </time>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card sec-checklist" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>Security Checklist</h3>
        <ChecklistItem text="HTTPS everywhere (BR-164)" />
        <ChecklistItem text="Server-side input validation (BR-165, BR-166)" />
        <ChecklistItem text="Parameterized queries & output encoding (BR-167)" />
        <ChecklistItem text="Security event logging, secrets redacted (BR-170, BR-171)" />
        <ChecklistItem text="Least-privilege database roles (BR-172)" />
        <ChecklistItem text="Secrets never committed to source control (BR-173)" />
      </section>
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card" style={{ padding: '14px 18px' }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-dim)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '1.15rem', fontWeight: 700, margin: '4px 0' }}>{value}</div>
      <div style={{ fontSize: '0.76rem', color: 'var(--ink-dim)' }}>{sub}</div>
    </div>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.86rem' }}>
      <span aria-hidden style={{ color: 'var(--turf)' }}>
        ✓
      </span>
      {text}
    </span>
  );
}

function formatWindow(windowSeconds: number): string {
  if (windowSeconds % 3600 === 0) return `${windowSeconds / 3600} hr`;
  if (windowSeconds % 60 === 0) return `${windowSeconds / 60} min`;
  return `${windowSeconds} sec`;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 0)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
