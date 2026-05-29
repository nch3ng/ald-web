/**
 * GTM module — public surface.
 *
 * The reusable "definition of GTM-ready" for Aldero apps: SEO metadata,
 * structured data, and a shared analytics event model. Copy the `lib/gtm/`
 * folder into a new app, edit `config.ts`, and wire it up per `README.md`.
 */

export { siteConfig, absoluteUrl, type SiteConfig } from "./config";
export {
  buildMetadata,
  organizationJsonLd,
  webSiteJsonLd,
  softwareAppJsonLd,
  type BuildMetadataInput,
} from "./seo";
export { JsonLd } from "./JsonLd";
export {
  track,
  trackPageView,
  GA_MEASUREMENT_ID,
  type GtmEventName,
  type GtmEventMap,
} from "./analytics";
export { Analytics } from "./analytics-loader";
