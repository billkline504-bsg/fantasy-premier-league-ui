import { useNavigate, useLocation } from 'react-router-dom';
import { useActiveLeague } from '../state/useActiveLeague';

// Implements BRD UIR-002: switching leagues re-scopes every league-specific screen without a
// full page reload. Rewrites the current URL's :leagueId segment in place so the user stays
// on "the same screen" (e.g., Table) for the newly selected league.
//
// Also implements BRD UIR-194 (F-UI-001.9): a "+ Create a League" option is always present,
// regardless of how many real Leagues are already in the dropdown, since creating an
// additional League never requires leaving any existing one.

const CREATE_LEAGUE_OPTION = '__create_league__';

export function LeagueSwitcher() {
  const { leagues, activeLeagueId, setActiveLeagueId } = useActiveLeague();
  const navigate = useNavigate();
  const location = useLocation();

  function handleChange(value: string) {
    if (value === CREATE_LEAGUE_OPTION) {
      navigate('/leagues/new');
      return;
    }
    setActiveLeagueId(value);
    const match = location.pathname.match(/^\/leagues\/[^/]+(\/.*)?$/);
    const rest = match?.[1] ?? '/dashboard';
    navigate(`/leagues/${value}${rest}`);
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
        <option value={CREATE_LEAGUE_OPTION}>+ Create a League</option>
      </select>
    </label>
  );
}
