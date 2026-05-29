# ald-web

The web application foundation. A thin **Next.js + TypeScript** slice you can run from a
fresh clone with one command. Stack rationale lives in
[`docs/adr/0001-stack-decision.md`](docs/adr/0001-stack-decision.md).

## Prerequisites

- **Node.js >= 20** (developed on 24). With [nvm](https://github.com/nvm-sh/nvm):
  `nvm use` (reads `.nvmrc`). npm ships with Node — nothing else to install.

## Run it (one command)

From a fresh clone:

```bash
make dev
```

That installs dependencies (first run only) and starts the dev server at
**http://localhost:3000**. You should see the "Hello, world" page.

No `make`? The equivalent two steps:

```bash
npm install
npm run dev
```

## Verify it's working

- App: open http://localhost:3000
- Health check: http://localhost:3000/api/health → `{"status":"ok",...}`

```bash
curl -s http://localhost:3000/api/health
```

## Common commands

| Command          | What it does                                      |
| ---------------- | ------------------------------------------------- |
| `make dev`       | Install (if needed) + run dev server              |
| `make setup`     | Install dependencies only                         |
| `make build`     | Production build                                   |
| `make start`     | Run the production build (run `make build` first) |
| `make lint`      | ESLint                                            |
| `make typecheck` | TypeScript type check (`tsc --noEmit`)            |
| `make test`      | Run the test suite once (Vitest)                  |
| `make check`     | lint + typecheck + test + build (mirrors CI)      |
| `make ci`        | Alias for `make check` — reproduce CI locally     |
| `make clean`     | Remove `.next/` and `node_modules/`               |

Every `make` target has an `npm run` equivalent (see `package.json`).

## Project layout

```
app/
  layout.tsx               Root layout + metadata
  page.tsx                 Hello-world home page
  page.test.tsx            Render smoke test for the home page
  api/health/route.ts      Health/liveness endpoint
  api/health/route.test.ts Test for the health endpoint
docs/adr/                  Architecture Decision Records ("why" notes)
scripts/daily-report.mjs          Daily cross-repo report generator (ALD-8)
scripts/daily-report.config.json  Which repos to monitor + thresholds
.github/workflows/ci.yml          CI pipeline (lint + typecheck + test + build)
.github/workflows/deploy-pages.yml Deploy: static export → GitHub Pages
.github/workflows/daily-report.yml Daily report (manual; schedule opt-in)
vitest.config.mts          Test runner config
Makefile                   One-command dev + common tasks
.nvmrc                     Pinned Node version
```

## Testing

Tests run on [Vitest](https://vitest.dev) + React Testing Library.

```bash
make test          # run once (CI mode)
npm run test:watch # watch mode while developing
```

Test files live next to the code they cover, named `*.test.ts(x)`. Add a test
whenever you add a route or component so CI stays meaningful.

## Deploy

The hello-world slice deploys to **GitHub Pages** (static export) via GitHub Actions —
zero spend, no extra accounts, instant rollback. Full rationale and the production
recommendation (Vercel / Node) live in
[`docs/adr/0002-deploy-target.md`](docs/adr/0002-deploy-target.md).

**Live URL:** https://nch3ng.github.io/ald-web/ (health: https://nch3ng.github.io/ald-web/api/health)

### How it deploys

- **Automatically** on every push to `main`.
- **On demand** from the GitHub UI: Actions → "Deploy to GitHub Pages" → *Run workflow*.

The workflow ([`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml))
builds a static export and publishes it:

```bash
# What CI runs — reproduce a deploy build locally:
STATIC_EXPORT=true PAGES_BASE_PATH=/ald-web npm run build   # → ./out
npx serve out   # spot-check (note: app is served under the /ald-web base path)
```

> Static export is **opt-in** via `STATIC_EXPORT=true`. Without it, `make dev` /
> `make build` run the normal full Next.js Node app unchanged.

### One-time setup (per repo)

In GitHub: **Settings → Pages → Build and deployment → Source = "GitHub Actions"**.
After that, deploys are fully automated.

### Rollback

- **Fast path:** Actions tab → "Deploy to GitHub Pages" → open a previous successful
  run → **Re-run jobs**. This redeploys that exact earlier build.
- **Source path:** `git revert <bad-commit> && git push` — the workflow rebuilds and
  redeploys `main`.

Each deploy is a discrete, restorable artifact. For the future production host
(Vercel/Node), rollback is documented in the ADR when that host is provisioned.

## Daily report (all apps)

A daily cross-repo digest of **the things to address today** — red CI on the default
branch, PRs failing checks or stuck awaiting review, attention-labelled issues, and open
Dependabot alerts — across every repo we monitor. Rationale:
[`docs/adr/0003-daily-report.md`](docs/adr/0003-daily-report.md).

```bash
make report          # → prints the report and writes reports/daily-report-YYYY-MM-DD.md
```

- **What's monitored:** edit the `repos` list (and thresholds) in
  [`scripts/daily-report.config.json`](scripts/daily-report.config.json). That's the only
  step to add or remove a project.
- **Requirements:** the [`gh`](https://cli.github.com) CLI authenticated (`gh auth login`)
  with access to each repo. Private repos need the `repo` scope; Dependabot alerts need
  `security_events`. The script is zero-dependency Node (no build step).
- **Scheduling:** [`.github/workflows/daily-report.yml`](.github/workflows/daily-report.yml)
  runs it. It is **manual (`Run workflow`) by default**. To make it a true daily report,
  uncomment the `schedule:` block in that file **and** add a `MONITOR_TOKEN` repo secret
  (a PAT with `repo` + `security_events` scope). The report appears in the run's job
  summary and as a downloadable artifact.

## Notes for contributors (agents & humans)

- This uses **Next.js 16**, which has breaking changes vs. older versions. See
  [`AGENTS.md`](AGENTS.md) — read the version's own docs under
  `node_modules/next/dist/docs/` before making framework changes.
- **CI** runs lint + typecheck + test + build on every push and pull request via
  GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).
  Reproduce it locally with `make check` (or its alias `make ci`) before pushing.
  (The workflow activates once the repo is pushed to a GitHub remote.)
- **Deployment**: see the [Deploy](#deploy) section above and
  [`docs/adr/0002-deploy-target.md`](docs/adr/0002-deploy-target.md).
