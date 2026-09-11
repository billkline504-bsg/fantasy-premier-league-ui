# Matchday Manager Web Client
## Feature Behavior Specifications — Phase 1 (Foundation) — Version 1.0

**Inputs:** BRD v1.1, Architecture v1.0, Epic and Feature Backlog v1.0.
**Covers:** F-UI-001.1–001.4 (Profile, EPL).

---

## F-UI-001.1 — Profile: User System Profile

**As a** user, **I want** to manage the account-level settings that apply everywhere I use Matchday Manager, **so that** I don't have to re-configure them per league.

- **AC1** (UIR-158): Given I open Profile, when the System Profile section renders, then my email and phone number display in a masked form (e.g., `w••••e@gaffersmail.com`) with a note that this is not shown to league members (`BR-015`).
- **AC2** (UIR-159, `BR-004`): Given I change my username to one already taken by another active user and click Save, when the save request returns a conflict, then an inline error ("Username already taken") displays next to the field, my typed value is preserved, and no navigation occurs.
- **AC3** (UIR-159, `BR-326`): Given my username save succeeds, when the confirmation displays, then a note states this never rewrites history — older standings/drafts keep showing the username held at the time.
- **AC4** (UIR-169): Given a username save fails, when I correct the value and click Save again, then the request retries without requiring me to reload the page or re-navigate to Profile.
- **AC5** (UIR-160, `BR-006`, `BR-011`): Given I open the Default Profile Icon picker, when it renders, then only icons from the fixed catalog are selectable — there is no upload control.
- **AC6** (UIR-161): Given I change the theme via Profile's theme switch, when I next look at the top bar's theme switch, then it reflects the same selection (and vice versa) — the two controls always agree.
- **AC7** (UIR-171): Given I have no league currently active in the league switcher, when I view Profile's System Profile section, then every control in it (username, default icon, default theme) is fully usable.

## F-UI-001.2 — Profile: User Season League Profile

**As a** user who belongs to more than one league, **I want** to configure my icon and notification preferences independently per league, **so that** a change in one league never leaks into another.

- **AC1** (UIR-162, `BR-007`): Given a league I belong to has no icon override set, when I view its card, then it shows "Using your default icon" and reflects my global default icon.
- **AC2** (UIR-162): Given I pick a different icon for one league, when the picker updates, then that league's row shows "Custom icon set for this League" with a "Use Default" action.
- **AC3** (UIR-163, `BR-009`): Given I set a custom icon for League A, when I view League B's card, then League B is unaffected (still showing its own override or default, independent of what I just did for League A).
- **AC4** (UIR-164, `BR-339`): Given I want to change how often I'm notified before a Gameweek deadline in one league, when I look for that control, then I find it inside that league's own card on this screen — not on a separate Notifications screen.
- **AC5** (UIR-164, `BR-338`): Given I toggle a notification channel off for League A, when I check League B's notification settings, then League B's settings are unchanged.
- **AC6** (UIR-165): Given a notification toggle is on, when I view it, then it shows the text "On" (not only a colored switch position); toggling it shows "Off" immediately.
- **AC7** (UIR-166): Given I view the Gameweek Reminder row for a specific league, when it renders, then it states that league's actual configured lead time (e.g., "24 hours before your roster lock"), not a generic constant.
- **AC8** (UIR-167, `BR-277`): Given I change my default icon, username, or a league-specific icon override anywhere on this screen, when the "How You'll Appear" panel re-renders, then it immediately reflects the change for every affected league, with no save-and-reload step required.
- **AC9** (UIR-168): Given I belong to three leagues, when I open Profile, then all three leagues' cards are shown simultaneously, regardless of which league is currently "active" in the top-bar switcher.

## F-UI-001.3 — EPL: Table View

**As a** league member, **I want** to see the real Premier League's own table, **so that** I can track club form independent of any fantasy league.

- **AC1** (UIR-074, `BR-329`, `BR-335`): Given I am viewing EPL with League A active in the switcher, when I switch to League B, then the EPL table's content does not change.
- **AC2** (UIR-076): Given I select a prior completed season's tab, when it loads, then the table reflects that season's final standings, distinctly labeled "Completed."
- **AC3** (UIR-077, `BR-334`): Given I view the current season's table, when it renders, then a legend states the data is official EPL/FPL data, not editable by any Fantasy League Administrator, and states the table's own tie-break order.
- **AC4** (UIR-079, `BR-331`): Given a season has completed, when I select its tab at any later point, then its final table remains fully browsable.

## F-UI-001.4 — EPL: Fixtures View

**As a** league member, **I want** to see real EPL fixtures by matchweek, including live matches, **so that** I understand my players' schedules and in-progress results.

- **AC1** (UIR-075): Given I am on the EPL Table view, when I select the Fixtures tab, then the Table view's content is hidden and the Fixtures view renders, with the toggle's selection state reflected.
- **AC2** (UIR-078): Given a matchweek has fixtures in three different states, when the matchweek's tab is selected, then each fixture renders per its actual state: completed fixtures result-coded (win/loss/draw), live fixtures show a running score and match minute distinctly styled from a final result, and upcoming fixtures show a kickoff time in place of a score.
- **AC3** (Architecture §8): Given a fixture is live, when 30–60 seconds elapse while I remain on the screen, then its score/minute refresh without a manual reload.
- **AC4** (UIR-080): Given the EPL Fixtures view shows a given matchweek's data, when the same matchweek's data is shown on Lineup's fixture strip or a player's "next opponent" context, then both agree — there is no independently-maintained second copy of this data in the client.

## Version History

| Version | Date | Summary |
|---|---|---|
| v1.0 | 2026-09-11 | Initial creation, covering F-UI-001.1–001.4 against BRD v1.1. |
