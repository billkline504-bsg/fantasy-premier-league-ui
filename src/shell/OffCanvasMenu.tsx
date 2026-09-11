import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ADMIN_NAV_GROUP,
  DRAFT_NAV_GROUP,
  LEAGUE_NAV_GROUP,
  PLATFORM_NAV_GROUP,
  PRIMARY_NAV_ITEMS,
  PROFILE_NAV_ITEM,
  TRAILING_NAV_ITEMS,
  type NavGroupConfig,
} from './navConfig';
import { useActiveLeague } from '../state/useActiveLeague';
import { useAuth } from '../state/useAuth';

// Implements BRD UIR-012 / Architecture v1.1 §12 (DEC-UI-006): below the mobile breakpoint,
// an off-canvas menu replaces the desktop dropdown nav, with League/Draft/Admin/Platform as
// accordion sections (native <details>/<summary> — gets expand/collapse and keyboard support
// for free, rather than reimplementing it). Traps focus while open and returns it to the
// trigger on close (UIR-026).

export interface OffCanvasMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

function AccordionSection({ group, resolveHref }: { group: NavGroupConfig; resolveHref: (path: string) => string }) {
  return (
    <details>
      <summary>{group.label}</summary>
      <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 12 }}>
        {group.items.map((item) => (
          <NavLink key={item.path} to={resolveHref(item.path)} end>
            {item.label}
          </NavLink>
        ))}
      </div>
    </details>
  );
}

export function OffCanvasMenu({ isOpen, onClose, triggerRef }: OffCanvasMenuProps) {
  const { activeLeagueId } = useActiveLeague();
  const { user } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);

  function resolveLeagueHref(path: string) {
    return `/leagues/${activeLeagueId}/${path}`;
  }

  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab' || !focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
      <div
        aria-hidden
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          background: 'var(--surface)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          overflowY: 'auto',
        }}
      >
        <button type="button" onClick={onClose} aria-label="Close menu" style={{ alignSelf: 'flex-end' }}>
          ✕
        </button>
        {PRIMARY_NAV_ITEMS.map((item) => (
          <NavLink key={item.path} to={resolveLeagueHref(item.path)} end onClick={onClose}>
            {item.label}
          </NavLink>
        ))}
        <AccordionSection group={LEAGUE_NAV_GROUP} resolveHref={resolveLeagueHref} />
        <AccordionSection group={DRAFT_NAV_GROUP} resolveHref={resolveLeagueHref} />
        {TRAILING_NAV_ITEMS.map((item) => (
          <NavLink key={item.path} to={resolveLeagueHref(item.path)} end onClick={onClose}>
            {item.label}
          </NavLink>
        ))}
        {/* TODO: gate on real per-league admin status once available — see routes/guards.tsx */}
        <AccordionSection group={ADMIN_NAV_GROUP} resolveHref={resolveLeagueHref} />
        {user?.isSystemAdministrator && (
          <AccordionSection group={PLATFORM_NAV_GROUP} resolveHref={(path) => path} />
        )}
        <NavLink to={PROFILE_NAV_ITEM.path} onClick={onClose}>
          {PROFILE_NAV_ITEM.label}
        </NavLink>
      </div>
    </div>
  );
}
