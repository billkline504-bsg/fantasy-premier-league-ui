# Matchday Manager Web Client

The web UI for the Fantasy EPL League Manager platform. This client consumes the REST API
implemented in the [`fantasy-premier-league`](../fantasy-premier-league) repository; it does
not implement any business rules of its own.

## Documentation

Every requirement, architecture decision, and feature spec behind this client lives in
[`docs/aidlc/`](docs/aidlc/README.md), following the same AIDLC pipeline convention as the
backend repository:

- [`01-requirements/`](docs/aidlc/01-requirements/) — Business Requirements Document (latest: v1.3)
- [`02-architecture/`](docs/aidlc/02-architecture/) — Frontend architecture (latest: v1.2)
- [`03-epics-and-backlog/`](docs/aidlc/03-epics-and-backlog/) — Feature backlog
- [`04-user-stories/`](docs/aidlc/04-user-stories/) — Given/When/Then acceptance criteria, by phase
- [`05-api-specification/`](docs/aidlc/05-api-specification/) — Vendored backend OpenAPI spec + this client's consumption contract (latest: v1.9)
- [`mockup/`](docs/mockup/) — The illustrative HTML mock-up this UI was originally interpreted from

Read `docs/aidlc/README.md` first — it explains the pipeline and points at the current baseline
version of every stage.

## Getting started

```bash
npm install
npm run generate:api   # produces src/api/generated/schema.d.ts (gitignored, derived)
npm run dev
```

Copy `.env.example` to `.env.local` and point `VITE_API_BASE_URL` at a running instance of the
backend API (see the `fantasy-premier-league` repository's README for how to run it locally).

> This repo's `.npmrc` sets `legacy-peer-deps=true` — needed because of an npm@10 arborist bug
> resolving Vitest 5's optional peer dependencies (unrelated to this project's own dependency
> choices). Remove it once that's fixed upstream or npm is updated past the affected version.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and produce a production build |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | Run oxlint |
| `npm run generate:api` | Regenerate `src/api/generated/schema.d.ts` from the vendored OpenAPI spec |

## Project layout

Mirrors Architecture v1.1 §3:

```
src/
  app.tsx / main.tsx    — root component, providers, entry point
  shell/                — top bar, nav, off-canvas mobile menu
  screens/              — one folder per screen area; Profile (F-UI-001.1/001.2), EPL
                          (F-UI-001.3/001.4), Draft Board (F-UI-002.1/002.2), Squad
                          (F-UI-002.4), Dashboard (F-UI-003.1), Lineup (F-UI-003.2), Table
                          (F-UI-003.3), Schedule (F-UI-003.4), Season Predictions
                          (F-UI-003.5), Messages (F-UI-004.1), and Audit Log (F-UI-004.2)
                          are fully implemented against the real API — every other screen
                          is still a scaffold placeholder (see docs/aidlc/04-user-stories/
                          for what each should become)
  components/           — shared, screen-agnostic components (CountdownClock, Tabs, etc.)
  api/                  — generated OpenAPI types + the typed fetch client wrapper
  state/                — Theme / ActiveLeague / Auth contexts (Architecture §4.2)
  routes/               — route table and role-based route guards
```

## Current status

The application shell, routing, auth session handling, theming, and shared component patterns
are real and working (see the test suite). Eleven screens are fully implemented:

- **Profile** (`src/screens/profile/`) — System Profile (username, default icon, theme) and
  League Season Profile (per-league icon override, notification preferences), per BRD
  UIR-157–172.
- **EPL** (`src/screens/league/EplScreen.tsx` + `EplTableView`/`EplFixturesView`) — the real
  Premier League table and Matchweek-tabbed fixtures, per BRD UIR-074–080, **current season
  only** (see below).
- **Draft Board** (`src/screens/draft/`) — snake draft order, on-the-clock timer, the available
  player pool (filter/sort/search via the shared `PlayerTable` component), recent picks, and
  pick submission, per BRD UIR-099–109, **available players only** (see below).
- **Squad** (`src/screens/squad/`) — full squad summary, acquisition-method badges, and the
  specific replacement-eligibility reason (cross-referenced against unspent replacement
  opportunities), per BRD UIR-055–063 — the second real use of `PlayerTable`.
- **Dashboard** (`src/screens/dashboard/`) — scorebug with a deadline-urgency treatment, stat
  tiles (League Position and Captain Points rank computed independently from the same
  standings response), the next Head-to-Head fixture, a league news feed, and condensed
  standings, per BRD UIR-035–042.
- **Lineup** (`src/screens/lineup/`) — the roster-lock banner, a Gameweek EPL fixture strip,
  the positional-minimums checklist, a pitch view with captain selection, a reserves panel,
  and roster submission (idempotency-key + ETag concurrency), per BRD UIR-043–054. Building
  this required **designing a real interaction the mock-up never depicted at all**: adding
  and removing players between the roster and reserves (new BRD UIR-046a) — without it, the
  screen couldn't do the one thing it exists for.
