# ADR 0002 — Deploy target: GitHub Pages (pipeline proof) + Vercel/Node (recommended for production)

- **Status:** Accepted
- **Date:** 2026-05-29
- **Decider:** FoundingEngineer (founder-level technical latitude per ALD-4)

## Context

ALD-4 asks us to **prove we can deploy end-to-end**: pick a hosting target, wire a
repeatable deploy path that ships the hello-world app to a reachable URL, and document
deploy + rollback. The brief favors a low-friction, free/cheap tier with simple
rollback, and asks us to flag any spend that needs board approval.

Constraints discovered in the environment:

- No hosting accounts or deploy tokens are provisioned (no Vercel / Fly / Render / etc.
  credentials available to this agent).
- The GitHub CLI **is** authenticated (`repo` scope), so GitHub-native automation is the
  only deploy path an agent can execute today without provisioning a new account.
- GitHub Pages (via GitHub Actions) is **free**, needs **no new account or spend**, has a
  reachable public URL, and rolls back trivially (re-run a prior workflow or revert).

## Decision

**Prove the pipeline now on GitHub Pages; recommend Vercel/Node for production later.**

1. **GitHub Pages (now, to satisfy ALD-4).** Deploy a **static export** (`output:
   "export"`) of the app via `.github/workflows/deploy-pages.yml` on every push to
   `main` (and on-demand via `workflow_dispatch`). Zero spend, zero new accounts, fully
   automated, instant rollback. This proves the end-to-end deploy path today.

   - Static export is **opt-in** behind `STATIC_EXPORT=true` (see `next.config.ts`), so
     the default Node build (`make dev` / `make build` / `make start`) is unchanged.
   - The app is served under a repo subpath (`/ald-web`); the workflow injects
     `PAGES_BASE_PATH` from `actions/configure-pages` and Next sets `basePath` /
     `assetPrefix` accordingly.
   - **Limitation (accepted):** static hosting cannot run server features — SSR on each
     request, dynamic Route Handlers, Server Actions, ISR, image optimization. Today the
     app has none of those that matter: the `/api/health` GET reads nothing from the
     request, so it is pre-rendered to a static JSON file (its `timestamp` is the
     build/deploy time — a useful "last deployed at" marker).

2. **Vercel or Node/Docker (recommended for production).** Once the product needs real
   server behavior (dynamic APIs, SSR, auth, a database), move production to a host that
   runs the full Next.js Node app. **Vercel** is the lowest-friction first-party option
   (free Hobby tier, Git-push deploys, instant rollback); **Node/Docker on Fly.io or
   Render** is the portable fallback. This requires the board/CEO to provision an account
   (and authorize any paid tier) — tracked as a follow-up, **not** a blocker for ALD-4.

## Why GitHub Pages over alternatives (for the *proof*)

- **Vercel / Fly / Render** — best technical fit for a full-stack Next app, but each
  needs an account + auth token this agent cannot self-provision. Would block ALD-4 on a
  credential handoff. Chosen as the *production recommendation*, not the *proof*.
- **Static-only nature of Pages** — acceptable for a hello-world proof and even for a
  marketing/docs site; not acceptable as the long-term host once we have server features
  (hence recommendation #2).

## Spend

- **$0.** GitHub Pages on a public repo is free; no board approval required.
- The repo is published under the available authenticated GitHub account
  (`nch3ng`) as a **public** repo (free Pages requires public). The hello-world slice
  contains no secrets. Reversible: the repo can later be transferred to a company org or
  swapped for Vercel without code changes (deploy config is isolated and env-gated).

## Rollback

- **GitHub Pages:** re-run a previous successful "Deploy to GitHub Pages" workflow run
  from the Actions tab (redeploys that exact build), or `git revert` the bad commit and
  push — the workflow redeploys `main`. Each deploy is a discrete, restorable artifact.
- **Future Vercel/Node:** promote a previous deployment (Vercel) or redeploy a prior
  image/commit (Fly/Render). Documented when that host is provisioned.
