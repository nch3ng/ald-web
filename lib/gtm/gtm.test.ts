import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { buildMetadata, softwareAppJsonLd, webSiteJsonLd } from "./seo";
import { siteConfig, absoluteUrl } from "./config";
import { track, trackPageView } from "./analytics";

describe("buildMetadata", () => {
  test("home metadata: absolute title, canonical, OG + Twitter", () => {
    const m = buildMetadata();
    expect(m.title).toEqual({ absolute: siteConfig.defaultTitle });
    expect(m.alternates?.canonical).toBe(siteConfig.url);
    expect(m.openGraph?.url).toBe(siteConfig.url);
    expect((m.twitter as { card?: string })?.card).toBe("summary_large_image");
    // metadataBase must be set so relative URL fields resolve.
    expect(m.metadataBase?.toString()).toContain(siteConfig.url);
  });

  test("page metadata: title template + path-based canonical", () => {
    const m = buildMetadata({ title: "Pricing", path: "/pricing" });
    expect(m.title).toEqual({
      default: "Pricing",
      template: siteConfig.titleTemplate,
    });
    expect(m.alternates?.canonical).toBe(absoluteUrl("/pricing"));
  });

  test("noindex flips robots off", () => {
    const m = buildMetadata({ noindex: true });
    expect(m.robots).toMatchObject({ index: false, follow: false });
  });
});

describe("JSON-LD builders", () => {
  test("emit valid schema.org nodes", () => {
    expect(webSiteJsonLd()).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: siteConfig.url,
    });
    const app = softwareAppJsonLd({
      offers: [{ price: "6.99", priceCurrency: "USD" }],
    });
    expect(app["@type"]).toBe("SoftwareApplication");
    expect(app.offers).toEqual([{ price: "6.99", priceCurrency: "USD" }]);
  });
});

describe("analytics track", () => {
  beforeEach(() => {
    // jsdom provides window; ensure gtag exists so dispatch forwards.
    (window as unknown as { gtag?: unknown }).gtag = vi.fn();
  });
  afterEach(() => {
    delete (window as unknown as { gtag?: unknown }).gtag;
    vi.restoreAllMocks();
  });

  test("does not throw and is callable with typed params", () => {
    // Without a GA id configured at import time, track() no-ops on the gtag
    // call but must never throw — that's the contract for unconfigured apps.
    expect(() => track("cta_click", { cta_id: "hero" })).not.toThrow();
    expect(() =>
      track("subscribe", { plan: "pro", value: 6.99, currency: "USD" }),
    ).not.toThrow();
    expect(() => trackPageView({ page_path: "/" })).not.toThrow();
  });
});
