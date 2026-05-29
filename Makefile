# ald-web — common developer commands.
# `make dev` is the one-command path from a fresh clone to a running app:
# it installs dependencies if needed, then starts the dev server.

.PHONY: dev setup build start lint typecheck test ci check clean report

# One command from clone to running app on http://localhost:3000
dev: node_modules
	npm run dev

# Install dependencies (idempotent). node_modules is the make target so
# `make dev` only reinstalls when package-lock.json changes.
node_modules: package-lock.json
	npm install
	@touch node_modules

setup: node_modules ## Install dependencies only

build: node_modules ## Production build
	npm run build

start: ## Run the production build (run `make build` first)
	npm run start

lint: node_modules ## Lint
	npm run lint

typecheck: node_modules ## TypeScript type check
	npm run typecheck

test: node_modules ## Run the test suite once
	npm test

# Full local verification: lint + typecheck + test + build. This is the exact
# set of steps the GitHub Actions CI pipeline runs (.github/workflows/ci.yml),
# so a green `make check` locally means a green CI run.
check: lint typecheck test build ## Lint + typecheck + test + build (mirrors CI)

# Alias so `make ci` reproduces the CI pipeline locally. Delegates to `check`
# so the two can never drift apart.
ci: check ## Alias for `make check` — reproduce the CI pipeline locally

clean: ## Remove build output and dependencies
	rm -rf .next node_modules

# Daily report for all monitored apps (ALD-8). Reads scripts/daily-report.config.json,
# polls each repo via the `gh` CLI, and writes reports/daily-report-YYYY-MM-DD.md.
# Requires `gh auth login` with access to the configured repos.
report: ## Generate the daily cross-repo status report
	node scripts/daily-report.mjs --out
