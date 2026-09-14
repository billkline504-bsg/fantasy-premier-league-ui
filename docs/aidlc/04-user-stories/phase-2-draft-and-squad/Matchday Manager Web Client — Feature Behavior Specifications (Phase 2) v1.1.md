# Matchday Manager Web Client
## Feature Behavior Specifications — Phase 2 (Draft & Squad) — Version 1.1

**Inputs:** BRD v1.6, Architecture v1.5, Epic and Feature Backlog v1.3 (v1.0's inputs: BRD v1.1, Architecture v1.0, Epic and Feature Backlog v1.0).
**Covers:** F-UI-002.1–002.4 (Draft Board, Makeup Picks & Timeouts, Squad).

---

## F-UI-002.1 — Draft Board: Order, Timer, and Pool

**As a** FantasyTeam Manager, **I want** to see the draft's order, the on-clock timer, and the available-player pool, **so that** I can make an informed pick when it's my turn and follow the draft otherwise.

- **AC1** (UIR-100, `BR-054`, `BR-056`): Given the draft's round order panel is open, when I read it, then completed picks, the team currently on the clock, and upcoming picks are each visually distinguished, and a note states how the order was derived and that it won't change even if later results reorder the standings.
- **AC2** (UIR-101, `BR-057`): Given a team is on the clock, when I view the on-clock panel, then it names the team, the manager, the pick number, and a live countdown that updates every second without a manual refresh. *(Amended v1.1 — this AC applies only while the draft's status is `InProgress`; see AC13 for the `Paused` case.)*
- **AC3** (Architecture §8): Given I remain on the Draft Board while a different team is on the clock, when 3–5 seconds elapse, then the on-clock panel's timer/turn state refreshes automatically.
- **AC4** (UIR-102, UIR-015, UIR-016): Given the player pool is showing all positions, when I click "MID" in the position filter and type "sak" in search, then only midfielders whose name contains "sak" remain visible; clicking a sortable column header (e.g., Points) reorders the visible rows accordingly.
- **AC5** (UIR-103): Given I am not the team currently on the clock, when I view the pool, then each row's "Draft" action is disabled/unusable for me.
- **AC6** (UIR-103): Given I am the team currently on the clock, when I click "Draft" on an available player, then a pick request is submitted for that player and, on success, the order panel advances to the next team. *(Amended v1.1 — this AC applies only while the draft's status is `InProgress`; see AC12 for the `Paused` case, where this is disabled even for the on-clock team.)*
- **AC7** (UIR-104): Given a player has already been drafted, when I view the pool, then that player's row remains visible (dimmed) with an "Owned · <team>" tag, rather than disappearing.
- **AC8** (UIR-105): Given a pick is made, when the Recent Picks panel updates, then it shows the new pick at the top with pick number, team, and player.
- **AC9** (UIR-106): Given the Initial Draft has not yet had any Gameweek scored, when I view the pool's Min/GP/Pts columns, then they legitimately read zero, and a note explains this is expected rather than missing data.
- **AC10** (UIR-107): Given I switch the active league in the top-bar switcher while on Draft Board, when the screen re-renders, then it shows the newly active league's own draft state, not the previous league's.
- **AC11** (UIR-214, added v1.1): Given the draft's status is `Paused`, when I view Draft Board, then a rule-banner-style explanation states plainly that the draft is paused and no picks can be made until a League Administrator resumes it — visible to every viewer, not only the Administrator.
- **AC12** (UIR-215, added v1.1): Given the draft's status is `Paused`, when I view any player row's "Draft" action, then it is disabled for me regardless of whether I'm the team on the clock, and this holds for every manager, not only whoever was on the clock at the moment it was paused.
- **AC13** (UIR-216, added v1.1): Given the draft's status is `Paused`, when I view the on-clock panel, then the live countdown (AC2) is replaced by a static "Paused" indicator — no specific time value (frozen or otherwise) is shown, since the backend records no remaining-time-at-pause value to show.
- **AC14** (UIR-217, added v1.1): Given I am a League Administrator, when the draft's status is `InProgress`, then I see a "Pause Draft" control; when its status is `Paused`, I see a "Resume Draft" control instead. Given I am not a League Administrator, when I view Draft Board in either state, then neither control is visible to me.
- **AC15** (UIR-218, added v1.1): Given a League Administrator pauses or resumes the draft from another session/device, when up to the existing 3–5 second poll interval elapses on my own Draft Board, then my view reflects the new status without my needing to manually refresh.

## F-UI-002.2 — Draft Board: Completion State

**As a** FantasyTeam Manager, **I want** to clearly see when a draft has concluded, **so that** I don't mistake a finished draft for one still in progress.

- **AC1** (UIR-109, `BR-052`, `BR-060`, `BR-197`): Given the final pick (regular or makeup) resolves, when I view Draft Board, then it states the draft is complete and that every FantasyTeam now holds its expected full squad size, rather than showing an order panel with no team on the clock and no further explanation.

## F-UI-002.3 — Makeup Picks & Timeouts

**As a** FantasyTeam Manager, **I want** to understand why a pick was skipped and how the makeup queue resolves it, **so that** I trust no team permanently loses a pick to a timeout.

- **AC1** (UIR-114, `BR-282`): Given I open this screen, when it renders, then a banner states the overall guarantee — no FantasyTeam ever permanently loses a draft pick to a timeout — before any detailed log content.
- **AC2** (UIR-110): Given regular rounds have completed with some picks skipped, when I view the progress tracker, then it shows regular-round completion (picks made of total, and how many were skipped) and, separately, makeup-round progress (pick N of total in the makeup queue).
- **AC3** (UIR-111): Given the makeup queue has multiple teams waiting, when I view the queue visualization, then each queued team's slot shows its status (done / current / pending) so I can see the whole remaining queue at a glance.
- **AC4** (UIR-112, UIR-113, `BR-282`): Given a makeup pick times out a second time, when the "what happened" log updates, then a re-queue entry appears, distinctly marked from a skip/pick/round-complete entry, stating in plain language that the team moved to the end of the queue rather than losing the pick.
- **AC5** (UIR-115): Given a team is on a repeat attempt after being re-queued, when I view its on-clock panel, then it visibly indicates this is a repeat attempt (e.g., "2nd attempt"), with the same live-countdown treatment as the main Draft Board.
- **AC6** (UIR-116): Given I am unfamiliar with why this mechanism exists, when I read the "why this matters" panel, then it explains the consequence of not having this rule in plain language.
- **AC7** (UIR-117): Given a league's current draft has no skipped picks at all, when I open this screen, then it renders an explicit "no makeup round in progress" state rather than an empty, unexplained log.

## F-UI-002.4 — Squad

**As a** FantasyTeam Manager, **I want** to see my full squad with how each player was acquired and their eligibility status, **so that** I understand my whole roster, not just this week's starting XI.

- **AC1** (UIR-055): Given I open Squad, when the summary strip renders, then it shows total squad size, count in the current Gameweek roster, a breakdown by acquisition method, and a count of replacement-eligible players.
- **AC2** (UIR-056, UIR-057): Given the full squad table is showing all positions, when I filter to "FWD" and sort by Points descending, then only forwards remain, ordered highest points first.
- **AC3** (UIR-058): Given the season has not yet had a Gameweek scored, when I view Min/GP/Pts columns, then they read zero and a note clarifies this is expected, matching the Draft Board's same disclosure.
- **AC4** (UIR-059): Given I switch the active league, when Squad re-renders, then it shows that league's squad, never a merged view across leagues.
- **AC5** (UIR-060): Given a player is in this week's starting roster per Lineup, when I check the same player's row on Squad, then its "in current Gameweek roster" flag agrees with Lineup — the two never disagree.
- **AC6** (UIR-061): Given I don't already know what "Secondary Draft" vs. "Replacement" acquisition badges mean, when I interact with one (hover/tap), then an explanation is discoverable.
- **AC7** (UIR-062, `BR-066`, `BR-067`): Given a player is flagged replacement-eligible, when I read their row, then it states the specific reason (EPL transfer-out, or admin-declared season-ending injury) rather than just the flag alone.
- **AC8** (UIR-063): Given a squad has been expanded by the Secondary Draft beyond its initial size, when I view Squad, then every player is listed and filterable — none are cut off by an arbitrary display cap.

## Version History

| Version | Date | Summary |
|---|---|---|
| v1.0 | 2026-09-11 | Initial creation, covering F-UI-002.1–002.4 against BRD v1.1. |
| v1.1 | 2026-09-11 | Against BRD v1.6/Architecture v1.5/Backlog v1.3, which resolve §12 item 11 (Draft-Paused) for Draft Board only. Adds AC11–AC15 to F-UI-002.1 (paused-state banner, blocked picks for every manager, replaced — not frozen or left running — timer display, League-Administrator-only pause/resume control, propagation via the existing poll interval). Amends AC2 and AC6 to scope their `InProgress`-only behavior explicitly now that a `Paused` state exists. F-UI-002.2–002.4 are unchanged; Makeup Picks & Timeouts (F-UI-002.3) does not yet exist as a built screen, so no equivalent ACs are added there in this pass. |
