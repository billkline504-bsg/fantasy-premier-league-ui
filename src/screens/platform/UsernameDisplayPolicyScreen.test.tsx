import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { UsernameDisplayPolicyScreen } from './UsernameDisplayPolicyScreen';

// Exercises F-UI-004.5 (BRD UIR-152-156). This screen is entirely static/illustrative content
// (API Consumption Specification, confirmed no dedicated endpoint exists) plus local toggle
// state — no fetch mock or provider is needed.

describe('UsernameDisplayPolicyScreen', () => {
  it('states this is a resolved platform setting, not an open decision, citing the UserId join key (UIR-152)', () => {
    render(<UsernameDisplayPolicyScreen />);

    expect(screen.getByText(/Resolved: historical records show the username active at the time of the event/)).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent!.includes('never the username, is what history actually joins on'))).toBeInTheDocument();
  });

  it('marks "Username at time of event" as Shipped and "Current username" as not shipped (UIR-153)', () => {
    render(<UsernameDisplayPolicyScreen />);

    const shippedOption = screen.getByRole('button', { name: /Username at time of event/ });
    expect(within(shippedOption).getByText('Shipped')).toBeInTheDocument();
    expect(shippedOption).toHaveAttribute('aria-pressed', 'true');

    const currentOption = screen.getByRole('button', { name: /Current username/ });
    expect(within(currentOption).queryByText('Shipped')).not.toBeInTheDocument();
    expect(currentOption).toHaveAttribute('aria-pressed', 'false');
  });

  it('updates all three example record types together when the toggle switches (UIR-154, UIR-030)', async () => {
    const user = userEvent.setup();
    render(<UsernameDisplayPolicyScreen />);

    expect(screen.getAllByText('kevin_corner')).toHaveLength(3);
    expect(screen.queryByText('cornerkick_kev', { selector: 'b.tabular' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Current username/ }));

    expect(screen.getAllByText('cornerkick_kev', { selector: 'b.tabular' })).toHaveLength(3);
    expect(screen.queryByText('kevin_corner')).not.toBeInTheDocument();
  });

  it("states the display choice never changes what's actually stored (UIR-155)", () => {
    render(<UsernameDisplayPolicyScreen />);

    expect(screen.getByText(/never changes what's actually stored/)).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent!.includes('stays the join key regardless'))).toBeInTheDocument();
  });

  it('shows a System Administrator badge (UIR-019)', () => {
    render(<UsernameDisplayPolicyScreen />);

    expect(screen.getByText('System Administrator only')).toBeInTheDocument();
  });
});
