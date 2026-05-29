# `lib/gtm/` — the GTM-ready module

The reusable **"definition of GTM-ready"** for Aldero apps: SEO metadata,
schema.org structured data, and a shared analytics event model. Codifies the
pattern FaxDash launched with so every new app inherits it. See the
[GTM-ready checklist](../../docs/gtm-ready-checklist.md) for the standard this
satisfies.

## What's in here

| File             | Purpose                                                              |
| ---------------- | ------------------------------------------------------------------- |
| `config.ts`      | **The one file you edit per app** — name, description, URL, org.    |
| `seo.ts`         | `buildMetadata()` + JSON-LD builders (Organization/WebSite/App).    |
| `JsonLd.tsx`     | Renders a JSON-LD node as a `<script type="application/ld+json">`.  |
| `analytics.ts`   | The shared event model + typed `track()` (GA4 sink, no-op if unset).|
| `attribution.ts` | Captures + persists UTM attribution; auto-merged into every event.  |
| `analytics-loader.tsx` | Loads gtag.js + fires `page_view`; renders nothing if unconfigured. |
| `index.ts`       | Barrel — `import { ... } from "@/lib/gtm"`.                          |

## Use it in a new app (≈5 minutes)

1. **Copy** the `lib/gtm/` folder into the app.
2. **Edit `config.ts`** — `name`, `defaultTitle`, `titleTemplate`,
   `description`, `organization`, optional `twitterHandle`. Set the canonical
   URL via `NEXT_PUBLIC_SITE_URL` (or the committed default).
3. **Root layout** (`app/layout.tsx`):

   ```tsx
   import { buildMetadata, organizationJsonLd, webSiteJsonLd } from "@/lib/gtm/seo";
   import { JsonLd } from "@/lib/gtm/JsonLd";
   import { Analytics } from "@/lib/gtm/analytics-loader";

   export const metadata = buildMetadata(); // title template, canonical, OG, Twitter

   export default function RootLayout({ children }) {
     return (
       <html lang="en">
         <body>
           <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
           {children}
           <Analytics />
         </body>
       </html>
     );
   }
   ```

4. **Each page** — export unique metadata:

   ```tsx
   export const metadata = buildMetadata({
     title: "Pricing",
     description: "Simple, pay-as-you-go pricing.",
     path: "/pricing",
   });
   ```

5. **Sitemap + robots** — add `app/sitemap.ts` and `app/robots.ts` (copy
   ald-web's; both use `absoluteUrl` from the config). Add a sitemap row per
   indexable route.

6. **OG image** — copy `app/opengraph-image.tsx` for an auto-branded social card
   (no binary asset to maintain), or drop a static `opengraph-image.png`.

7. **Track product events** — in client components:

   ```tsx
   import { track } from "@/lib/gtm/analytics";

   <button onClick={() => track("cta_click", { cta_id: "hero", location: "home" })}>
     Get started
   </button>;

   track("signup",    { method: "email", plan: "free" });
   track("activate",  { activation: "first_fax_sent" });
   track("subscribe", { plan: "pro_monthly", value: 6.99, currency: "USD" });
   track("cancel",    { plan: "pro_monthly", reason: "too_expensive" });
   ```

   `track()` is fully typed — a wrong event name or missing required param is a
   compile error.

## UTM attribution (channel measurement)

`attribution.ts` makes signups attributable to the campaign that drove the visit.
On load, `<Analytics/>` parses `utm_*` params from the landing URL and persists
them (first-touch, per `sessionStorage` visit). `dispatch()` then merges that
attribution into **every** event — so a `signup` fired pages later still carries
`source`, `medium`, `campaign`, and `content`. No per-call-site work; explicit
`track()` params win on key collision. See
[`docs/youtube-funnel.md`](../../docs/youtube-funnel.md) for the end-to-end flow
and the GA4 go-live follow-ups.

## Configuring analytics

Analytics is **opt-in**: set `NEXT_PUBLIC_GA_MEASUREMENT_ID` (e.g. `G-XXXXXXX`)
and the loader injects gtag.js and forwards events. With it unset, `track()` is
a no-op and `<Analytics/>` renders nothing — so local dev and previews stay
clean and no measurement id is committed. In dev, events are logged to the
console (`[gtm] <event>`) for verification without a real GA property.

To use a different analytics sink (Plausible, PostHog, a warehouse), change
only `dispatch()` in `analytics.ts` — the event vocabulary and call sites stay.

## The event model (don't fork it)

`page_view · cta_click · signup · activate · subscribe · cancel` — the same six
names across every Aldero app, so funnels are comparable app-to-app. Add
parameters as needed, but keep the event names. Extend the vocabulary in
`analytics.ts` (`GtmEventMap`) only with deliberate, cross-app intent.
