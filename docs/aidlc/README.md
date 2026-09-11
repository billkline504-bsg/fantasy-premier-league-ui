# AIDLC Documentation — Matchday Manager Web Client

This folder holds every artifact produced for the Fantasy EPL League Manager **web UI** ("Matchday Manager") through the same AIDLC (AI-driven documentation/development lifecycle) pipeline convention used by the backend (`fantasy-premier-league`) repository. Each subfolder is one stage of that pipeline, numbered so they sort in the order the pipeline actually runs.

The actual application (a Vite + React + TypeScript project scaffolded per `02-architecture/`) lives at this repository's root, alongside this `docs/` folder — see the root [`README.md`](../../README.md) for how to run it. It implements **every one of the 17 screens the original mock-up depicts**, against the real backend API rather than mock data: **Profile** (F-UI-001.1/001.2), **EPL** (F-UI-001.3/001.4, current season only), **Draft Board** (F-UI-002.1/002.2, available players only), **Squad** (F-UI-002.4), **Dashboard** (F-UI-003.1), **Lineup** (F-UI-003.2), **Table** (F-UI-003.3), **Schedule** (F-UI-003.4), **Season Predictions** (F-UI-003.5), **Messages** (F-UI-004.1), **Audit Log** (F-UI-004.2, League-Administrator-only), **Score Corrections** (F-UI-004.3, League-Administrator-only), **Security & Abuse Protection** (F-UI-004.4, System-Administrator-only, platform-level), **Username Display Policy** (F-UI-004.5, System-Administrator-only, platform-level), and **History** (F-UI-004.6). Building Lineup required designing a real UI interaction the mock-up never depicted at all — adding and removing players between the roster and reserves (BRD UIR-046a) — since the screen would otherwise be unable to do the one thing it exists for. Building these against the real API surfaced twenty-two backend data-availability/model gaps recorded across API Consumption Specification v1.1–v1.12, the most consequential being that `FantasyTeam` has no distinct "team name" field at all — only a username — which affects nearly every screen, not just Draft Board. **Score Corrections surfaced the single most consequential finding in this project**: there is no `PlayerPerformance` lookup endpoint anywhere in the API, so its override form cannot offer the player+Gameweek picker and live official-value comparison the BRD depicts at all — it takes a raw id instead — and there is no endpoint to list existing overrides either, so its Active/Recently-Undone tables are reconstructed from Audit Log entries. Security's own findings are a milder instance of the same "schema under-specified for the UI" pattern: neither `RateLimitRule` nor `SecurityEvent` carries the scope/status/category fields the BRD depicts. Username Display Policy needed no new findings at all — it was confirmed as static/illustrative content, with no dedicated endpoint expected, in the very first pass of the API Consumption Specification. History closed out the mock-up's own 17-screen scope with one more confirmed-but-unimplementable requirement: there is no endpoint to check any user's retirement status except the caller's own, so its "Retired" tag can't be shown, even though the identity-safety half of that same requirement already holds by construction (every historical join is by internal id, never by username).

