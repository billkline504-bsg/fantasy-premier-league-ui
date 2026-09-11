# AIDLC Documentation — Matchday Manager Web Client

This folder holds every artifact produced for the Fantasy EPL League Manager **web UI** ("Matchday Manager") through the same AIDLC (AI-driven documentation/development lifecycle) pipeline convention used by the backend (`fantasy-premier-league`) repository. Each subfolder is one stage of that pipeline, numbered so they sort in the order the pipeline actually runs.

The actual application (a Vite + React + TypeScript project scaffolded per `02-architecture/`) lives at this repository's root, alongside this `docs/` folder — see the root [`README.md`](../../README.md) for how to run it. It implements the application shell, routing, auth/session handling, theming, and the shared component patterns described in `02-architecture/`, plus five fully working screens: **Profile** (F-UI-001.1/001.2), **EPL** (F-UI-001.3/001.4, current season only), **Draft Board** (F-UI-002.1/002.2, available players only), **Squad** (F-UI-002.4), and **Dashboard** (F-UI-003.1). Building these against the real API surfaced eleven backend data-availability/model gaps recorded across API Consumption Specification v1.1–v1.5, the most consequential being that `FantasyTeam` has no distinct "team name" field at all — only a username — which affects nearly every screen still to be built, not just Draft Board. Every other screen under `src/screens/` is still a scaffold placeholder pending the feature work described in `04-user-stories/`.

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
| `03-epics-and-backlog/` | Epics & Backlog | The BRD's 17 screens refined into a prioritized, dependency-ordered feature list (`F-UI-###.#`), grouped into a foundational Phase 0 plus the same four build phases the backend uses, each feature citing the `UIR-###` range it implements. |
| `04-user-stories/` | User Stories / Feature Behavior Specs | Given/When/Then acceptance criteria for every feature in the backlog, grouped into the same four phase subfolders as the backend (`phase-1-foundation/`, `phase-2-draft-and-squad/`, `phase-3-weekly-gameplay/`, `phase-4-operations/`). |
| `05-api-specification/` | API Specification | The backend's OpenAPI v1.0 spec vendored verbatim, plus this client's **API Consumption Specification** — a feature-to-operation mapping, the pagination and idempotency/concurrency contracts, known error codes needing distinct UI treatment, and the reconciliation findings that drove Architecture v1.1 and BRD v1.2. |

## Versioning convention

Every artifact is **append-only**, exactly as in the backend repository: a change never edits a prior version's file — it's saved as a new `v{N}.md` in the same folder, one integer higher than the previous version. The highest version number in a folder is always the current baseline for that stage. Each document's own "Version History" section explains what changed and why between versions.

## Current baseline (highest version in each folder)

| Stage | Latest version |
|---|---|
| Requirements (BRD) | v1.2 |
| Architecture | v1.2 |
| Epic and Feature Backlog | v1.0 |
| Feature Behavior Specs — Phase 1 | v1.0 |
| Feature Behavior Specs — Phase 2 | v1.0 |
| Feature Behavior Specs — Phase 3 | v1.0 |
| Feature Behavior Specs — Phase 4 | v1.0 |
| API Consumption Specification | v1.5 |

## Not yet produced

`06-database-migrations` onward (repurposed stages — build/test tooling, implementation task breakdown; see §"Pipeline stages" above). Also not yet produced anywhere in this pipeline: the authentication/onboarding/league-creation screens explicitly deferred by BRD v1.1 (DEC-UI-007), and a design for the Draft-Paused state discovered in BRD v1.2 (§12 item 11).
