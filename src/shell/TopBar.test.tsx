import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TopBar } from './TopBar';
import { ActiveLeagueProvider } from '../state/ActiveLeagueProvider';
import { ThemeProvider } from '../state/ThemeProvider';
import { AuthContext } from '../state/AuthContext';
import type { AuthContextValue } from '../state/AuthContext';

function renderTopBar(authOverrides: Partial<AuthContextValue> = {}) {
  const authValue: AuthContextValue = {
    user: { userId: 'u1', username: 'wkline', isSystemAdministrator: false },
    isAuthenticated: true,
    isRestoringSession: false,
    login: async () => {},
    logout: async () => {},
    ...authOverrides,
  };

  return render(
    <MemoryRouter initialEntries={['/leagues/the-gaffers-league/dashboard']}>
      <ThemeProvider>
        <AuthContext.Provider value={authValue}>
          <ActiveLeagueProvider>
            <TopBar />
          </ActiveLeagueProvider>
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('TopBar', () => {
  it('renders the primary nav items and the profile chip (UIR-001, UIR-003, UIR-011)', () => {
    renderTopBar();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lineup' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Squad' })).toBeInTheDocument();
    expect(screen.getByText('wkline')).toBeInTheDocument();
  });

  it('opens exactly one nav group at a time and closes on Escape (UIR-008)', async () => {
    const user = userEvent.setup();
    renderTopBar();

    await user.click(screen.getByRole('button', { name: /league/i }));
    expect(screen.getByRole('link', { name: 'Table' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /draft/i }));
    expect(screen.queryByRole('link', { name: 'Table' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Draft Board' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('link', { name: 'Draft Board' })).not.toBeInTheDocument();
  });

  it('hides the Platform nav section from a non-System-Administrator (UIR-006a)', async () => {
    const user = userEvent.setup();
    renderTopBar({ user: { userId: 'u1', username: 'wkline', isSystemAdministrator: false } });
    expect(screen.queryByRole('button', { name: /platform/i })).not.toBeInTheDocument();
    void user;
  });

  it('shows the Platform nav section to a System Administrator (UIR-006a)', async () => {
    renderTopBar({ user: { userId: 'u2', username: 'admin', isSystemAdministrator: true } });
    expect(screen.getByRole('button', { name: /platform/i })).toBeInTheDocument();
  });
});
