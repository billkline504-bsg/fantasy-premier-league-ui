import { useNavigate, useLocation } from 'react-router-dom';
import { useActiveLeague } from '../state/useActiveLeague';

// Implements BRD UIR-002: switching leagues re-scopes every league-specific screen without a
// full page reload. Rewrites the current URL's :leagueId segment in place so the user stays
// on "the same screen" (e.g., Table) for the newly selected league.

export function LeagueSwitcher() {
  const { leagues, activeLeagueId, setActiveLeagueId } = useActiveLeague();
  const navigate = useNavigate();
  const location = useLocation();

  function handleChange(newLeagueId: string) {
    setActiveLeagueId(newLeagueId);
    const match = location.pathname.match(/^\/leagues\/[^/]+(\/.*)?$/);
    const rest = match?.[1] ?? '/dashboard';
    navigate(`/leagues/${newLeagueId}${rest}`);
  }

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="visually-hidden">Active league</span>
      <select value={activeLeagueId} onChange={(e) => handleChange(e.target.value)}>
        {leagues.map((league) => (
          <option key={league.leagueId} value={league.leagueId}>
            {league.name}
          </option>
        ))}
      </select>
    </label>
  );
}
