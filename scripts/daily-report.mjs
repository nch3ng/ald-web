#!/usr/bin/env node
// Daily report for all apps (ALD-8).
//
// Polls a configurable set of GitHub repos via the `gh` CLI and produces a
// single markdown report of "things to address today": red CI, PRs failing
// checks or stuck awaiting review, attention-labelled or stale issues, and
// open security alerts. Zero dependencies — runs on Node >=20 with `gh`
// authenticated for each repo.
//
// Usage:
//   node scripts/daily-report.mjs            # print report to stdout
//   node scripts/daily-report.mjs --out      # also write reports/daily-report-YYYY-MM-DD.md
//   node scripts/daily-report.mjs --config path/to/config.json
//
// Exit code is 0 even when action items exist; it is non-zero only on a
// configuration/auth failure, so a scheduler can distinguish "report says
// there is work" from "the report could not run".

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

const args = process.argv.slice(2);
const writeOut = args.includes("--out");
const configPath = (() => {
  const i = args.indexOf("--config");
  return i >= 0 && args[i + 1] ? resolve(args[i + 1]) : join(HERE, "daily-report.config.json");
})();

const SEV = { high: "🔴", med: "🟡" };

/** Run a `gh` command and parse JSON. Returns {ok, data} or {ok:false, error}. */
async function gh(ghArgs) {
  try {
    const { stdout } = await execFileAsync("gh", ghArgs, { maxBuffer: 16 * 1024 * 1024 });
    return { ok: true, data: stdout.trim() ? JSON.parse(stdout) : null };
  } catch (err) {
    const msg = (err.stderr || err.message || String(err)).trim();
    return { ok: false, error: msg.split("\n")[0] };
  }
}

