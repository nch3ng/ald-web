"use client";

/**
 * GTM module — analytics loader.
 *
 * Injects the GA4 gtag.js snippet and fires the first `page_view` from our
 * shared event model. Renders NOTHING and loads NO script when
 * NEXT_PUBLIC_GA_MEASUREMENT_ID is unset — so the app works unconfigured (local
 * dev, previews) and analytics is purely opt-in via that one env var.
 *
 * We configure GA with `send_page_view: false` and fire page_view ourselves so
 * the shared event model is the single source of funnel truth (no double count).
 */

import { useEffect } from "react";
import Script from "next/script";
import { GA_MEASUREMENT_ID, trackPageView } from "./analytics";
import { captureAttribution } from "./attribution";

export function Analytics() {
  useEffect(() => {
    // Capture first-touch UTM attribution from the landing URL BEFORE the first
    // page_view, so the landing event — and every event after it this visit —
    // carries the channel/campaign that drove the visit. Idempotent.
    captureAttribution();
    trackPageView({
      page_path: window.location.pathname,
      page_title: document.title,
    });
  }, []);

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtm-gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
