# Matchday Manager Web Client
## API Consumption Specification — Version 1.0

**Inputs:** BRD v1.1, Architecture v1.0, Epic and Feature Backlog v1.0, Feature Behavior Specs v1.0 (all in this repo); Backend OpenAPI Specification v1.0 (vendored alongside this document as `Fantasy EPL League Manager — OpenAPI Specification v1.0.yaml`, copied verbatim from `fantasy-premier-league/docs/aidlc/05-api-specification/`).

---

# 1. Purpose

This client does not author its own API contract — the backend's OpenAPI v1.0 spec (71 endpoints, 23 controllers) is authoritative, and Architecture v1.0 (ADR-003) already commits to generating this client's request/response types directly from it. This document is the **reconciliation pass** the AIDLC pipeline's `05` stage exists for: it maps every UI feature (`F-UI-###.#`) to the exact operations it consumes, and — more importantly — records every place that reading the actual spec, line by line, turned up something the BRD and Architecture had not yet accounted for. Three such findings materially affect earlier documents and are called out immediately in §2 before the routine mapping in §3 onward; the rest of this document is confirmatory (a real mapping) rather than corrective.

# 2. Reconciliation Findings (read this section first)

## 2.1 Draft mutations require an `Idempotency-Key`; roster submission also requires `If-Match` — Architecture v1.0 didn't say so

The spec's `makeDraftPick` and `submitGameweekRoster` operations both take a required `Idempotency-Key` header (client-generated UUID, so a network-retried request can't double-submit — the backend cites `BR-237`). `submitGameweekRoster` additionally takes an `If-Match` header carrying the `ETag` the corresponding `getGameweekRoster` call returned, for optimistic concurrency. Neither requirement was mentioned in Architecture v1.0 (§6.2/§6.3 described the fetch wrapper and mutation hooks generically, with no idempotency- or concurrency-token handling). **This is corrected in Architecture v1.1** (new §6.5) rather than left as a note only in this document, since it changes how two concrete mutation hooks must be implemented. See §5 of this document for the consumption-level detail.

## 2.2 A Draft can be `Paused` — no screen in the BRD accounts for this

`Draft.status` is an enum of `Scheduled | InProgress | Paused | Completed`, and the spec defines `POST /drafts/{draftId}/pause` and `POST /drafts/{draftId}/resume`, both League-Administrator-only. Neither the mock-up nor BRD v1.1 depicts a paused-draft state or a pause/resume control anywhere on Draft Board or Makeup Picks & Timeouts. This is a genuine capability the backend supports that this UI currently has no design for — consistent with how BRD DEC-UI-007 already treats "no source material to interpret" cases, this is **not resolved here**; it's recorded as a new BRD gap (see BRD v1.2, §12 item 12) rather than designed ad hoc in this document. `extendDraftTimer`'s exact request shape (`{ additionalSeconds: integer }`) *is* now known, though, which partially resolves BRD's pre-existing gap #10 (the timer-extension control's existence was known; its input shape wasn't) — the control itself still needs designing.

## 2.3 `POST /users/me/reactivate` exists and is unaccounted for — confirmed out of scope, not a new gap

The spec includes a `reactivateUser` operation with no corresponding screen anywhere. Unlike §2.2, this isn't a new finding requiring a BRD update: it's squarely inside the already-deferred authentication/account-lifecycle scope (BRD DEC-UI-007, §12 item 1), so it's noted here for completeness and left there.

# 3. Feature-to-Operation Mapping

Organized by the Backlog's phases (`03-epics-and-backlog/`). Every `operationId` below is defined in the vendored spec; consult it directly for full request/response schemas rather than treating this table as a substitute for reading it.

## Phase 1 — Foundation

