# Matchday Manager Web Client
## Business Requirements Document — Version 1.4

---

# 1. Executive Summary

Matchday Manager is the web client for the Fantasy EPL League Manager platform. The platform's domain, rules, and API surface are already specified in the `fantasy-premier-league` repository's AIDLC pipeline (Business Requirements Document v1.17, Architecture and Domain Model v1.15, OpenAPI Specification v1.0). This document is the first artifact of a parallel pipeline for the web client itself: it interprets the illustrative HTML mock-up (`mockup/index.html`, versioned through `v4`) into a structured set of UI requirements (`UIR-###`), organized by screen, and cross-referenced against the backend business rules (`BR-###`) each screen surfaces or enforces.

The mock-up is not a finished design — it is a functional sketch built to make the backend's business rules concrete and checkable. Several of its screens carry their own explanatory banners citing the exact `BR-###` rule they exist to demonstrate (e.g., the Makeup Picks screen's "no pick is ever lost" banner citing `BR-282`, or the Username Display Policy screen resolving `BR-326`). This BRD treats those in-mockup annotations as a strong signal of intent, not as content to duplicate — where a screen exists specifically to make a rule visible, this document says so and points at the rule rather than re-deriving it.

This version (v1.0) is a baseline: it inventories every screen present in the mock-up, states the UI requirement each screen implies, and flags the gaps the mock-up leaves open (authentication/onboarding screens, error and empty states, pagination, and a nav-placement inconsistency on the Security screen — see §12). It does not yet make frontend architecture decisions (framework, state management, component structure); that belongs to `02-architecture`, once this requirements baseline is agreed.

# 2. Purpose & Scope

## 2.1 Primary Goals

- Give every **FantasyTeam Manager** (a league member) a single web application to: view their league standing, set their weekly roster and captain, review their full squad, follow league schedule/results, participate in Initial and Secondary Drafts, read league messages, track their Season Goal Prediction, browse league history, review EPL-wide standings/fixtures, and manage their own profile and per-league notification preferences.
- Give every **League Administrator** the tools the backend already models for them: an immutable audit log of every correction and override, a score-correction workbench with a clear precedence explanation, and league messaging.
- Give the **System Administrator** platform-level visibility into authentication and abuse-protection posture, kept clearly separate from any single league's data.
- Faithfully surface backend business rules at the point of user action — e.g., positional minimums while building a roster, "no vice-captain" while setting a captain, replacement-draft eligibility flags while reviewing a squad — rather than only after a rejected request comes back from the API.
- Support light, dark, and system-matched color themes, persisted per user.

## 2.2 Non-Goals for This Version

