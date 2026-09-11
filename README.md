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
- [`05-api-specification/`](docs/aidlc/05-api-specification/) — Vendored backend OpenAPI spec + this client's consumption contract (latest: v1.6)
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
                          (F-UI-002.4), Dashboard (F-UI-003.1), and Lineup (F-UI-003.2) are
                          fully implemented against the real API — every other screen is
                          still a scaffold placeholder (see docs/aidlc/04-user-stories/ for
                          what each should become)
  components/           — shared, screen-agnostic components (CountdownClock, Tabs, etc.)
  api/                  — generated OpenAPI types + the typed fetch client wrapper
  state/                — Theme / ActiveLeague / Auth contexts (Architecture §4.2)
  routes/               — route table and role-based route guards
```

## Current status

The application shell, routing, auth session handling, theming, and shared component patterns
are real and working (see the test suite). Six screens are fully implemented:

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

Building these against the real API rather than the mock-up surfaced eleven backend
data-availability/model gaps, recorded in API Consumption Specification v1.1–v1.6:

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

Every other screen under `src/screens/` is still a scaffold placeholder.
`src/state/ActiveLeagueProvider.tsx` and `src/routes/guards.tsx` both carry `TODO`s for wiring
up real league-membership/admin-role data once it's available — read those before assuming any
authorization check in this client is complete; the backend's own authorization remains the
actual authority regardless.
