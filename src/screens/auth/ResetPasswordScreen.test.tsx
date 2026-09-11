import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResetPasswordScreen } from './ResetPasswordScreen';

// Exercises F-UI-001.7 (BRD UIR-185-186, confirm step).

function jsonResponse(body: unknown, status = 204) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderResetPasswordScreen(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordScreen />} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const STRONG_PASSWORD = 'Tr0ub4dor&Zebra!';

describe('ResetPasswordScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(outcome: 'success' | 'expired') {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        if (path === '/auth/password-reset/confirm' && init?.method === 'POST') {
          return outcome === 'success'
            ? jsonResponse(null, 204)
            : jsonResponse({ status: 400, detail: 'Reset token invalid or expired.' }, 400);
        }
        throw new Error(`Unhandled request: ${path}`);
      }),
    );
  }

  it('shows the reset form when a token is present in the URL, with no token to type by hand', () => {
    stubFetch('success');
    renderResetPasswordScreen('/reset-password?token=abc123');

    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    expect(screen.queryByLabelText(/token/i)).not.toBeInTheDocument();
  });

  it('shows a "no longer works" message with no token in the URL at all (UIR-186)', () => {
    stubFetch('success');
    renderResetPasswordScreen('/reset-password');

    expect(screen.getByText(/no longer works/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new reset link' })).toHaveAttribute('href', '/forgot-password');
  });

  it('shows a "no longer works" message when the backend rejects the token (UIR-186)', async () => {
    stubFetch('expired');
    const user = userEvent.setup();
    renderResetPasswordScreen('/reset-password?token=expired-token');

    await user.type(screen.getByLabelText('New password'), STRONG_PASSWORD);
    await user.type(screen.getByLabelText('Confirm new password'), STRONG_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Update Password' }));

    expect(await screen.findByText(/no longer works/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new reset link' })).toBeInTheDocument();
  });

  it('confirms success and links to Sign In', async () => {
    stubFetch('success');
    const user = userEvent.setup();
    renderResetPasswordScreen('/reset-password?token=valid-token');

    await user.type(screen.getByLabelText('New password'), STRONG_PASSWORD);
    await user.type(screen.getByLabelText('Confirm new password'), STRONG_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Update Password' }));

    expect(await screen.findByText('Password Updated')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });
});
