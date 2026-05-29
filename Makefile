# ald-web — common developer commands.
# `make dev` is the one-command path from a fresh clone to a running app:
# it installs dependencies if needed, then starts the dev server.

.PHONY: dev setup build start lint typecheck check clean

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

# Full local verification — mirrors what CI will run (ALD child task).
check: lint typecheck build ## Lint + typecheck + build

clean: ## Remove build output and dependencies
	rm -rf .next node_modules
