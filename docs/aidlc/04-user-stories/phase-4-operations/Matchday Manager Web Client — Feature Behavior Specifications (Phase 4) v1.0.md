# Matchday Manager Web Client
## Feature Behavior Specifications — Phase 4 (Operations) — Version 1.0

**Inputs:** BRD v1.1, Architecture v1.0, Epic and Feature Backlog v1.0.
**Covers:** F-UI-004.1–004.6 (Messages, Audit Log, Score Corrections, Security, Username Display Policy, History).

---

## F-UI-004.1 — Messages

**As a** League Administrator, **I want** to publish announcements the whole league can see, **so that** I can communicate rules/schedule/news in one place; **as** any league member, **I want** to read them.

- **AC1** (UIR-118, `BR-221`–`BR-222`): Given I am not a League Administrator, when I open Messages, then the composer is hidden or disabled with an explanation; given I am the Administrator, then the composer is fully usable.
- **AC2** (UIR-119, UIR-120): Given I publish a message, when it's confirmed, then it appears at the top of the feed immediately, visually distinguished as newly published, with my name, role badge, and timestamp.
- **AC3** (UIR-121): Given my message contains line breaks, when it renders in the feed, then those line breaks are preserved and no markup is interpreted as formatting.
- **AC4** (UIR-122): Given I am about to publish, when I look beside the composer, then it states who will see this message (every active league member).
- **AC5** (UIR-123, `BR-223`): Given a message was published weeks ago, when I scroll the feed, then it's still there — nothing is silently removed.
- **AC6** (UIR-124): Given I switch the active league, when Messages re-renders, then it shows the newly active league's own feed and composer state, never a mix of leagues.

## F-UI-004.2 — Audit Log

**As a** League Administrator, **I want** an immutable, filterable record of every correction and override, **so that** I can review and explain any change to competitive results.

- **AC1** (UIR-125): Given I am not this league's Administrator, when I attempt to reach Audit Log, then I am denied access (route guard, Architecture §5.2), not merely shown a hidden nav link.
- **AC2** (UIR-125): Given I am the Administrator, when I open Audit Log, then a statement confirms this data is Administrator-only, reverse-chronological, and that nothing here can be edited or deleted.
- **AC3** (UIR-126): Given I want to see only Score Override entries for Iron Wall FC between Aug 1–31, when I set the action-type filter, team dropdown, and date range together, then only matching rows remain visible.
- **AC4** (UIR-127, UIR-129): Given a row has no recorded reason, when I view it, then the Reason cell shows an explicit placeholder (em-dash), not a blank cell.
- **AC5** (UIR-128, UIR-020): Given I click a row's "Details" toggle, when it expands, then the before/after state renders as two distinguished blocks (before in a warning color, after in a confirming color); clicking again collapses it and the label reverts to "Details."
- **AC6** (UIR-130, UIR-032): Given an entry was system-generated (e.g., an auto-granted replacement eligibility), when I view its Actor cell, then it shows "System" with a distinct icon, not a named administrator.
- **AC7** (UIR-131): Given a league-settings change occurred (e.g., invitation-expiration window), when I view its row, then it uses the identical row shape as a player/roster/score correction row, with Target = "League Settings."
- **AC8** (UIR-133): Given a draft pick timer was extended, when I expand that row's detail, then it shows the exact before/after deadline timestamps, not only a relative "+3:00" summary.
- **AC9** (UIR-134): Given I switch the active league, when Audit Log re-renders, then it shows only the newly active league's own history.
- **AC10** (Architecture §11): Given the log has more rows than the first page, when I click "Load more," then the next page of results appends below the current rows.

## F-UI-004.3 — Score Corrections

**As a** League Administrator, **I want** a clear, auditable way to override an incorrect score and undo it later, **so that** I can fix disputed data without bypassing the audit trail.

- **AC1** (UIR-135, `BR-139`–`BR-141`, `BR-143`): Given I open Score Corrections, when the precedence panel renders, then it states the three-tier authority order (Active Override → Official FPL Data → Application Calculation) plainly.
- **AC2** (UIR-136, `BR-145`): Given I select a player and Gameweek with no active override, when I view the form, then the current Official FPL value is shown for comparison, and I can enter a new value and an optional reason.
- **AC3** (UIR-137, UIR-030): Given I submit an override, when it applies, then the value-compare widget immediately updates to show Official → Override side by side, flagged "Manually Overridden," with who applied it and when.
- **AC4** (UIR-138, `BR-139`): Given I open the form without context, when I read its note, then it states official-data corrections apply automatically and this form is only for the exception cases.
- **AC5** (UIR-139): Given multiple overrides are active league-wide, when I view the Active Overrides table, then each row shows player, team, Gameweek, official value, override value, and reason.
- **AC6** (UIR-140, UIR-033): Given I click "Undo" on an active override, when it processes, then the row disappears from Active Overrides and a corresponding row appears in Recently Undone, stating which value is now authoritative — the record is not deleted.
- **AC7** (UIR-142, `BR-145`): Given an override or its undo has a reason, when I view it anywhere on this screen (form, active table, or the Audit Log), then the reason is shown consistently.
- **AC8** (UIR-143): Given I apply or undo an override, when I later check Audit Log, then a corresponding entry exists there.
- **AC9** (UIR-144): Given I switch the active league, when this screen re-renders, then it shows only the newly active league's overrides.

