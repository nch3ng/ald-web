"use client";

import { useState } from "react";
import { track } from "@/lib/gtm/analytics";
import { getAttribution } from "@/lib/gtm/attribution";
import styles from "./signup.module.css";

/**
 * Minimal email signup that fires the shared `signup` event. The event is
 * automatically enriched with the visit's UTM attribution by the GTM module
 * (see `lib/gtm/analytics.ts`), so a signup from a YouTube-sourced visit lands
 * in analytics attributed to `source=youtube` + the originating campaign/video.
 *
 * Scope note: this is funnel INSTRUMENTATION, not a real account system — the
 * email is not yet persisted to a list/backend (separate work). The point is a
 * tracked, attributable conversion event on the destination side.
 */
export function SignupForm() {
  const [submitted, setSubmitted] = useState(false);
  const [attributionLabel, setAttributionLabel] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Fire the conversion. Attribution (source/campaign/content) is merged in by
    // the GTM dispatcher; `method` is the only signup-specific param we set here.
    track("signup", { method: "email" });

    // Surface the captured attribution in the UI purely as verification feedback
    // (helps QA confirm the YouTube → signup attribution end to end).
    const a = getAttribution();
    setAttributionLabel(
      a.source
        ? `attributed to source=${a.source}` +
            (a.campaign ? `, campaign=${a.campaign}` : "")
        : "no campaign attribution on this visit (direct)",
    );
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div>
        <p className={styles.confirmation}>You&apos;re on the list — thanks! ✅</p>
        {attributionLabel && (
          <p className={styles.attribution}>{attributionLabel}</p>
        )}
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="email">
        Get early access
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        className={styles.input}
      />
      <button type="submit" className={styles.button}>
        Sign up
      </button>
    </form>
  );
}
