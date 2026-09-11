import { NavLink } from 'react-router-dom';
import type { NavGroupConfig } from './navConfig';

// Implements BRD UIR-004–006a (League/Draft/Admin/Platform dropdown groups), UIR-007
// (active-screen indication even while collapsed), and UIR-008 (aria-expanded, closes when
// another group opens or Escape is pressed — orchestrated by the parent nav, see PrimaryNav).

export interface NavGroupProps {
  group: NavGroupConfig;
  isOpen: boolean;
  onToggle: () => void;
  /** Resolves an item's relative path to its full href — league-scoped groups need the active leagueId prefixed. */
  resolveHref: (path: string) => string;
  hasActiveItem: boolean;
}

export function NavGroup({ group, isOpen, onToggle, resolveHref, hasActiveItem }: NavGroupProps) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        data-active={hasActiveItem || undefined}
      >
        {group.label} ▾
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: 'var(--surface)',
            border: '1px solid var(--line-strong)',
            borderRadius: 10,
            boxShadow: 'var(--shadow)',
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 210,
            zIndex: 30,
          }}
        >
          {group.items.map((item) => (
            <NavLink
              key={item.path}
              to={resolveHref(item.path)}
              style={{ textAlign: 'left', padding: '9px 12px' }}
              end
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