## F-UI-004.4 — Security & Abuse Protection (Platform)

**As a** System Administrator, **I want** platform-wide visibility into authentication and abuse-protection posture, **so that** I can monitor and explain the platform's security controls independent of any single league.

- **AC1** (UIR-145, `BR-300`): Given I am not a System Administrator, when I attempt to reach `/platform/security`, then I am denied access regardless of any league membership or administrator status I hold.
- **AC2** (UIR-145): Given I am a System Administrator with no league currently active in the switcher, when I open Security, then it renders fully and correctly.
- **AC3** (UIR-146): Given I view the auth-posture tiles, when they render, then they show the auth method, access-token lifetime, and cookie-flow status accurately.
- **AC4** (UIR-147, `BR-168`): Given I read the CSRF panel, when it renders, then it explains why the bearer-token API isn't exposed to CSRF today, shows current vs. standby status, and states that protections activate automatically if a cookie flow is introduced.
- **AC5** (UIR-148, `BR-169`): Given I view the rate-limit table, when it renders, then every configured limit (endpoint, limit, window, scope, status) is listed accurately.
- **AC6** (UIR-149): Given a rate-limit event occurred recently, when I view the events feed, then it shows the category, a plain-language description, the outcome, and a relative timestamp.
- **AC7** (UIR-150, `BR-164`–`BR-173`): Given I view the security checklist, when it renders, then each control cites its governing `BR-###`.
- **AC8** (UIR-151, Architecture §5.4): Given I navigate directly to `/platform/security` via a bookmarked URL with no league context, then the screen loads and renders identically to reaching it via in-app navigation.

## F-UI-004.5 — Username Display Policy (Platform)

**As a** System Administrator, **I want** to see how the resolved historical-username policy behaves, **so that** I can explain it if asked, even though it's no longer an open decision.

- **AC1** (UIR-152, `BR-271`, `BR-278`, `BR-326`): Given I open this screen, when it renders, then it states plainly this is a resolved setting, not an open decision, and explains why (the `UserId`, not username, is the actual join key).
- **AC2** (UIR-153): Given I view the policy toggle, when it renders, then "Username at time of event" is marked "Shipped" and "Current username" is marked as not shipped, both clearly comparison-only.
- **AC3** (UIR-154, UIR-030): Given I switch the toggle to "Current username," when the live preview updates, then all three example record types (standings placement, draft-history pick, head-to-head result) update together to show the current username instead of the historical one.
- **AC4** (UIR-155, `BR-278`): Given I read the screen's footnote, when I check it, then it states this display choice never changes what's actually stored.
- **AC5** (UIR-156): Given I am a League Administrator but not a System Administrator, when I attempt to reach this screen, then I am denied access — it is not reachable via the per-league Admin group.

## F-UI-004.6 — History

**As a** league member, **I want** to browse completed seasons' standings, drafts, and rosters, **so that** I can look back at past results and my own history in this league.

- **AC1** (UIR-089, UIR-023): Given the 2026/27 season is still in progress, when I view the season tabs, then it is shown disabled with an explanatory tooltip, while 2024/25 and 2025/26 are selectable and marked "Completed."
- **AC2** (UIR-090): Given I select a completed season, when it loads, then Final Standings, Draft History, and Gameweek Roster are available as a nested tab set, with Final Standings shown by default.
- **AC3** (UIR-091): Given I view Final Standings, when it renders, then a champion banner names the winning FantasyTeam and manager.
- **AC4** (UIR-093, `BR-296`): Given the league's invitation-expiration window has since changed from 7 to 10 days, when I view a season predating that change, then its configuration snapshot shows 7 days, flagged and annotated with why it differs from the current value.
- **AC5** (UIR-094): Given I want another team's draft history, when I use the team selector, then the view updates to that team's picks.
- **AC6** (UIR-095): Given I select a team's Draft History, when it renders, then every pick (number, player, position, club) is listed in order.
- **AC7** (UIR-096): Given I select a team and Gameweek for Gameweek Roster, when it renders, then the match result, fantasy points, captain, locked status, and full 15-player roster display.
- **AC8** (UIR-097, `BR-174`, `BR-178`, `BR-179`): Given a specific team/Gameweek combination isn't populated with illustrative data, when I select it, then an explanatory placeholder states the data is genuinely stored and queryable, rather than an ambiguous blank view.
- **AC9** (UIR-098, `BR-012`, `BR-013`, `BR-298`): Given a manager retired from the platform after a prior season and a different, later user has since taken a similar username, when I view the retired manager's historical record, then it displays correctly and tagged retired, joined by internal user identifier rather than by username, with no possibility of confusion with the later user.

## Version History

| Version | Date | Summary |
|---|---|---|
| v1.0 | 2026-09-11 | Initial creation, covering F-UI-004.1–004.6 against BRD v1.1. |
