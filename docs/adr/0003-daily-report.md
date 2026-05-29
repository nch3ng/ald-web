# ADR 0003 — Daily report for all apps: `gh`-driven script over a service

- **Status:** Accepted
- **Date:** 2026-05-29
- **Decider:** FoundingEngineer (founder-level technical latitude per ALD-8)

## Context

ALD-8 asks for a **daily report across all of our apps** that surfaces "the things we
need to address every day." The board clarified the projects live on GitHub
(`nch3ng/*`) and that the exact set to monitor is still being chosen together.

What needs surfacing daily, per repo: red CI on the default branch, PRs failing checks
or stuck awaiting review, attention-labelled / stale issues, and open security
(Dependabot) alerts.

Constraints in the environment:

- The GitHub CLI **is** authenticated (`repo` + `read:org`) and can read both public and
  private `nch3ng/*` repos — so a `gh`-driven tool needs no new credentials today.
- No monitoring service, dashboard host, or alerting account is provisioned.
- The monitored set is a moving target (board still deciding) — config must be trivial to
  edit without touching code.

## Decision

**Ship a zero-dependency Node script that reads a JSON config and polls each repo via
`gh`, rendering one markdown report.** No service, no database, no new accounts.

- `scripts/daily-report.config.json` — the `repos` list + thresholds. Editing this is the
  only step to change what's monitored.
- `scripts/daily-report.mjs` — plain Node ESM (runs on Node >=20, no `tsx`/build step).
  Each repo is inspected independently and failures degrade to notes, so one unreachable
  repo never breaks the report. `--out` also writes `reports/daily-report-YYYY-MM-DD.md`.
- `make report` — local entry point.
- `.github/workflows/daily-report.yml` — runs the script in CI. **Manual
  (`workflow_dispatch`) by default**; the daily `schedule` is committed but commented out
  so enabling recurring runs is an explicit human opt-in (it also needs a `MONITOR_TOKEN`
  secret with `repo` + `security_events` scope to read private repos and alerts).

### CI-health signal

"Is the default branch healthy" uses the latest **completed** run per `workflowName`,
**excluding Dependabot's internal `event: "dynamic"` update runs** — those are bot
version-bump attempts, not project CI, and including them produced dozens of false reds
in testing. Dependabot's *open PRs* and *security alerts* are still reported (they are
real action items), just not counted as CI failures.

## Alternatives considered

- **A hosted monitoring/dashboard service (Datadog, a custom Next.js page, etc.)** —
  heavier, needs an account/host and ongoing upkeep for a report that is fundamentally a
  daily digest. Deferred; the script can later feed such a surface if wanted.
- **GitHub's own notifications / Dependabot emails** — per-repo and noisy; no single
  cross-repo "what to address today" view, which is the actual ask.
- **A TypeScript module inside the Next app** — would couple an ops tool to the app build
  and require the bundler/`tsx`. A standalone `.mjs` runs anywhere `gh` is logged in.

## Spend & security

- **$0.** Uses the existing `gh` auth; GitHub Actions minutes on a public repo are free.
- No secrets in the repo. The optional `MONITOR_TOKEN` is a user-provided PAT stored as a
  GitHub Actions secret — it is never committed and only read inside the workflow.
- Reversible: delete the script + workflow, or empty the config, to disable.

## Open question (tracked on ALD-8)

The exact repo list and the delivery channel (Actions summary / artifact, issue comment,
email, Slack) are pending board input — asked via an interaction on ALD-8. The config
ships with a sensible starter set (recently-active `nch3ng/*` repos) so the tool is useful
immediately.
