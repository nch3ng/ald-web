/**
 * GTM module — shared analytics event model.
 *
 * One typed event vocabulary across every Aldero app so funnels are comparable
 * app-to-app. The funnel is: discover → engage → sign up → activate → pay.
 *
 *   page_view  — a page/route was viewed (sent automatically by <Analytics/>)
 *   cta_click  — a call-to-action was clicked (top of funnel)
 *   signup     — an account was created
 *   activate   — the user reached the product's "aha" / first value
 *   subscribe  — a paid subscription started (or a one-off purchase)
 *   cancel     — a subscription was cancelled / churned
 *
 * Sink: Google Analytics 4 via gtag.js when NEXT_PUBLIC_GA_MEASUREMENT_ID is
 * set; otherwise `track()` is a no-op (and logs in dev). Swapping in a
 * different sink means changing only `dispatch()` below.
 *
 * Attribution: every event is automatically enriched with the visit's UTM
 * attribution (source/medium/campaign/content) captured by `attribution.ts`, so
 * signups land in GA already attributed to the channel and creative that drove
 * them — e.g. `source=youtube`, `campaign=<video-slug>`. Explicit params passed
 * to `track()` win over attribution on key collision.
 */

import { captureAttribution, type Attribution } from "./attribution";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/** Typed parameter shapes per event. All params are optional context. */
export type GtmEventMap = {
  page_view: { page_path?: string; page_title?: string };
  cta_click: { cta_id: string; location?: string; href?: string };
  signup: { method?: string; plan?: string };
  activate: { activation?: string };
  subscribe: { plan: string; value?: number; currency?: string };
  cancel: { plan?: string; reason?: string };
};

export type GtmEventName = keyof GtmEventMap;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const isBrowser = typeof window !== "undefined";
const isDev = process.env.NODE_ENV !== "production";

/**
 * Send the event to the configured sink. Safe to call anywhere (SSR/no-config):
 * it no-ops off the browser or when analytics isn't configured.
 */
function dispatch(name: GtmEventName, params: Record<string, unknown>): void {
  // Merge the visit's UTM attribution under the explicit params (explicit wins).
  // captureAttribution() is idempotent first-touch and no-ops off the browser.
  const attribution: Attribution = isBrowser ? captureAttribution() : {};
  const enriched = { ...attribution, ...params };

  if (isDev && isBrowser) {
    // Observability in dev without a GA id — confirm events fire and carry the
    // right params (including attribution) before they ever reach production.
    console.debug(`[gtm] ${name}`, enriched);
  }
  if (!isBrowser || !GA_MEASUREMENT_ID || typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", name, enriched);
}

/**
 * Track a typed product event. Params are constrained to the event's shape, so
 * a typo in an event name or a missing required param is a compile error.
 *
 *   track("cta_click", { cta_id: "hero_get_started", location: "home" });
 *   track("subscribe", { plan: "pro_monthly", value: 6.99, currency: "USD" });
 */
export function track<E extends GtmEventName>(
  name: E,
  params: GtmEventMap[E],
): void {
  dispatch(name, params ?? {});
}

/** Convenience wrapper for the page_view event. */
export function trackPageView(params: GtmEventMap["page_view"] = {}): void {
  dispatch("page_view", params);
}