- **Table** (`src/screens/league/TableScreen.tsx`) — the full League Table (every column BRD
  UIR-064 lists), the viewer's row highlighted, the points-per-result and tie-break-order
  disclosures, per BRD UIR-064–068. Reused every hook already built for Dashboard/Squad with
  no new reconciliation findings — the simplest screen so far.
- **Schedule** (`src/screens/league/ScheduleScreen.tsx`) — Gameweek-tabbed Head-to-Head
  fixtures (Results/Upcoming/Fixtures labels, pre-selecting the current Gameweek), fetching
  the whole season's schedule in one call so future Gameweeks are already loaded, per BRD
  UIR-069–073.
- **Season Predictions** (`src/screens/league/PredictionsScreen.tsx`) — the manager's own
  locked Season Goal Prediction (or a submission form if none exists yet), an actual-vs-
  predicted stats panel that reads "TBD" until the season ends, a worked-example explanation
  of the tie-break mechanics and where it sits in the overall tie-break order, and the League
  Predictions list — every other manager's value stays hidden, and isn't even requested, until
  the season completes, per BRD UIR-081–088.
- **Messages** (`src/screens/messages/MessagesScreen.tsx`, the first Phase 4 screen) — an
  Administrator-gated composer (hidden with an explanation for every other member) publishing
  to a reverse-chronological feed, a just-published message visually distinguished at the top
  of the feed for the rest of the session, plain-text bodies with line breaks preserved, and
  the permanent-retention disclosure, per BRD UIR-118–124. Needed no new API Consumption
  Specification revision — `LeagueMessage`/`createLeagueMessage` matched what the BRD already
  assumed.
- **Audit Log** (`src/screens/admin/AuditLogScreen.tsx`, League-Administrator-only) — a
  filterable (action type, team/league-settings scope, date range), cursor-paginated
  ("Load more") immutable history of every correction, override, and system-generated
  eligibility grant, each row expandable into a before/after detail block, per BRD
  UIR-125–134. The first screen to actually build a "Load more" UI atop this client's cursor
  pagination contract, and the sharpest example yet of a schema under-specified for what the
  UI needs — see below.

Building these against the real API rather than the mock-up surfaced sixteen backend
data-availability/model gaps, recorded in API Consumption Specification v1.1–v1.9:

- No phone-number field exists on the user profile despite the BRD depicting one; the
  profile-icon catalog is an image-asset reference with no stated hosting convention.
- There's no endpoint to discover which EPL seasons exist (so EPL only shows the current
  season — historical-season tabs are deliberately not built, since the only available
  workaround would make EPL's content vary by active league, violating UIR-074); live fixtures
  have no match-minute field (shown as "Live" plus the score, not a fake clock); clubs have no
  crest/color data (plain text badges).
- **`FantasyTeam` has no distinct "team name" field at all — only a username.** This is the
  most consequential finding: it isn't scoped to Draft Board, it affects nearly every screen
  still to be built that displays a team. This client's adopted convention, effective
  immediately: render `username` as team identity everywhere. `getDraftPlayerPool` also returns
  undrafted players only, so the pool doesn't show already-owned players (dimmed) the way the
  BRD describes — that would need a backend change, not a client workaround.
- The shared `sort` parameter's documented example values don't match either `getDraftPlayerPool`'s
  or `getSquad`'s actual schema field names — this client sends the schema names, unconfirmed
  against the running API either way.
- There's no "current Gameweek" endpoint (a fourth instance of the same "no current-X" pattern
  already seen for seasons and drafts), and `LeagueMessage` has no category field, so
  Dashboard's news feed is the real Messages feed with no Admin/Injury/Result tag — that would
  need a backend addition to implement as the BRD depicts it.
- `HeadToHeadMatch` has no per-match kickoff-time field — every unresolved match in a Gameweek
  on Schedule shows the same Gameweek-level first-kickoff time, not a fabricated distinct time
  per match the way the mock-up showed.
- There's no bulk "list every FantasyTeam's Season Goal Prediction" endpoint, and the
  endpoint's own authorization would technically let any active league member read any team's
  prediction at any time — Season Predictions' "hidden until season end" reveal rule (BRD
  UIR-083) is enforced entirely by this client choosing not to request other teams' values
  before then, not by anything the API itself restricts. The prediction record does, however,
  already carry the real lock timestamp and the server-computed final comparison once the
  season ends, so this client only derives the in-progress "goals so far" figure itself.
- Audit Log entries carry no dedicated summary/target-player/target-team fields — only
  completely untyped `beforeState`/`afterState` objects and an unenumerated `targetEntityType`
  string. Rather than guess at per-action-type field names the spec never documents, this
  client renders a generic before/after key diff as the row summary; the team-scope filter can
  likewise only offer the current season's teams, since Audit Log itself isn't season-scoped
  but there's no league-wide team-listing endpoint to build a fuller dropdown from.

Every other screen under `src/screens/` is still a scaffold placeholder.
`src/state/ActiveLeagueProvider.tsx` and `src/routes/guards.tsx` both carry `TODO`s for wiring
up real league-membership/admin-role data once it's available — read those before assuming any
authorization check in this client is complete; the backend's own authorization remains the
actual authority regardless.
