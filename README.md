# Matchday Manager Web Client

The web UI for the Fantasy EPL League Manager platform. This client consumes the REST API
implemented in the [`fantasy-premier-league`](../fantasy-premier-league) repository; it does
not implement any business rules of its own.

## Documentation

Every requirement, architecture decision, and feature spec behind this client lives in
[`docs/aidlc/`](docs/aidlc/README.md), following the same AIDLC pipeline convention as the
backend repository:

- [`01-requirements/`](docs/aidlc/01-requirements/) — Business Requirements Document (latest: v1.2)
- [`02-architecture/`](docs/aidlc/02-architecture/) — Frontend architecture (latest: v1.1)
- [`03-epics-and-backlog/`](docs/aidlc/03-epics-and-backlog/) — Feature backlog
- [`04-user-stories/`](docs/aidlc/04-user-stories/) — Given/When/Then acceptance criteria, by phase
- [`05-api-specification/`](docs/aidlc/05-api-specification/) — Vendored backend OpenAPI spec + this client's consumption contract
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
  screens/              — one folder per screen area; each screen is currently a scaffold
                          placeholder (see docs/aidlc/04-user-stories/ for what it should become)
  components/           — shared, screen-agnostic components (CountdownClock, Tabs, etc.)
  api/                  — generated OpenAPI types + the typed fetch client wrapper
  state/                — Theme / ActiveLeague / Auth contexts (Architecture §4.2)
  routes/               — route table and role-based route guards
```

## Current status

This is a scaffold: the application shell, routing, auth session handling, theming, and shared
component patterns are real and working (see the test suite), but every screen under
`src/screens/` is a placeholder pending actual feature implementation. `src/state/ActiveLeagueProvider.tsx`
and `src/routes/guards.tsx` both carry `TODO`s for wiring up real league-membership/admin-role
data once it's available — read those before assuming any authorization check in this client is
complete; the backend's own authorization remains the actual authority regardless.