| Feature | Operations | Notes |
|---|---|---|
| F-UI-001.1 Profile: System Profile | `getCurrentUser`, `updateUsername`, `updateDefaultIcon`, `listProfileIcons` | `updateUsername`'s conflict path is what BRD UIR-159's inline-error acceptance criterion depends on — confirm the actual `errorCode` for a taken username against the running API (not yet enumerated in the spec's error examples) before implementing that branch. |
| F-UI-001.2 Profile: League Season Profile | `setLeagueIcon`, `clearLeagueIcon`, `getNotificationPreferences`, `updateNotificationPreferences`, `listMemberships` (to enumerate the user's leagues for the "every league at once" requirement, BRD UIR-168) | `NotificationPreference` is one row per `(eventType, channel)` pair — the UI's per-event, per-channel toggle grid (BRD UIR-164) maps directly onto iterating this array, not onto a single nested-object response. |
| F-UI-001.3 EPL: Table | `getEplTable` (per `eplSeasonId`) | |
| F-UI-001.4 EPL: Fixtures | `listGameweeks`, `getGameweekFixtures` | `Fixture.status` (`Scheduled/Postponed/InProgress/Completed/Abandoned`) is exactly the state set BRD UIR-078 needs to distinguish — no client-side inference of "live" from score+time is needed; the backend already classifies it. |

## Phase 2 — Draft & Squad

| Feature | Operations | Notes |
|---|---|---|
| F-UI-002.1 Draft Board | `getDraft`, `makeDraftPick`, `getDraftPlayerPool`, `listDraftSelections`, `extendDraftTimer` | `makeDraftPick` needs the `Idempotency-Key` header (§2.1). `getDraft`'s `pendingMakeupPicks` array is what both Draft Board (indirectly) and Makeup Picks (directly) render — one source, two views. |
| F-UI-002.2 Draft Board: Completion | `getDraft` (`status === Completed`) | |
| F-UI-002.3 Makeup Picks & Timeouts | `getDraft` (`pendingMakeupPicks`, `currentPickDeadline`), `extendDraftTimer` | The "what happened, in order" log (BRD UIR-112) has no single backing endpoint — it's an event history, not a `Draft` field. It must be assembled client-side from `listDraftSelections` (`isMakeupPick` flag) plus `getAuditLog`'s `DraftTimerExtended` entries, or the backend needs a dedicated timeline endpoint. **Flagged for `02-architecture` revisit** — this doesn't need a BRD change (the requirement is already right), just a data-sourcing decision this spec can't make unilaterally from the contract alone. |
| F-UI-002.4 Squad | `getSquad` | `SquadPlayerView` already carries every field BRD UIR-055–062 need (`acquisitionType`, `onCurrentGameweekRoster`, `replacementEligibleAt`, season-to-date stats) — no client-side derivation required. |

## Phase 3 — Weekly Gameplay

| Feature | Operations | Notes |
|---|---|---|
| F-UI-003.1 Dashboard | `getStandings`, `getSchedule`, `listLeagueMessages` | Dashboard is a composite of three independent reads, not one dashboard-specific endpoint — three separate query hooks (Architecture §6.3) compose it. |
| F-UI-003.2 Lineup | `getGameweekRoster` (capture `ETag`), `submitGameweekRoster` (`Idempotency-Key` + `If-Match`), `setCaptain` (no concurrency header — see §5), `getGameweekFixtures` | `RosterPlayer.selectionRole` (`StartingXI`/`Bench`) is server-computed post-scoring per the schema's own note ("not chosen by the user") — the client renders it, it does not decide it. |
| F-UI-003.3 League Table | `getStandings` (no `asOfGameweekId` — current) | |
| F-UI-003.4 Schedule & Results | `getSchedule` (optionally filtered to one Gameweek), `getMatch` | |
| F-UI-003.5 Season Predictions | `getSeasonGoalPrediction`, `submitSeasonGoalPrediction` | |

## Phase 4 — Operations

| Feature | Operations | Notes |
|---|---|---|
| F-UI-004.1 Messages | `listLeagueMessages`, `createLeagueMessage` | |
| F-UI-004.2 Audit Log | `getAuditLog` (`actionType`, `from`, `to`, `fantasyTeamId`, `limit`, `cursor`) | The `fantasyTeamId` filter's special `"__league_settings__"` sentinel value (for `ConfigurationChanged` rows with no owning team) is exactly what BRD UIR-131's "Target = League Settings" row shape needs — confirmed, not a client-side invention. |
| F-UI-004.3 Score Corrections | `createScoreOverride`, `undoScoreOverride` | |
| F-UI-004.4 Security (Platform) | `getRateLimitConfiguration`, `getSecurityEvents` (`limit`, `cursor`), `getCsrfStatus` | |
| F-UI-004.5 Username Display Policy (Platform) | *None* | Confirmed no dedicated endpoint exists (§2 of Architecture v1.0 already assumed this correctly) — this screen is static/illustrative content per BRD UIR-152–155, not a data-driven view. |
| F-UI-004.6 History | `listSeasons` (`status=Completed`), `getStandings` (`asOfGameweekId` = the season's final Gameweek), `listDraftSelections`, `getGameweekRoster` (historical — no `If-Match` needed since it's read-only here), `getSeasonConfiguration` | `SeasonConfiguration`'s `lockedFields` array plus its `allOf` inheritance from `LeagueConfiguration` is exactly BRD UIR-093's "config snapshot, with changed values flagged" requirement — field-for-field: `initialSquadSize`, `weeklyRosterSize`, `positionalMinimums`, `draftTimerSecondsByType`, `leaguePoints`, `invitationExpirationDays` all match the mock-up's snapshot card. |

# 4. Pagination Contract

Three operations are cursor-paginated: `listDraftSelections`, `getAuditLog`, `getSecurityEvents`. Each takes shared `limit` (default 50, max 200) and `cursor` query parameters and returns a `{ items: [...], nextCursor: string | null }` page shape (`DraftSelectionPage`, `AdministrativeActionPage`, `SecurityEventPage` respectively). **This corrects an implicit assumption in Architecture v1.0 §11**, which described a page-size default and a "Load more" UI pattern but didn't specify the pagination *mechanism* — it is cursor-based, not offset/page-number-based. TanStack Query's `useInfiniteQuery` should use `nextCursor` as its `getNextPageParam`, not a computed offset. No other list-returning operation in the spec (`listMemberships`, `listInvitations`, `listFantasyTeams`, `listDrafts`, `listSeasons`, `getStandings`, `listClubs`, `listPlayers`) is paginated — these return full arrays, consistent with their expected size staying small (a league's membership count, a season's fantasy-team count, etc.).

# 5. Idempotency & Optimistic Concurrency Contract

| Operation | Idempotency-Key | If-Match (ETag) | Behavior on conflict |
|---|---|---|---|
| `makeDraftPick` | Required | Not used | `409 player_already_owned` if another team's concurrent pick for the same player won the race first. |
| `submitGameweekRoster` | Required | Required (from the preceding `getGameweekRoster`'s `ETag` response header) | `409` on a stale `If-Match` (someone/something changed the roster since the client's last read — e.g., an admin correction) — the client must refetch and prompt the user to reconcile, not blindly retry with the stale ETag. `409 season_goal_prediction_required` is a *different* 409 cause on this same operation (see §6) and must be distinguished by `errorCode`, not assumed to mean a concurrency conflict. |
| `setCaptain` | Not used | Not used | `409` only if the roster is already `Locked` (`BR-040`) — no concurrency token because this is a narrower, single-field mutation with its own simpler failure mode. |
| `correctRoster`, `createScoreOverride`, `undoScoreOverride`, `extendDraftTimer` | Not used | Not used | Administrator-only actions; the spec does not model concurrent-administrator conflicts for these today. |

Every `Idempotency-Key` the client sends must be a freshly generated UUID **per user-initiated action**, not reused across retries of what the user perceives as "the same click" versus a genuinely new submission — Architecture v1.1 §6.5 specifies exactly where in the mutation-hook lifecycle it's generated.

# 6. Known Error Codes Requiring Distinct UI Treatment

The generic `ErrorState` component (Architecture §10) handles any `ProblemDetails` body by showing `detail` and `correlationId`. The following `errorCode` values, however, are specifically named in the spec's operation descriptions and correspond to conditions the BRD already has an opinion about — these must be caught and handled with their own copy, not the generic fallback:

| `errorCode` | Operation | Surfaces as |
|---|---|---|
| `player_already_owned` | `makeDraftPick` | "That player was just taken — refreshing the pool" (auto-refetch the pool, don't just show a raw error) |
| `season_goal_prediction_required` | `submitGameweekRoster` | Directly implements BRD UIR-087's disclosed consequence — must route the user toward Season Predictions, not show a generic validation error. |
| `invalid_roster_composition` | `submitGameweekRoster` | Should render inline against the positional checklist (BRD UIR-045), telling the user which minimum is unmet — the checklist already shows this proactively (Architecture should make submission client-side-block on it, per BRD UIR-045's "enforces" language, so this server error becomes a rare defense-in-depth case rather than the primary path). |

Any `errorCode` not in this table falls back to the generic `ErrorState` treatment; this table should grow as the running API's actual error catalog is confirmed (the spec does not enumerate every possible `errorCode` value exhaustively — `player_already_owned` is given as an example in `ProblemDetails.errorCode`'s own schema description, not an exhaustive enum).

# 7. Vendored Spec File

`Fantasy EPL League Manager — OpenAPI Specification v1.0.yaml`, copied verbatim into this folder from the backend repository, is the exact file `openapi-typescript` (Architecture ADR-003) should run against. It is not modified in any way as part of vendoring — if the backend's spec changes, re-copy the whole file and note the change in this document's Version History rather than hand-editing the vendored copy.

# 8. Decision Register

| ID | Decision | Rationale |
|---|---|---|
| DEC-UI-009 | The backend's OpenAPI v1.0 YAML is vendored verbatim into this repo rather than referenced only by path into the other repo. | Codegen (Architecture ADR-003) needs a stable local file to run against; a cross-repo relative path would break for anyone who clones only this repository. |
| DEC-UI-010 | The three findings in §2 are handled at three different levels of formality: idempotency/concurrency corrects Architecture (v1.1), the Draft-Paused-state gap is logged as a new BRD gap (v1.2) without being designed here, and `reactivateUser` needs no action at all. | Matches each finding to the document whose job it actually is to own that kind of fact — this document's role is reconciliation and mapping, not silently expanding scope (Draft-Paused) or silently fixing an under-specified architecture detail without recording why (idempotency). |

# 9. Version History

| Version | Date | Summary |
|---|---|---|
| v1.0 | 2026-09-11 | Initial creation. Vendors the backend's OpenAPI v1.0 spec; maps every `F-UI-###.#` feature to its consumed operations; establishes the pagination and idempotency/concurrency contracts; records three reconciliation findings, triggering Architecture v1.1 and BRD v1.2. |
