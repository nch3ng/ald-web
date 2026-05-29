import type { NextConfig } from "next";

// Static-export config is OPT-IN via `STATIC_EXPORT=true`. It is used only by the
// GitHub Pages deploy pipeline (.github/workflows/deploy-pages.yml). See
// docs/adr/0002-deploy-target.md for the "why".
//
// Default (flag unset): the full Next.js Node app — what `make dev`, `make start`,
// and Node/Vercel hosts run. Nothing here changes that path.
//
// When STATIC_EXPORT=true: emit a static `out/` folder. `PAGES_BASE_PATH` is the
// repo subpath GitHub Pages serves a project site under (e.g. `/ald-web`); it is
// injected by the workflow from actions/configure-pages. We re-expose it as
// NEXT_PUBLIC_BASE_PATH so plain <a> links (which Next does NOT auto-prefix) work.
const isStaticExport = process.env.STATIC_EXPORT === "true";
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = isStaticExport
  ? {
      output: "export",
      basePath,
      assetPrefix: basePath || undefined,
      trailingSlash: true,
      images: { unoptimized: true },
      env: { NEXT_PUBLIC_BASE_PATH: basePath },
    }
  : {};

export default nextConfig;
