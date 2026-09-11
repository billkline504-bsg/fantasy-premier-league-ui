# Matchday Manager Web Client
## Epic and Feature Backlog — Version 1.1

**Inputs:** Business Requirements Document v1.1 (`01-requirements/`); Architecture v1.0 (`02-architecture/`). **v1.1 additionally reads:** Business Requirements Document v1.4 (§8.17–8.20); Architecture v1.3 (§5.6, §7.1).

---

# 1. Purpose

Refines BRD v1.1's 17-screen inventory into a prioritized, dependency-ordered feature list, each feature citing the `UIR-###` range it implements and the shared components (from Architecture §9) it depends on. Follows the backend's own four-phase build sequence (BRD §11) so this client's build order lines up with when the corresponding backend capability actually becomes available to call.

Two cross-cutting features precede every phase: they aren't screens, but nothing in any phase is buildable without them.

# 2. Cross-Cutting Foundational Features (Phase 0)

| ID | Feature | Depends on | Cites |
|---|---|---|---|
| F-UI-000.1 | Application shell: top bar, primary nav, League/Draft/Admin nav groups, Platform nav section, league switcher, theme switch, profile chip, off-canvas mobile menu | Architecture §3, §5, §9, §12 | UIR-001–012, UIR-006a |
| F-UI-000.2 | API client foundation: generated types, typed fetch wrapper, auth-header injection, error normalization, token refresh flow. Originally paired with an interim login placeholder (pre-v1.1); that placeholder is superseded by the real F-UI-001.5–001.8 screens below — the underlying token/session mechanics this feature built were never placeholder and are unchanged. | Architecture §6, §7 | (enables every other feature) |
| F-UI-000.3 | Shared component library: PlayerTable, Tabs, CountdownClock, ExpandableRow, ResultPill/FixtureRow, RuleBanner, ActorCell, UndoableRecord, Skeleton/ErrorState/EmptyState | Architecture §9, §10 | UIR-013–034 |

Every feature below assumes F-UI-000.1–000.3 are complete.

# 3. Phase 1 — Foundation

Corresponds to the backend's Phase 1 (Identity & Auth, User Profile & FantasyTeam, League & Season Management, EPL/FPL Data).

| ID | Feature | Cites |
|---|---|---|
| F-UI-001.1 | Profile — User System Profile (username edit, default icon, default theme, private contact display) | UIR-157–161, UIR-169–171 |
| F-UI-001.2 | Profile — User Season League Profile (per-league icon override, per-league notification preferences, "How You'll Appear" preview) | UIR-162–168, UIR-172 |
| F-UI-001.3 | EPL — Table view (current + prior season tabs) | UIR-074–077, UIR-079 |
| F-UI-001.4 | EPL — Fixtures view (Matchweek tabs, completed/live/upcoming states) | UIR-078, UIR-080 |
| F-UI-001.5 | Login — sign-in form, generic invalid-credential message, already-authenticated skip, return-to-origin (added v1.1, BRD v1.4) | UIR-173–177 |
| F-UI-001.6 | Register — registration form, live password-strength feedback, inline username-availability feedback, immediate sign-in (added v1.1, BRD v1.4) | UIR-178–182 |
| F-UI-001.7 | Forgot / Reset Password — request form, always-identical confirmation, reset-confirmation form, expired-token handling (added v1.1, BRD v1.4) | UIR-183–186 |
| F-UI-001.8 | Accept League Invitation — auth-first detour preserving the token, no-preview confirmation, expired/used/revoked handling, post-acceptance redirect (added v1.1, BRD v1.4) | UIR-187–190 |

# 4. Phase 2 — Draft & Squad

Corresponds to the backend's Phase 2 (Initial Draft, Secondary & Replacement Draft).