- **League-creation and league-administration-setup screens** (§12 item 2) — creating a league, sending invitations, or configuring the settings later shown read-only on History's config snapshot has no corresponding input screen anywhere, mock-up or otherwise, and stays out of scope even after v1.4 designs the rest of authentication/onboarding. Nothing in the mock-up or the backend's own BRD gives this document enough to design from yet, and the four flows v1.4 does add (§8.17–8.20) don't depend on it existing.
- Frontend technology selection (SPA framework, mobile app strategy per `BR-188`/`BR-189`, build tooling) — reserved for `02-architecture`.
- Visual design polish beyond what the mock-up already establishes (the mock-up's dark/light palette, typography, and component shapes are treated as an accepted starting point, not as final art direction) — this now extends to the auth/onboarding screens added in v1.4 too, which reuse the same established visual language even though the mock-up never depicted them (see the note at the top of §8.17).
- Any business rule not already reflected in a mock-up screen or, as of v1.4, already designed in §8.17–8.20. If the backend BRD defines a rule with no corresponding screen (league creation, invitation sending), this document does not invent a screen for it — it lists the omission in §12 instead.

# 3. Inputs

This BRD was produced by reading, in full:

- `fantasy-premier-league/mockup/index.html` — the current mock-up (equivalent to the versioned `index.v4.html`), all 17 screens and their inline JavaScript behavior. Now also vendored into this repository at `docs/mockup/` (see `docs/aidlc/README.md` for the canonical-source note).
- `fantasy-premier-league/docs/aidlc/01-requirements/Fantasy EPL League Manager — Business Requirements Document v1.17.md` — for the `BR-###` rules the mock-up cites or implies.
- `fantasy-premier-league/docs/aidlc/README.md` — for the AIDLC pipeline and versioning conventions this document follows.

Later versions of this BRD should record which mock-up version and which backend BRD version they were reconciled against, the same way the backend's downstream stages cite their upstream inputs.

**v1.4 additionally reads directly from**: `fantasy-premier-league-ui/docs/aidlc/05-api-specification/Fantasy EPL League Manager — OpenAPI Specification v1.0.yaml`'s `registerUser`, `login`, `refreshToken`, `logout`, `requestPasswordReset`, `confirmPasswordReset`, and `acceptInvitation` operations, and the backend BRD's `BR-001`–`BR-004`, `BR-027`–`BR-029`, `BR-156`–`BR-159`, `BR-284`–`BR-286` — since §8.17–8.20 have no mock-up screen to interpret at all (confirmed absent, §12 item 1), this version designs them from the already-existing, already-consumable backend contract and this client's own established visual/interaction conventions instead.

# 4. Terminology

| Term | Meaning |
|---|---|
| **Screen** | One top-level, navigable view of the application, corresponding to one `<section class="screen">` in the mock-up (e.g., Dashboard, Lineup, Draft Board). |
| **Nav group** | A collapsible dropdown in the top navigation bar that groups related screens (League, Draft, Admin) behind a single trigger button, rather than listing every screen flat. |
| **UIR** | A UI Requirement defined by this document, numbered sequentially and independent of the backend's `BR-###` numbering. |
| **Surfaces** | A screen "surfaces" a backend rule when it displays data or state that rule governs (e.g., the Lineup screen surfaces `BR-041` by showing positional minimums as a checklist). |
| **Enforces** | A screen "enforces" a rule when it also constrains user input client-side to match it (e.g., disabling roster submission until positional minimums are met), in addition to the backend's own authoritative enforcement. |
| **League Administrator** | Per-league role (`BR-024`–`BR-025`) with access to that league's Audit Log, Score Corrections, and Messages composer. |
| **System Administrator** | Platform-level role (`BR-300`) with access to the Security & Abuse Protection screen, scoped above any single league. |
| **FantasyTeam Manager** | Any authenticated user viewing their own FantasyTeam's data within a league they belong to — the default, unprivileged role. |

# 5. Users & Roles

Three roles are visible in the mock-up, matching the backend's authorization model:

1. **FantasyTeam Manager** — every league member. Sees Dashboard, Lineup, Squad, League (Table/Schedule/EPL/Predictions/History), Draft (Draft Board/Makeup & Timeouts), Messages, and Profile.
2. **League Administrator** — additionally sees Audit Log, Score Corrections, and can publish to Messages (composer is hidden or disabled for non-administrators per `BR-221`/`BR-222`).
3. **System Administrator** — sees Security & Abuse Protection. This is explicitly **not** a per-league role (the screen's own eyebrow text says "not a League-scoped screen," citing `BR-300`), which creates a placement question addressed in §12.

A single user can hold the FantasyTeam Manager role in multiple leagues simultaneously (`BR-020`) and the League Administrator role in some subset of them; the application shell's league switcher (§6) is how the UI scopes screens to "the currently selected league" for a user in more than one.

**A fourth, pre-authentication role is introduced in v1.4** (§8.17–8.20), resolving §12 item 1:

- **Anonymous Visitor** — no session at all. Can only reach Login, Register, Forgot/Reset Password, and an invitation-acceptance landing page (§8.20) — every other route requires authentication and redirects here first, returning the visitor to their original destination once signed in (UIR-177). Conversely, an already-authenticated user is redirected away from these same four screens rather than shown them again (UIR-176).

# 6. Application Shell & Navigation

## UIR-001 — Persistent Top Bar
Every screen renders inside a persistent top bar containing: the Matchday Manager brand mark, a league switcher, primary navigation, a theme switch, and the current user's profile chip. Only the screen content below the top bar changes on navigation — this is a single-page shell, not a series of full-page reloads.

## UIR-002 — League Switcher
The top bar shows the user's currently active league by name (e.g., "The Gaffers League") with an affordance to switch. Because a user can belong to multiple leagues (`BR-020`) with independent memberships (`BR-021`), switching leagues must re-scope every league-specific screen (Lineup, Squad, League group, Draft group, Messages, Admin group, and the League-specific half of Profile) to the newly selected league without a full page reload.

## UIR-003 — Primary Navigation Items
Top-level nav buttons, always visible (not nested in a group): Dashboard, Lineup, Squad, Messages, Profile.

## UIR-004 — "League" Nav Group
A collapsible nav group labeled "League" contains: Table, Schedule, EPL, Season Predictions, History.

## UIR-005 — "Draft" Nav Group
A collapsible nav group labeled "Draft" contains: Draft Board, Makeup Picks & Timeouts.

## UIR-006 — "Admin" Nav Group (League-Scoped)
A collapsible nav group labeled "Admin" contains only the two genuinely league-scoped administrative screens: Audit Log and Score Corrections. This group, and everything in it, must only render for a user who is a League Administrator for the active league, and re-scopes entirely when the active league changes (UIR-002). *(Revised in v1.1 — Security and Username Display Policy moved out of this group; see UIR-006a and the resolution of §12 items 3–4.)*

## UIR-006a — "Platform" Nav Section (League-Independent, System Administrator Only)
A second, structurally separate top-level nav destination labeled "Platform" holds the two screens that are not league-scoped: Security & Abuse Protection and Username Display Policy. It renders only for a System Administrator (`BR-300`), renders identically regardless of which league (if any) is currently active in the league switcher, and remains fully reachable when no league is selected at all. This resolves the placement inconsistency identified in the v1.0 BRD (§12, items 3–4): those two screens' own content already asserted they were platform-wide, but v1.0's navigation nested them inside the per-league "Admin" group — a contradiction between stated scope and actual reachability. Unlike the "League," "Draft," and "Admin" nav groups (which are dropdowns scoped to whatever league is active), "Platform" is not league-scoped and must not visually imply it is (e.g., it must not sit beside or collapse together with the league switcher's dropdowns).

## UIR-007 — Active-Screen Indication
The nav button (or nav-group trigger, if the active screen is nested inside a collapsed group) for the current screen is visually distinguished (`aria-current="page"` in the mock-up) so the user always knows where they are, including when the containing group is collapsed.

## UIR-008 — Keyboard and Screen-Reader Accessible Nav Groups
Nav-group triggers expose their open/closed state via `aria-expanded`, close when the user clicks elsewhere or presses Escape, and close any other open group when one is opened (only one nav group open at a time).

## UIR-009 — Cross-Screen Deep Links
Several screens link directly into another screen with context carried along (e.g., a "View full table →" link from the Dashboard's mini-standings into the full League Table; a "full fixtures & table →" link from the Lineup screen into EPL; a "view full squad →" link from Lineup into Squad). Every such link must navigate directly to the target screen without requiring the user to locate it via the nav bar.

## UIR-010 — Theme Switch (System / Light / Dark)
A three-way theme switch (matching system preference, force light, force dark) is available both in the top bar and, redundantly, inside Profile (UIR-166). Selecting a theme applies immediately across the whole application and persists across sessions for that user; selecting "system" clears any stored override and follows the OS/browser preference going forward.

## UIR-011 — Profile Chip
The top bar shows the current user's active-league icon/initials and username at a glance, without navigating to Profile.

## UIR-012 — Off-Canvas Navigation Below the Mobile Breakpoint
Below a defined mobile breakpoint, the top bar's primary navigation, "League"/"Draft"/"Admin" nav groups, and the "Platform" section (UIR-006a) are replaced by an off-canvas (slide-out) menu, opened via a persistent menu control in the top bar. The off-canvas menu lists every destination the user's role grants them, with "League," "Draft," and "Admin" rendered as expandable accordion sections (mirroring their desktop dropdown grouping) rather than flattening every screen into one long list. *(Revised in v1.1 — resolves the mobile-navigation question left open in v1.0 §12; the reflow-only behavior visible in the mock-up is superseded by this pattern.)*

# 7. Cross-Cutting UI Requirements

## UIR-013 — Countdown Clocks
Any deadline shown to the user (Gameweek roster lock on Dashboard and Lineup, draft pick timer on Draft Board and Makeup Picks) renders as a live, continuously-updating countdown (`HH:MM:SS` for roster locks, `MM:SS` for draft pick timers), not a static timestamp the user must mentally subtract from the current time.

## UIR-014 — Tabular Number Alignment
All numeric columns and statistics (points, minutes, goal difference, standings figures) render with tabular (fixed-width) digit spacing so columns of numbers align vertically regardless of digit count.

## UIR-015 — Position-Filter + Search Pattern for Player Lists
Any list of players (Squad, Draft Board's available pool) supports simultaneous filtering by position (All/GK/DEF/MID/FWD, as a pressed-button group) and free-text search by name, applied together (a player must match both the active position filter and the search term to remain visible).

## UIR-016 — Sortable Player-List Columns
Any tabular player list (Squad, Draft Board pool) supports click-to-sort on its numeric and text columns, toggling ascending/descending on repeated clicks of the same column, with a visible sort-direction indicator on the active column and no indicator on inactive columns.

## UIR-017 — Positional Acquisition Provenance
Anywhere a player's route onto a squad matters (Squad, History drill-downs), the UI distinguishes Initial Draft, Secondary Draft, and Replacement acquisitions with a distinct visual tag, so a manager can see at a glance which of their players came from which mechanism (`BR-034`, `BR-060`, `BR-063`).

## UIR-018 — Replacement Eligibility Flag
A squad player who has become replacement-eligible (EPL transfer-out per `BR-066` or admin-declared season-ending injury per `BR-067`/`BR-068`) is visibly flagged wherever that player appears in a list, not only on a dedicated notification.

## UIR-019 — Role-Gated Admin Badge
Every screen restricted to a League Administrator or System Administrator displays a persistent badge naming the role and, for league-scoped admin screens, the acting administrator's username, so it's unambiguous the user is viewing privileged, not personal, data.

## UIR-020 — Expandable Row Detail (Progressive Disclosure)
Detail that would clutter a table's default view (the Audit Log's before/after JSON diff) is hidden behind a per-row "Details" toggle rather than always shown, and the toggle's label reflects its state ("Details" ↔ "Hide").

## UIR-021 — Multi-Dimensional Filtering on Log/History Screens
The Audit Log supports simultaneous filtering by action type (button group), team or league-settings scope (dropdown), and date range (from/to date pickers), all three applied together, with the underlying expanded-detail row hidden (and its toggle state reset) whenever its parent row is filtered out.

## UIR-022 — Tabbed Time/Period Navigation
Any screen presenting the same shape of data across multiple discrete periods (Schedule's GW9/GW10/GW11 tabs, EPL's fixture-gameweek tabs, History's season tabs, EPL's season tabs) uses a consistent tab pattern: one tab visibly selected (`aria-selected`) at a time, its content panel shown, all sibling panels hidden.

## UIR-023 — Disabled-with-Reason Tabs
A tab representing a period that cannot yet be shown (History's in-progress 2026/27 season tab) is rendered disabled with an explanatory tooltip/title rather than omitted, so the user understands why it's unavailable rather than wondering where it went.

## UIR-024 — Result-Coded Fixture Rows
Every completed-fixture row is color/pill-coded by outcome (win/loss/draw) via a left accent border and a result pill, distinct from an in-progress fixture (live indicator with running match clock/minute) and an upcoming fixture (kickoff time in place of a score).

## UIR-025 — Reduced-Motion Respect
Any UI transition driven by CSS transition/animation (nav-group chevron rotation, toggle switches) must be suppressed when the user's OS signals a reduced-motion preference.

## UIR-026 — Focus-Visible Indication
Every interactive element (buttons, inputs, toggles, tab controls) shows a visible focus indicator when reached via keyboard, distinct from (and not solely reliant on) mouse hover styling.

## UIR-027 — Historical / Locked Data Is Visually Read-Only
Any data the backend has locked from further change (a submitted historical roster, a locked season prediction, a completed season's standings) is presented in a visually non-editable form (e.g., a read-only "locked field" treatment) and never rendered inside an editable control a user could mistake for actionable.

## UIR-028 — Currency-Free, Points/Goals-Based Stat Presentation
All statistics throughout the application (fantasy points, league points, goals) are plain numeric displays with unit context in a label/eyebrow, never implying real-money stakes.

## UIR-029 — Rule-Explanation Banners at the Point of Relevance
Where a screen exists specifically to demonstrate a non-obvious business rule (Makeup Picks' skip-and-requeue banner for `BR-282`; Score Corrections' precedence-order banner for `BR-139`–`BR-145`; Username Display Policy's resolution banner for `BR-326`), the UI presents that explanation inline, adjacent to the data it governs, rather than requiring the user to consult separate documentation.

## UIR-030 — Live-Preview Pattern for Policy/Settings Screens
Where a setting has a visible, non-obvious effect on how other data displays (Username Display Policy's toggle changing how a sample historical username renders; Profile's icon picker changing the "How You'll Appear" preview), changing the setting must update an inline live preview immediately, without requiring a save-and-reload cycle to see the effect.

## UIR-031 — "Hidden Until Reveal Condition" Data Pattern
Data that is intentionally concealed from other users until a defined condition is met (other managers' Season Goal Predictions, hidden until season end per the tie-break design) renders a clear "hidden" placeholder with an icon and explanation, not an empty cell or a fabricated value.

## UIR-032 — System vs. Human Actor Distinction
Wherever an action has an actor (Audit Log rows), the UI must visibly distinguish an automated/system-generated action (e.g., an auto-granted replacement eligibility) from a human administrator's action, using a distinct icon/label ("System" vs. a named administrator with avatar).

## UIR-033 — Undo/Reversal Affordance Where the Backend Supports It
Where the backend models an explicit undo (Score Corrections' override undo per `BR-142`), the UI provides a direct, single-action control for it and moves the record to a visually distinct "recently undone" list rather than deleting it from view.

## UIR-034 — No Client-Side Fabrication of Authoritative Data
Interactive elements that appear to submit an action (Submit Roster, Apply Override, Publish message, Draft pick) must be understood as UI affordances over real backend calls; this document does not require or endorse client-only state changes as a substitute for the corresponding API call — the mock-up's client-only JavaScript (e.g., re-ordering a table row into "undone" purely in the DOM) is illustrative only and must be backed by a real write in the production client.

# 8. Screen-Level Requirements

## 8.1 Dashboard

## UIR-035 — Gameweek Scorebug
The Dashboard's top element ("scorebug") always shows the current Gameweek number, a deadline-relevant message (e.g., "Set your Gameweek N lineup before kickoff"), and the live countdown to that Gameweek's roster lock (`BR-093`–`BR-094`, and UIR-013).

## UIR-036 — At-a-Glance Stat Tiles
The Dashboard shows four stat tiles for the signed-in manager's FantasyTeam in the active league: League Position, League Points (with W-D-L breakdown), Fantasy Goal Difference (with for/against breakdown), and Captain Points (with the manager's rank on that tie-break statistic per `BR-051`, `BR-123`).

## UIR-037 — Next Head-to-Head Fixture Card
The Dashboard shows the manager's next scheduled Head-to-Head match (`BR-107`, `BR-111`): both FantasyTeams' identity/manager/current standing, and the kickoff/roster-lock time.

## UIR-038 — League News Feed
The Dashboard shows a reverse-chronological feed of recent league-relevant events, each tagged by category (e.g., Admin, Injury, Result) with a relative timestamp.

## UIR-039 — Condensed League Standings
The Dashboard shows a condensed version of the League Table (position, team, played, points, goal difference only) for the active league, with the manager's own row visually highlighted, and a direct link to the full League Table (UIR-009).

## UIR-040 — Own-Row Highlighting Convention
Anywhere the signed-in manager's own FantasyTeam appears in a list alongside other teams (Dashboard standings, full League Table, League Predictions list, History standings), that row is visually distinguished from the rest.

## UIR-041 — Dashboard Requires an Active League Context
Because a manager can belong to multiple leagues, the Dashboard's content is entirely scoped to whichever league is currently active in the league switcher (UIR-002) — there is no cross-league aggregate dashboard in this version.

## UIR-042 — Dashboard Reflects Deadline Urgency
The Dashboard's deadline messaging is visually distinct (e.g., a live/urgent color treatment) as the roster lock approaches, matching the same urgency treatment used on the Lineup screen's own deadline banner (UIR-043).

## 8.2 Lineup (Gameweek Roster)

## UIR-043 — Roster Lock Deadline Banner
The Lineup screen shows a prominent banner stating exactly when the roster locks (one hour before the Gameweek's first kickoff, per `BR-094`) with a live countdown (UIR-013).

## UIR-044 — Gameweek Fixture Strip
The Lineup screen shows a horizontally scrollable strip of that Gameweek's real EPL fixtures (club badges, kickoff times) so a manager can see opponent context while building their roster, with a link into the full EPL fixtures screen (UIR-009).

## UIR-045 — Positional-Minimums Checklist
The Lineup screen shows a checklist confirming each positional minimum is met (Goalkeepers, Defenders, Midfielders, Forwards, each against its minimum per `BR-041`) plus a total-selected-of-15 indicator, each item visually confirmed (checkmark) only once satisfied.

## UIR-046 — Formation Pitch View
The weekly roster's 15 starting players render as a graphical pitch, grouped into forward/midfield/defense/goalkeeper bands, each player shown as a shirt token with name, club, and next-opponent (with home/away indication).

## UIR-046a — Adding and Removing Players Between Roster and Reserves
*(Added in v1.3.)* The weekly roster's composition is not fixed once initially set — a manager must be able to change which players from their full squad make up a given Gameweek's roster week to week (`BR-037`, `BR-041`; a manager benches an out-of-form or injured player and starts someone else). The mock-up never depicted this: its JavaScript wires up only captain selection and a Submit/Reset pair, with no control that actually changes roster membership — without one, the screen's core purpose (choosing a different 15 of the squad each week) would be impossible to exercise, so this requirement fills that gap rather than leaving it unbuilt (contrast with BRD §12 item 11, the Draft-Paused state, which has no source material to design from and is deliberately left undesigned — this is different: the feature is non-functional without *some* answer here). Concretely: each reserve player has an explicit "Add" action (disabled once the roster already holds `WeeklyRosterSize` players); each rostered player has an explicit "Remove" action, distinct from the click-to-captain area (UIR-047) so the two interactions never conflict on the same click target. Removing the current captain clears the captain selection rather than leaving a removed player captain. Unlike UIR-034's general framing, the client additionally **requires** a captain be chosen among the currently-selected players before "Submit Roster" is enabled, even though the backend itself accepts a roster submission with no captain (settable separately) — consistent with UIR-047 already treating captain selection as integral to a valid weekly roster, not an optional afterthought.

## UIR-047 — Captain Selection via Player Token
Clicking any starting player's token on the pitch designates them captain (`BR-045`); the previously designated captain's marker is removed and the new selection is visibly marked (border treatment plus a "C" badge). Exactly one captain is selectable at a time (`BR-049` — no vice-captain), and the UI must state plainly, near the pitch, that if the captain doesn't play, the captain bonus is simply lost (`BR-048`) — there is no fallback selection.

## UIR-048 — Captain-Eligible Players Only
Only a player currently in the starting XI is selectable as captain from the pitch view — the captain must be drawn from the active roster, matching `BR-045`/`BR-046`.

## UIR-049 — Reserves Panel
Alongside the pitch, a panel lists the bench/reserve players not in this Gameweek's starting XI (`BR-038`), each with position, club, and next opponent, plus the Add action described in UIR-046a; if the reserve list is long, it is truncated with a count and a link to the full Squad screen (UIR-009) rather than growing the panel indefinitely.

## UIR-050 — Submit / Reset Roster Actions
The Lineup screen provides a primary "Submit Roster" action and a secondary "Reset" action. Submission must be understood to write the roster to the backend (UIR-034); reset must be understood to discard in-progress, unsaved changes back to the last submitted (or default) state.

## UIR-051 — No Late Changes After Lock
Once the roster lock passes (`BR-094`, `BR-096`), the Lineup screen must prevent further user-initiated changes to the roster or captain for that Gameweek — the pitch/reserves become read-only (UIR-027) until the next Gameweek's roster opens.

## UIR-052 — Roster Reflects Real Opponent Data
Each player token and reserve row shows that player's real-world club and this Gameweek's opponent (with home "vs" / away "@" distinction), sourced from the same EPL fixture data shown on the EPL screen — the two must never disagree within the same Gameweek.

## UIR-053 — Squad-Size Context in Header
The Lineup screen's header states the manager's full squad size (e.g., "Squad of 27") for orientation, distinguishing it from the 15-player weekly roster being built below.

## UIR-054 — Administrative-Change Disclosure
If a squad-affecting administrative action (e.g., a declared season-ending injury) happened outside the current roster-submission flow, the Lineup or Squad screen must disclose it in context (as the mock-up's footnote about a replacement-eligible player does) rather than leaving the manager to discover it only via the news feed or Messages.

## 8.3 Squad

## UIR-055 — Full Squad Summary Strip
The Squad screen opens with summary counts: total squad size, count currently in the active Gameweek roster, and a breakdown by acquisition method (Initial Draft / Secondary Draft / Replacement, per UIR-017), plus a count of players currently replacement-eligible (UIR-018).

## UIR-056 — Full Squad Table
The Squad screen lists every player on the manager's FantasyTeam with: name, club, position, acquisition method, season-to-date minutes played, games played, fantasy points, whether they're in the current Gameweek roster (yes/no), and a notes column for flags like replacement eligibility.

## UIR-057 — Squad Table Filter and Sort
The Squad table supports the position-filter + search pattern (UIR-015) and column sorting (UIR-016), matching the Draft Board's pool table so the interaction pattern is consistent wherever a player list appears.

## UIR-058 — Season-to-Date Stat Semantics
Minutes/Games Played/Points columns are explicitly season-to-date figures; the UI must make clear (as the mock-up's footnote does for the Draft Board) that these read as zero before any Gameweek has been scored, so a manager doesn't mistake early-season zeros for a data error.

## UIR-059 — Squad Scoped to One League
Because a FantasyTeam is per-league (`BR-018`, `BR-019`), the Squad screen shows only the active league's squad — a manager with FantasyTeams in multiple leagues sees a different squad after switching leagues (UIR-002), never a merged view.

## UIR-060 — In-Roster Indicator Consistency
The "in current Gameweek roster" flag on Squad must always agree with what the Lineup screen currently shows as the starting XI for the same Gameweek — these are two views of the same underlying roster, not independently derived.

## UIR-061 — Acquisition-Method Legend
Because three acquisition badges (Initial/Secondary/Replacement, UIR-017) appear with only a short label, the UI must make their meaning discoverable (tooltip, legend, or equivalent) rather than assuming every manager already knows the distinction.

## UIR-062 — Replacement-Eligibility Explanation In Context
Where a squad row is flagged replacement-eligible (UIR-018), the Squad screen states in plain language why (EPL transfer-out per `BR-066`, or admin-declared season-ending injury per `BR-067`), matching the specificity the mock-up's footnote shows.

## UIR-063 — No Squad-Size Cap in the UI Beyond the Rule
The Squad screen must not impose its own arbitrary display cap on squad size — the full squad (up to whatever size the Secondary Draft has expanded it to, per `BR-062`) is always fully listed, filterable rather than paginated away by default.

## 8.4 League Table (Standings)

## UIR-064 — Full Standings Table
The League Table shows every FantasyTeam in the active league with: position, team/manager identity, played, won, drawn, lost, fantasy goals for, fantasy goals against, fantasy goal difference, captain points (the primary numeric tie-break statistic, `BR-051`), and league points.

## UIR-065 — Tie-Break Order Disclosure
The League Table states its full tie-break order in plain text (League Points → Goal Difference → Goals For → Head-to-Head → Captain Points → Season Prediction → Random, per `BR-119`–`BR-125`) so a manager can see why two teams are ordered the way they are without needing to reverse-engineer it from the numbers.

## UIR-066 — Points Legend
The League Table states its points-per-result convention (e.g., "3 for a win, 1 for a draw," per `BR-115`–`BR-117`) inline rather than assuming it's known.

## UIR-067 — Own-Row Highlighting
The manager's own FantasyTeam row is highlighted (UIR-040) within the full table, not just the Dashboard's condensed version.

## UIR-068 — Manager Identity Alongside Team Name
Each row shows both the FantasyTeam name and the managing user's username, since league members generally know each other by one or the other.

## 8.5 Schedule & Results

## UIR-069 — Gameweek-Tabbed Fixture List
Schedule presents the active league's Head-to-Head fixtures grouped by Gameweek via tabs (UIR-022), with the currently relevant Gameweek (the one nearest kickoff) pre-selected on load.

## UIR-070 — Tab Labels State Fixture Status
Each Gameweek tab's label states whether that Gameweek is Results (completed), Upcoming (this week), or Fixtures (future), so the user knows what kind of content a tab holds before selecting it.

## UIR-071 — Result-Coded Rows for Completed Gameweeks
Completed fixtures use the win/loss/draw coding (UIR-024), each showing both FantasyTeams and the final Fantasy Points score.

## UIR-072 — Kickoff-Time Rows for Upcoming/Future Gameweeks
Fixtures not yet played show each side's identity and the real-world kickoff time in place of a score.

## UIR-073 — Schedule Reflects the Full-Season Draw
Because the Head-to-Head schedule is fixed for the season once generated (`BR-108`–`BR-110`), a manager must be able to reach future Gameweeks' fixtures (not just the next one) via the Gameweek tabs, not only the upcoming week.

## 8.6 EPL (League Table & Fixtures)

## UIR-074 — EPL Is Not League-Scoped
The EPL screen shows the real Premier League's own table and fixtures — official data with no Fantasy League scoping (`BR-329`, `BR-335`) — and must remain reachable and identical in content regardless of which Fantasy League is currently active in the league switcher.

## UIR-075 — Table / Fixtures View Toggle
EPL offers two top-level views (Table, Fixtures) via a tab pattern (UIR-022), each independently navigable.

## UIR-076 — EPL Table by Season
The EPL Table view is further tabbed by season (current season "through Matchweek N," plus at least one prior completed season), matching the season-tab pattern used on History (UIR-022).

## UIR-077 — EPL Table Source-of-Truth Disclosure
The EPL Table states plainly that it is official EPL/FPL data, not editable by any Fantasy League Administrator (`BR-334`), and states its own tie-break order (points → goal difference → goals for → head-to-head).

## UIR-078 — EPL Fixtures by Matchweek, Including Live State
The EPL Fixtures view is tabbed by real Matchweek (UIR-022) and must represent three fixture states: completed (result-coded, UIR-024), live (running score plus match minute, distinctly styled from a final result), and upcoming (kickoff time only).

## UIR-079 — Historical EPL Seasons Remain Reachable
A completed EPL season's final table remains fully browsable indefinitely (`BR-331`), consistent with the platform's historical-retention rule (`BR-174`).

## UIR-080 — EPL Data Feeds the Lineup/Squad Opponent Context
The same underlying EPL fixture data shown here must be what powers the "next opponent" context shown on Lineup (UIR-052) and Squad — these are not independently maintained data sets in the UI layer.

## 8.7 Season Predictions

## UIR-081 — Own Prediction, Locked and Labeled
The manager's own season goal prediction displays as a locked field, stating when it was locked (season start, per `BR-127`–`BR-128`) and that it cannot be changed now, using the locked/read-only treatment (UIR-027).

## UIR-082 — Actual-vs-Predicted Progress Stats
The screen shows the actual EPL goal total accumulated so far this season alongside the manager's locked prediction, and states plainly that the final comparison is "TBD" — only calculated at season end (`BR-130`–`BR-131`) — rather than computing a misleading partial comparison.

## UIR-083 — League Predictions List, Hidden Until Season End
The screen lists every FantasyTeam in the active league and their prediction status: the manager's own value is shown; every other manager's value is replaced with the "hidden until season end" pattern (UIR-031), preserving the tie-break's designed-in anti-anchoring property.

## UIR-084 — Tie-Break Mechanics Explanation
The screen explains, in plain language and with a worked numeric example, exactly how the prediction tie-break resolves: closest prediction wins; on an equal absolute difference, the prediction at-or-below the actual total wins over the one above it (`BR-131`–`BR-134`).

## UIR-085 — Tie-Break Position in the Overall Order
The screen states where this tie-break sits in the overall standings tie-break sequence (last, after League Points, Goal Difference, Goals For, Head-to-Head, and Captain Points), consistent with UIR-065's disclosure on the League Table.

## UIR-086 — Permanent Retention Disclosure
The screen states that the prediction and its calculated difference are retained permanently, even after the tie-break resolves at season end (`BR-135`).

## UIR-087 — Missed-Submission Consequence Disclosure
The screen states the consequence of not having submitted a prediction before season start: the manager would have been blocked from submitting their first Gameweek roster until they did (`BR-299`) — this is informational context on the screen the manager is currently viewing, not a blocking flow itself (since, if they're viewing it, they've already submitted).

## UIR-088 — Prediction Screen Is League-Scoped
Because the prediction and its comparison league are per active-league (each league runs its own tie-break pool), switching the active league (UIR-002) must re-scope this screen entirely, including which other managers' predictions are listed.

## 8.8 History

## UIR-089 — Season-Tabbed Navigation
History is tabbed by season (UIR-022), each tab labeled with its completion status ("Completed" or, for the season in progress, disabled with an explanatory tooltip per UIR-023 — an in-progress season has no History entry until it completes).

## UIR-090 — Three Drill-Down Views per Season
Within a selected completed season, a secondary tab set offers: Final Standings, Draft History, and Gameweek Roster — a nested tab-within-tab pattern.

## UIR-091 — Champion Banner
The Final Standings drill-down leads with a champion banner naming the winning FantasyTeam and its manager for that season.

## UIR-092 — Historical Standings Table
Final Standings shows the same column set as the current League Table (UIR-064), for the completed season.

## UIR-093 — Historical League Configuration Snapshot
Final Standings also shows a snapshot of the league's configuration as it actually applied to that season (squad size, roster size, positional minimums, draft timer, points-per-result, invitation-expiration window), with any value that has since changed visually flagged and annotated with why it differs from the current value (`BR-296` — a season keeps the configuration value that actually applied to it, not the league's present-day setting).

## UIR-094 — Team/Gameweek Selectors for Drill-Down Data
The Draft History and Gameweek Roster drill-downs each provide selectors (team, and for Gameweek Roster, also Gameweek) so the manager can inspect any team's/gameweek's historical record, not only their own.

## UIR-095 — Full Draft-Order Historical Record
Draft History for a selected team lists every pick in order (pick number, player, position, club) for that season's Initial Draft.

## UIR-096 — Full Gameweek Roster Historical Record
Gameweek Roster for a selected team/gameweek shows the match result and fantasy points for that gameweek, the captain, whether the record is locked (always "yes" for a historical record, per UIR-027), and the full 15-player roster with the captain marked.

## UIR-097 — Placeholder for Un-Illustrated Combinations
Where the underlying data model supports every team/gameweek combination but a specific combination isn't illustrated with real content, the UI must show an explanatory placeholder stating that the data is genuinely stored and queryable (`BR-174`, `BR-178`, `BR-179`) rather than presenting an ambiguous blank screen that could be mistaken for missing data.

## UIR-098 — Retired-User and Historical-Identity Handling
A historical record for a manager who has since retired from the platform (`BR-013`) must still display correctly, tagged as retired, and must be joined by the platform's internal user identifier rather than by username, so a retired user's historical record can never be confused with a different, later user who reuses that username (`BR-012`, `BR-298`). This same identity-joining behavior underlies the Username Display Policy screen (§8.15) and must be applied consistently everywhere a historical username is shown, not only in History.

## 8.9 Draft Board

## UIR-099 — Draft Context Header
The Draft Board states which draft is active (Initial or Secondary), the current round of however many total rounds, and — for the Secondary Draft — through which Gameweek's data the pool's stats are current.

## UIR-100 — Snake Draft Order Panel
A dedicated panel lists the full pick order for the current round, visually distinguishing completed picks, the team currently on the clock, and upcoming picks, and states in plain text how the snake order was derived (worst-to-first from a standings snapshot for round 1, reversing each subsequent round) and that it does not change even if later results reorder the standings (`BR-054`, `BR-056`).

## UIR-101 — On-the-Clock Panel with Live Timer
A prominent panel names the team currently on the clock, the manager, the pick number, and a live countdown (UIR-013) to the pick timer's expiration (`BR-057`), plus a note that an administrator may extend it (`BR-058`).

## UIR-102 — Available-Player Pool
The main draft interface is a filterable, sortable player pool (position filter + search per UIR-015, column sort per UIR-016) showing name, club, position, season-to-date minutes/games/points, and a status column distinguishing "Available" from "Owned" (with the owning team named).

## UIR-103 — Draft Action Restricted to the On-Clock Team
A "Draft" action button exists per available-player row, but must only be usable by the FantasyTeam currently on the clock (UIR-101) — every other manager views the same pool read-only while another team picks.

## UIR-104 — Owned Players Visually De-Emphasized, Not Removed
An already-owned player remains visible in the pool (de-emphasized/dimmed) rather than disappearing, so managers can still see full pool context (who has whom) while drafting.

## UIR-105 — Recent Picks Feed
A panel lists the most recent picks (pick number, team, player selected) so managers can follow draft progress without re-scanning the whole order panel.

## UIR-106 — Zero-Stats Disclosure During Initial Draft
Where the pool's season-to-date stat columns would legitimately read zero (before any Gameweek has been scored, i.e., during the Initial Draft), the UI states this explicitly rather than letting managers mistake it for missing data (matches UIR-058's Squad-screen requirement).

## UIR-107 — Draft Board Is League-Scoped
The Draft Board reflects the active league's own draft only; switching leagues (UIR-002) must re-scope to that league's own draft state entirely, since each league runs independent drafts.

## UIR-108 — Secondary Draft Round/Size Context
For the Secondary Draft specifically, the header states the fixed number of rounds/picks per team for this mechanism (`BR-060`), distinguishing it from the Initial Draft's larger, full-squad round count.

## UIR-109 — Draft Completion State
Once a draft's final pick resolves, the Draft Board (or the screen a manager is routed to next) must clearly communicate that the draft has concluded and that every FantasyTeam now holds its expected full squad size (`BR-052`, `BR-060`, `BR-197`), rather than leaving a completed draft looking identical to an in-progress one with an empty order panel.

## 8.10 Makeup Picks & Timeouts

## UIR-110 — Regular-Round vs. Makeup-Round Progress Tracker
A two-segment tracker shows regular-round completion (picks made of total, and how many were skipped along the way) and, once regular rounds finish, makeup-round progress (pick N of total in the makeup queue).

## UIR-111 — Makeup Queue Slot Visualization
The makeup round's queue renders as a row of slots, each showing the queued team and status (done/current/pending), so a manager can see the whole remaining queue at a glance, not just whoever is presently on the clock.

## UIR-112 — Chronological "What Happened" Log
A chronological log lists every timeout-relevant event in order: a skip (timer expired, no extension, queued as makeup pick #N), the final regular pick (transition into the makeup round, with however many teams were queued), a re-queue (a makeup pick itself timed out and moved to the end of the now-longer queue), and a completed makeup pick — each entry distinctly marked by type (skip / re-queue / pick / round-complete milestone).

## UIR-113 — Re-Queue Rule Explanation In Context
Wherever a re-queue event appears in the log, the UI states the rule it demonstrates in plain language (a timed-out makeup pick goes to the end of the queue rather than being lost a second time, `BR-282`) rather than leaving the manager to infer it from the sequence of events alone.

## UIR-114 — "No Pick Is Ever Lost" Framing Banner
The screen leads with a rule-explanation banner (UIR-029) stating the overall guarantee this mechanism exists to provide — no FantasyTeam ever permanently loses a draft pick to a timeout — before the manager reads the detailed log.

## UIR-115 — Live Timer for the Current Makeup Pick
Same live-countdown treatment as the main Draft Board (UIR-013, UIR-101), including a visible indicator when a team is on a repeat attempt (e.g., "2nd attempt") after having been re-queued.

## UIR-116 — "Why This Matters" Rationale Panel
A short panel explains the consequence of *not* having this rule (a single missed connection could freeze the whole draft, or cost a team a player permanently) so the mechanism's value is understandable to a manager encountering it for the first time, not only to someone who already knows the backend rule.

## UIR-117 — Makeup Screen Is League- and Draft-Scoped
Like the main Draft Board, this screen reflects only the active league's current draft; it must correctly render "no makeup round in progress" state (not just an empty log) when a league's active draft has no skipped picks to show.

## 8.11 Messages

## UIR-118 — Administrator-Only Composer
A message composer (textarea plus Publish action) is visible to a League Administrator; for a non-administrator viewing the same screen, the composer must be hidden or clearly disabled with an explanation, since only the League Administrator can publish league messages (`BR-221`, `BR-222`).

## UIR-119 — Reverse-Chronological Message Feed
Published messages render as a feed, newest first, each showing the author (an administrator), their role badge, and a timestamp.

## UIR-120 — Newly Published Message Distinction
A message just published in the current session is visually distinguished (e.g., a highlight treatment) from previously existing messages, and is inserted at the top of the feed immediately on publish.

## UIR-121 — Plain-Text Message Body with Preserved Line Breaks
Message bodies render as plain text with user-entered line breaks preserved (no rich-text/HTML formatting is implied by the mock-up).

## UIR-122 — Composer Visibility Note
Directly beside the composer, the UI states who can see a published message (every active member of the league) so an administrator understands the audience before publishing.

## UIR-123 — Permanent Message Retention Disclosure
The screen states that messages are retained under the same historical-retention policy as the rest of the league's data (`BR-223`) — nothing published here is ever silently removed.

## UIR-124 — Messages Are League-Scoped
Switching the active league (UIR-002) must re-scope the message feed and composer entirely to the newly selected league — messages are never shown across leagues.

## 8.12 Audit Log (League Administrator)

## UIR-125 — Administrator-Only Screen with Explicit Framing
The Audit Log states plainly, near the top, that it is visible only to the active league's Administrator, and that every correction, override, and system-generated eligibility grant that has ever touched competitive results is listed, in reverse-chronological order, and that nothing on this screen can be edited or deleted (immutability is a feature to communicate, not just a backend constraint).

## UIR-126 — Multi-Dimensional Filter Controls
The log supports the filter pattern described in UIR-021: action-type buttons (all types the backend records: roster correction, score override, override undo, replacement-eligibility grant, injury declared, timer extended, config changed), a team-or-league-settings scope dropdown, and a from/to date range, all combinable.

## UIR-127 — Standard Audit Row Shape
Each row shows: timestamp, actor (named administrator with avatar, or the System actor per UIR-032), action-type badge, the specific target (player+team+gameweek, or a settings key), a plain-language summary of what changed, and the recorded reason (or an em-dash if none was given).

## UIR-128 — Expandable Before/After Detail
Each row's full before/after state is available via the expandable-detail pattern (UIR-020), rendered as two side-by-side, syntax-distinguished (before in a warning color, after in a confirming color) data blocks.

## UIR-129 — Reason Field Is Optional but Always Displayed
Because a correction's reason is optional-but-recorded (`BR-145`), the row must have a Reason column regardless, showing an explicit placeholder (em-dash) rather than an empty cell when none was given, so its absence reads as "none provided," not as a rendering gap.

## UIR-130 — System-Actor Rows Explained
Where an audit entry's actor is the System rather than a human (currently, only EPL-exit replacement-eligibility auto-grants), a footnote or equivalent explains that "System" entries have no human actor and are generated automatically — distinguishing them from every other row, which is administrator-only and routed through the same audit recorder.

## UIR-131 — Config-Change Rows Use the Same Shape as Domain-Data Rows
A league-settings change (e.g., invitation-expiration window) is logged and displayed with the identical row shape as a player/roster/score correction — Target is "League Settings," Summary states the changed key and its old→new value — rather than a visually separate settings-change log.

## UIR-132 — Injury-Declaration Rows Carry Domain Context
An injury-declaration row's summary states both the outcome ("marked season-ending · replacement-eligible") and, via its reason field, the administrator's stated justification, since this action has a direct downstream effect on Secondary Draft/Replacement eligibility (`BR-066`–`BR-068`) that a reviewing administrator needs to be able to reconstruct later.

## UIR-133 — Timer-Extension Rows Carry Before/After Deadlines
A timer-extension row's expanded detail shows the exact before/after pick-deadline timestamps, not just a relative "+3:00" summary, so the audit trail is independently verifiable.

## UIR-134 — Audit Log Is League-Scoped
The Audit Log reflects only the active league's own administrative history; switching leagues (UIR-002) re-scopes it entirely — an administrator of multiple leagues never sees a merged cross-league log.

## 8.13 Score Corrections (League Administrator)

## UIR-135 — Precedence Explanation Banner
The screen leads with a three-tier visual stack explaining the authority order for a given data point: an active Administrator Override wins every time until undone; absent an active override, Official FPL data is authoritative; the application's own calculation is the fallback of last resort (`BR-139`–`BR-141`, `BR-143`).

## UIR-136 — Override Form
A form applies an override to a specific player's specific-Gameweek fantasy points: player and Gameweek are shown as context (read-only once a target is selected), the current Official FPL value is shown for comparison, a numeric input captures the desired override value, and an optional (but recorded) reason field is provided (`BR-145`).

## UIR-137 — Value-Compare Widget Updates Live
On applying an override, the form's value-compare widget must immediately show official value → new override value side by side, with the override flagged ("Manually Overridden"), and immediately reflect who applied it and when (UIR-030's live-preview pattern).

## UIR-138 — Auto-Detection Disclosure
The form states that official-data corrections are detected and applied automatically (`BR-139`) and that this manual form exists only for cases needing a human to step in before the next sync, or where official data itself is disputed — so an administrator understands this is the exception path, not the primary correction mechanism.

## UIR-139 — Active Overrides Table (League-Wide)
A table lists every currently active override across the whole league (not just the one being edited): player, team, Gameweek, official value, override value, and recorded reason, each row with its own Undo action.

## UIR-140 — Undo Moves a Row, Never Deletes It
Undoing an active override (UIR-033) removes it from the Active Overrides table and adds it to a separate Recently Undone table, stating which value (official or a subsequent override) is now authoritative — the record of the override having existed and been undone is preserved, not deleted.

## UIR-141 — Recently Undone Table
A separate table lists undone overrides: player, team, Gameweek, what value they had been overridden to, and current status/authoritative-value statement.

## UIR-142 — Override Reason Recorded and Displayed
Wherever an override or its undo appears (form, active table, log), the administrator's stated reason is shown, consistent with `BR-145`'s audit requirement and with the Audit Log's own reason-field treatment (UIR-129).

## UIR-143 — Score Corrections Feed the Audit Log
Every override and undo performed on this screen must produce a corresponding Audit Log entry (UIR-125–UIR-134) — this screen and the Audit Log are two views into overlapping, not independent, data.

## UIR-144 — Score Corrections Is League-Scoped
Like Audit Log, this screen reflects only the active league's overrides; switching leagues re-scopes it entirely.

## 8.14 Security & Abuse Protection (System Administrator)

## UIR-145 — Explicit Platform-Level Framing
The screen states plainly, near the top, that it sits above every league — it is the platform-level System Administrator role (`BR-300`), separate from and not exposed through any per-league Administrator screen — so a viewer never mistakes this for league-scoped data.

## UIR-146 — Authentication Posture Summary
Three stat tiles summarize the current authentication mechanism: auth method (bearer JWT with a short-lived access token plus rotating refresh token), access-token lifetime (with refresh-token lifetime as context), and whether cookie-based flows are currently in use.

## UIR-147 — CSRF Protection Status and Rationale
A panel explains why the current bearer-token API is not exposed to classic CSRF (`BR-168`) — every state-changing request requires an `Authorization` header a browser never attaches automatically cross-site — states the current status (not exposed) alongside a standby status (cookie-flow CSRF middleware implemented but not active), and states that anti-CSRF protections activate automatically if a cookie-based flow is ever introduced, rather than being bolted on after the fact.

## UIR-148 — Rate-Limit Configuration Table
A table lists every currently configured rate limit: endpoint, limit, time window, scope (per IP, per IP+username, per email, per FantasyTeam, or per authenticated user), and active status (`BR-169`).

## UIR-149 — Recent Rate-Limit Events Feed
A reverse-chronological feed of recent rate-limit-triggering events, each tagged by category (Login, Password Reset, General API) with a plain-language description of what happened and the outcome (blocked for N minutes, throttled, no account action taken), and a relative timestamp.

## UIR-150 — Security Checklist
A checklist of platform-wide security controls currently in force (HTTPS everywhere, server-side input validation, parameterized queries/output encoding, security event logging with secrets redacted, least-privilege database roles, secrets never committed to source control), each citing its governing `BR-###` (`BR-164`–`BR-173`).

## UIR-151 — Security Screen Access Must Not Route Through Any League
Because this screen is explicitly not league-scoped (UIR-145), reaching it must never require an active league to be selected, and it must render identically regardless of which league (if any) is currently active in the league switcher. This is satisfied by reaching it through the "Platform" nav section (UIR-006a) rather than the mock-up's original placement inside the per-league "Admin" group. *(Revised in v1.1 — resolves §12 item 3 from v1.0.)*

## 8.15 Username Display Policy

## UIR-152 — Resolved-Decision Framing
The screen states that this is a resolved platform setting (not an open decision) — historical records show the username that was active at the time of the event — and that this closed what had been an open BRD decision, since the underlying data model always supported either choice (`BR-271`, `BR-278`) because a `UserId`, never the username, is the actual join key for history.

## UIR-153 — Comparison Toggle Retained for Illustration
A toggle between "Username at time of event" (shipped) and "Current username" (not shipped) is retained on the screen specifically so a viewer can see what the rejected alternative would have looked like — the shipped option is visually marked as such (a "Shipped" badge), and the toggle is explicitly framed as illustrative comparison, not a live configuration control.

## UIR-154 — Live Preview Across Multiple Record Types
Selecting either policy option must immediately update a live preview (UIR-030) showing the same example user's name as it would render across at least three different historical record types (final standings placement, draft-history pick, head-to-head result), demonstrating the policy applies uniformly everywhere a historical username appears, not just in one place.

## UIR-155 — Underlying Join Key Never Changes
The screen states explicitly that this display choice never changes what's actually stored — `UserId` remains the join key regardless of which display policy is shown (`BR-278`) — so a viewer does not mistake this for a data-migration concern.

## UIR-156 — Username Display Policy Is Platform-Wide, Not Per-League
Unlike the Audit Log and Score Corrections, this policy is described as applying platform-wide to every historical record, not scoped to the active league. It is reached via the "Platform" nav section (UIR-006a), not the per-league "Admin" group, and — like Security — must render identically with no active league selected. *(Revised in v1.1 — resolves §12 item 4 from v1.0. Access is restricted to a System Administrator, matching Security's audience, rather than any League Administrator: since the resolved policy is a single platform-wide answer with no per-league variation to administer, there is nothing for a League Administrator to configure here.)*

## 8.16 Profile

## UIR-157 — Two-Part Profile Structure
Profile is divided into a **User System Profile** section (global — applies everywhere the user uses Matchday Manager, not tied to any league) and a **User Season League Profile** section (repeated per league the user belongs to, each independently configurable), with each card/section visibly badged Global or League-specific (matching the scope badges used elsewhere).

## UIR-158 — Private Contact Information Display
The System Profile shows the user's email and phone number in a masked/partially-redacted form, with an explicit note that this is not shown to league members (`BR-015`).

## UIR-159 — Username Editing with Live Validation
A username field (global, `BR-004`/`BR-266`) allows editing with a Save action; on save, the UI must check for and clearly report a uniqueness conflict (an inline error state) versus success (an inline confirmation), and must state that changing a username never alters underlying account identity or rewrites history — older standings/drafts keep showing the username held at the time (`BR-326`, consistent with §8.15's policy).

## UIR-160 — Default Profile Icon Picker
A picker over a fixed icon catalog (never an arbitrary upload, `BR-011`) sets the user's global default profile icon (`BR-006`), shown in any league where the user hasn't set a league-specific override (`BR-008`).

## UIR-161 — Default Color Scheme Control, Synchronized with Top-Bar Switch
A second instance of the theme switch (UIR-010) lives in Profile; selecting a theme here and via the top-bar switch must always reflect the same, single stored preference — the two controls are two entry points to one setting, never independently stateful.

## UIR-162 — Per-League Icon Override
For each league the user belongs to, a per-league icon picker (same fixed catalog, UIR-160) lets them set a league-specific override (`BR-007`); the row states whether an override is currently set ("Custom icon set for this League") or the default is in use ("Using your default icon"), with an explicit "Use Default" action to clear an override back to inheriting the global default.

## UIR-163 — League Icon Independence
Setting or clearing one league's icon override must never affect any other league's icon (own or default) — each is stored and rendered independently (`BR-009`).

## UIR-164 — Per-League Notification Preferences, Not a Separate Screen
Each league's notification preferences (Gameweek Reminder, Weekly Score, Weekly Standings — each with independent Email and Text/SMS toggles) are configured directly within that league's card on the Profile screen, alongside its icon settings — not on a separate Notifications screen (`BR-339`) — and changing one league's preferences must never affect any other league's (`BR-338`).

## UIR-165 — Notification Toggle Reflects On/Off State Textually, Not Only Visually
Each notification toggle shows an explicit "On"/"Off" text label alongside the switch control itself, so state isn't conveyed by color/position alone.

## UIR-166 — Gameweek Reminder States Its League-Specific Lead Time
The Gameweek Reminder notification row states the specific lead time before roster lock that applies to this league (e.g., "24 hours before your roster lock"), since this is itself a per-league configured value, not a platform-wide constant.

## UIR-167 — "How You'll Appear" Preview
A summary panel shows, for every league the user belongs to, the resolved icon and username exactly as other members of that league would currently see them (`BR-277`) — this must recompute live as the user changes their username, default icon, or any league-specific icon override elsewhere on the same screen (UIR-030).

## UIR-168 — Profile Reflects All Memberships, Not Just the Active League
Unlike every other league-scoped screen (which re-scope on switching the active league, UIR-002), the League Season Profile section of Profile lists *every* league the user belongs to simultaneously, since a user manages all their league-specific settings from one place rather than needing to switch context repeatedly.

## UIR-169 — Username Save Failure Is Recoverable Inline
A failed username save (uniqueness conflict) must leave the user's typed input in place with a clear inline error, not silently revert to the old value or navigate away — the user should be able to correct and retry without re-typing.

## UIR-170 — Icon Catalog Consistency Across Contexts
The same fixed icon catalog (used for both the global default and every per-league override) must render identically wherever it's presented — same set, same visual treatment — so a user isn't learning two different picker UIs for what is conceptually one choice made in two places.

## UIR-171 — Global Settings Never Require a League to Be Selected
The System Profile section (username, default icon, default theme) must be fully usable even for a user viewing Profile without any particular league "active," since these settings are not league-scoped (mirrors UIR-151's requirement for the Security screen).

## UIR-172 — Profile Access Requires No Special Role
Unlike the Admin nav group's screens, Profile is available to every authenticated user regardless of role — it is the one screen every user, League Administrator or not, System Administrator or not, always has full access to for their own account.

---

**§8.17–8.20 (added in v1.4) have no mock-up screen behind them at all** — confirmed absent in §12 item 1 since v1.0. Every other section in §8 interprets a screen the mock-up already drew; these four are designed directly from the backend's already-implemented, already-consumable API (`registerUser`, `login`, `refreshToken`, `logout`, `requestPasswordReset`, `confirmPasswordReset`, `acceptInvitation` — see §3) and this client's own established conventions (the locked-field pattern, inline-error-without-losing-input from Profile's username save, `EmptyState`/`ErrorState`, card/form styling) rather than from mock-up interpretation. They render entirely outside the application shell (§6) — no top bar, no league switcher, no nav — since an Anonymous Visitor (§5) has no league context, and often no session, to show one for.

## 8.17 Login

## UIR-173 — Login Form
A form collects a single "username or email" field and a password (matching the backend's own `usernameOrEmail` login contract, `BR-156`, `BR-159`), with a single Sign In action.

## UIR-174 — Generic Invalid-Credential Message
A failed login shows one generic message ("That username/email or password isn't right.") regardless of whether the identifier was unrecognized or the password was wrong for a real account — never a message that discloses which half was incorrect, since that would let a visitor enumerate valid usernames/emails by trial and error.

## UIR-175 — Links to Register and Forgot Password
The form links to both Register (§8.18, for a visitor with no account yet) and Forgot Password (§8.19, for a visitor who has one but can't recall the password).

## UIR-176 — Already-Authenticated Users Skip the Auth Screens
A visitor who already holds a valid session and navigates directly to Login, Register, or Forgot/Reset Password (§8.17–8.19) is redirected away immediately (to the destination in UIR-177) rather than shown the form again — these four screens are for an Anonymous Visitor only.

## UIR-177 — Return-to-Origin After Login
A visitor redirected to Login by attempting to reach a protected route while unauthenticated returns to that exact original destination immediately after a successful sign-in, rather than always landing on the Dashboard. A visitor who reached Login directly (not via such a redirect) lands on their most-recently-active league's Dashboard if they belong to at least one league, or an explanatory empty state ("You're not a member of any league yet — ask a League Administrator to send you an invitation.") if they belong to none.

## 8.18 Register

## UIR-178 — Registration Form
A form collects username, email, password, and a password-confirmation field, with a single Create Account action (`BR-001`–`BR-004`).

## UIR-179 — Live Password-Strength Feedback, Not a Composition Checklist
As the password field is typed into, a live strength indicator updates continuously — never a static checklist of composition rules ("must contain a number/symbol/uppercase letter"), since the backend evaluates strength via an estimation mechanism rather than fixed composition rules (`BR-285`). The form states the twelve-character effective-length minimum plainly, and disables Create Account until the backend's strength bar is cleared, consistent with the same rule.

## UIR-180 — Inline Username-Availability Feedback
A uniqueness conflict on submission (`BR-004`) is shown as an inline error that leaves the typed username in place for correction, not a silent revert or navigation away — the same recoverable-inline pattern already established for Profile's username save (UIR-169).

## UIR-181 — Immediate Sign-In After Registration
A successful registration signs the new user in immediately, without a separate Login step — the backend's own registration response already carries a full token pair (`AuthTokenResponse`), so requiring a second, redundant sign-in would contradict what the contract already provides.

## UIR-182 — Link to Login for Existing Accounts
The form links to Login, for a visitor who already has an account and reached Register by mistake.

## 8.19 Forgot / Reset Password

## UIR-183 — Request-Reset Form
A form collects only an email address, with a single Send Reset Link action (`BR-284`).

## UIR-184 — Always-Identical Confirmation Regardless of Match
After submitting the request-reset form, the exact same confirmation message displays regardless of whether the email actually matched an account — the backend deliberately returns success unconditionally to avoid revealing account existence (`BR-284`), so the UI must never show a different message (e.g., "no account found") for a non-matching email, which would defeat that protection.

## UIR-185 — Reset-Confirmation Form
Following the link from the reset email lands on a form collecting a new password and its confirmation (reusing UIR-179's live strength feedback), with the reset token itself read from the link's URL rather than typed by hand.

## UIR-186 — Expired/Invalid/Already-Used Token Handling
A reset link that the backend rejects (expired, already used, or malformed) shows a plain statement that the link no longer works, with a direct path back to the request-reset form (UIR-183) to send a new one — never a generic/unexplained error.

## 8.20 Accept League Invitation

## UIR-187 — Invitation Link Requires Authentication First, Preserving the Invitation
Since accepting an invitation (`BR-027`) requires an authenticated session, an Anonymous Visitor who reaches an invitation link is routed to Register or Login first (their choice, both linked from this landing page) with the invitation's token carried through that detour; immediately after either succeeds, the visitor is returned to complete the same invitation's acceptance automatically, without needing to re-click or re-locate the original link.

## UIR-188 — No Preview Before Accepting
The confirmation screen states plainly that accepting will add the visitor to a league, without naming which one — the backend has no way to look up an invitation's target league before accepting it (only the accept action itself), so this screen does not pretend otherwise with a fabricated preview. Which league it was is first revealed by the `LeagueMembership` the accept action itself returns (`BR-027`), used to route the visitor onward (UIR-190).

## UIR-189 — Expired/Already-Used/Revoked Invitation Handling
An invitation the backend rejects (expired after one week per `BR-029`, already accepted, or revoked by a League Administrator) shows a single plain statement that the invitation is no longer valid — the backend's error response does not obviously distinguish these three causes from each other, so this screen does not invent a distinction it can't confirm.

## UIR-190 — Post-Acceptance Redirect
After a successful acceptance, the visitor lands on that league's Dashboard, with it now selected as the active league in the switcher (UIR-002) — the first time in the visit that which league it was becomes visible at all (UIR-188).

# 9. Non-Functional Requirements

- **Accessibility.** Interactive controls must be operable via keyboard alone (nav groups, tabs, toggles, sortable columns, expandable rows) and expose their state via appropriate ARIA attributes (`aria-current`, `aria-pressed`, `aria-selected`, `aria-expanded`), consistent with the patterns already present in the mock-up (UIR-008, UIR-026). A formal WCAG conformance target (e.g., 2.1 AA) should be set explicitly in `02-architecture` rather than left implicit.
- **Theming.** Both a dark and a light palette must maintain sufficient contrast for text and status colors (win/loss/draw, gold "live"/urgent accents) in both themes — the mock-up defines both palettes as CSS custom properties; this should be verified for contrast compliance, not merely assumed correct because both exist.
- **Responsiveness.** The application must remain fully usable from common desktop widths down to a defined minimum mobile width; grid-based layouts (Dashboard, Lineup, Draft Board) must reflow to a single column below the breakpoints the mock-up already defines (980px, 640px) rather than horizontally overflowing or truncating content.
- **Real-time accuracy.** Countdown clocks (UIR-013) must remain accurate to the second across a long-lived tab (i.e., computed from a fixed target timestamp, not by naive repeated decrementing that can drift).
- **Data currency.** Live/in-progress fixture states (EPL Fixtures, Dashboard) imply a need for the client to refresh score/status data at some interval or via push while a Gameweek is live; the exact mechanism (polling interval, WebSocket/SSE) is an architecture decision, but the requirement that displayed live states not go stale for the duration of a match is a UI requirement.
- **Performance.** Client-side filter/sort/search interactions (UIR-015, UIR-016, UIR-021) must feel instantaneous (no visible delay) for realistic list sizes (a league of up to a few dozen teams, a player pool in the low thousands).
- **Browser support.** Not specified by the mock-up; should be set explicitly in `02-architecture`.
- **Internationalization.** Out of scope for this version — the mock-up is English-only with no locale-switching affordance, and no UIR above assumes otherwise.

# 10. Screen-to-Role Access Matrix

| Screen | FantasyTeam Manager | League Administrator | System Administrator |
|---|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | — |
| Lineup | ✓ | ✓ | — |
| Squad | ✓ | ✓ | — |
| Table | ✓ | ✓ | — |
| Schedule | ✓ | ✓ | — |
| EPL | ✓ | ✓ | — |
| Season Predictions | ✓ | ✓ | — |
| History | ✓ | ✓ | — |
| Draft Board | ✓ | ✓ | — |
| Makeup Picks & Timeouts | ✓ | ✓ | — |
| Messages (view) | ✓ | ✓ | — |
| Messages (compose/publish) | — | ✓ | — |
| Audit Log | — | ✓ | — |
| Score Corrections | — | ✓ | — |
| Security & Abuse Protection | — | — | ✓ |
| Username Display Policy | — | — | ✓ |
| Profile | ✓ | ✓ | ✓ |

*(Security and Username Display Policy resolved to System-Administrator-only, reached via the "Platform" nav section (UIR-006a) rather than the per-league "Admin" group — see v1.1's revisions to UIR-006, UIR-151, and UIR-156.)*

**Pre-authentication screens (added in v1.4)** — reachable only by an Anonymous Visitor (§5), not by any of the three authenticated roles above, and outside the application shell entirely:

| Screen | Anonymous Visitor |
|---|:---:|
| Login | ✓ |
| Register | ✓ |
| Forgot / Reset Password | ✓ |
| Accept League Invitation | ✓ |

# 11. Traceability to Backend Epics

The backend's Epic and Feature Backlog (`03-epics-and-backlog/`) groups features into four build phases. Each UI screen maps most naturally onto one of those phases, which should inform this UI's own future backlog sequencing:

| Backend Phase | UI Screens It Corresponds To |
|---|---|
| Phase 1 — Foundation (Identity & Auth, User Profile & FantasyTeam, League & Season Management, EPL/FPL Data) | Profile, EPL, Login, Register, Forgot/Reset Password, Accept League Invitation (§8.17–8.20, added v1.4) |
| Phase 2 — Draft & Squad (Initial Draft, Secondary & Replacement Draft) | Draft Board, Makeup Picks & Timeouts, Squad |
| Phase 3 — Weekly Gameplay (Gameweek Roster, Scoring Engine, H2H Competition, Standings & Tie-Breaks) | Dashboard, Lineup, Table, Schedule, Season Predictions |
| Phase 4 — Operations (Corrections & Administration, Notifications, Reporting & History) | Audit Log, Score Corrections, Security, Username Display Policy, History, Messages, Profile's notification settings |

# 12. Gaps, Assumptions & Open Questions

These are not UI requirements yet — they are what the mock-up does not answer, surfaced now so they can be resolved before or during `02-architecture` rather than discovered mid-build.

1. ~~**No authentication, registration, or invitation-acceptance screens exist in the mock-up.**~~ **Resolved in v1.4.** Login, Register, Forgot/Reset Password, and Accept League Invitation are now designed in §8.17–8.20, from the backend's already-implemented `/api/v1/auth/*` and `/api/v1/invitations/{token}/accept` surface rather than from a mock-up (there still isn't one — see the note at the top of §8.17). League-creation/administration-setup (item 2 below) remains a separate, still-open gap; resolving this item did not require resolving that one too.
2. **No league-creation or league-administration-setup screens exist.** League Administrator actions like creating a league, sending invitations, or configuring the settings later shown read-only on the History screen's "config snapshot" (squad size, positional minimums, draft timer, points-per-result, invitation expiration) have no corresponding input screen in the mock-up. **Confirmed as deliberately out of scope, unlike item 1** — v1.4 designed the *receiving* end of an invitation (§8.20) but deliberately not the *sending*/league-creation end, which stays open pending its own scoping pass.
3. ~~**The Security screen's navigation placement contradicts its own stated scope.**~~ **Resolved in v1.1.** A structurally separate "Platform" nav section (UIR-006a), reachable with no league context and visible only to a System Administrator, now holds this screen. See the revised UIR-006, UIR-145, and UIR-151.
4. ~~**Username Display Policy has the same placement question.**~~ **Resolved in v1.1**, alongside item 3. It moves to the same "Platform" nav section and is scoped to System Administrator access only (not any League Administrator), since the resolved policy has no per-league variation for a League Administrator to configure. See the revised UIR-156.
5. **No error, empty, or loading states are depicted anywhere in the mock-up.** Every screen assumes a happy-path, fully-populated data set. This BRD cannot specify what a manager sees on, e.g., a network failure during Submit Roster, a league with zero messages yet, or a Draft Board pool still loading — these need their own requirements pass. **Partially addressed at the architecture level**: `02-architecture` defines baseline loading/error/empty component patterns every screen must use, but the screen-specific *content* of each state (what an empty Messages feed says, etc.) remains open and should be folded into `04-user-stories`' acceptance criteria as they're written, or a future BRD revision if a story surfaces a case this document doesn't already cover.
6. **No pagination is shown anywhere**, including on screens (Audit Log, Messages, History) whose real data volume will eventually exceed a single unpaginated page. The mock-up's filtering (UIR-021) reduces *visible* rows but does not address *loaded* row volume at scale. **Addressed at the architecture level**: the backend already paginates Audit Log, Draft selections, and Security events (confirmed against `API_ENDPOINTS.md`); `02-architecture` defines the client-side pagination pattern those endpoints require.
7. **The mechanism behind "live" data (in-progress EPL fixtures, live draft clocks) is unspecified.** Whether the client polls, holds a persistent connection, or something else is an architecture decision this BRD intentionally defers (see §9). **Addressed in `02-architecture`**, which sets a polling-based baseline.
8. ~~**Mobile-specific interaction patterns are unconfirmed.**~~ **Resolved in v1.1.** An off-canvas menu with accordion-grouped sections replaces reflow-only navigation below the mobile breakpoint. See the revised UIR-012.
9. **The relationship between "Profile → League Season Profile" notifications and any future dedicated Notifications screen is asserted, not just observed.** `BR-339` (cited directly in the mock-up) states preferences are managed on Profile rather than a separate screen; this is treated here as a settled backend decision this UI must honor (UIR-164), not an open UI question — flagged only so a future BRD revision doesn't reintroduce a separate Notifications screen without realizing that contradicts an already-resolved backend rule.
10. **Draft-pick timer extension is mentioned but has no depicted trigger.** Both Draft Board (UIR-101) and Makeup Picks (UIR-115) state "Admin may extend the timer," and the Audit Log shows a resulting "Timer Extended" record (UIR-133), but no screen in the mock-up shows the actual administrator control that performs the extension — this control needs to be designed, not merely inferred to exist. **Partially narrowed in v1.2**: the backend's OpenAPI spec (reconciled in `05-api-specification`) confirms this action takes a single `additionalSeconds` numeric input — so the control's *contract* is now known, even though its on-screen design still is not.
11. **A Draft can be `Paused` by a League Administrator, with no corresponding UI anywhere.** Discovered in v1.2 while reconciling `05-api-specification` against the backend's actual OpenAPI spec: `Draft.status` includes a `Paused` value alongside `Scheduled`/`InProgress`/`Completed`, and dedicated `pause`/`resume` operations exist, League-Administrator-only. Neither the mock-up nor any UIR in this document accounts for a paused-draft state or a control to trigger it — on Draft Board, on Makeup Picks & Timeouts, or anywhere else. Like items 1–2, this needs its own design pass with real source material (at minimum, an agreed answer to what other league members see while a draft they're mid-pick-order in is paused) before it can become a UIR — it is intentionally left undesigned here rather than invented without that input.
12. ~~**The mock-up depicts no way to actually change a Gameweek roster's composition.**~~ **Resolved in v1.3.** Only captain selection and Submit/Reset were wired up in the mock-up's JavaScript — nothing lets a manager choose a different 15 of their squad week to week, without which the screen would be non-functional for its actual purpose. New UIR-046a designs and requires the Add/Remove interaction this needed. Unlike item 11 (Draft-Paused), this wasn't left undesigned, because the feature has no fallback "skip it for now" — a Lineup screen that can only ever resubmit the same 15 players isn't a lineup screen.

# 13. Decision Register

| ID | Decision | Rationale |
|---|---|---|
| DEC-UI-001 | This BRD numbers its own requirements as `UIR-###`, kept entirely separate from the backend's `BR-###` numbering, and cites `BR-###` only by reference. | Prevents ambiguity about which pipeline (backend domain vs. this UI) owns a given identifier, and keeps this document mechanically re-derivable if the backend BRD is revised independently. |
| DEC-UI-002 | The mock-up's in-screen rule-explanation banners, live-preview widgets, and explicit "why this matters" panels (UIR-029–UIR-031, UIR-116) are treated as required UI patterns for this product, not merely as illustrative flourishes specific to the mock-up. | The mock-up was evidently built to make non-obvious backend rules legible to end users at the point of relevance; several BRD versions in the backend were themselves driven by gaps a mock-up review surfaced, suggesting this "explain the rule where it applies" pattern is a deliberate, load-bearing product characteristic rather than incidental mock-up styling. |
| DEC-UI-003 | The Security and Username Display Policy screens' nav placement (inside the per-league Admin group) is documented as an open question (§12, items 3–4) rather than silently "corrected" in this BRD. | This document's job is to interpret the mock-up as given, not to redesign it; a placement change is a real product decision that should be made deliberately in a later version, with its own rationale recorded here once resolved. |
| DEC-UI-004 | (v1.1) Security and Username Display Policy move out of the per-league "Admin" nav group into a new, structurally separate "Platform" nav section, visible only to a System Administrator and reachable with no league selected. | Resolves §12 items 3–4: both screens' own content already asserted platform-wide scope; the fix is to make the navigation match that assertion rather than relax the assertion to match the navigation. |
| DEC-UI-005 | (v1.1) Username Display Policy's access is narrowed to System-Administrator-only (not any League Administrator). | The resolved policy (`BR-326`) is a single platform-wide answer with no per-league variation — there is nothing league-specific for a League Administrator to view or configure here, so gating it the same way as Security (a genuinely platform-level concern) is more honest than leaving it reachable by every League Administrator. |
| DEC-UI-006 | (v1.1) Below the mobile breakpoint, navigation becomes an off-canvas menu with accordion-grouped sections, replacing the mock-up's reflow-only behavior. | Resolves §12 item 8. With 17 screens across four nav groupings (plus the new Platform section), a bottom tab bar cannot fit the primary destinations without an overflow menu of its own, and reflow-only navigation degrades badly well before typical mobile widths. An off-canvas drawer scales to the full destination count while preserving the same League/Draft/Admin grouping already established on desktop. |
| DEC-UI-007 | (v1.1) This BRD's scope is confirmed to remain the 17 mock-up screens; authentication/onboarding/league-creation screens are explicitly deferred to a future BRD revision rather than designed now. | Recorded here so the deferral is a documented decision (with its rationale — no source material to interpret yet) rather than a silent omission, per §12 items 1–2. |
| DEC-UI-008 | (v1.1) Frontend technology stack is React 18 + TypeScript, per the `02-architecture` document. | Recorded here only as a cross-reference; per §2.2's non-goals, this BRD does not itself make or own technology-selection decisions — see `02-architecture`'s own decision log for the rationale. |
| DEC-UI-011 | (v1.2) The Draft-Paused-state gap (§12 item 11), discovered while reconciling `05-api-specification` against the backend's OpenAPI spec, is recorded as a new open gap rather than designed into a UIR in this same revision. | Consistent with how DEC-UI-007 already treats out-of-scope items: a capability with no mock-up (or other) source material to interpret shouldn't be designed by inference just because its existence is now known — it needs its own deliberate design pass. |
| DEC-UI-019 | (v1.3) The mock-up's roster add/remove gap (§12 item 12) is designed and required now (UIR-046a), unlike the Draft-Paused gap, which stayed unresolved. | The distinguishing factor is functional necessity, not confidence: Draft-Paused is an edge case a league may rarely hit and the screen works fine without it in the meantime; a Lineup screen with no way to change roster composition fails at its one job every single week. |
| DEC-UI-020 | (v1.3) Submitting a Gameweek roster requires a captain to be selected among the chosen players, even though `RosterSubmissionRequest.captainPlayerId` is optional in the backend contract. | Matches UIR-047's own framing of captain selection as integral, not optional — and avoids a roster silently persisting with no captain, which would be a confusing state for a manager to discover only after the fact. |
| DEC-UI-035 | (v1.4) This BRD's scope extends beyond the original 17 mock-up screens to design Login, Register, Forgot/Reset Password, and Accept League Invitation (§8.17–8.20), resolving §12 item 1. League-creation/administration-setup (§12 item 2) is deliberately left out of this same pass. | The backend's auth/invitation API surface has sat fully implemented and unconsumed since DEC-UI-007 deferred it in v1.1; designing the four flows that let a real user actually reach an authenticated session is a functional necessity distinct from designing the League Administrator tooling item 2 covers, which can be scoped independently later. |
| DEC-UI-036 | (v1.4) Password strength (Register, Reset Confirmation) is shown via continuous live strength-estimation feedback, never a fixed composition checklist ("must contain a number/symbol"). | `BR-285` explicitly specifies strength-estimation over composition rules; a checklist UI would misrepresent a backend contract that doesn't work that way and could reject (or accept) passwords for reasons the UI's own checklist didn't predict. |
| DEC-UI-037 | (v1.4) A failed login shows one generic "that username/email or password isn't right" message, never a message that discloses which half was wrong. | Standard authentication practice: revealing whether the identifier was recognized lets a visitor enumerate valid usernames/emails by trial and error, independent of any password-guessing attempt. |
| DEC-UI-038 | (v1.4) Forgot Password's confirmation message is identical whether or not the submitted email actually matched an account. | Mirrors `requestPasswordReset`'s own unconditional-202 design (`BR-284`) exactly — a differently-worded UI message for a non-match would defeat the backend's own account-existence protection. |
| DEC-UI-039 | (v1.4) Accept League Invitation shows no league-name preview before the visitor commits to accepting. | `acceptInvitation` is the only operation touching an invitation token at all — there is no `GET` to preview it first — so a preview would have to be fabricated; stating the limitation plainly is more honest than pretending otherwise. |
| DEC-UI-040 | (v1.4) An invitation link reached while unauthenticated routes through Register/Login first, then resumes acceptance automatically, rather than requiring the visitor to re-find the original link afterward. | `acceptInvitation` requires a bearer token, so *some* detour through authentication is unavoidable; losing the invitation's token during that detour would silently break the one flow this screen exists for. |

# 14. Version History

| Version | Date | Summary |
|---|---|---|
| v1.0 | 2026-09-11 | Initial creation. Full screen inventory (17 screens) interpreted from `mockup/index.html`, cross-referenced against Backend BRD v1.17. Establishes `UIR-###` numbering, the screen-to-role access matrix, and the Gaps/Open Questions and Decision Register sections. |
| v1.1 | 2026-09-11 | Resolves §12 items 3, 4, and 8 ahead of proceeding to `02-architecture` and `04-user-stories`. Splits the "Admin" nav group (UIR-006) and introduces a new "Platform" nav section (UIR-006a) for Security and Username Display Policy, scoped to System Administrator access only and reachable independent of any league context. Replaces reflow-only mobile navigation with an off-canvas menu (UIR-012). Confirms this BRD's scope stays limited to the 17 mock-up screens, with auth/onboarding/league-creation explicitly deferred (§12 items 1–2). Adds DEC-UI-004 through DEC-UI-008. Updates the screen-to-role access matrix (§10) accordingly. |
| v1.2 | 2026-09-11 | Adds §12 item 11: a new gap discovered while reconciling `05-api-specification` against the backend's actual OpenAPI spec — a Draft can be `Paused` by a League Administrator, with no corresponding UI anywhere in this document. Narrows item 10 now that the timer-extension control's request shape is confirmed. Adds DEC-UI-011. No UIRs are added or changed — this version only records the new gap. |
| v1.3 | 2026-09-11 | Adds UIR-046a (Adding and Removing Players Between Roster and Reserves), discovered and resolved while implementing F-UI-003.2 (Lineup): the mock-up never wired up a way to actually change roster composition, only captain selection and Submit/Reset — unlike the Draft-Paused gap, this couldn't be left undesigned since the screen is non-functional without it. Also requires a captain be selected before Submit is enabled, beyond the backend's own optional-captain contract. Amends UIR-049. Closes §12 item 12 (new). Adds DEC-UI-019 and DEC-UI-020. |
| v1.4 | 2026-09-11 | Adds §8.17–8.20 (UIR-173–UIR-190): Login, Register, Forgot/Reset Password, and Accept League Invitation — the first sections in this document with no mock-up screen behind them at all, designed instead directly from the backend's already-implemented `/api/v1/auth/*`/`/api/v1/invitations/{token}/accept` surface and this client's own established conventions. Adds the Anonymous Visitor role (§5) and its access row (§10). Resolves §12 item 1 (item 2, league-creation/administration-setup, stays open, deliberately not part of this pass). Adds DEC-UI-035 through DEC-UI-040. |