**v1.4 (BRD) extends past the mock-up's original scope for the first time**, designing the authentication/onboarding flows BRD DEC-UI-007 had deferred since v1.1: **Login**, **Register**, **Forgot / Reset Password**, and **Accept League Invitation** (F-UI-001.5–001.8, BRD §8.17–8.20) — the first screens in this whole client with no mock-up to interpret at all, designed instead directly from the backend's already-implemented `/api/v1/auth/*`/`/api/v1/invitations/{token}/accept` surface. This resolves BRD §12 item 1 in full; item 2 (league-creation/administration-setup) remains open, deliberately out of scope for this pass. Building these surfaced two more findings (API Consumption Specification v1.13): `acceptInvitation`'s `410` response has no structured field distinguishing an expired, already-accepted, or revoked invitation, so Accept League Invitation shows one generic message rather than a guessed three-way distinction; and `listMyLeagues` — confirmed caller-scoped — is used directly to resolve "does this user have zero leagues" for post-login landing, bypassing `ActiveLeagueContext`'s still-placeholder league list (a pre-existing, separately-tracked limitation this pass didn't attempt to fix). Every screen's implementation, reconciliation findings, and resulting scope decisions are recorded across this pipeline's documents — nothing under `src/screens/` remains a placeholder.

## Relationship to the backend repository

This UI is a client of the domain already specified in `fantasy-premier-league`. It does not re-derive business rules — it interprets them into screens, interactions, and presentation-layer requirements. Wherever a UI requirement exists to surface or enforce a rule owned by the backend, this documentation cites that rule's `BR-###` identifier rather than restating it. The backend's own pipeline artifacts are the authoritative source for those rules:

- `../../fantasy-premier-league/docs/aidlc/01-requirements/` — Business Requirements Document (BRD), latest v1.17
- `../../fantasy-premier-league/docs/aidlc/02-architecture/` — Architecture and Domain Model, latest v1.15
- `../../fantasy-premier-league/docs/aidlc/05-api-specification/` — OpenAPI Specification, v1.0
- `../../fantasy-premier-league/API_ENDPOINTS.md` and `EplFantasy.postman_collection.json` — a working REST surface this UI will consume
- `../mockup/index.html` (and its versioned `index.v{N}.html` snapshots) — the illustrative HTML mock-up this UI's first requirements pass was interpreted from, vendored into this repo at `docs/mockup/` for convenience. The backend repository's own `mockup/` folder remains the original source; if the two ever diverge, treat the backend copy as canonical unless this repo has explicitly taken over mock-up iteration.

## Pipeline stages

```
00-domain-specification → 01-requirements → 02-architecture → 03-epics-and-backlog → 04-user-stories → 05-api-specification → 06-database-migrations → 07-testing-strategy → 08-implementation-tasks
```

The backend's `06-database-migrations` and `07-testing-strategy` stages (in the sense of physical schema and DB-level test suites) don't have a direct UI analog; when this pipeline reaches those numbers, they'll be re-purposed for this project's actual needs (e.g., a component/visual testing strategy) rather than left unused — see each stage's own front matter once it exists for what it was repurposed to mean here.

| Stage | Produces |
|---|---|
| `00` seed | The inputs this UI's requirements are interpreted from: the mock-up and the backend BRD/Architecture |
| `01` requirements | BRD — screen inventory, `UIR-###` UI requirements, traceability to backend `BR-###` |
| `02` architecture | Frontend architecture: framework/stack choice, component structure, state management, API client layer |
| `03` epics & backlog | Screens/features refined into a prioritized, dependency-ordered build list |
| `04` user stories | Acceptance criteria per screen/feature |
| `05` API specification | The consumed contract — generated from or reconciled against the backend's OpenAPI spec |
| `06`–`08` | Repurposed as this project's needs become concrete (build/test/deploy tooling, implementation task breakdown) |

| Folder | Stage | Contents |
|---|---|---|
| `01-requirements/` | Requirements | The **Business Requirements Document (BRD)** — the authoritative source of every `UIR-###` UI requirement for this web client, interpreted from the mock-up and cross-referenced against the backend BRD. |
| `02-architecture/` | Architecture | Frontend stack (React + TypeScript + Vite), application structure, state management, the API client/codegen layer, routing (including the Platform nav section), live-data/polling strategy, and baseline loading/error/empty/pagination patterns. |
| `03-epics-and-backlog/` | Epics & Backlog | The BRD's 17 mock-up screens (plus, as of v1.1, the four auth/onboarding screens BRD v1.4 designed) refined into a prioritized, dependency-ordered feature list (`F-UI-###.#`), grouped into a foundational Phase 0 plus the same four build phases the backend uses, each feature citing the `UIR-###` range it implements. |
| `04-user-stories/` | User Stories / Feature Behavior Specs | Given/When/Then acceptance criteria for every feature in the backlog, grouped into the same four phase subfolders as the backend (`phase-1-foundation/`, `phase-2-draft-and-squad/`, `phase-3-weekly-gameplay/`, `phase-4-operations/`). |
| `05-api-specification/` | API Specification | The backend's OpenAPI v1.0 spec vendored verbatim, plus this client's **API Consumption Specification** — a feature-to-operation mapping, the pagination and idempotency/concurrency contracts, known error codes needing distinct UI treatment, and the reconciliation findings that drove Architecture v1.1 and BRD v1.2. |

## Versioning convention

Every artifact is **append-only**, exactly as in the backend repository: a change never edits a prior version's file — it's saved as a new `v{N}.md` in the same folder, one integer higher than the previous version. The highest version number in a folder is always the current baseline for that stage. Each document's own "Version History" section explains what changed and why between versions.

## Current baseline (highest version in each folder)

| Stage | Latest version |
|---|---|
| Requirements (BRD) | v1.4 |
| Architecture | v1.3 |
| Epic and Feature Backlog | v1.1 |
| Feature Behavior Specs — Phase 1 | v1.1 |
| Feature Behavior Specs — Phase 2 | v1.0 |
| Feature Behavior Specs — Phase 3 | v1.0 |
| Feature Behavior Specs — Phase 4 | v1.0 |
| API Consumption Specification | v1.13 |

## Not yet produced

`06-database-migrations` onward (repurposed stages — build/test tooling, implementation task breakdown; see §"Pipeline stages" above). Also not yet produced anywhere in this pipeline: league-creation/administration-setup screens (BRD §12 item 2 — still deferred; item 1, authentication/onboarding, was resolved in BRD v1.4), and a design for the Draft-Paused state discovered in BRD v1.2 (§12 item 11).
