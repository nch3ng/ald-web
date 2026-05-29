/**
 * GTM module — SEO metadata + JSON-LD helpers.
 *
 * `buildMetadata()` produces a Next.js `Metadata` object with a sane GTM-ready
 * baseline (unique title/description, canonical, OpenGraph, Twitter card) that
 * any page or layout can spread and override. JSON-LD builders emit
 * schema.org structured data; render them with the `<JsonLd>` component.
 */

import type { Metadata } from "next";
import { siteConfig, absoluteUrl } from "./config";

export type BuildMetadataInput = {
  /** Page title WITHOUT the brand suffix; the template adds it. Omit for home. */
  title?: string;
  /** Page-specific description; falls back to the site default. */
  description?: string;
  /** Site-relative path of THIS page, e.g. "/pricing". Drives canonical + OG url. */
  path?: string;
  /** Override the OG/Twitter image (absolute or site-relative). */
  image?: string;
  /** OpenGraph type. "website" for marketing pages, "article" for posts. */
  type?: "website" | "article";
  /** Set true to keep a page out of the index (e.g. thank-you pages). */
  noindex?: boolean;
};

/**
 * The default OG/Twitter image. `app/opengraph-image.tsx` generates this at the
 * site root; per-route opengraph-image files override it automatically, and the
 * `image` arg overrides both.
 */
const DEFAULT_OG_IMAGE = "/opengraph-image";

/**
 * Build a GTM-ready Metadata object. Spread the result from a `metadata` export
 * (or return it from `generateMetadata`) in any layout/page.
 *
 * `metadataBase` is set from the site config so every relative URL field
 * (canonical, OG image) resolves to a fully-qualified URL — required by the
 * Metadata API and by crawlers/social scrapers.
 */
export function buildMetadata(input: BuildMetadataInput = {}): Metadata {
  const {
    title,
    description = siteConfig.description,
    path = "/",
    image = DEFAULT_OG_IMAGE,
    type = "website",
    noindex = false,
  } = input;

  const canonical = absoluteUrl(path);
  const resolvedTitle = title
    ? { default: title, template: siteConfig.titleTemplate }
    : { absolute: siteConfig.defaultTitle };

  return {
    metadataBase: new URL(siteConfig.url),
    title: resolvedTitle,
    description,
    applicationName: siteConfig.name,
    alternates: { canonical },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        },
    openGraph: {
      type,
      siteName: siteConfig.name,
      title: title ?? siteConfig.defaultTitle,
      description,
      url: canonical,
      locale: siteConfig.locale,
      images: [{ url: image, width: 1200, height: 630, alt: siteConfig.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? siteConfig.defaultTitle,
      description,
      images: [image],
      ...(siteConfig.twitterHandle
        ? { site: siteConfig.twitterHandle, creator: siteConfig.twitterHandle }
        : {}),
    },
  };
}

/* ------------------------------------------------------------------ *
 * JSON-LD structured data (schema.org)
 * ------------------------------------------------------------------ */

type JsonLdNode = Record<string, unknown>;

/** Organization node — publisher identity. Render once, in the root layout. */
export function organizationJsonLd(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.organization.name,
    url: siteConfig.organization.url,
  };
}

/** WebSite node — enables sitelinks search box eligibility + site identity. */
export function webSiteJsonLd(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
  };
}

/**
 * SoftwareApplication node — for product/app surfaces (matches the FaxDash
 * landing pattern). `offers` is optional; pass it for monetizable surfaces.
 */
export function softwareAppJsonLd(opts?: {
  name?: string;
  description?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: { price: string; priceCurrency: string }[];
}): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: opts?.name ?? siteConfig.name,
    description: opts?.description ?? siteConfig.description,
    url: siteConfig.url,
    applicationCategory: opts?.applicationCategory ?? "BusinessApplication",
    operatingSystem: opts?.operatingSystem ?? "Web",
    ...(opts?.offers ? { offers: opts.offers } : {}),
  };
}
