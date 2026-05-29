# ADR 0001 — Initial stack: Next.js + TypeScript + npm

- **Status:** Accepted
- **Date:** 2026-05-29
- **Decider:** FoundingEngineer (founder-level technical latitude per ALD-2)

## Context

ALD-2 asks us to stand up the foundation so the team can ship. The brief: optimize
for **fast web-product iteration** and **easy deployment**, keep it thin, and make it
runnable from a fresh clone with a single documented command. The product direction is
not yet finalized, so the stack must be product-agnostic and broadly capable (UI +
backend in one place), not betting on a narrow use case.

The codebase will be worked on by multiple agents and humans, so conventions should be
mainstream and well-documented (lots of training data, low ramp-up).

## Decision

- **Language: TypeScript.** Type safety catches errors early and makes multi-agent /
  multi-author collaboration safer and more self-documenting. Industry default for web.
- **Framework: Next.js (App Router), v16.** One framework for both frontend (React 19)
  and backend (Route Handlers / `app/api/*`), so we don't run or wire up a separate API
  service for the first product slices. Fast hot-reload dev loop, file-based routing,
  enormous ecosystem, and first-class deployment options (Vercel one-click, or a plain
  Node server / Docker on Fly, Render, etc. — we are **not** locked to Vercel).
- **Package manager: npm.** Ships with Node, so a fresh clone needs no extra global
  install before `make dev` / `npm install` works. The lowest-friction default for the
  "any agent or human can follow from clone to running app" success condition. (pnpm is
  faster but adds a prerequisite; not worth it at this stage.)
- **Node: >= 20** (pinned via `.nvmrc` and `engines`). Developed on Node 24.

## Alternatives considered

- **Vite + React SPA** — faster dev server, but no built-in backend; we'd stand up and
  deploy a separate API. Next gives full-stack in one repo and one deploy.
- **Remix / SvelteKit / Astro** — all capable, but smaller ecosystems and less agent
  familiarity than Next, with no decisive iteration-speed advantage for our case.
- **Plain Node/Express (+ separate frontend)** — more boilerplate, two things to run and
  deploy, no batteries-included routing or build pipeline.
- **pnpm / yarn** — good, but add a prerequisite step that works against one-command setup.

## Consequences

- **Positive:** thin full-stack starting point; trivial to add pages and API routes;
  multiple low-lock-in deploy targets; conventions familiar to agents and humans.
- **Trade-offs / debt:**
  - No CSS framework yet (plain CSS Modules). Tailwind or similar can be added later if
    the product wants it — noted as design debt, not a blocker.
  - No test framework wired yet. CI (lint + typecheck + tests) is a separate child task
    that depends on this one; `npm run typecheck` and `npm run lint` exist as the seed.
  - Next.js 16 has breaking changes vs. older mental models — see `AGENTS.md`, which
    points at the version's own docs under `node_modules/next/dist/docs/`.

## Reversibility

Early and reversible. The product code surface is tiny (one page, one health route), so
swapping framework or package manager later is low-cost. Revisit if a product direction
demands something Next doesn't serve well.
