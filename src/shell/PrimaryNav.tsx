import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ADMIN_NAV_GROUP,
  DRAFT_NAV_GROUP,
  LEAGUE_NAV_GROUP,
  PLATFORM_NAV_GROUP,
  PRIMARY_NAV_ITEMS,
  TRAILING_NAV_ITEMS,
  type NavGroupConfig,
} from './navConfig';
import { NavGroup } from './NavGroup';
import { useActiveLeague } from '../state/useActiveLeague';
import { useAuth } from '../state/useAuth';

// Implements BRD UIR-001–008. Desktop primary navigation; see OffCanvasMenu for the
// mobile equivalent (UIR-012), which reads the same navConfig so the two never diverge.

export function PrimaryNav() {
  const { activeLeagueId } = useActiveLeague();
  const { user } = useAuth();
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // UIR-008: close whichever group is open on outside click or Escape.
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenGroup(null);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function resolveLeagueHref(path: string) {
    return `/leagues/${activeLeagueId}/${path}`;
  }

  function hasActiveItem(group: NavGroupConfig, resolveHref: (path: string) => string) {
    return group.items.some((item) => location.pathname.startsWith(resolveHref(item.path)));
  }

  // TODO (see routes/guards.tsx RequireLeagueAdministrator): real per-league admin status
  // isn't wired up yet, so the Admin group renders for everyone until that lands.
  const isLeagueAdministrator = true;
  const isSystemAdministrator = Boolean(user?.isSystemAdministrator);

  return (
    <nav ref={navRef} aria-label="Primary" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {PRIMARY_NAV_ITEMS.map((item) => (
        <NavLink key={item.path} to={resolveLeagueHref(item.path)} end>
          {item.label}
        </NavLink>
      ))}

      <NavGroup
        group={LEAGUE_NAV_GROUP}
        isOpen={openGroup === 'league'}
        onToggle={() => setOpenGroup((g) => (g === 'league' ? null : 'league'))}
        resolveHref={resolveLeagueHref}
        hasActiveItem={hasActiveItem(LEAGUE_NAV_GROUP, resolveLeagueHref)}
      />
      <NavGroup
        group={DRAFT_NAV_GROUP}
        isOpen={openGroup === 'draft'}
        onToggle={() => setOpenGroup((g) => (g === 'draft' ? null : 'draft'))}
        resolveHref={resolveLeagueHref}
        hasActiveItem={hasActiveItem(DRAFT_NAV_GROUP, resolveLeagueHref)}
      />

      {TRAILING_NAV_ITEMS.map((item) => (
        <NavLink key={item.path} to={resolveLeagueHref(item.path)} end>
          {item.label}
        </NavLink>
      ))}

      {isLeagueAdministrator && (
        <NavGroup
          group={ADMIN_NAV_GROUP}
          isOpen={openGroup === 'admin'}
          onToggle={() => setOpenGroup((g) => (g === 'admin' ? null : 'admin'))}
          resolveHref={resolveLeagueHref}
          hasActiveItem={hasActiveItem(ADMIN_NAV_GROUP, resolveLeagueHref)}
        />
      )}

      {isSystemAdministrator && (
        <NavGroup
          group={PLATFORM_NAV_GROUP}
          isOpen={openGroup === 'platform'}
          onToggle={() => setOpenGroup((g) => (g === 'platform' ? null : 'platform'))}
          resolveHref={(path) => path}
          hasActiveItem={hasActiveItem(PLATFORM_NAV_GROUP, (path) => path)}
        />
      )}
    </nav>
  );
}
