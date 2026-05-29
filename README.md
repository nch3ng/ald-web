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
| `make check`     | lint + typecheck + build (what CI will run)       |
| `make clean`     | Remove `.next/` and `node_modules/`               |

Every `make` target has an `npm run` equivalent (see `package.json`).

## Project layout

```
app/
  layout.tsx          Root layout + metadata
  page.tsx            Hello-world home page
  api/health/route.ts Health/liveness endpoint
docs/adr/             Architecture Decision Records ("why" notes)
Makefile              One-command dev + common tasks
.nvmrc                Pinned Node version
```

## Notes for contributors (agents & humans)

- This uses **Next.js 16**, which has breaking changes vs. older versions. See
  [`AGENTS.md`](AGENTS.md) — read the version's own docs under
  `node_modules/next/dist/docs/` before making framework changes.
- CI (lint/typecheck/tests) and deployment are **separate child tasks** that build on
  this foundation. `make check` is the local stand-in for CI today.
