import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';

// Exercises F-UI-001.7 (BRD UIR-183-184, request step).

function jsonResponse(body: unknown, status = 202) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderForgotPasswordScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ForgotPasswordScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch() {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        const path = decodeURIComponent(url.pathname.replace(/^\/api\/v1/, ''));
        if (path === '/auth/password-reset/request' && init?.method === 'POST') return jsonResponse(null, 202);
        throw new Error(`Unhandled request: ${path}`);
      }),
    );
  }

  it('shows the exact same confirmation message for a matching and a non-matching email (UIR-184)', async () => {
    stubFetch();
    const user = userEvent.setup();

    const { unmount } = renderForgotPasswordScreen();
    await user.type(screen.getByLabelText('Email'), 'exists@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    const matchMessage = await screen.findByText(/If that email matches an account/);
    const matchText = matchMessage.textContent;
    unmount();

    renderForgotPasswordScreen();
    const user2 = userEvent.setup();
    await user2.type(screen.getByLabelText('Email'), 'doesnotexist@example.com');
    await user2.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    const nonMatchMessage = await screen.findByText(/If that email matches an account/);

    expect(nonMatchMessage.textContent).toBe(matchText);
  });

  it('links back to Sign In', async () => {
    stubFetch();
    renderForgotPasswordScreen();

    expect(screen.getByRole('link', { name: 'Back to Sign In' })).toHaveAttribute('href', '/login');
  });
});
