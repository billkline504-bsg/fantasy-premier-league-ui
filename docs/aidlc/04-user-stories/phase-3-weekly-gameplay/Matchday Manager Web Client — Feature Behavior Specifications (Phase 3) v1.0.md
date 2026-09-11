# Matchday Manager Web Client
## Feature Behavior Specifications — Phase 3 (Weekly Gameplay) — Version 1.0

**Inputs:** BRD v1.1, Architecture v1.0, Epic and Feature Backlog v1.0.
**Covers:** F-UI-003.1–003.5 (Dashboard, Lineup, League Table, Schedule & Results, Season Predictions).

---

## F-UI-003.1 — Dashboard

**As a** FantasyTeam Manager, **I want** an at-a-glance summary of my league standing and upcoming deadline, **so that** I know what needs my attention without navigating elsewhere.

- **AC1** (UIR-035, `BR-093`–`BR-094`): Given the current Gameweek's roster lock is 30 hours away, when I open Dashboard, then the scorebug shows the Gameweek number, a deadline message, and a live countdown ticking down in real time.
- **AC2** (UIR-036, `BR-051`, `BR-123`): Given my FantasyTeam is 2nd with a 6-3-0 record, when I view the stat tiles, then League Position, League Points (with W-D-L), Fantasy Goal Difference (with for/against), and Captain Points (with my tie-break rank) all display correctly.
- **AC3** (UIR-037, `BR-107`, `BR-111`): Given I have a Head-to-Head match scheduled this Gameweek, when I view the fixture card, then both teams' identities/managers/standings and the kickoff/roster-lock time display.
- **AC4** (UIR-038): Given recent league events exist (admin note, injury, result), when I view the news feed, then each item shows a category tag and relative timestamp, newest first.
- **AC5** (UIR-039, UIR-040): Given I am 2nd in the league, when I view the condensed standings, then my row is visually highlighted and a "View full table" link navigates to the full League Table.
- **AC6** (UIR-041): Given I belong to two leagues and switch the active one, when Dashboard re-renders, then every section reflects the newly active league only.
- **AC7** (UIR-042): Given the roster lock is under 2 hours away, when I view the deadline messaging, then it uses a visibly more urgent treatment than when the deadline was a day away.

## F-UI-003.2 — Lineup (Gameweek Roster)

**As a** FantasyTeam Manager, **I want** to build my weekly starting XI and set a captain within the rules, **so that** I maximize my score while never submitting an invalid roster.

- **AC1** (UIR-043, `BR-094`): Given the roster lock is 30 hours away, when I open Lineup, then the deadline banner shows the exact lock time and a live countdown.
- **AC2** (UIR-045, `BR-041`): Given I have only 1 forward selected against a minimum of 1, when I view the positional checklist, then Forwards shows satisfied (checkmark) while, e.g., Defenders shows unsatisfied if below its minimum, and the total-selected indicator reflects the current count against 15.
- **AC3** (UIR-046, UIR-052): Given my roster is set, when the pitch view renders, then each starting player shows as a shirt token grouped by position band, with name, club, and next opponent (home/away indicated), matching the same fixture data shown on EPL.
- **AC4** (UIR-047, UIR-048, `BR-045`, `BR-046`): Given no captain is yet set, when I click a starting player's token, then that player becomes captain (marked with a border treatment and a "C" badge); clicking a different starting player's token moves the captain designation there and removes it from the first.
- **AC5** (UIR-047, `BR-048`, `BR-049`): Given a captain is set, when I look for a vice-captain option, then none exists, and adjacent text states plainly that if the captain doesn't play, the bonus is simply lost.
- **AC6** (UIR-048): Given a player is on the bench (not in the starting XI), when I attempt to designate them captain, then the action is unavailable — only starting-XI players are captain-eligible.
- **AC7** (UIR-049): Given I have 12 reserves, when I view the reserves panel and it exceeds the space available, then it truncates with a count and a link to the full Squad screen.
- **AC8** (UIR-050): Given I've made changes to my roster, when I click "Reset," then all in-progress unsaved changes revert to the last submitted state; when I click "Submit Roster," then those changes are sent to the backend.
- **AC9** (UIR-051, `BR-094`, `BR-096`): Given the roster lock has passed for the current Gameweek, when I view Lineup, then the pitch and reserves render read-only and no further captain/roster changes are possible through this screen.
- **AC10** (UIR-054): Given an administrator has declared one of my players season-ending injured since I last viewed this screen, when I open Lineup or Squad, then this is disclosed in context, not only via the news feed.

