# Matchday Manager Web Client
## Feature Behavior Specifications — Phase 1 (Foundation) — Version 1.2

**Inputs:** BRD v1.1, Architecture v1.0, Epic and Feature Backlog v1.0. **v1.1 additionally reads:** BRD v1.4 (§8.17–8.20), Architecture v1.3 (§5.6, §7.1), Epic and Feature Backlog v1.1 (F-UI-001.5–001.8). **v1.2 additionally reads:** BRD v1.5 (§8.21–8.24), Architecture v1.4 (§5.7), Epic and Feature Backlog v1.2 (F-UI-001.9–001.12).
**Covers:** F-UI-001.1–001.4 (Profile, EPL); F-UI-001.5–001.8 (Login, Register, Forgot/Reset Password, Accept League Invitation — added v1.1); F-UI-001.9–001.12 (League Creation, League Settings, Invitations, League Members — added v1.2).

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

## F-UI-001.5 — Login

**As an** anonymous visitor with an existing account, **I want** to sign in, **so that** I can reach my leagues.

- **AC1** (UIR-173): Given I open Login, when it renders, then it shows one "username or email" field, one password field, and a single Sign In action.
- **AC2** (UIR-174): Given I submit incorrect credentials, when the request fails, then one generic message displays ("That username/email or password isn't right.") regardless of whether the identifier or the password was the actual problem.
- **AC3** (UIR-175): Given I have no account, or have forgotten my password, when I look at the form, then I find a link to Register and a link to Forgot Password respectively.
- **AC4** (UIR-176): Given I already hold a valid session, when I navigate directly to `/login`, then I'm redirected away immediately rather than shown the form.
- **AC5** (UIR-177): Given I was redirected to Login while trying to reach a protected page, when I sign in successfully, then I land back on that exact original page, not the Dashboard.
- **AC6** (UIR-177): Given I reached Login directly (no prior redirect) and belong to at least one league, when I sign in successfully, then I land on my most-recently-active league's Dashboard.
- **AC7** (UIR-177): Given I reached Login directly and belong to zero leagues, when I sign in successfully, then I see an explanatory empty state inviting me to wait for a league invitation, not an error or a blank screen.

## F-UI-001.6 — Register

**As an** anonymous visitor with no account yet, **I want** to create one, **so that** I can sign in and eventually join a league.

- **AC1** (UIR-178, `BR-001`–`BR-004`): Given I open Register, when it renders, then it shows username, email, password, and confirm-password fields with a single Create Account action.
- **AC2** (UIR-179, `BR-285`): Given I type a password, when I keep typing, then a live strength indicator updates continuously — never a static "must contain a number/symbol" checklist — and Create Account stays disabled until the estimated strength clears the twelve-character-effective-length policy.
- **AC3** (UIR-180, `BR-004`): Given I submit a username another active user already holds, when the conflict returns, then an inline error displays next to the field, my typed username is preserved, and nothing navigates away.
- **AC4** (UIR-181): Given my registration succeeds, when the response returns, then I am signed in immediately — no separate Login step is shown.
- **AC5** (UIR-182): Given I already have an account and reached Register by mistake, when I look at the form, then I find a link to Login.

## F-UI-001.7 — Forgot / Reset Password

**As a** user who can't recall their password, **I want** to reset it via a link to my email, **so that** I can regain access to my account.

- **AC1** (UIR-183, `BR-284`): Given I open Forgot Password, when it renders, then it shows one email field and a single Send Reset Link action.
- **AC2** (UIR-184, `BR-284`): Given I submit an email that does and one that does not match an account (two separate attempts), when each request completes, then both show the exact same confirmation message — nothing distinguishes a match from a non-match.
- **AC3** (UIR-185): Given I follow the link from a reset email, when the Reset Password screen loads, then it shows a new-password field (with the same live strength feedback as UIR-179) and a confirm field, with the reset token itself already carried from the link — I never type it by hand.
- **AC4** (UIR-186): Given the reset link the backend rejects (expired, already used, or malformed), when I attempt to submit a new password, then a plain statement explains the link no longer works, with a direct path back to Forgot Password to request a new one.

## F-UI-001.8 — Accept League Invitation

**As an** anonymous visitor (or an existing user) holding an invitation link, **I want** to accept it, **so that** I join the league it's for.

- **AC1** (UIR-187, `BR-027`): Given I open an invitation link with no existing session, when the landing page renders, then it offers both Register and Login, and following either one returns me to this same invitation afterward, automatically, without needing to re-click the original link.
- **AC2** (UIR-187): Given I open an invitation link while already signed in, when the landing page renders, then acceptance proceeds immediately with no detour through Register/Login.
- **AC3** (UIR-188): Given I view the confirmation before accepting, when I read it, then it states plainly that accepting adds me to a league, without naming which one — there is no preview.
- **AC4** (UIR-189, `BR-029`): Given the invitation the backend rejects (expired after one week, already accepted, or revoked), when I attempt to accept it, then a single plain statement explains the invitation is no longer valid, without a fabricated distinction among those three causes.
- **AC5** (UIR-190): Given my acceptance succeeds, when I land on the next screen, then it is that league's Dashboard, with that league now active in the switcher — the first point in the visit where I learn which league it was.

