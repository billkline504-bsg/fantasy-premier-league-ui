import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SecurityScreen } from './SecurityScreen';

// Exercises F-UI-004.4 (BRD UIR-145-151). This screen is deliberately league-independent
// (UIR-151), so no ActiveLeagueProvider is needed — only a QueryClientProvider, same as
// ProfileScreen's test setup for its own global-scope sections.

const RATE_LIMITS = [
  { endpointPattern: 'POST /api/v1/auth/login', windowSeconds: 900, maxRequests: 5 },
  { endpointPattern: 'POST /api/v1/auth/register', windowSeconds: 3600, maxRequests: 10 },
];

const SECURITY_EVENTS = {
  items: [
    {
      securityEventId: 'e1',
      eventType: 'RateLimitBlocked',
      endpoint: 'POST /api/v1/auth/login',
      scope: 'IP 203.0.113.44 + username davecoach',
      detail: '5th attempt blocked for 15 minutes',
      occurredAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    },
  ],
  nextCursor: null,
};

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function renderSecurityScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SecurityScreen />
    </QueryClientProvider>,
  );
}

describe('SecurityScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(csrfStatus: { cookieAuthenticationEnabled: boolean; csrfMiddlewareActive: boolean }) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));

        if (path === '/admin/security/rate-limits') return jsonResponse(RATE_LIMITS);
        if (path === '/admin/security/events') return jsonResponse(SECURITY_EVENTS);
        if (path === '/admin/security/csrf-status') return jsonResponse(csrfStatus);

        throw new Error(`Unhandled request: ${path}`);
      }),
    );
  }

  it('states this is a platform-level, System-Administrator-only screen (UIR-145)', async () => {
    stubFetch({ cookieAuthenticationEnabled: false, csrfMiddlewareActive: false });
    renderSecurityScreen();

    expect(await screen.findByText('System Administrator only')).toBeInTheDocument();
    expect(screen.getByText(/sits above every league/)).toBeInTheDocument();
  });

  it('shows the auth-posture tiles (UIR-146)', async () => {
    stubFetch({ cookieAuthenticationEnabled: false, csrfMiddlewareActive: false });
    renderSecurityScreen();

    expect(await screen.findByText('Bearer JWT')).toBeInTheDocument();
    const lifetimeTile = screen.getByText('Access Token Lifetime').closest('.card') as HTMLElement;
    expect(within(lifetimeTile).getByText('15 min')).toBeInTheDocument();
    expect(screen.getByText('Refresh token: 30 days')).toBeInTheDocument();
    expect(screen.getByText('Not in use')).toBeInTheDocument();
  });

  it('reflects an active cookie flow in the Cookie-Based Flows tile', async () => {
    stubFetch({ cookieAuthenticationEnabled: true, csrfMiddlewareActive: true });
    renderSecurityScreen();

    expect(await screen.findByText('In use')).toBeInTheDocument();
  });

  it('explains CSRF posture and reflects current vs. standby status from CsrfStatus (UIR-147)', async () => {
    stubFetch({ cookieAuthenticationEnabled: false, csrfMiddlewareActive: false });
    renderSecurityScreen();

    expect(await screen.findByText('Current API · Not Exposed')).toBeInTheDocument();
    expect(screen.getByText('Cookie-Flow Middleware · Implemented, Standing By')).toBeInTheDocument();
    expect(screen.getByText(/activate automatically for that flow/)).toBeInTheDocument();
  });

  it('flips to Exposed/Active when cookie auth and its CSRF middleware are both on', async () => {
    stubFetch({ cookieAuthenticationEnabled: true, csrfMiddlewareActive: true });
    renderSecurityScreen();

    expect(await screen.findByText('Current API · Exposed to CSRF')).toBeInTheDocument();
    expect(screen.getByText('Cookie-Flow Middleware · Active')).toBeInTheDocument();
  });

  it('lists every configured rate limit with endpoint/limit/window, marking scope/status as not exposed (UIR-148)', async () => {
    stubFetch({ cookieAuthenticationEnabled: false, csrfMiddlewareActive: false });
    renderSecurityScreen();

    const heading = await screen.findByText('Rate Limiting (BR-169)');
    const section = heading.closest('section')!;
    expect(within(section).getByText('POST /api/v1/auth/login')).toBeInTheDocument();
    expect(within(section).getByText('5 requests')).toBeInTheDocument();
    expect(within(section).getByText('15 min')).toBeInTheDocument();
    expect(within(section).getAllByText('Not exposed by this endpoint').length).toBeGreaterThan(0);
  });

  it('shows recent rate-limit events with endpoint, scope + detail, and a relative timestamp (UIR-149)', async () => {
    stubFetch({ cookieAuthenticationEnabled: false, csrfMiddlewareActive: false });
    renderSecurityScreen();

    expect(await screen.findByText('IP 203.0.113.44 + username davecoach', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/5th attempt blocked for 15 minutes/)).toBeInTheDocument();
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  it('renders the security checklist with governing BR citations (UIR-150)', async () => {
    stubFetch({ cookieAuthenticationEnabled: false, csrfMiddlewareActive: false });
    renderSecurityScreen();

    expect(await screen.findByText('HTTPS everywhere (BR-164)')).toBeInTheDocument();
    expect(screen.getByText('Server-side input validation (BR-165, BR-166)')).toBeInTheDocument();
    expect(screen.getByText('Parameterized queries & output encoding (BR-167)')).toBeInTheDocument();
    expect(screen.getByText('Security event logging, secrets redacted (BR-170, BR-171)')).toBeInTheDocument();
    expect(screen.getByText('Least-privilege database roles (BR-172)')).toBeInTheDocument();
    expect(screen.getByText('Secrets never committed to source control (BR-173)')).toBeInTheDocument();
  });
});
