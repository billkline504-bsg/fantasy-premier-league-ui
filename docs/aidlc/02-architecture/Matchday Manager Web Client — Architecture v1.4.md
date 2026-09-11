# Matchday Manager Web Client
## Architecture — Version 1.4

**Inputs:** Business Requirements Document v1.1 (`01-requirements/`); Backend Architecture and Domain Model v1.15 and OpenAPI Specification v1.0 (`fantasy-premier-league` repository); `API_ENDPOINTS.md` (71 endpoints across 23 controllers, confirmed against `src/EplFantasy.Api/Controllers/`); API Consumption Specification v1.0 (`05-api-specification/`), whose reconciliation against the actual OpenAPI spec is what drove this revision.

---

# 1. Purpose

This document makes the technology and structural decisions the BRD deliberately deferred (§2.2's non-goals): the frontend stack, application structure, state management approach, API integration layer, navigation implementation, and the cross-cutting architectural patterns (loading/error/empty states, pagination, live data) needed to satisfy every `UIR-###` in BRD v1.1. It also formally resolves the two remaining architecture-level open items from BRD §12 that weren't nav-placement questions: the live-data mechanism (item 7) and a baseline pattern for loading/error/empty states (item 5).

Scope matches the BRD: the 17 mock-up screens, role-gated per §10 of the BRD. Authentication/onboarding/league-creation screens remain out of scope (BRD DEC-UI-007), but §7 of this document still has to decide how the client obtains and holds a session token, because every in-scope screen requires one.

# 2. Technology Stack

| Concern | Choice | Rationale |
|---|---|---|
| UI framework | **React 18** | Widest ecosystem for the data-table/filter/sort/live-clock-heavy UI the BRD describes (UIR-015, UIR-016, UIR-021); large pool of existing, well-tested components for tables, tabs, and virtualization if list sizes grow. |
| Language | **TypeScript** | The backend's OpenAPI spec (v1.0) can generate request/response types directly into this client (§6), giving compile-time traceability back to the same contract the backend tests against. |
| Build tool | **Vite** | Fast dev server and HMR for a UI this component-heavy; standard, low-config production build to static assets. |
| Routing | **React Router v6** | Nested routes map directly onto the nav structure (top-level screens, League/Draft/Admin groups, the new Platform section) and support the league-scoped URL pattern in §5. |
| Server-state / data fetching | **TanStack Query (React Query) v5** | Owns caching, refetching, and the polling behavior §8 requires for live data, without hand-rolled state machines per screen. Distinguishes "server state" (everything from the API) from "client state" (§4) as two different concerns with two different tools, rather than forcing one state manager to do both. |
| Client/UI state | **React Context + `useReducer`** for the small, genuinely global set (active league/season, theme, auth session, off-canvas menu open/closed) | This state is small in surface area (a handful of values) and changes infrequently; a dedicated library (Redux/Zustand/Jotai) would be more machinery than the actual state graph justifies. If cross-cutting client state grows materially past what's listed in §4, revisit. |
| Styling | **CSS custom properties (design tokens) carried over from the mock-up, plus CSS Modules per component** | The mock-up's `:root` token set (colors, spacing rhythm implied by its component classes) already satisfies BRD UIR-010 (theme switching) and is a proven starting point; CSS Modules keep component styles scoped without introducing a CSS-in-JS runtime cost for a table/list-heavy UI. |
| API client generation | **`openapi-typescript` + a thin typed fetch wrapper** (see §6) | Generates request/response/param types directly from the backend's OpenAPI v1.0 YAML, so a backend contract change surfaces as a TypeScript compile error in this client rather than a runtime surprise. |
| Testing | Component tests via **Vitest + React Testing Library**; end-to-end via **Playwright** | Deferred in detail to a later `07-testing-strategy` pass (repurposed per the README), but the tool choices are recorded now since they affect how components in §4 should be structured (testable in isolation, not deeply coupled to router/query context). |

# 3. High-Level Application Structure

```
src/
  app/                  — root App component, router setup, top-level providers (Query, Auth, ActiveLeague, Theme)
  shell/                — TopBar, LeagueSwitcher, PrimaryNav, NavGroup, PlatformNav, OffCanvasMenu, ThemeSwitch, ProfileChip
  screens/
    dashboard/
    lineup/
    squad/
    league/             — table, schedule, epl, predictions, history (share the "League" nav group's data scope)
    draft/              — draft-board, makeup-and-timeouts
    messages/
    admin/              — audit-log, score-corrections (league-scoped)
    platform/           — security, username-display-policy (system-administrator, league-independent)
    profile/
  components/           — shared, screen-agnostic components (see §9): PlayerTable, Tabs, CountdownClock, StatTile,
                           ResultPill, RuleBanner, IconPicker, Toggle, ExpandableRow, EmptyState, ErrorState, Skeleton
  api/                   — generated OpenAPI types + the typed client wrapper (§6), one query-hook module per backend
                           controller area (useLeagues, useFantasyTeams, useDrafts, useRoster, useScoring, useCompetition,
                           useEplReferenceData, usePlatformAdmin)
  state/                 — AuthContext, ActiveLeagueContext, ThemeContext, and their reducers (§4)
  routes/                — route table (§5)
```

Each screen module owns its own presentational components and composes shared components from `components/`; a screen module never reaches into another screen module's internals. Cross-screen reuse only happens through `components/` or `api/`.

# 4. State Management

Three distinct kinds of state, deliberately kept in three different places:

## 4.1 Server state (TanStack Query)
Everything that ultimately comes from the API: leagues, seasons, fantasy teams, squads, rosters, scores, standings, schedule, drafts, messages, audit log, EPL reference data, security/rate-limit data. Query keys are structured hierarchically by resource path (e.g., `['leagues', leagueId, 'seasons', seasonId, 'standings']`) so invalidation after a mutation (e.g., submitting a roster invalidates that gameweek's roster and score queries) is precise rather than a blunt full-cache clear.

## 4.2 Global client state (Context + reducer)
- **Auth session** — access token, refresh token metadata, decoded role claims (FantasyTeam Manager / League Administrator / System Administrator), and derived per-league administrator status. See §7.
- **Active league/season** — the league switcher's current selection (UIR-002), persisted to `localStorage` so a returning user lands back where they left off, and read by every league-scoped query hook so switching leagues re-scopes data (BRD UIR-002, UIR-059, UIR-088, UIR-107, UIR-124, UIR-134, UIR-144) without each screen re-implementing that logic.
- **Theme** — system/light/dark (UIR-010), persisted to `localStorage`, exposed to both the top-bar switch and the Profile screen's duplicate control (UIR-161) as two views of one value.
- **Off-canvas menu open/closed** — mobile nav state (UIR-012), UI-only, not persisted.

## 4.3 Local component state (`useState`/`useReducer` inside a component)
Everything scoped to one screen or one widget and never needed elsewhere: player-pool filter/search/sort state (UIR-015, UIR-016), audit-log filter state (UIR-021), which drill-down tab is active on History (UIR-090), form input values before submission (Score Corrections' override form, Profile's username field), expanded/collapsed state of an individual audit row (UIR-020).

# 5. Routing & Navigation

## 5.1 Route table

```
/                                              → redirect to /leagues/:activeLeagueId/dashboard
/leagues/:leagueId/dashboard                   → Dashboard
/leagues/:leagueId/lineup                      → Lineup
/leagues/:leagueId/squad                       → Squad
/leagues/:leagueId/table                       → League Table
/leagues/:leagueId/schedule                    → Schedule & Results
/leagues/:leagueId/epl                         → EPL (not actually league-scoped in content — see 5.3)
/leagues/:leagueId/predictions                 → Season Predictions
/leagues/:leagueId/history                     → History
/leagues/:leagueId/draft                       → Draft Board
/leagues/:leagueId/draft/makeup                → Makeup Picks & Timeouts
/leagues/:leagueId/messages                    → Messages
/leagues/:leagueId/admin/audit                 → Audit Log            (League Administrator only)
/leagues/:leagueId/admin/corrections            → Score Corrections    (League Administrator only)
/leagues/:leagueId/admin/settings               → League Settings      (League Administrator only, §5.7)
/leagues/:leagueId/admin/invitations            → Invitations          (League Administrator only, §5.7)
/leagues/:leagueId/members                      → League Members       (every member, §5.7)
/platform/security                             → Security & Abuse Protection  (System Administrator only)
/platform/username-policy                      → Username Display Policy      (System Administrator only)
/profile                                       → Profile
/login                                         → Login                        (Anonymous Visitor only, §5.6)
/register                                      → Register                     (Anonymous Visitor only, §5.6)
/forgot-password                               → Forgot Password (request step)   (Anonymous Visitor only, §5.6)
/reset-password                                → Reset Password (confirm step, reads ?token= from the emailed link)  (Anonymous Visitor only, §5.6)
/invite/:token                                 → Accept League Invitation     (Anonymous Visitor or authenticated, §5.6)
/leagues/new                                   → League Creation      (any authenticated user, no league context, §5.7)
/no-leagues                                     → No Leagues (existing, an authenticated user with zero League memberships)
/no-access                                     → No Access (existing, previously undocumented in this table)
```

## 5.2 Route guarding
A route-level guard reads the auth-session context (§4.2) and:
- Redirects to a "no access" state (not a silent 404) if a `/leagues/:leagueId/admin/*` route is hit by a user who isn't that league's Administrator.
- Redirects similarly for `/platform/*` if the user isn't a System Administrator — this is a route-level guard, not merely a hidden nav entry, because BRD UIR-006a requires these screens be unreachable to the wrong role, not just unlinked.
- Redirects `/leagues/:leagueId/*` entirely if the user isn't a member of `leagueId` (defense in depth — the backend's own `ActiveLeagueMember` policy is authoritative, but the client shouldn't render a screen it knows will 403).
- **(v1.3)** Redirects `/login`, `/register`, `/forgot-password`, and `/reset-password` to the destination in §5.6 if the visitor already holds a valid session (BRD UIR-176) — the inverse of every guard above, since these four routes are for an Anonymous Visitor only.

## 5.3 The EPL screen's URL still carries a `leagueId`
BRD UIR-074 requires EPL's *content* be identical regardless of active league. It still lives under `/leagues/:leagueId/epl` (rather than a bare `/epl`) purely so the top bar's league-scoped nav groups and the league switcher stay visually consistent while the user is on it — switching leagues while on EPL updates the URL's `:leagueId` segment but must not change anything EPL renders. Deep-linking is unaffected either way.

## 5.4 Platform section is not nested under `/leagues/:leagueId`
Per BRD UIR-006a/UIR-151, `/platform/*` routes carry no league segment at all and must render with no active league selected — satisfying "reachable with no league context" at the routing layer, not just visually in the nav.

## 5.5 Deep links (BRD UIR-009)
Cross-screen links (Dashboard → full Table, Lineup → EPL, Lineup → Squad) are implemented as ordinary router links carrying the current `:leagueId`, not client-only view-swaps — this also gives every such destination a real, shareable/bookmarkable URL, which the mock-up's single-page `data-screen` switching did not.

## 5.6 Auth/onboarding routing (added in v1.3, implements BRD §8.17–8.20)

**Return-to-origin (BRD UIR-177).** `RequireAuth` (§5.2) redirects an unauthenticated visitor to `/login` carrying `state: { from: location }` (React Router's own mechanism for this, not a custom query param) rather than a bare redirect. On successful login, the callback reads `location.state?.from` and navigates there if present; otherwise it falls back to the most-recently-active league's Dashboard, or the "no leagues yet" empty state if the session's `GET /users/me`-adjacent league list (`listMemberships` equivalent) is empty (BRD UIR-177's second sentence).

**Already-authenticated skip (BRD UIR-176).** The same four routes wrap in a new `RequireAnonymous` guard (the mirror image of `RequireAuth`) that redirects to the same destination-resolution logic above if a valid session already exists, rather than rendering the form.

**Invitation-token preservation across the auth detour (BRD UIR-187).** `/invite/:token` itself requires no guard — it renders unconditionally and branches internally on `isAuthenticated`:
- If authenticated, it calls `acceptInvitation` immediately and routes to the result (§7's `useAcceptInvitation` hook, BRD UIR-190).
- If not, it renders two links to `/register`/`/login`, each carrying `state: { from: '/invite/:token' }` — the *same* current URL, token included, reusing the return-to-origin mechanism above rather than inventing a second, parallel storage-based one. The token never needs a separate persistence mechanism (no `sessionStorage`, no query param duplication): it's already sitting in `/invite/:token`'s own URL, and returning to that exact URL after a successful Register/Login is all "preserving the invitation" requires. On that return visit `isAuthenticated` is now `true`, and the branch above fires.

## 5.7 League-administration routing (added in v1.4, implements BRD §8.21–8.24)

**League Creation (`/leagues/new`) carries no `:leagueId` segment and sits outside the AppShell-wrapped route group**, the same treatment `/no-leagues` already gets — creating a League is definitionally not scoped to a League that exists yet, and rendering the shell (top bar, league switcher, nav) for a user who may have zero Leagues would show controls with nothing real to act on. Guarded only by `RequireAuth` — reachable by any authenticated user regardless of how many Leagues they already belong to (BRD UIR-194).

**League Settings and Invitations wrap in `RequireLeagueAdministrator`**, the same guard Audit Log/Score Corrections already use — access denial happens at the route level, not just by hiding the nav entry (consistent with §5.2's existing rationale for that guard).

**League Members does not wrap in `RequireLeagueAdministrator`** — `listMemberships` is available to any active member (BRD UIR-208), so the route itself is reachable by anyone `RequireAuth` already lets through; the Remove action's admin-only restriction (BRD UIR-209) is enforced by conditionally rendering that control inside the screen (the same pattern Messages' composer already establishes for an admin-gated *action* on an otherwise open screen), not by gating the whole route.

**Nav placement** (`src/shell/navConfig.ts`): "Settings" and "Invitations" join `ADMIN_NAV_GROUP` alongside Audit Log/Score Corrections. "Members" joins `TRAILING_NAV_ITEMS` alongside Messages, for the same reason Messages sits there rather than inside a role-gated group — it's meant to be reachable by everyone. League Creation has no nav-group entry at all (it isn't a "current League" screen to navigate to); it's reached from `NoLeaguesScreen` (a direct link) and from `LeagueSwitcher` (a new "+ Create a League" option, always present regardless of how many Leagues are already in the dropdown).

# 6. API Client Layer

## 6.1 Codegen
`openapi-typescript` runs against the backend's OpenAPI v1.0 YAML (`fantasy-premier-league/docs/aidlc/05-api-specification/`) as a build step, producing request/response/parameter types for all 71 endpoints. This client's `package.json` pins a copy (or a versioned artifact) of that YAML rather than fetching it live at build time, so a backend contract change is a deliberate, reviewed update to this client, not a silent drift.

## 6.2 Thin fetch wrapper
A single `apiClient` module wraps `fetch`, and is the only place that:
- Attaches the `Authorization: Bearer <accessToken>` header (§7).
- Normalizes every error response into the backend's `ProblemDetails` shape (`errorCode`, `correlationId`) so every screen's error-state component (§10) can render a consistent message and, where useful, surface the `correlationId` for support.
- Detects a `401` and triggers the refresh flow (§7.3) once per request before surfacing the error, so an expired access token doesn't surface as a user-visible failure during ordinary use.

## 6.3 Query-hook modules
One hook module per backend controller grouping (Identity & User, League & Season, Fantasy Team, Draft Management, Roster Management, Scoring, Competition, Player & EPL Reference Data, System Administration — matching `API_ENDPOINTS.md`'s own section headings), each exposing typed TanStack Query hooks (`useStandings(leagueId, seasonId)`, `useDraftState(draftId)`, etc.) and typed mutation hooks (`useSubmitRoster()`, `useDraftPick()`, `useApplyScoreOverride()`) rather than screens calling `apiClient` directly. This is what makes query-key invalidation (§4.1) consistent and keeps screens free of fetch/error-handling boilerplate.

## 6.4 Endpoint-to-screen mapping (representative, not exhaustive)

| Screen | Primary endpoints |
|---|---|
| Dashboard | `GET /leagues/{id}/seasons/{id}/standings`, `GET /leagues/{id}/seasons/{id}/schedule`, `GET /leagues/{id}/messages` |
| Lineup | `GET`/`PUT /fantasy-teams/{id}/gameweeks/{id}/roster`, `PUT .../roster/captain`, `GET /epl/gameweeks/{id}/fixtures` |
| Squad | `GET /leagues/{id}/seasons/{id}/fantasy-teams/{id}/squad`, `GET .../replacement-opportunities` |
| Table | `GET /leagues/{id}/seasons/{id}/standings` |
| Schedule | `GET /leagues/{id}/seasons/{id}/schedule`, `GET /leagues/{id}/seasons/{id}/matches/{id}` |
| EPL | `GET /epl/seasons/{id}/table`, `GET /epl/gameweeks`, `GET /epl/gameweeks/{id}/fixtures` |
| Season Predictions | `GET`/`PUT /fantasy-teams/{id}/season-goal-prediction` |
| History | `GET /leagues/{id}/seasons?status=completed`, `GET .../standings` (as-of), `GET .../drafts` + `/selections`, `GET .../roster` (historical gameweek), `GET .../configuration` (season-level) |
| Draft Board | `GET /drafts/{id}`, `POST /drafts/{id}/picks`, `GET /drafts/{id}/player-pool`, `GET /drafts/{id}/selections` |
| Makeup Picks & Timeouts | `GET /drafts/{id}` (turn/timer/makeup-queue state), `POST /drafts/{id}/timer/extend` |
| Messages | `GET`/`POST /leagues/{id}/messages` |
| Audit Log | `GET /leagues/{id}/audit` *(paginated)* |
| Score Corrections | `POST /admin/score-overrides`, `POST /admin/score-overrides/{id}/undo` |
| Security | `GET /admin/security/rate-limits`, `GET /admin/security/events` *(paginated)*, `GET /admin/security/csrf-status` |
| Username Display Policy | No dedicated endpoint — this screen is informational/illustrative per BRD UIR-152–155; it renders static explanatory content plus a client-only comparison toggle, not live data. |
| Profile | `GET`/`PUT /users/me`, `PUT /users/me/icon`, `GET /profile-icons`, `PUT`/`DELETE /leagues/{id}/memberships/{id}/icon`, `GET`/`PUT .../notification-preferences` |
| Login (v1.3) | `POST /auth/login` |
| Register (v1.3) | `POST /auth/register` |
| Forgot / Reset Password (v1.3) | `POST /auth/password-reset/request`, `POST /auth/password-reset/confirm` |
| Accept League Invitation (v1.3) | `POST /invitations/{token}/accept` |
| League Creation (v1.4) | `POST /leagues`, `POST /leagues/{id}/seasons` |
| League Settings (v1.4) | `GET`/`PUT /leagues/{id}`, `GET`/`PUT /leagues/{id}/configuration`, `GET`/`PUT /leagues/{id}/seasons/{id}/configuration` |
| Invitations (v1.4) | `POST`/`GET /leagues/{id}/invitations`, `DELETE /leagues/{id}/invitations/{id}` |
| League Members (v1.4) | `GET /leagues/{id}/memberships`, `POST /leagues/{id}/memberships/{id}/leave` |

# 6.5 Idempotency & Optimistic Concurrency (added in v1.1)

Reading the backend's actual OpenAPI spec (`05-api-specification`'s API Consumption Specification v1.0, §2.1 and §5) surfaced a requirement this version's original §6 did not account for: two mutations carry contract-level headers beyond the bearer token.

- **`makeDraftPick`** requires an `Idempotency-Key` header — a client-generated UUID — so that a network-level retry of the same user action (the same click) cannot be recorded as a second pick. The draft-pick mutation hook (§6.3) must generate this UUID once per user-initiated pick attempt (not once per HTTP retry) and reuse it across the fetch wrapper's own internal retries for that same attempt.
- **`submitGameweekRoster`** requires both an `Idempotency-Key` (same pattern) and an `If-Match` header carrying the `ETag` value the preceding `getGameweekRoster` call returned in its response headers. This is optimistic concurrency: if the roster changed server-side since the client's last read (e.g., a League Administrator correction landed in between), the `PUT` fails with `409` rather than silently overwriting it. The Lineup screen's roster query hook must retain the `ETag` alongside the cached roster data (not discard it as "just a header"), and the submit mutation must read it from there — a second `409` cause on this same endpoint (`season_goal_prediction_required`) must be distinguished by `errorCode`, not treated as the same conflict.
- **`setCaptain`** deliberately carries neither header — it's a narrower, single-field mutation with its own simpler failure mode (`409` only if the roster is already locked). Do not generalize the roster-submission pattern onto it.

No other mutation in the current API surface (`correctRoster`, `createScoreOverride`, `undoScoreOverride`, `extendDraftTimer`, message/icon/notification-preference writes) carries either header. This is a property of *this specific pair* of endpoints, not a blanket client-side policy to apply everywhere "to be safe" — adding unrequested idempotency keys or If-Match headers to endpoints that don't ask for them would just be dead weight the backend ignores.

# 7. Authentication & Session Handling

**v1.3 note**: §7.1 originally assumed a placeholder login form pending a future BRD pass; BRD v1.4 has now designed Login, Register, Forgot/Reset Password, and Accept League Invitation in full (§8.17–8.20). §7.1 below is rewritten accordingly — the token/session mechanics in §7.2–7.4 were already real (not placeholder) and are unchanged; only the screen this section pointed at has moved from "assumed" to "designed."

## 7.1 Screens (implements BRD §8.17–8.20)
Four screens now sit in front of the router (§5.6), replacing the single unstyled placeholder: Login (`POST /auth/login`), Register (`POST /auth/register`), Forgot/Reset Password (`POST /auth/password-reset/request` then `POST /auth/password-reset/confirm`), and Accept League Invitation (`POST /invitations/{token}/accept`, reached only via `/invite/:token`). Each is a real, styled screen using this client's already-established form/card conventions (Profile's inline-error-without-losing-input pattern, `LoadingState`/`ErrorState`/`EmptyState`) — there being no mock-up to match visually here (BRD §8.17's own note), matching this client's *existing* conventions is the closest thing to a design source available. Register's password field and Reset Password's new-password field both use a shared `PasswordStrengthMeter` component (BRD UIR-179) — one component, not two ad hoc implementations, since both need identical strength-estimation feedback framed against the same twelve-character-minimum, composition-rule-free policy (`BR-285`).

## 7.2 Token storage
- **Access token**: held in memory only (React Context), never written to `localStorage`/`sessionStorage`. It's short-lived (15 minutes, per the backend's Security screen data, BRD UIR-146) so the exposure window from an XSS-style leak is bounded, and keeping it out of storage avoids it surviving in a way a script could read after the fact.
- **Refresh token**: the backend's `/auth/refresh` endpoint is bearer-based, not cookie-based (BRD UIR-146/UIR-147 — "Cookie-Based Flows: Not in use"), so there is no `httpOnly` cookie option available today. This architecture stores the refresh token in `localStorage` as the only available option given the backend's current auth model, while flagging this as the weaker half of the design: an XSS vulnerability could exfiltrate it. **This should be revisited if/when the backend's already-implemented-but-standing-by cookie-flow middleware (BRD UIR-147) is activated**, at which point the refresh token should move to an `httpOnly` cookie the client never touches directly.

## 7.3 Refresh flow
On a `401` from any request (§6.2) or proactively ~60 seconds before the access token's known expiry, the client calls `/auth/refresh` once, rotates both tokens per the backend's contract, and retries the original request. A second consecutive `401` after a refresh attempt is treated as a genuine session expiry and routes the user to `/login` (§7.1, §5.6), clearing both tokens — carrying `state: { from: <current location> }` the same as any other unauthenticated redirect (BRD UIR-177), so a session that expires mid-use returns the user to what they were doing after they sign back in, not just to the Dashboard.

## 7.4 Role/permission derivation
The decoded JWT (or a dedicated `GET /users/me` call, whichever the backend's token actually carries — to be confirmed against the Architecture v1.15 token-claims design) yields: the user's global identity, and per-league Administrator status. System Administrator status gates `/platform/*` (§5.2) and must come from a claim/flag that is not forgeable by adjusting client-side state — the client treats it as informational only; the backend's own `SystemAdministrator` policy (confirmed in `API_ENDPOINTS.md`'s System Administration section) remains the actual authority.

# 8. Real-Time / Live Data Strategy

No WebSocket/SSE endpoint exists in the backend's current 71-endpoint surface (`API_ENDPOINTS.md`), so this version uses **polling via TanStack Query's `refetchInterval`**, tuned per screen by how quickly staleness would actually mislead a user:

| Data | Interval | Rationale |
|---|---|---|
| Draft turn/timer state (Draft Board, Makeup Picks) | 3–5 seconds while the draft is active | Turn-based and time-boxed (5-minute pick clocks, BRD UIR-013/UIR-101) — a stale "on the clock" indicator is actively confusing, not just slightly late. |
| Live EPL fixtures (EPL screen, and any Gameweek's live match context surfaced on Lineup/Dashboard) | 30–60 seconds while any fixture in the current view is live | Matches football's own pace of change; sub-30s gains little. |
| Standings, schedule, squad, messages, audit log, security events | On navigation/focus-refetch only (TanStack Query's default `staleTime`/`refetchOnWindowFocus`), no fixed interval | These change on human/administrative action, not continuously — polling them on a timer would be waste for no perceptible benefit. |
| Countdown clocks (roster lock, draft pick timer) | Client-side `setInterval` ticking a locally-held target timestamp (per BRD UIR-013), independent of the data-refetch interval above | The clock only needs the *target* timestamp from the server (fetched at the cadence above); the second-by-second tick is pure client-side arithmetic, matching the mock-up's own approach. |

If a future version needs sub-second draft-turn accuracy across many simultaneous viewers, revisit with a push mechanism (SSE is the lighter-weight fit given the backend is already bearer-token/HTTP, not a natural WebSocket candidate) — but that is explicitly not needed for this version and would be premature to build now.

# 9. Component & Design System Approach

The BRD's cross-cutting requirements (§7 of the BRD) each name a recurring pattern; this architecture turns each into exactly one shared component, so no screen re-implements it:

| BRD requirement | Shared component |
|---|---|
| UIR-013 | `<CountdownClock target={...} format="hms" \| "ms" />` |
| UIR-015, UIR-016 | `<PlayerTable columns={...} rows={...} />` (position filter + search + sortable columns built in once) |
| UIR-020 | `<ExpandableRow summary={...} detail={...} />` |
| UIR-022, UIR-023 | `<Tabs items={...} disabledReason={(item) => ...} />` |
| UIR-024 | `<ResultPill outcome="win" \| "loss" \| "draw" \| "live" />`, `<FixtureRow ... />` |
| UIR-029 | `<RuleBanner icon={...}>...</RuleBanner>` |
| UIR-030 | a `useLivePreview`-style pattern: form/control state lifted so a preview component re-renders from the same state, not a separate component per screen |
| UIR-031 | `<HiddenUntil condition={...} reason="..." />` |
| UIR-032 | `<ActorCell actor={systemActor \| humanActor} />` |
| UIR-033 | `<UndoableRecord onUndo={...} />` list pattern (Active/Recently-Undone list pair) |
| Loading/error/empty (§10 below) | `<Skeleton />`, `<ErrorState correlationId={...} onRetry={...} />`, `<EmptyState message={...} />` |

Design tokens (colors, the dark/light palette, spacing) are carried over as CSS custom properties from the mock-up's `:root`/`[data-theme]` definitions, reviewed for WCAG contrast (BRD §9 flags this as unverified, not assumed-fine) before being finalized as this project's own token set rather than a direct copy-paste.

# 10. Loading, Error & Empty States (resolves BRD §12 item 5, partially)

Every screen composes its data-dependent regions from three states, using the shared components in §9:
1. **Loading** — a skeleton matching the shape of the eventual content (not a generic spinner), shown for TanStack Query's `isPending`.
2. **Error** — `<ErrorState>` rendering the normalized `ProblemDetails` message (§6.2) plus a retry action, and the `correlationId` visible (e.g., in a "details" disclosure) for support/bug-report purposes.
3. **Empty** — `<EmptyState>` for a successful response with zero rows (an empty Messages feed, a league with no audit history yet, a Draft Board pool fully drafted), distinct from the error state and never conflated with it.

The screen-specific *copy* for each empty state (what an empty Messages feed actually says, etc.) is not fully specified here — that's exactly the remainder of BRD §12 item 5, and should be filled in as `04-user-stories`' acceptance criteria are written per screen, or via a small BRD addendum if a case doesn't fit any UIR already written.

# 11. Pagination (resolves BRD §12 item 6)

Three endpoints are already paginated by the backend (`API_ENDPOINTS.md`): League Audit (`GET /leagues/{id}/audit`), Draft Selections (`GET /drafts/{id}/selections`), and Security Events (`GET /admin/security/events`). This client uses a consistent **"Load more" pattern** (not infinite scroll) for all three: TanStack Query's `useInfiniteQuery`, a page-size default of 50 rows, and an explicit "Load more" button rather than a scroll-triggered fetch — chosen because these are investigative/audit screens (BRD UIR-125–134, UIR-148–149) where a user scanning for a specific event benefits from a stable, deliberately-paged list rather than content shifting under continued scrolling. Messages and History currently show unbounded lists in the mock-up with no corresponding backend pagination parameter; if their real data volume grows large, backend pagination support would need to be added before this client can apply the same pattern to them.

**Mechanism confirmed in v1.1**: pagination is cursor-based, not offset/page-number-based — each operation takes shared `limit`/`cursor` query parameters and returns `{ items, nextCursor }`. `useInfiniteQuery`'s `getNextPageParam` must read `nextCursor` directly; there is no page-number arithmetic to perform or reconstruct.

# 12. Mobile Navigation (resolves BRD §12 item 8 / DEC-UI-006)

An `<OffCanvasMenu>` component (state in `state/`, §4.2), triggered by a persistent menu control in the mobile top bar, lists: the primary items (Dashboard, Lineup, Squad, Messages, Profile) flat, and League/Draft/Admin/Platform as accordion sections matching their desktop dropdown grouping (BRD UIR-012). Opening the menu traps focus within it and closing (via an explicit close control, backdrop click, or Escape) returns focus to the trigger — satisfying BRD UIR-026 (focus-visible) and UIR-008's keyboard-accessibility bar for the desktop nav groups, applied to the mobile equivalent.

# 13. Accessibility

- WCAG 2.1 AA is adopted as this project's explicit conformance target (the BRD's §9 left this unset).
- Automated checks (`axe-core` or equivalent) run as part of component tests, not left to manual review alone.
- Every shared component in §9 that has a mock-up precedent with an ARIA attribute already present (`aria-current`, `aria-pressed`, `aria-selected`, `aria-expanded`) carries that attribute forward as a required prop, not an optional afterthought.

# 14. Non-Functional / Deployment

- **Build output**: static assets (Vite production build), deployable behind any static host/CDN.
- **API base URL**: environment-configured (build-time env var), not hardcoded, so the same build artifact can target a local/staging/production API by configuration alone.
- **CORS**: the backend must allow this client's origin(s); this is a backend-side configuration dependency this document flags but does not own.
- **CSP**: a Content-Security-Policy should be defined once real deployment targets are known; deferred, not forgotten.
- **Browser support**: last 2 versions of evergreen browsers (Chrome, Edge, Firefox, Safari) — no IE11/legacy support, consistent with a 2026-era product with no stated legacy-browser requirement.

# 15. Decision Register

| ID | Decision | Rationale |
|---|---|---|
| ADR-001 | React 18 + TypeScript SPA, built with Vite. | See §2 — widest ecosystem fit for this UI's table/filter/live-clock density; user-confirmed choice over Blazor/Vue. |
| ADR-002 | TanStack Query for server state; React Context + reducer for the small global client-state set; local component state for everything else. | Matches each kind of state to the tool actually suited to it (§4), rather than one library forced to do all three. |
| ADR-003 | `openapi-typescript`-generated types from the backend's pinned OpenAPI v1.0 YAML, behind a single typed fetch wrapper. | Compile-time contract traceability (§6.1); one seam (§6.2) for auth-header injection, error normalization, and refresh-on-401. |
| ADR-004 | Access token in memory only; refresh token in `localStorage` as an accepted interim tradeoff given the backend's bearer-only auth today. | §7.2 — no `httpOnly` cookie option exists yet; revisit when the backend's standing-by cookie-flow middleware activates. |
| ADR-005 | Polling (via `refetchInterval`), not WebSocket/SSE, for all live data in this version. | §8 — no push endpoint exists in the current 71-endpoint backend surface; polling at a per-data-type interval is sufficient and avoids building infrastructure the backend doesn't yet support. |
| ADR-006 | "Load more" (paged), not infinite scroll, for the three backend-paginated list endpoints. | §11 — these are investigative/audit screens where a stable, deliberately-paged list serves the user's actual task better than continuous scroll. |
| ADR-007 | `/platform/*` routes carry no league segment and are guarded independently of any league-membership check. | §5.2/§5.4 — directly implements BRD UIR-006a/UIR-151's requirement that Platform screens be reachable with no league context, at the routing layer rather than only in the nav's visual grouping. |
| ADR-008 | (v1.1) `makeDraftPick` and `submitGameweekRoster` generate a per-attempt `Idempotency-Key`; `submitGameweekRoster` additionally retains and resends the roster's `ETag` as `If-Match`. No other mutation gets either header. | §6.5 — confirmed against the actual OpenAPI spec (API Consumption Specification v1.0 §2.1, §5), not assumed; applying this pattern only to the two operations that actually require it avoids both a missed requirement and unrequested complexity elsewhere. |
| ADR-009 | (v1.1) The three paginated endpoints use cursor-based paging (`limit`/`cursor` → `{ items, nextCursor }`), confirmed against the spec — not offset/page-number paging. | §11 — `useInfiniteQuery`'s `getNextPageParam` reads `nextCursor` directly; no page-number reconstruction is needed or should be built. |
| ADR-010 | (v1.3) Return-to-origin after Login/Register uses React Router's own `state: { from }` navigation payload, not a query parameter or stored value. | §5.6/§7.3 — the router already carries this state through a redirect at no extra cost; a `?redirect=` query param would be visible/editable in the URL bar for no benefit, and a stored value would need its own cleanup lifecycle a router state object doesn't. |
| ADR-011 | (v1.3) The invitation token in `/invite/:token` needs no persistence mechanism of its own across the Register/Login detour — the same `state: { from }` value (ADR-010) is just that exact URL, token included. | §5.6 — avoids a second, parallel storage mechanism (`sessionStorage`, a second query param) for a value the router state already carries; one mechanism serves both BRD UIR-177 and UIR-187. |
| ADR-012 | (v1.3) Register's and Reset Password's new-password fields share one `PasswordStrengthMeter` component, driven by continuous strength estimation, never a static composition-rule checklist. | §7.1 — `BR-285` specifies strength-estimation over composition rules for both operations identically; one component keeps that policy consistent rather than risking two independently-drifting implementations. |
| ADR-013 | (v1.4) League Creation (`/leagues/new`) sits outside the `AppShell`-wrapped route group, guarded only by `RequireAuth` — the same treatment as `/no-leagues`. | §5.7 — creating a League isn't scoped to a League that exists yet, and a user with zero Leagues has nothing real for the shell's league switcher/nav to act on. |
| ADR-014 | (v1.4) League Settings and Invitations use `RequireLeagueAdministrator`; League Members uses no route guard, gating only its Remove action internally. | §5.7 — `listMemberships` is available to any active member, so Members' route-level access matches what the backend already allows; Settings/Invitations have no legitimate non-Administrator use, matching Audit Log/Score Corrections' existing treatment. |
| ADR-015 | (v1.4) `updateLeagueConfiguration`/`updateSeasonConfiguration` are called with the *full* `LeagueConfiguration`/`SeasonConfiguration` object on every save, including fields the user didn't touch, rather than a partial patch. | §6.4 — both operations' request bodies are the full schema, not a partial/PATCH shape (confirmed against the spec); locked `SeasonConfiguration` fields are rendered read-only and pre-filled with their current value, so resubmitting them unchanged never risks the `409` `BR-293` describes for a genuinely different value. |

# 15.1 Toolchain Versions Confirmed During Scaffolding (added in v1.2)

Actually scaffolding the project (rather than only specifying it) surfaced a few version
decisions this document should record rather than leave implicit:

| Concern | This document said | What's actually scaffolded | Why |
|---|---|---|---|
| React | "React 18" (§2) | **React 19** | The user's decision (§15, ADR-001) was React + TypeScript over Blazor/Vue — the major version wasn't the substance of that choice, and 19 is current stable with no reason to pin backward. |
| React Router | "React Router v6" (§2) | **React Router v7** | Same reasoning — the classic `<Routes>`/`<Route>` component API this project uses is unchanged between v6 and v7. |
| TypeScript | Implied "current" (§2 didn't pin a version) | **TypeScript 5.9.x, explicitly not 6.x** | TypeScript 6 is new enough that `openapi-typescript` (ADR-003) still declares a `^5.x` peer dependency — pinning to the latest stable 5.x avoids fighting the ecosystem for no benefit. Revisit once the ecosystem catches up. |
| Vitest | "Vitest" (§2, no version pinned) | **Vitest 5.0.0, explicitly not the default-installed 3.x/4.x** | A moderate-severity path-traversal advisory (GHSA-82fw-gwwq-j7x9) affects `@vitest/mocker` in the 2.1.0–4.1.10 range; 5.0.0 is the first version outside that range. |
| Package manager | Not specified | **`npm`, with `legacy-peer-deps=true` in `.npmrc`** | npm@10.9.0 (this environment's version, itself pinned by the locally available Node v23.0.0) has an arborist bug (`Cannot read properties of null (reading 'edgesOut')`) resolving Vitest 5's optional peer dependency set. `--legacy-peer-deps` avoids the buggy code path entirely. This is a workaround for an npm bug, not a project preference — remove it once npm is upgraded past the affected version (blocked today by this Node version not satisfying newer npm's own engine requirement) or Vitest's optional-peer graph changes. |

None of these changes anything substantive in §2–§14 above — they're recorded here because "the architecture says X, the repo does Y" is exactly the kind of drift this document exists to prevent, even when Y is clearly the more reasonable choice.

# 16. Version History

| Version | Date | Summary |
|---|---|---|
| v1.0 | 2026-09-11 | Initial creation, against BRD v1.1. Establishes the React/TypeScript/Vite/TanStack Query stack, the route table (including the new Platform section), the API client/codegen approach, an interim auth/token-storage design, a polling-based live-data strategy, and baseline loading/error/empty and pagination patterns. |
| v1.1 | 2026-09-11 | Corrects two gaps the API Consumption Specification v1.0 surfaced by reading the actual OpenAPI spec: adds §6.5 (Idempotency-Key on draft picks and roster submission; If-Match/ETag concurrency on roster submission specifically) and confirms §11's pagination is cursor-based, not offset-based. Adds ADR-008 and ADR-009. |
| v1.2 | 2026-09-11 | Adds §15.1, recording toolchain-version deltas discovered while actually scaffolding the project (React 19 not 18, React Router v7 not v6, TypeScript pinned to 5.9.x, Vitest pinned to 5.0.0 for a security advisory, and an `.npmrc` workaround for an npm@10 arborist bug). No change to §2–§14. |
| v1.3 | 2026-09-11 | Against BRD v1.4, which designs Login, Register, Forgot/Reset Password, and Accept League Invitation (§8.17–8.20) in full for the first time — §7.1 is rewritten from "interim placeholder assumption" to "designed screens," §5.1's route table gains `/login`, `/register`, `/forgot-password`, `/reset-password`, `/invite/:token`, and (previously undocumented) `/no-access`, and new §5.6 specifies the return-to-origin and invitation-token-preservation mechanisms (both reusing React Router's own `state: { from }`, not a bespoke storage mechanism). §7.2–7.4's token/session mechanics are unchanged — they were never placeholder. Adds ADR-010 through ADR-012. |
| v1.4 | 2026-09-11 | Against BRD v1.5, which designs League Creation, League Settings, Invitations, and Members (§8.21–8.24) — §5.1 gains `/leagues/new`, the three new per-League admin/member routes, and (previously undocumented) `/no-leagues`; new §5.7 specifies their route-guard/nav-placement decisions (League Creation outside the shell like `/no-leagues`; Settings/Invitations `RequireLeagueAdministrator`; Members ungated at the route level, gating only its Remove action internally). §6.4's endpoint-to-screen mapping gains four rows. Adds ADR-013 through ADR-015. |