## F-UI-003.3 — League Table

**As a** league member, **I want** the full standings with a clear tie-break explanation, **so that** I understand exactly why teams are ordered the way they are.

- **AC1** (UIR-064): Given the season is partway through, when I open the League Table, then every FantasyTeam's position, P/W/D/L, GF/GA/GD, captain points, and league points are shown.
- **AC2** (UIR-065, `BR-119`–`BR-125`): Given two teams are level on points, when I check why one ranks above the other, then the table's stated tie-break order (Points → GD → GF → H2H → Captain Points → Season Prediction → Random) explains it without needing to ask elsewhere.
- **AC3** (UIR-066, `BR-115`–`BR-117`): Given I don't already know the points convention, when I view the legend, then it states, e.g., "3 for a win, 1 for a draw."
- **AC4** (UIR-067, UIR-068): Given my FantasyTeam appears in the table, when I view it, then my row is highlighted and shows both my team name and my username.

## F-UI-003.4 — Schedule & Results

**As a** league member, **I want** to browse Head-to-Head fixtures by Gameweek, past and future, **so that** I can see results and plan around upcoming matches.

- **AC1** (UIR-069, UIR-070): Given I open Schedule, when it loads, then the Gameweek nearest kickoff is pre-selected, and each tab's label states whether it's Results, Upcoming, or Fixtures.
- **AC2** (UIR-071, UIR-024): Given a Gameweek has completed, when I view its fixtures, then each is result-coded (win/loss/draw) with both teams and the final score.
- **AC3** (UIR-072): Given a Gameweek hasn't been played yet, when I view its fixtures, then each shows both teams and the real kickoff time in place of a score.
- **AC4** (UIR-073, `BR-108`–`BR-110`): Given the season's full schedule was generated at season start, when I select a Gameweek several weeks in the future, then its fixtures are already shown (the draw doesn't reveal itself only week-by-week).

## F-UI-003.5 — Season Predictions

**As a** FantasyTeam Manager, **I want** to see my locked prediction and understand how the tie-break resolves, **so that** I trust the mechanism even though I can no longer change my guess.

- **AC1** (UIR-081, `BR-127`–`BR-128`): Given I submitted my prediction at season start, when I open this screen, then my prediction displays in a locked/read-only field stating when it locked and that it cannot be changed now.
- **AC2** (UIR-082, `BR-130`–`BR-131`): Given the season is in progress, when I view the actual-vs-predicted stats, then the actual EPL goal total so far is shown, and the "Final Comparison" explicitly reads "TBD" rather than a misleading partial calculation.
- **AC3** (UIR-083, UIR-031): Given other managers have also predicted, when I view the league predictions list, then my own value is shown, and every other manager's value shows a "hidden until season end" placeholder, not an empty cell or a fabricated number.
- **AC4** (UIR-084, `BR-131`–`BR-134`): Given I want to understand the tie-break, when I read the explanation panel, then it states the closest-prediction rule and the at-or-below tie-breaker, illustrated with a worked numeric example.
- **AC5** (UIR-085): Given I want to know where this sits among all tie-breaks, when I read the panel, then it states this is the last tier, after League Points/GD/GF/H2H/Captain Points.
- **AC6** (UIR-088): Given I switch the active league, when this screen re-renders, then it shows the newly active league's own prediction pool, not the previous league's.

## Version History

| Version | Date | Summary |
|---|---|---|
| v1.0 | 2026-09-11 | Initial creation, covering F-UI-003.1–003.5 against BRD v1.1. |