function daysSince(iso) {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/**
 * Expand each org in `orgs` to its non-archived repos (full `owner/name`).
 * Lets the config say "monitor everything in this org" instead of hand-listing
 * repos — which is how the apps are actually organised. Returns {repos, notes}.
 */
async function expandOrgs(orgs) {
  const repos = [];
  const notes = [];
  for (const org of orgs) {
    const res = await gh([
      "repo", "list", org, "--no-archived", "--limit", "200",
      "--json", "nameWithOwner",
    ]);
    if (res.ok && Array.isArray(res.data)) {
      repos.push(...res.data.map((r) => r.nameWithOwner));
    } else {
      notes.push(`org "${org}": could not list repos (${res.error || "unknown error"})`);
    }
  }
  return { repos, notes };
}

const FAIL_STATES = new Set(["FAILURE", "ERROR", "TIMED_OUT", "CANCELLED", "STARTUP_FAILURE"]);
function prChecksFailing(rollup) {
  if (!Array.isArray(rollup)) return false;
  return rollup.some((c) => FAIL_STATES.has(c.state) || FAIL_STATES.has(c.conclusion));
}

/** Gather everything for one repo. Never throws — failures become notes. */
async function inspectRepo(fullName, thresholds, attentionLabels) {
  const repo = { fullName, notes: [], actions: [], status: {} };
  const add = (sev, text, url) => repo.actions.push({ sev, text, url });

  const meta = await gh(["api", `repos/${fullName}`, "--jq", "{default_branch, open_issues_count, archived}"]);
  if (!meta.ok) {
    repo.notes.push(`could not read repo (${meta.error})`);
    return repo;
  }
  const branch = meta.data.default_branch || "main";
  if (meta.data.archived) repo.notes.push("repo is archived");

  // --- Default-branch CI ---------------------------------------------------
  const runs = await gh([
    "run", "list", "-R", fullName, "--branch", branch, "--limit", "60",
    "--json", "workflowName,event,conclusion,status,createdAt,url",
  ]);
  if (runs.ok && Array.isArray(runs.data)) {
    // Keep only real project CI: exclude Dependabot's internal "dynamic"
    // update runs, then take the latest completed run per workflow.
    const latest = new Map();
    for (const r of runs.data) {
      if (r.event === "dynamic") continue;
      if (r.status !== "completed") continue;
      if (!latest.has(r.workflowName)) latest.set(r.workflowName, r);
    }
    const reds = [...latest.values()].filter((r) => FAIL_STATES.has((r.conclusion || "").toUpperCase()));
    repo.status.ci = reds.length ? `${SEV.high} ${reds.length} workflow(s) failing on ${branch}` : `✅ green on ${branch}`;
    for (const r of reds) add("high", `[${fullName}] CI failing on ${branch}: "${r.workflowName}"`, r.url);
  } else {
    repo.status.ci = "⚠️ CI status unavailable";
    if (runs.error) repo.notes.push(`runs: ${runs.error}`);
  }

  // --- Open PRs ------------------------------------------------------------
  const prs = await gh([
    "pr", "list", "-R", fullName, "--state", "open", "--limit", "50",
    "--json", "number,title,createdAt,isDraft,reviewDecision,statusCheckRollup,url",
  ]);
  if (prs.ok && Array.isArray(prs.data)) {
    repo.status.prs = `${prs.data.length} open`;
    for (const pr of prs.data) {
      if (pr.isDraft) continue;
      const age = daysSince(pr.createdAt);
      if (prChecksFailing(pr.statusCheckRollup)) {
        add("high", `[${fullName}] PR #${pr.number} failing checks — "${pr.title}" (open ${age}d)`, pr.url);
      } else if (pr.reviewDecision !== "APPROVED" && age >= thresholds.stalePrDays) {
        add("med", `[${fullName}] PR #${pr.number} awaiting review ${age}d — "${pr.title}"`, pr.url);
      }
    }
  } else {
    repo.status.prs = "⚠️ unavailable";
  }

  // --- Open issues ---------------------------------------------------------
  const issues = await gh([
    "issue", "list", "-R", fullName, "--state", "open", "--limit", "100",
    "--json", "number,title,createdAt,labels,url",
  ]);
  if (issues.ok && Array.isArray(issues.data)) {
    repo.status.issues = `${issues.data.length} open`;
    const wanted = new Set(attentionLabels.map((l) => l.toLowerCase()));
    for (const it of issues.data) {
      const labels = (it.labels || []).map((l) => l.name.toLowerCase());
      const hit = labels.find((l) => wanted.has(l));
      if (hit) {
        add("med", `[${fullName}] issue #${it.number} labelled "${hit}" — "${it.title}"`, it.url);
      } else if (daysSince(it.createdAt) >= thresholds.staleIssueDays) {
        // Stale issues are informational, not action items — count only.
        repo.status.staleIssues = (repo.status.staleIssues || 0) + 1;
      }
    }
  } else {
    repo.status.issues = "⚠️ unavailable";
  }

  // --- Security (Dependabot) alerts ---------------------------------------
  const alerts = await gh([
    "api", `repos/${fullName}/dependabot/alerts?state=open&per_page=100`,
    "--jq", "[.[] | .security_advisory.severity] | group_by(.) | map({sev: .[0], n: length})",
  ]);
  if (alerts.ok && Array.isArray(alerts.data)) {
    const total = alerts.data.reduce((s, g) => s + g.n, 0);
    repo.status.security = total ? `${total} open` : "none";
    const high = alerts.data.filter((g) => ["critical", "high"].includes((g.sev || "").toLowerCase()));
    for (const g of high) {
      add("high", `[${fullName}] ${g.n} ${g.sev} severity Dependabot alert(s)`, `https://github.com/${fullName}/security/dependabot`);
    }
  } else {
    repo.status.security = "n/a"; // disabled or no access — not an error.
  }

  return repo;
}

function renderRepo(r) {
  const s = r.status;
  const lines = [`### ${r.fullName}`];
  lines.push(`- CI: ${s.ci ?? "—"}`);
  lines.push(`- Open PRs: ${s.prs ?? "—"}`);
  lines.push(`- Open issues: ${s.issues ?? "—"}${s.staleIssues ? ` (${s.staleIssues} stale)` : ""}`);
  lines.push(`- Security alerts: ${s.security ?? "—"}`);
  if (r.notes.length) lines.push(`- Notes: ${r.notes.join("; ")}`);
  return lines.join("\n");
}

function render(repos, dateStr) {
  const all = repos.flatMap((r) => r.actions);
  const high = all.filter((a) => a.sev === "high");
  const med = all.filter((a) => a.sev === "med");

  const out = [`# Daily Report — ${dateStr}`, ""];
  out.push(`Monitoring **${repos.length}** repos · **${high.length}** urgent · **${med.length}** to review`, "");

  out.push(`## ${SEV.high} Urgent (${high.length})`);
  out.push(high.length ? high.map((a) => `- ${a.text}${a.url ? ` — ${a.url}` : ""}`).join("\n") : "_Nothing urgent. ✅_");
  out.push("");

  out.push(`## ${SEV.med} To review (${med.length})`);
  out.push(med.length ? med.map((a) => `- ${a.text}${a.url ? ` — ${a.url}` : ""}`).join("\n") : "_Nothing waiting. ✅_");
  out.push("");

  out.push("## Per-repo status", "");
  out.push(repos.map(renderRepo).join("\n\n"));
  out.push("");
  out.push(`---`, `_Generated ${new Date().toISOString()} by scripts/daily-report.mjs_`);
  return out.join("\n");
}

async function main() {
  let config;
  try {
    config = JSON.parse(readFileSync(configPath, "utf8"));
  } catch (err) {
    console.error(`Cannot read config at ${configPath}: ${err.message}`);
    process.exit(2);
  }
  const thresholds = { stalePrDays: 5, staleIssueDays: 30, ...(config.thresholds || {}) };
  const attentionLabels = config.attentionIssueLabels || ["bug", "urgent", "critical"];

  // Verify gh is present and authenticated before fanning out.
  const auth = await gh(["api", "user", "--jq", "{login}"]);
  if (!auth.ok) {
    console.error(`gh is not authenticated (${auth.error}). Run \`gh auth login\`.`);
    process.exit(2);
  }

  // Monitored set = explicitly listed `repos` + every non-archived repo in each
  // configured `orgs` entry. Orgs are the primary knob — the apps live in GitHub
  // orgs, so "add an org" beats hand-listing each repo.
  const orgExpansion = await expandOrgs(config.orgs || []);
  const repos = [...new Set([...(config.repos || []), ...orgExpansion.repos])];
  if (!repos.length) {
    console.error(
      "Nothing to monitor: set `orgs` (e.g. [\"aldero-io\"]) and/or `repos` in daily-report.config.json." +
        (orgExpansion.notes.length ? `\n${orgExpansion.notes.join("\n")}` : ""),
    );
    process.exit(2);
  }
  if (orgExpansion.notes.length) for (const n of orgExpansion.notes) console.error(`note: ${n}`);

  const results = await Promise.all(repos.map((r) => inspectRepo(r, thresholds, attentionLabels)));
  const dateStr = new Date().toISOString().slice(0, 10);
  const report = render(results, dateStr);

  console.log(report);

  if (writeOut) {
    const dir = join(ROOT, "reports");
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `daily-report-${dateStr}.md`);
    writeFileSync(file, report + "\n");
    console.error(`\nWrote ${file}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
