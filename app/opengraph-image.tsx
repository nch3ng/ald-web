import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/gtm/config";

// Generates the default social-share card from the site config — no binary
// asset to commit, and it stays in sync with the brand automatically. Rendered
// to a static PNG at build time (works under `output: export`). Per-route
// opengraph-image files override this one.
export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = siteConfig.name;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0b1020 0%, #1a2238 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
          {siteConfig.name}
        </div>
        <div
          style={{
            fontSize: 32,
            marginTop: 28,
            color: "#aab4d4",
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          {siteConfig.description}
        </div>
      </div>
    ),
    size,
  );
}
