/**
 * GTM module — UTM attribution capture & persistence.
 *
 * Turns a campaign-tagged landing URL into durable, per-visit attribution so a
 * later `signup` (which usually happens on a different page, with no UTMs in the
 * URL) is still attributable to the channel and the specific creative that drove
 * the visit. This is the destination-side half of channel measurement: e.g. a
 * YouTube link `?utm_source=youtube&utm_medium=description&utm_campaign=<video-slug>`
 * lands, we persist it, and every subsequent event carries `source=youtube` +
 * the campaign/content (see `analytics.ts`, which merges this into `dispatch()`).
 *
 * Model:
 *   - First-touch wins for the visit. Once attribution is stored we never
 *     overwrite it, so navigating to a page with different/absent UTMs can't
 *     clobber the originating campaign.
 *   - Scope is the browser session (`sessionStorage`), which matches "a visit":
 *     a YouTube-sourced visit, and the signup from that visit, share attribution.
 *   - Safe everywhere: no-ops off the browser (SSR) and swallows storage errors
 *     (private mode / disabled storage), returning empty attribution instead.
 *
 * The param names mirror the UTM convention Content Managers set on links:
 *   utm_source → source, utm_medium → medium, utm_campaign → campaign,
 *   utm_content → content, utm_term → term.
 */

/** Attribution captured from UTM params. Only present params are set. */
export type Attribution = {
  /** Channel, e.g. "youtube". From utm_source. */
  source?: string;
  /** Placement type, e.g. "description" | "endscreen" | "pinnedcomment". From utm_medium. */
  medium?: string;
  /** Specific campaign/video, e.g. "inbox-ai-agent". From utm_campaign. */
  campaign?: string;
  /** Creative/placement detail. From utm_content. */
  content?: string;
  /** Keyword/extra. From utm_term. */
  term?: string;
};

/** sessionStorage key holding the visit's first-touch attribution (JSON). */
export const ATTRIBUTION_STORAGE_KEY = "ald_gtm_attribution";

/** utm_* query param → Attribution field. */
const UTM_TO_KEY: Readonly<Record<string, keyof Attribution>> = {
  utm_source: "source",
  utm_medium: "medium",
  utm_campaign: "campaign",
  utm_content: "content",
  utm_term: "term",
};

const isBrowser = typeof window !== "undefined";

/** True when the object carries at least one attribution field. */
function hasAttribution(a: Attribution): boolean {
  return Object.keys(a).length > 0;
}

/**
 * Parse `utm_*` params from a query string (e.g. `window.location.search`) into
 * an Attribution. Unknown params are ignored; empty values are dropped. Pure —
 * safe to unit test without a DOM.
 */
export function parseUtmParams(search: string): Attribution {
  const params = new URLSearchParams(search);
  const out: Attribution = {};
  for (const [utm, key] of Object.entries(UTM_TO_KEY)) {
    const value = params.get(utm);
    if (value) out[key] = value;
  }
  return out;
}

function readStore(): Attribution {
  if (!isBrowser) return {};
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
  }
}

function writeStore(a: Attribution): void {
  if (!isBrowser) return;
  try {
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(a));
  } catch {
    // Storage unavailable (private mode / quota) — attribution degrades to
    // last-touch-only for this event, which is acceptable; never throw.
  }
}

/**
 * Capture first-touch attribution for the visit. Idempotent: if attribution is
 * already stored it's returned unchanged (first-touch wins); otherwise the
 * current URL's UTMs are parsed, persisted, and returned. Returns `{}` when
 * there's nothing to attribute (no stored value and no UTMs on the URL).
 *
 * @param search Query string to read. Defaults to the live URL in the browser.
 */
export function captureAttribution(
  search: string = isBrowser ? window.location.search : "",
): Attribution {
  const existing = readStore();
  if (hasAttribution(existing)) return existing;

  const fresh = parseUtmParams(search);
  if (hasAttribution(fresh)) {
    writeStore(fresh);
    return fresh;
  }
  return existing;
}

/** Read the visit's stored attribution without capturing from the URL. */
export function getAttribution(): Attribution {
  return readStore();
}

/** Clear stored attribution. Primarily for tests; rarely needed in app code. */
export function clearAttribution(): void {
  if (!isBrowser) return;
  try {
    window.sessionStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
  } catch {
    // ignore
  }
}
