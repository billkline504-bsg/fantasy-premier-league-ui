// Single source of truth for navigation destinations, shared by the desktop nav groups
// (BRD UIR-003–006a) and the mobile off-canvas menu (UIR-012) so the two never drift apart —
// Architecture v1.1 §12.

export interface NavItem {
  label: string;
  /** Relative to /leagues/:leagueId, or absolute (starting with /) for league-independent routes. */
  path: string;
}

export interface NavGroupConfig {
  label: string;
  items: NavItem[];
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: 'dashboard' },
  { label: 'Lineup', path: 'lineup' },
  { label: 'Squad', path: 'squad' },
];

export const LEAGUE_NAV_GROUP: NavGroupConfig = {
  label: 'League',
  items: [
    { label: 'Table', path: 'table' },
    { label: 'Schedule', path: 'schedule' },
    { label: 'EPL', path: 'epl' },
    { label: 'Season Predictions', path: 'predictions' },
    { label: 'History', path: 'history' },
  ],
};

export const DRAFT_NAV_GROUP: NavGroupConfig = {
  label: 'Draft',
  items: [
    { label: 'Draft Board', path: 'draft' },
    { label: 'Makeup Picks & Timeouts', path: 'draft/makeup' },
  ],
};

// League-scoped, League Administrator only (BRD UIR-006, revised in v1.1).
export const ADMIN_NAV_GROUP: NavGroupConfig = {
  label: 'Admin',
  items: [
    { label: 'Audit Log', path: 'admin/audit' },
    { label: 'Score Corrections', path: 'admin/corrections' },
    { label: 'Settings', path: 'admin/settings' },
    { label: 'Invitations', path: 'admin/invitations' },
  ],
};

// Members (added v1.4, BRD UIR-208) is viewable by every member, not just the Administrator —
// it sits alongside Messages rather than inside ADMIN_NAV_GROUP for that reason (Architecture
// v1.4 §5.7).
export const TRAILING_NAV_ITEMS: NavItem[] = [
  { label: 'Messages', path: 'messages' },
  { label: 'Members', path: 'members' },
];

// League-independent, System Administrator only (BRD UIR-006a). Absolute paths — not nested
// under /leagues/:leagueId (Architecture §5.4).
export const PLATFORM_NAV_GROUP: NavGroupConfig = {
  label: 'Platform',
  items: [
    { label: 'Security', path: '/platform/security' },
    { label: 'Username Display Policy', path: '/platform/username-policy' },
  ],
};

export const PROFILE_NAV_ITEM: NavItem = { label: 'Profile', path: '/profile' };
