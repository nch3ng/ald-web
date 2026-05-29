# GTM-ready checklist

The Aldero **definition of "GTM-ready"** — what every new app must satisfy
before (and at) launch so it's discoverable, measurable, and ready to convert.
FaxDash launched with these; ald-web (and earlier apps) launched with none. The
[`lib/gtm/`](../lib/gtm/) module codifies the pattern so each app inherits it
instead of re-deriving it.

Background: approved GTM plan, [ALD-10 §5](/ALD/issues/ALD-10#document-plan).

Each box below has a one-line "done when" test. A launch is **GTM-ready** when
all five dimensions pass.

---

## 1. Discoverable — search & social can find and render it

- [ ] **Unique title + meta description** per indexable page (not a shared default).
- [ ] **Canonical URL** on every page (absolute, one per page).
- [ ] **OpenGraph + Twitter card** tags (title, description, 1200×630 image).
- [ ] **JSON-LD structured data** — `Organization` + `WebSite` site-wide;
      `SoftwareApplication` (or the right type) on product surfaces.
- [ ] **sitemap.xml** listing all indexable routes.
- [ ] **robots.txt** allowing crawl and pointing at the sitemap.

> **Done when:** the page passes a social-card preview (e.g. opengraph.xyz) and
> a [Rich Results test](https://search.google.com/test/rich-results), and the
> sitemap is reachable and submitted to Search Console.
>
> **Gotcha (GitHub Pages project sites):** `robots.txt` is only honored at the
> *domain* root. A project site served under `/app-name` on the shared
> `github.io` host can't own `/robots.txt`. Page meta/canonical/OG/JSON-LD and
> the sitemap still work and are submittable, but **full discoverability needs a
> custom domain** (or a host like Vercel). Track this as the last step to 100%.

## 2. Measurable — you can see the funnel

- [ ] **Analytics loaded** (GA4 via the shared loader) behind a single env var.
- [ ] **Shared event model wired:** `page_view`, `cta_click`, `signup`,
      `activate`, `subscribe`, `cancel` — same names across all apps so funnels
      compare app-to-app.
- [ ] **No PII** in event params; analytics is opt-in per environment.

> **Done when:** events appear in GA4 DebugView (or the dev console via the
> module's debug logging) with the right params.

## 3. Capturing — top-of-funnel intent is recorded

- [ ] At least one **CTA** wired to `cta_click`.
- [ ] **Signup** fires `signup` (with `method`/`plan` where known).
- [ ] The **activation** ("aha") moment fires `activate`.

> **Done when:** clicking the primary CTA and completing signup produce the
> corresponding events end-to-end.

## 4. Monetizable — revenue events are tracked

- [ ] **`subscribe`** fires on a paid subscription / purchase (with `plan`,
      `value`, `currency`).
- [ ] **`cancel`** fires on churn (with `plan`/`reason` where known).
- [ ] Pricing/product offers reflected in `SoftwareApplication` JSON-LD `offers`
      where applicable.

> **Done when:** a test purchase and a test cancellation each emit their event
> with monetary value attached. (N/A for apps with no paid tier yet — note it.)

## 5. Fast — Core Web Vitals are within budget

Field/lab thresholds (Google "good" bar):

| Metric | Budget   |
| ------ | -------- |
| LCP    | < 2.5 s  |
| INP    | < 200 ms |
| CLS    | < 0.1    |

- [ ] Largest Contentful Paint (LCP) **< 2.5 s**.
- [ ] Interaction to Next Paint (INP) **< 200 ms**.
- [ ] Cumulative Layout Shift (CLS) **< 0.1**.

> **Done when:** Lighthouse (mobile) and/or field data (CrUX / `web-vitals`)
> show all three within budget on the key landing/conversion pages.

---

## How to satisfy this with the module

1. Copy [`lib/gtm/`](../lib/gtm/) into the new app.
2. Edit [`lib/gtm/config.ts`](../lib/gtm/config.ts) (name, description, URL,
   org, Twitter handle).
3. Wire it up — see [`lib/gtm/README.md`](../lib/gtm/README.md). That covers
   dimensions **1–4**. Dimension **5** (CWV) is a per-app performance budget
   verified at launch; the foundation slice starts well within it.

**Metric this moves:** % of future launches meeting the standard → 100%, and
ald-web goes from 0 SEO signals to indexable.
