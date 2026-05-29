"use client";

import styles from "./page.module.css";
import { track } from "@/lib/gtm/analytics";

// Example of capturing a top-of-funnel signal: a CTA wired to the shared
// `cta_click` event. Any app reuses this pattern — call track() in the handler.
export function CtaButton({
  ctaId,
  href,
  children,
}: {
  ctaId: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className={styles.cta}
      href={href}
      onClick={() => track("cta_click", { cta_id: ctaId, location: "home", href })}
    >
      {children}
    </a>
  );
}
