import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/gtm/config";

// Required so the route prerenders to a static file under `output: export`.
export const dynamic = "force-static";

// Static sitemap, emitted to /sitemap.xml at build time (compatible with
// `output: export`). Add a row per indexable route as the app grows; keep
// `noindex` pages out. URLs are absolute and include the deploy's base path
// via the site config.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
