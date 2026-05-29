import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/gtm/config";

// Required so the route prerenders to a static file under `output: export`.
export const dynamic = "force-static";

// Emitted to /robots.txt at build time (compatible with `output: export`).
// Allows all crawlers and points at the sitemap.
//
// NOTE: on a GitHub Pages *project* site (served under /ald-web), this file
// lands at /ald-web/robots.txt — but crawlers only read robots.txt at the
// DOMAIN root, which we don't control on the shared github.io host. Page-level
// meta/canonical/OG/JSON-LD and the sitemap are still valid and submittable to
// Search Console; full robots.txt control arrives with a custom domain. See
// docs/gtm-ready-checklist.md → "Discoverable".
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
