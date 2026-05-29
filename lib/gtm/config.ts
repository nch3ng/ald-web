/**
 * GTM module — site config (single source of truth).
 *
 * This is the ONE file you edit when you copy the `lib/gtm/` module into a new
 * Aldero app. Everything else (SEO metadata, sitemap, robots, OG image,
 * analytics) derives from these values, so an app is GTM-ready the moment this
 * is filled in. See `lib/gtm/README.md` and `docs/gtm-ready-checklist.md`.
 *
 * `url` is the only value that legitimately changes per environment (Pages base
 * path vs. a custom domain), so it is env-overridable via NEXT_PUBLIC_SITE_URL.
 * The rest are product identity and rarely differ between environments.
 */

export type SiteConfig = {
  /** Short brand name, e.g. "FaxDash". Used in titles, OG, JSON-LD. */
  name: string;
  /** Home-page title (the `%s` fallback when a page sets no title). */
  defaultTitle: string;
  /** Title template applied to page-level titles, e.g. "%s · FaxDash". */
  titleTemplate: string;
  /** Default meta description — keep under ~155 chars. */
  description: string;
  /**
   * Canonical site origin INCLUDING any base path, no trailing slash.
   * e.g. "https://faxdash.io" or "https://nch3ng.github.io/ald-web".
   * Override per-deploy with NEXT_PUBLIC_SITE_URL.
   */
  url: string;
  /** BCP-47 locale, e.g. "en_US" for OpenGraph. */
  locale: string;
  /** Twitter/X handle including the leading "@" (optional). */
  twitterHandle?: string;
  /** Publishing organization, for the Organization JSON-LD node. */
  organization: {
    name: string;
    url: string;
  };
};

function trimTrailingSlash(u: string): string {
  return u.replace(/\/+$/, "");
}

/**
 * Resolve the canonical site URL.
 * Priority: explicit NEXT_PUBLIC_SITE_URL → committed default below.
 */
function resolveSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv && fromEnv.length > 0) return trimTrailingSlash(fromEnv);
  // Committed default = current production deploy (GitHub Pages project site).
  // When ald-web moves to a custom domain, set NEXT_PUBLIC_SITE_URL (or change
  // this) and every SEO signal follows automatically.
  return "https://nch3ng.github.io/ald-web";
}

export const siteConfig: SiteConfig = {
  name: "ald-web",
  defaultTitle: "ald-web — the Aldero web foundation",
  titleTemplate: "%s · ald-web",
  description:
    "The Aldero web application foundation: a fast, observable Next.js + TypeScript starter that ships GTM-ready (SEO, OpenGraph, analytics) from day one.",
  url: resolveSiteUrl(),
  locale: "en_US",
  // twitterHandle: "@aldero",
  organization: {
    name: "Aldero",
    url: "https://nch3ng.github.io/ald-web",
  },
};

/** Build an absolute URL from a site-relative path (leading slash optional). */
export function absoluteUrl(path = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${p === "/" ? "" : p}`;
}