## F-UI-001.9 — League Creation

**As an** authenticated user, **I want** to create a new League, **so that** I can run my own private fantasy competition rather than only join ones I'm invited to.

- **AC1** (UIR-191, `BR-023`, `BR-032`): Given I open League Creation, when it renders, then it collects a League name, description, an EPL season identifier, and a start date for the first Season, with a single Create League action.
- **AC2** (UIR-192): Given I look for a way to choose the EPL season identifier from a list, when I check the field, then it's free text, not a dropdown — there is no endpoint to discover valid values.
- **AC3** (UIR-193, `BR-024`): Given my League is created successfully, when the confirmation displays, then it states plainly that I am now this League's sole Administrator.
- **AC4** (UIR-194): Given I have zero Leagues, when I look for how to create one, then I find it from the "no leagues yet" empty state; given I already belong to one or more Leagues, when I look for the same thing, then I find it from the league switcher too.
- **AC5** (UIR-195): Given creation succeeds, when I land on the next screen, then it is the new League's Dashboard, with it now active in the switcher.

## F-UI-001.10 — League Settings

**As a** League Administrator, **I want** to edit my League's details and configuration, **so that** I can run it the way my group actually wants without waiting on a backend change.

- **AC1** (UIR-196, `BR-025`): Given I open League Settings, when it renders, then I can edit the League's name, description, and status (Active/Archived), pre-filled with current values.
- **AC2** (UIR-197, `BR-292`, `BR-294`): Given I view the configuration editor, when it renders, then League Defaults and This Season's Configuration are two clearly separated sections, each stating what it does and doesn't affect.
- **AC3** (UIR-198, `BR-291`): Given I look for a parameter History's config snapshot doesn't show (e.g., replacement selection cap), when I check this screen, then it's editable here too — every `BR-291` parameter is present, not only History's six.
- **AC4** (UIR-199, `BR-291`, `BR-293`): Given a Season Configuration field is already past its lock point, when I view it, then it renders using the same locked-field treatment as elsewhere in this product (not merely disabled with no explanation).
- **AC5** (UIR-200, `BR-295`): Given I save a change, when it succeeds, then the confirmation states which fields actually changed, old value to new.
- **AC6** (UIR-201): Given I switch the active League, when I return to Settings, then it reflects only the newly active League; given I am not that League's Administrator, when I attempt to reach this screen, then I am denied access.

## F-UI-001.11 — Invitations

**As a** League Administrator, **I want** to invite people to my League and track who I've invited, **so that** I can grow my League without needing the backend team's help.

- **AC1** (UIR-202, `BR-028`): Given I open Invitations, when it renders, then a form collects a destination (email or phone) and a channel (Email or Text/SMS), with a single Send Invitation action.
- **AC2** (UIR-203, `BR-029`): Given I look at the form, when I check it, then it states the League's current invitation-expiration window before I send anything.
- **AC3** (UIR-204): Given my invitation sends successfully, when the confirmation displays, then it confirms delivery but never shows the invitation link or token itself.
- **AC4** (UIR-205): Given multiple invitations exist in different states, when I view the list, then each shows destination, channel, status (Pending/Accepted/Expired/Revoked), and expiration date, newest first.
- **AC5** (UIR-206): Given a Pending invitation, when I view its row, then a Revoke action is available; given an Accepted, Expired, or Revoked one, then no action is shown.
- **AC6** (UIR-207): Given I am not this League's Administrator, when I attempt to reach Invitations, then I am denied access.

## F-UI-001.12 — League Members

**As a** league member, **I want** to see who's in my League and manage my own membership, **so that** I understand who I'm playing against and can leave if I need to; **as the** League Administrator, **I want** to remove a member who needs to go.

- **AC1** (UIR-208): Given I open Members, when it renders, then every member's username, Administrator badge (where applicable), join date, and status (Active/Left) display — I don't need to be the Administrator to see this.
- **AC2** (UIR-209): Given I am the League Administrator viewing another member's row, when I look for an action, then Remove is available; given I view my own row, then Remove is never shown there — only Leave League.
- **AC3** (UIR-210): Given I view my own row, when I look for an action, then Leave League is available, regardless of whether I'm the Administrator.
- **AC4** (UIR-211, `BR-283`): Given I am the sole Administrator and click Leave League, when the backend rejects it, then I see a plain statement that I can't leave because there's no way yet to transfer the Administrator role — not a generic error.
- **AC5** (UIR-212, `BR-020`): Given a member has been removed or has left, when I view the list, then their row is still there, status changed to "Left," not deleted.
- **AC6** (UIR-213): Given I switch the active League, when I return to Members, then it reflects only the newly active League.

## Version History

| Version | Date | Summary |
|---|---|---|
| v1.0 | 2026-09-11 | Initial creation, covering F-UI-001.1–001.4 against BRD v1.1. |
| v1.1 | 2026-09-11 | Adds F-UI-001.5–001.8 (Login, Register, Forgot/Reset Password, Accept League Invitation), against BRD v1.4's newly-designed §8.17–8.20. |
| v1.2 | 2026-09-11 | Adds F-UI-001.9–001.12 (League Creation, League Settings, Invitations, League Members), against BRD v1.5's newly-designed §8.21–8.24. |