| ID | Feature | Cites |
|---|---|---|
| F-UI-002.1 | Draft Board — order panel, on-clock timer, available-player pool, recent picks | UIR-099–108 |
| F-UI-002.2 | Draft Board — completion state | UIR-109 |
| F-UI-002.3 | Makeup Picks & Timeouts — progress tracker, queue visualization, chronological log, rationale panel | UIR-110–117 |
| F-UI-002.4 | Squad — summary strip, full table (filter/sort), acquisition-method legend, replacement-eligibility explanation | UIR-055–063 |

# 5. Phase 3 — Weekly Gameplay

Corresponds to the backend's Phase 3 (Gameweek Roster, Scoring Engine, H2H Competition, Standings & Tie-Breaks).

| ID | Feature | Cites |
|---|---|---|
| F-UI-003.1 | Dashboard — scorebug, stat tiles, next-fixture card, news feed, condensed standings | UIR-035–042 |
| F-UI-003.2 | Lineup — deadline banner, fixture strip, positional checklist, pitch view, captain selection, reserves panel, submit/reset | UIR-043–054 |
| F-UI-003.3 | League Table — full standings, tie-break/points legend | UIR-064–068 |
| F-UI-003.4 | Schedule & Results — Gameweek-tabbed fixture list | UIR-069–073 |
| F-UI-003.5 | Season Predictions — locked own prediction, progress stats, league predictions list (hidden-until-reveal), tie-break explanation | UIR-081–088 |

# 6. Phase 4 — Operations

Corresponds to the backend's Phase 4 (Corrections & Administration, Notifications, Reporting & History).

| ID | Feature | Cites |
|---|---|---|
| F-UI-004.1 | Messages — composer (administrator-gated), feed, retention disclosure | UIR-118–124 |
| F-UI-004.2 | Audit Log — filterable/sortable log, expandable before/after detail, system-vs-human actor distinction | UIR-125–134 |
| F-UI-004.3 | Score Corrections — precedence explanation, override form + live value-compare, active/undone override tables | UIR-135–144 |
| F-UI-004.4 | Security & Abuse Protection (Platform) | UIR-145–151 |
| F-UI-004.5 | Username Display Policy (Platform) | UIR-152–156 |
| F-UI-004.6 | History — season tabs, standings/draft/roster drill-downs, config snapshot, placeholder handling, retired-user identity handling | UIR-089–098 |

# 7. Recommended Build Sequence

1. **Phase 0** (F-UI-000.1–000.3) — nothing else is buildable first.
2. **Phase 1** — lowest interdependency; Profile and EPL have no dependency on draft/roster state existing yet, and validate the shell/nav/API-client foundation against real, simple data before tackling the more stateful screens.
3. **Phase 2** — Draft Board and Squad establish the player-pool/roster data shapes that Phase 3's Lineup and Dashboard then consume.
4. **Phase 3** — the weekly-gameplay core loop; depends on Phase 2's squad/draft data existing.
5. **Phase 4** — administrative and historical screens; several (Audit Log, Score Corrections) are naturally exercised only once Phase 3 data exists to correct, and History only once a season has completed.

# 8. Explicitly Out of Scope for This Backlog

Per BRD DEC-UI-007/DEC-UI-035: league-creation/administration-setup features (BRD §12 item 2) are not on this backlog. Authentication/registration/password-reset/invitation-acceptance (item 1) **is** now on this backlog as of v1.1 (F-UI-001.5–001.8) — league-creation/administration-setup will still need its own epic once its own BRD revision specifies it.

# 9. Version History

| Version | Date | Summary |
|---|---|---|
| v1.0 | 2026-09-11 | Initial creation, against BRD v1.1 and Architecture v1.0. Establishes `F-UI-###.#` numbering across a Phase 0 (foundational) plus four backend-aligned build phases, and a recommended build sequence. |
| v1.1 | 2026-09-11 | Adds F-UI-001.5–001.8 (Login, Register, Forgot/Reset Password, Accept League Invitation), against BRD v1.4's newly-designed §8.17–8.20 and Architecture v1.3's §5.6/§7.1. Updates F-UI-000.2's description to reflect that its interim login placeholder is now superseded by these real screens. Narrows §8's out-of-scope note to league-creation/administration-setup only. |
