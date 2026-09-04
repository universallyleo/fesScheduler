# Live-Fes Timetable Scheduler

A Japanese-first, local-first festival timetable PWA built with SvelteKit, TypeScript, and Bun. It renders a dense vertical time grid with lane-colored blocks, favorites, compact filtering, edit gestures, IndexedDB persistence, JSON transfer, and offline service-worker caching.

## Run locally

```sh
bun install
bun run dev
```

Useful checks:

```sh
bun run check
bun run lint
bun run test:unit -- --run
bun run build
```

Install Playwright browsers once before browser tests:

```sh
bun run test:e2e:install
bun run test:e2e
```

## GitHub Pages

`.github/workflows/deploy.yml` runs checks, unit tests, browser tests, and the static build on `main`, then deploys `build/` to GitHub Pages. The workflow supplies `BASE_PATH` from the repository name so project-page assets resolve correctly.

User timetable copies, favorites, and preferences stay in the browser’s IndexedDB; they are not included in the static deployment artifact.

## Architecture notes and implementation records

Detailed refactor plans and their progress records live in [`docs/superpowers/plans/`](docs/superpowers/plans/). The completed scheduler component/controller split is recorded in [`2026-09-04-component-refactor.md`](docs/superpowers/plans/2026-09-04-component-refactor.md); the README stays focused on using and deploying the app.
