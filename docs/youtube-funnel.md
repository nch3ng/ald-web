# YouTube → Aldero funnel instrumentation (ALD-32)

Destination-side instrumentation that makes YouTube-driven signups **attributable
to the channel and to a specific video**. Reuses the [ALD-19 GTM module](../lib/gtm/)
— no parallel analytics stack. Parent: ALD-23 (CMO condition).

> **Measure-before-optimize:** a YouTube view doesn't count as a working channel
> until we can tie a signup back to it. This is the half that makes that possible
> on Aldero web; the YouTube/Google account side is board-gated separately.

## How it works

1. **Landing.** A campaign link lands on any page on the site with UTMs, e.g.
   `…/signup?utm_source=youtube&utm_medium=description&utm_campaign=inbox-ai-agent&utm_content=endcard`.
2. **Capture + persist.** On load, the GTM module (`lib/gtm/attribution.ts`,
   invoked from `<Analytics/>`) parses the `utm_*` params and stores them in
   `sessionStorage` under `ald_gtm_attribution`. **First-touch wins**: once
   captured, navigating to other pages (with different or no UTMs) never clobbers
   the originating campaign for the visit.
3. **Enrich every event.** `lib/gtm/analytics.ts`'s `dispatch()` merges the stored
   attribution into the params of **every** event it sends (`page_view`,
   `cta_click`, `signup`, …). Explicit params passed to `track()` win on collision.
4. **Convert.** The `/signup` form fires `track("signup", { method: "email" })`.
   Because of step 3 that event reaches GA4 already carrying
   `source=youtube`, `medium=…`, `campaign=<video-slug>`, `content=<placement>`.

So a signup from a YouTube visit is attributed to `source=youtube` **and** the
specific video, with **no per-call-site work** — any new `track()` call inherits
attribution automatically.

## UTM convention (Content Manager sets these on links)

| Param          | Value                                            |
| -------------- | ------------------------------------------------ |
| `utm_source`   | `youtube`                                        |
| `utm_medium`   | `description` \| `endscreen` \| `pinnedcomment`  |
| `utm_campaign` | `{video-slug}` — the per-video campaign slug     |
| `utm_content`  | `{placement}` — optional finer placement detail  |

First three campaign slugs: `inbox-ai-agent`, `best-ai-tools-solopreneurs`,
`zapier-vs-n8n-vs-make`.

**Recommended landing path:** `/signup` (purpose-built, in the sitemap). UTMs work
on **any** path though — capture is global via `<Analytics/>` in the root layout —
so a link to `/` with UTMs is also attributed.

Example link:

```
https://<aldero-domain>/signup?utm_source=youtube&utm_medium=description&utm_campaign=inbox-ai-agent&utm_content=endcard
```

## Verifying locally (no GA account needed)

Analytics is opt-in. With `NEXT_PUBLIC_GA_MEASUREMENT_ID` **unset**, events don't
hit GA but are logged to the browser console as `[gtm] <event>` with the merged
params — enough to confirm attribution end to end:

1. `npm run dev`, open `/signup?utm_source=youtube&utm_campaign=inbox-ai-agent`.
2. Console shows `[gtm] page_view { …, source: "youtube", campaign: "inbox-ai-agent" }`.
3. Submit the form → `[gtm] signup { method: "email", source: "youtube", campaign: "inbox-ai-agent" }`.
   The page also echoes the captured attribution as QA feedback.

## GA4 go-live runbook (ALD-38)

Turning the (already-live) instrumentation into reportable numbers. Only the GA4
**property + custom dimensions + Realtime check** need a Google login (standing
GA4 access constraint — agents have no Analytics credentials). Everything on the
deploy side is wired and agent-doable. Division of labor below.

### Step 1 — Get a measurement id  *(GA login required → CEO/board)*
Create a GA4 web data stream for ald-web (or reuse an existing Aldero property)
and copy its **Measurement ID** (`G-XXXXXXXXXX`).
- Data stream URL: `https://nch3ng.github.io/ald-web` (the current prod origin;
  if/when ald-web moves to a custom domain, add that as an additional stream).
- A measurement id is **not** a secret — it ships in client JS — so it can be
  pasted into a ticket comment or set directly as a repo variable.

### Step 2 — Turn it on in the deploy  *(agent-doable, no GA login)*
The deploy build already consumes the id from a GitHub **repo variable**
(`.github/workflows/deploy-pages.yml`). Set it once and re-deploy:
```bash
gh variable set NEXT_PUBLIC_GA_MEASUREMENT_ID -R nch3ng/ald-web -b 'G-XXXXXXXXXX'
gh workflow run deploy-pages.yml -R nch3ng/ald-web   # or just push to main
```
Until the variable is set it resolves to `""` and `track()` no-ops, so the
current production deploy is unaffected. No code change, no secret.

### Step 3 — Register event-scoped custom dimensions  *(GA login required → CEO/board)*
In **Admin → Custom definitions → Custom dimensions**, create four
**event-scoped** dimensions so attribution is queryable in reports/explorations.
The *Event parameter* must match the names our events actually send (see
`lib/gtm/attribution.ts` / `analytics.ts`) **exactly**:

| Dimension name | Scope | Event parameter |
| -------------- | ----- | --------------- |
| Source         | Event | `source`        |
| Medium         | Event | `medium`        |
| Campaign       | Event | `campaign`      |
| Content        | Event | `content`       |

(`term` is also sent and can optionally be registered the same way. GA4 records
its own session source/medium automatically, but these **event** params are what
tie a specific `signup` to a specific video.)

### Step 4 — Validate end-to-end  *(GA login required → CEO/board, or hand to QA)*
Open
`https://nch3ng.github.io/ald-web/signup?utm_source=youtube&utm_campaign=inbox-ai-agent`,
submit the form, and confirm in **GA4 → Reports → Realtime** that a `signup`
event arrives carrying `source=youtube` and `campaign=inbox-ai-agent`. (Use
DebugView for parameter-level inspection.)

**No paid analytics** are required for any of the above; flag to CMO before any spend.

## Scope note

The `/signup` form is **funnel instrumentation**, not a real account system — the
email is not yet persisted to a list/backend. Wiring it to an email list /
backend (and any design polish on the form) is separate follow-up work.
